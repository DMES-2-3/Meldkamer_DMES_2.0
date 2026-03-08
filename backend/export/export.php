<?php  
try {
    /** @var \Doctrine\ORM\EntityManagerInterface $entityManager */
    $entityManager = require dirname(__DIR__) . '/bootstrap.php';
    $conn = $entityManager->getConnection();
} catch (Throwable $e) {
    http_response_code(500);
    echo "DB/Doctrine initialisatiefout: " . $e->getMessage();
    exit;
}

// 1) Input lezen
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$eventIdRaw = $_POST['eventId'] ?? $input['eventId'] ?? $_GET['eventId'] ?? 1;
$eventId = max(1, (int)$eventIdRaw);

// 2) Kerncijfers
$summaryData = [];
try {
    $event = $conn->executeQuery(
        "SELECT * FROM `Event` WHERE eventId = :eventId", 
        ['eventId' => $eventId]
    )->fetchAssociative();

    if ($event) {
        $summaryData['Evenement'] = $event['eventName'];
        $summaryData['Postcode'] = $event['postcode'] ?? '';
        $summaryData['Aangemaakt op'] = $event['createdAt'] ?? '';
        $summaryData['Laatst bijgewerkt'] = $event['updatedAt'] ?? '';
    }

    $summaryData['Totaal aantal meldingen'] =
        (int)$conn->executeQuery(
            "SELECT COUNT(*) FROM `Notification` WHERE FK_event = :eventId",
            ['eventId' => $eventId]
    )->fetchOne();

    $summaryData['Totaal aantal teams'] = (int)$conn->executeQuery(
        "SELECT COUNT(*) FROM `AidTeam` WHERE FK_Event = :eventId",
        ['eventId' => $eventId]
    )->fetchOne();

    $summaryData['Totaal aantal hulpverleners'] = (int)$conn->executeQuery(
        "SELECT COUNT(*) FROM `AidWorker` WHERE FK_Event = :eventId",
        ['eventId' => $eventId]
    )->fetchOne();

} catch (Throwable $e) {
    error_log("Fout bij kerncijfers: " . $e->getMessage());
}

// 3) Meldingen ophalen
$notificationsQuery = "
    SELECT 
        n.reportedBy,
        n.subject,
        n.mapLocation,
        n.time,
        n.status,
        n.priority,
        n.ambulanceNeeded,
        n.description,

        a.alert,
        a.verbal,
        a.pain,
        a.unresponsive,

        ass.coordinator,
        ass.doctor,
        ass.emergencyCare,
        ass.basicCareVPK,

        s.injury AS sitrapInjury,
        s.description AS sitrapDescription

    FROM Notification n
    LEFT JOIN AVPU a ON n.FK_AVPU = a.AVPUId
    LEFT JOIN Assistance ass ON n.FK_Assistance = ass.assistanceId
    LEFT JOIN SITRAP s ON n.FK_SITRAP = s.SITRAPId
    WHERE n.FK_event = :eventId
    ORDER BY n.time ASC
";

$notifications = [];
try {
    $stmt = $conn->executeQuery($notificationsQuery, ['eventId' => $eventId]);
    $notifications = $stmt->fetchAllAssociative();
} catch (Throwable $e) {
    error_log("Fout bij meldingen: " . $e->getMessage());
}

