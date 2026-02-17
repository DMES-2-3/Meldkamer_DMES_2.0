<?php
namespace App\Api\Controllers;

use App\Entity\Map;
use App\Entity\Event;
use App\Entity\MapType;

class MapController extends BaseController
{
    private $repo;

    public function __construct($entityManager)
    {
        parent::__construct($entityManager);
        $this->repo = $entityManager->getRepository(Map::class);
    }

    public function handleRequest($method, $id = null, $sub = null)
    {
        if ($method === "OPTIONS") {
            http_response_code(200);
            exit();
        }

        switch ($method) {
            case "GET":
                if ($id && $sub === "file") {
                    return $this->serveFile($id);
                }
                return $this->handleGet($id);

            case "POST":
                return $this->handlePost();

            case "DELETE":
                return $this->handleDelete($id);

            default:
                $this->sendError("Method not allowed", 405);
        }
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
        $map->setMapName(pathinfo($file["name"], PATHINFO_FILENAME));

        $this->entityManager->persist($map);
        $this->entityManager->flush();

        $this->sendResponse(["data" => $map->toArray()], 201);
    }

    private function handleGet($id)
    {
        if ($id) {
            $map = $this->repo->findOneBy(["mapId" => $id]);
            if (!$map) {
                $this->sendError("Map not found", 404);
            }
            $this->sendResponse($map->toArray());
            return;
        }

        $eventId = $_GET["eventId"] ?? null;
        if ($eventId) {
            $maps = $this->repo->findBy(["event" => $eventId]);
        } else {
            $maps = $this->repo->findAll();
        }

        $this->sendResponse(array_map(fn($m) => $m->toArray(), $maps));
    }

    private function handleDelete($id)
    {
        if (!$id) {
            $this->sendError("ID required", 400);
        }

        $map = $this->repo->findOneBy(["mapId" => $id]);
        if (!$map) {
            $this->sendError("Map not found", 404);
        }

        $file = $map->getFilePath();
        if ($file && file_exists($this->uploadsDir . $file)) {
            unlink($this->uploadsDir . $file);
        }

        $this->entityManager->remove($map);
        $this->entityManager->flush();

        $this->sendResponse(["message" => "Map deleted"]);
    }

    private function serveFile($id)
    {
        $map = $this->repo->findOneBy(["mapId" => $id]);
        if (!$map || !$map->getFilePath()) {
            http_response_code(404);
            exit();
        }

        $path = $this->uploadsDir . $map->getFilePath();
        if (!file_exists($path)) {
            http_response_code(404);
            exit();
        }

        header("Content-Type: application/pdf");
        header("Content-Length: " . filesize($path));
        readfile($path);
        exit();
    }
}
?>
