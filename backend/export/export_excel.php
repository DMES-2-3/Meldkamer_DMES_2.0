<?php
require dirname(__DIR__) . "/vendor/autoload.php"; // PhpSpreadsheet autoload

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;

try {
    /** @var \Doctrine\ORM\EntityManagerInterface $entityManager */
    $entityManager = require dirname(__DIR__) . "/bootstrap.php";
    $conn = $entityManager->getConnection();
} catch (Throwable $e) {
    http_response_code(500);
    echo "DB/Doctrine initialisatiefout: " . $e->getMessage();
    exit();
}

// --- 1) Input lezen ---
$input = json_decode(file_get_contents("php://input"), true) ?: [];
$eventIdRaw =
    $_POST["eventId"] ?? ($input["eventId"] ?? ($_GET["eventId"] ?? 1));
$eventId = max(1, (int) $eventIdRaw);

// --- 2) Kerncijfers ophalen ---
$summaryData = [];
try {
    $event = $conn
        ->executeQuery("SELECT * FROM `Event` WHERE eventId = :eventId", [
            "eventId" => $eventId,
        ])
        ->fetchAssociative();

    if ($event) {
        $summaryData["Evenement"] = $event["eventName"];
        $summaryData["Postcode"] = $event["postcode"] ?? "";
        $summaryData["Aangemaakt op"] = $event["createdAt"] ?? "";
        $summaryData["Laatst bijgewerkt"] = $event["updatedAt"] ?? "";
    }

    $summaryData["Totaal aantal meldingen"] = (int) $conn
        ->executeQuery(
            "SELECT COUNT(*) FROM `Notification` WHERE FK_event = :eventId",
            ["eventId" => $eventId],
        )
        ->fetchOne();

    $summaryData["Totaal aantal teams"] = (int) $conn
        ->executeQuery(
            "SELECT COUNT(*) FROM `AidTeam` WHERE FK_Event = :eventId",
            ["eventId" => $eventId],
        )
        ->fetchOne();

    $summaryData["Totaal aantal hulpverleners"] = (int) $conn
        ->executeQuery(
            "SELECT COUNT(*) FROM `AidWorker` WHERE FK_Event = :eventId",
            ["eventId" => $eventId],
        )
        ->fetchOne();
} catch (Throwable $e) {
    error_log("Fout bij kerncijfers: " . $e->getMessage());
}

// --- 3) Meldingen ophalen ---
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
        n.assignedAt,
        n.closedAt,
        (SELECT GROUP_CONCAT(CONCAT(DATE_FORMAT(l.time, '%H:%i'), ' : ', l.event) SEPARATOR '\n')
         FROM Logbook l
         WHERE l.FK_notification = n.notificationId) AS logbook,
        a.alert,
        a.verbal,
        a.pain,
        a.unresponsive,
        ass.coordinator,
        ass.doctor,
        ass.emergencyCare,
        ass.basicCareVPK,
        s.injury AS sitrapInjury,
        s.description AS sitrapDescription,
        t.aidTeamName AS team
    FROM Notification n
    LEFT JOIN AVPU a ON n.FK_AVPU = a.AVPUId
    LEFT JOIN Assistance ass ON n.FK_Assistance = ass.assistanceId
    LEFT JOIN SITRAP s ON n.FK_SITRAP = s.SITRAPId
    LEFT JOIN AidTeam t ON n.FK_AidTeam = t.aidTeamId
    WHERE n.FK_event = :eventId
    ORDER BY n.time ASC
";

$notifications = [];
try {
    $stmt = $conn->executeQuery($notificationsQuery, ["eventId" => $eventId]);
    $notifications = $stmt->fetchAllAssociative();
} catch (Throwable $e) {
    error_log("Fout bij meldingen: " . $e->getMessage());
}