// 4) Data verwerken
foreach ($notifications as &$row) {

    // Datum formatteren
    if (!empty($row['time'])) {
        $row['time'] = date('d-m-Y H:i:s', strtotime($row['time']));
    }

    // STATUS vertalen (database: REGISTERED, NOTIFICATION, SIGNED_OUT)
    $statusMap = [
        'REGISTERED'   => 'Open',
        'NOTIFICATION' => 'In behandeling',
        'SIGNED_OUT'   => 'Gesloten'
    ];
    $row['status'] = $statusMap[$row['status']] ?? $row['status'];

    // PRIORITY vertalen (database: GREEN, ORANGE, RED)
    $priorityMap = [
        'GREEN'  => 'Groen',
        'ORANGE' => 'Oranje',
        'RED'    => 'Rood'
    ];
    $row['priority'] = $priorityMap[$row['priority']] ?? $row['priority'];

    // Ambulance ja/nee
    $row['ambulanceNeeded'] = $row['ambulanceNeeded'] ? 'Ja' : 'Nee';

    // Locatie filteren indien coordinaten
    if (!empty($row['mapLocation']) &&
        preg_match('/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/', $row['mapLocation'])) {
        $row['mapLocation'] = '';
    }

    // AVPU samenvoegen
    $avpu = [];
    if (!empty($row['alert'])) $avpu[] = 'Alert';
    if (!empty($row['verbal'])) $avpu[] = 'Verbaal';
    if (!empty($row['pain'])) $avpu[] = 'Pijn';
    if (!empty($row['unresponsive'])) $avpu[] = 'Onresponsief';
    $row['AVPU'] = implode(', ', $avpu);

    // Assistance samenvoegen
    $assistance = [];
    if (!empty($row['coordinator'])) $assistance[] = 'Coordinator';
    if (!empty($row['doctor'])) $assistance[] = 'Arts';
    if (!empty($row['emergencyCare'])) $assistance[] = 'Spoedzorg';
    if (!empty($row['basicCareVPK'])) $assistance[] = 'Basiszorg VPK';
    $row['Assistance'] = implode(', ', $assistance);

    // SITRAP alleen indien gevuld
    if (!empty($row['sitrapInjury']) || !empty($row['sitrapDescription'])) {
        $row['SITRAP'] = trim($row['sitrapInjury'] . ' - ' . $row['sitrapDescription'], ' -');
    } else {
        $row['SITRAP'] = '';
    }

    unset(
        $row['alert'], $row['verbal'], $row['pain'], $row['unresponsive'],
        $row['coordinator'], $row['doctor'], $row['emergencyCare'], $row['basicCareVPK'],
        $row['sitrapInjury'], $row['sitrapDescription']
    );
}
unset($row);

// 5) Lege kolommen volledig verwijderen
if (!empty($notifications)) {

    $columnsToRemove = [];

    foreach (array_keys($notifications[0]) as $column) {
        $allEmpty = true;
        foreach ($notifications as $row) {
            if (!empty($row[$column])) {
                $allEmpty = false;
                break;
            }
        }
        if ($allEmpty) {
            $columnsToRemove[] = $column;
        }
    }

    foreach ($notifications as &$row) {
        foreach ($columnsToRemove as $col) {
            unset($row[$col]);
        }
    }
    unset($row);
}

// 6) ZIP maken
$zip = new ZipArchive();
$zipFilePath = tempnam(sys_get_temp_dir(), 'export_zip_');
$zip->open($zipFilePath, ZipArchive::OVERWRITE);

$eventNameSafe = strtolower(
    preg_replace('/[^a-zA-Z0-9_-]/', '_', $event['eventName'] ?? 'evenement')
);

// Kerncijfers CSV
$csvStream = fopen('php://temp', 'r+');
fputcsv($csvStream, array_keys($summaryData), ';', '"', '\\');
fputcsv($csvStream, array_values($summaryData), ';', '"', '\\');
rewind($csvStream);
$zip->addFromString("kerncijfers_{$eventNameSafe}.csv", stream_get_contents($csvStream));
fclose($csvStream);

// Meldingen CSV
$csvStream = fopen('php://temp', 'r+');

if (!empty($notifications)) {

    $headersNL = [
        'reportedBy' => 'Gemeld door',
        'subject' => 'Onderwerp',
        'mapLocation' => 'Locatie',
        'time' => 'Tijdstip',
        'status' => 'Status',
        'priority' => 'Prioriteit',
        'ambulanceNeeded' => 'Ambulance nodig',
        'description' => 'Beschrijving',
        'AVPU' => 'Bewustzijn (AVPU)',
        'Assistance' => 'Assistentie',
        'SITRAP' => 'Situatierapport'
    ];

    $headerRow = [];
    foreach (array_keys($notifications[0]) as $key) {
        $headerRow[] = $headersNL[$key] ?? $key;
    }

    fputcsv($csvStream, $headerRow, ';', '"', '\\');

    foreach ($notifications as $row) {
        fputcsv($csvStream, $row, ';', '"', '\\');
    }

} else {
    fputcsv($csvStream, ["Geen meldingen gevonden"], ';', '"', '\\');
}

rewind($csvStream);
$zip->addFromString("meldingen_{$eventNameSafe}.csv", stream_get_contents($csvStream));
fclose($csvStream);

$zip->close();

// Output
while (ob_get_level()) ob_end_clean();

header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="export_evenement_'.$eventNameSafe.'_'.date("Ymd_His").'.zip"');
header('Content-Length: ' . filesize($zipFilePath));

readfile($zipFilePath);
@unlink($zipFilePath);
exit;