<?php
namespace App\Api\Controllers;

use App\Entity\Map;
use App\Entity\Event;
use App\Entity\MapType;

class MapUploadController extends BaseController implements IController
{
    public function handleRequest($method, $id = null)
    {
        if ($method === "OPTIONS") {
            http_response_code(200);
            exit();
        }
        if ($method !== "POST") {
            $this->sendError("Method not allowed", 405);
        }

        return $this->handlePost();
    }

    private function handlePost()
    {
        if (!isset($_FILES["file"])) {
            $this->sendError("Missing file", 422);
        }

        $file = $_FILES["file"];
        if ($file["error"] !== UPLOAD_ERR_OK) {
            $this->sendError("Upload error", 422);
        }

        $eventId = $_POST["eventId"] ?? null;
        if (!$eventId) {
            $this->sendError("Missing eventId", 422);
        }

        $event = $this->entityManager->find(Event::class, $eventId);
        if (!$event) {
            $this->sendError("Event not found", 404);
        }

        $ext = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
        if ($ext !== "pdf") {
            $this->sendError("Only PDF files allowed", 422);
        }

        $filename = uniqid("map_", true) . ".pdf";
        $target = $this->uploadsDir . $filename;

        if (!move_uploaded_file($file["tmp_name"], $target)) {
            $this->sendError("File move failed", 500);
        }

        $map = new Map();
        $map->setEvent($event);
        $map->setMapType(MapType::PDF_MAP);
        $map->setFilePath($filename);
        $map->setMapName(htmlspecialchars($file["name"]));

        $this->entityManager->persist($map);
        $this->entityManager->flush();

        $this->sendResponse(
            [
                "mapId" => $map->getMapId(),
                "name" => $map->getMapName(),
                "filePath" => $map->getFilePath(),
                "eventId" => $map->getEvent()->getEventId(),
            ],
            201,
        );
    }
}
?>