// --- 4) Data verwerken ---
foreach ($notifications as &$row) {
    if (!empty($row["time"])) {
        $row["time"] = date("d-m-Y H:i:s", strtotime($row["time"]));
    }

    if (!empty($row["assignedAt"])) {
        $row["assignedAt"] = date("d-m-Y H:i:s", strtotime($row["assignedAt"]));
    }

    if (!empty($row["closedAt"])) {
        $row["closedAt"] = date("d-m-Y H:i:s", strtotime($row["closedAt"]));
    }

    if (!empty($row["time"]) && !empty($row["closedAt"])) {
        $start = strtotime($row["assignedAt"] ?? $row["time"]);
        $end = strtotime($row["closedAt"]);
        $row["Duur (minuten)"] = round(($end - $start) / 60); 
    } else {
        $row["Duur (minuten)"] = "";
    }

    $statusMap = [
        "REGISTERED" => "Open",
        "NEW" => "Open",
        "PENDING" => "In behandeling",
        "CLOSED" => "Gesloten",
    ];
    $row["status"] = $statusMap[$row["status"]] ?? $row["status"];

    $priorityMap = ["GREEN" => "Groen", "ORANGE" => "Oranje", "RED" => "Rood"];
    $row["priority"] = $priorityMap[$row["priority"]] ?? $row["priority"];

    $row["ambulanceNeeded"] = $row["ambulanceNeeded"] ? "Ja" : "Nee";

    if (
        !empty($row["mapLocation"]) &&
        preg_match('/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/', $row["mapLocation"])
    ) {
        $row["mapLocation"] = "Coordinaten";
    }

    $avpu = [];
    if ($row["alert"]) {
        $avpu[] = "Alert";
    }
    if ($row["verbal"]) {
        $avpu[] = "Verbaal";
    }
    if ($row["pain"]) {
        $avpu[] = "Pijn";
    }
    if ($row["unresponsive"]) {
        $avpu[] = "Onresponsief";
    }
    $row["AVPU"] = implode(", ", $avpu);

    $assistance = [];
    if ($row["coordinator"]) {
        $assistance[] = "Coordinator";
    }
    if ($row["doctor"]) {
        $assistance[] = "Arts";
    }
    if ($row["emergencyCare"]) {
        $assistance[] = "Spoedzorg";
    }
    if ($row["basicCareVPK"]) {
        $assistance[] = "Basiszorg VPK";
    }
    $row["Assistance"] = implode(", ", $assistance);

    if ($row["sitrapInjury"] || $row["sitrapDescription"]) {
        $row["SITRAP"] = trim(
            $row["sitrapInjury"] . " - " . $row["sitrapDescription"],
            " -",
        );
    } else {
        $row["SITRAP"] = "";
    }

    unset(
        $row["alert"],
        $row["verbal"],
        $row["pain"],
        $row["unresponsive"],
        $row["coordinator"],
        $row["doctor"],
        $row["emergencyCare"],
        $row["basicCareVPK"],
        $row["sitrapInjury"],
        $row["sitrapDescription"],
    );
}
unset($row);

// --- 5) Spreadsheet maken ---
$spreadsheet = new Spreadsheet();

// --- Kerncijfers sheet ---
$sheet1 = $spreadsheet->getActiveSheet();
$sheet1->setTitle("Kerncijfers");
$sheet1->fromArray(array_keys($summaryData), null, "A1");
$sheet1->fromArray(array_values($summaryData), null, "A2");

$lastCol1 = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(
    count($summaryData),
);
$lastRow1 = 2;

// Header stijl + randen
$sheet1->getStyle("A1:{$lastCol1}1")->applyFromArray([
    "font" => ["bold" => true, "color" => ["rgb" => "FFFFFF"]],
    "fill" => [
        "fillType" => Fill::FILL_SOLID,
        "startColor" => ["rgb" => "1E1B4B"],
    ],
    "borders" => [
        "allBorders" => [
            "borderStyle" => Border::BORDER_THIN,
            "color" => ["rgb" => "1E1B4B"],
        ],
    ],
]);

// Waarde rij randen en achtergrond
$sheet1->getStyle("A2:{$lastCol1}2")->applyFromArray([
    "borders" => [
        "allBorders" => [
            "borderStyle" => Border::BORDER_THIN,
            "color" => ["rgb" => "1E1B4B"],
        ],
    ],
    "fill" => [
        "fillType" => Fill::FILL_SOLID,
        "startColor" => ["rgb" => "FFFFFF"],
    ],
]);

