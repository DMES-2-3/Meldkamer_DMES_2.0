<?php


try {
    /** @var \Doctrine\ORM\EntityManagerInterface $entityManager */
    $entityManager = require dirname(__DIR__) . '/bootstrap.php';
    $conn = $entityManager->getConnection();
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "DB/Doctrine initialisatiefout: " . $e->getMessage();
    exit;
}

// 2) Input lezen (supports form POST, JSON body, and query params)
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$eventIdRaw = $_POST['eventId'] ?? $input['eventId'] ?? $_GET['eventId'] ?? 1;
$eventId = max(1, (int)$eventIdRaw);

// 3) Queries via Doctrine DBAL (backticks rond o.a. `user`), met parameters
//    Dynamisch aanpassen op kolom-beschikbaarheid om runtime schema verschillen op te vangen.

// Helper: check of kolom bestaat
$getDbName = $conn->executeQuery('SELECT DATABASE() AS db')->fetchOne();
$columnExists = function(string $table, string $column) use ($conn, $getDbName): bool {
    try {
        $sql = 'SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = :table AND COLUMN_NAME = :column';
        $count = $conn->executeQuery($sql, [
            'schema' => $getDbName,
            'table' => $table,
            'column' => $column,
        ])->fetchOne();
        return (int)$count > 0;
    } catch (Throwable $e) {
        // Als dit faalt, ga uit van niet aanwezig om veilig te zijn
        error_log('Kolom-check faalde voor ' . $table . '.' . $column . ': ' . $e->getMessage());
        return false;
    }
};

$tablesToExport = [];

// Basis Tabellen
$tablesToExport['Event'] = "SELECT * FROM `Event` WHERE `eventId` = :eventId";
$tablesToExport['AidWorker'] = "SELECT * FROM `AidWorker` WHERE `FK_Event` = :eventId";
$tablesToExport['Notification'] = "SELECT * FROM `Notification` WHERE `FK_event` = :eventId";

// Gerelateerde tabellen via Notification
$tablesToExport['AidTeam'] = "
    SELECT DISTINCT `AidTeam`.*
    FROM `AidTeam`
    JOIN `Notification` ON `Notification`.`FK_AidTeam` = `AidTeam`.`aidTeamId`
    WHERE `Notification`.`FK_event` = :eventId
";

$tablesToExport['AVPU'] = "
    SELECT DISTINCT `AVPU`.*
    FROM `AVPU`
    JOIN `Notification` ON `Notification`.`FK_AVPU` = `AVPU`.`AVPUId`
    WHERE `Notification`.`FK_event` = :eventId
";

$tablesToExport['SITRAP'] = "
    SELECT DISTINCT `SITRAP`.*
    FROM `SITRAP`
    JOIN `Notification` ON `Notification`.`FK_SITRAP` = `SITRAP`.`SITRAPId`
    WHERE `Notification`.`FK_event` = :eventId
";

// Optionele relaties: Victim en user (alleen als kolommen bestaan)
if ($columnExists('Notification', 'FK_victim')) {
    $tablesToExport['Victim'] = "
        SELECT DISTINCT `Victim`.*
        FROM `Victim`
        JOIN `Notification` ON `Notification`.`FK_victim` = `Victim`.`victimId`
        WHERE `Notification`.`FK_event` = :eventId
    ";
} else {
    $tablesToExport['Victim'] = null; // zal als leeg CSV verwerkt worden
}

if ($columnExists('Notification', 'FK_user')) {
    $tablesToExport['user'] = "
        SELECT DISTINCT `user`.*
        FROM `user`
        JOIN `Notification` ON `Notification`.`FK_user` = `user`.`userId`
        WHERE `Notification`.`FK_event` = :eventId
    ";
} else {
    $tablesToExport['user'] = null;
}

// Kaart-data: alleen includen als Event -> FK_mapId_event bestaat
if ($columnExists('Event', 'FK_mapId_event')) {
    $tablesToExport['Map'] = "
        SELECT `Map`.*
        FROM `Map`
        JOIN `Event` ON `Event`.`FK_mapId_event` = `Map`.`mapId`
        WHERE `Event`.`eventId` = :eventId
    ";

    $tablesToExport['MapEntity'] = "
        SELECT DISTINCT `MapEntity`.*
        FROM `MapEntity`
        JOIN `Map` ON `MapEntity`.`FK_mapId` = `Map`.`mapId`
        JOIN `Event` ON `Event`.`FK_mapId_event` = `Map`.`mapId`
        WHERE `Event`.`eventId` = :eventId
    ";
} else {
    // Fallback: laat ze leeg als het veld niet bestaat
    $tablesToExport['Map'] = null;
    $tablesToExport['MapEntity'] = null;
}

if (!class_exists('ZipArchive')) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "ZipArchive-extensie ontbreekt.";
    exit;
}

// 4) ZIP bouwen
$zip = new ZipArchive();
$zipFilePath = tempnam(sys_get_temp_dir(), 'export_zip_');
if ($zip->open($zipFilePath, ZipArchive::OVERWRITE) !== true) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Kon ZIP niet openen";
    exit;
}

foreach ($tablesToExport as $table => $sql) {
    $rows = [];
    try {
        if ($sql !== null) {
            $result = $conn->executeQuery($sql, ['eventId' => $eventId]);
            $rows = $result->fetchAllAssociative();
        }
    } catch (Throwable $e) {
        // Log query-fout, maar geen output naar browser
        error_log("Query fout voor $table: " . $e->getMessage());
    }

    // CSV in memory
    $csvStream = fopen('php://temp', 'r+');

    if (!empty($rows)) {
        // Header
        $header = array_keys($rows[0]);
        fputcsv($csvStream, $header, ';', '"', '\\'); // delimiter NL/BE

        // Rows
        foreach ($rows as $row) {
            fputcsv($csvStream, $row, ';', '"', '\\');
        }
    } else {
        // Plaats een informatieregel in de CSV
        fputcsv($csvStream, ["Geen data voor $table (eventId=$eventId)"], ';', '"', '\\');
    }

    rewind($csvStream);
    $csvContent = stream_get_contents($csvStream);
    fclose($csvStream);

    $filename = $table . "_event_" . $eventId . ".csv";
    $zip->addFromString($filename, $csvContent);
}

$zip->close();

// 5) Stuur ZIP naar browser (geen output vóór dit punt!)
$downloadName = "export_event_{$eventId}_" . date("Ymd_His") . ".zip";

// Maak outputbuffer schoon en zet headers
while (ob_get_level()) {
    ob_end_clean();
}

header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $downloadName . '"');
header('Content-Length: ' . filesize($zipFilePath));

// Stuur de bytes en sluit af
readfile($zipFilePath);
@unlink($zipFilePath);
exit;