// Auto kolombreedtes
foreach (range("A", $lastCol1) as $col) {
    $sheet1->getColumnDimension($col)->setAutoSize(true);
}

// --- Meldingen sheet ---
$sheet2 = $spreadsheet->createSheet();
$sheet2->setTitle("Meldingen");

if (!empty($notifications)) {
    $headersNL = [
        "reportedBy" => "Gemeld door",
        "subject" => "Onderwerp",
        "mapLocation" => "Locatie",
        "time" => "Melding aangemaakt",
        "assignedAt" => "Toegewezen op",
        "closedAt" => "Gesloten op",
        "status" => "Status",
        "priority" => "Prioriteit",
        "ambulanceNeeded" => "Ambulance nodig",
        "description" => "Beschrijving",
        "logbook" => "Logboek",
        "AVPU" => "Bewustzijn (AVPU)",
        "Assistance" => "Assistentie",
        "SITRAP" => "Situatierapport",
        "team" => "Team",
    ];

    $headerRow = [];
    foreach (array_keys($notifications[0]) as $key) {
        $headerRow[] = $headersNL[$key] ?? $key;
    }

    $sheet2->fromArray($headerRow, null, "A1");
    $sheet2->fromArray($notifications, null, "A2");

    $lastCol2 = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(
        count($headerRow),
    );
    $lastRow2 = count($notifications) + 1;

    // Header stijl + randen
    $sheet2->getStyle("A1:{$lastCol2}1")->applyFromArray([
        "font" => ["bold" => true, "color" => ["rgb" => "FFFFFF"]],
        "fill" => [
            "fillType" => Fill::FILL_SOLID,
            "startColor" => ["rgb" => "1E1B4B"],
        ],
        "borders" => [
            "allBorders" => [
                "borderStyle" => Border::BORDER_THIN,
                "color" => ["rgb" => "1E1B4B"],
            ],
        ],
    ]);

    // Alle cellen randen
    $sheet2->getStyle("A1:{$lastCol2}{$lastRow2}")->applyFromArray([
        "borders" => [
            "allBorders" => [
                "borderStyle" => Border::BORDER_THIN,
                "color" => ["rgb" => "1E1B4B"],
            ],
        ],
    ]);

    // Afwisselende rij-kleuren
    for ($rowNum = 2; $rowNum <= $lastRow2; $rowNum++) {
        $color = $rowNum % 2 == 0 ? "FFFFFF" : "F2F2F2";
        $sheet2
            ->getStyle("A{$rowNum}:{$lastCol2}{$rowNum}")
            ->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()
            ->setRGB($color);
    }

    // Auto kolombreedtes
    for ($i = 1; $i <= count($headerRow); $i++) {
        $sheet2->getColumnDimensionByColumn($i)->setAutoSize(true);
    }

    // Datumkolom formatteren
    if (in_array("time", array_keys($notifications[0]))) {
        $colIndex = array_search("time", array_keys($notifications[0])) + 1;
        $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(
            $colIndex,
        );
        $sheet2
            ->getStyle("{$colLetter}2:{$colLetter}{$lastRow2}")
            ->getNumberFormat()
            ->setFormatCode(NumberFormat::FORMAT_DATE_DATETIME);
    }
} else {
    $sheet2->setCellValue("A1", "Geen meldingen gevonden");
}

$sheet1->setSelectedCell("A1");
$sheet2->setSelectedCell("A1");
$spreadsheet->setActiveSheetIndex(0);

// --- Output ---
$eventNameSafe = strtolower(
    preg_replace("/[^a-zA-Z0-9_-]/", "_", $event["eventName"] ?? "evenement"),
);
$filename = "export_excel_{$eventNameSafe}_" . date("Ymd_His") . ".xlsx";

header(
    "Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
);
header("Content-Disposition: attachment; filename=\"{$filename}\"");
header("Cache-Control: max-age=0");

$writer = new Xlsx($spreadsheet);
$writer->save("php://output");
exit();
