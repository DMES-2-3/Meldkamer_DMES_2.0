<?php
namespace App\Api\Controllers;

use App\Entity\Map;
use App\Entity\MapEntity;
use App\Entity\AidWorker;
use TypeError;
use ValueError;

require_once __DIR__ . "/BaseController.php";
require_once __DIR__ . "/IController.php";

class MapEntityController extends BaseController implements IController
{
    private $repo;
    private $repoMapEntities;

    public function __construct($entityManager)
    {
        parent::__construct($entityManager);
        $this->repo = $this->entityManager->getRepository(MapEntity::class);
    }

    public function handleRequest($method, $id = null)
    {
        switch ($method) {
            case "GET":
                return $this->handleGet($id);
            case "POST":
                return $this->handlePost();
            case "DELETE":
                return $this->handleDelete($id);
        }
    }

    public function handleGet($id = null)
    {
        if ($id === null) {
            $response = $this->repo->findAll();
            $this->sendResponse(array_map(fn($r) => $r->toArray(), $response));
        } else {
            $response = $this->repo->findOneBy(["mapEntityId" => $id]);
            if (!$this->validateEntity($response, "mapEntityId", $id)) {
                return;
            }
            $this->sendResponse($response->toArray());
        }
    }

    public function handlePost()
    {
        $input = $this->getJsonInput();
        if ($input === null) {
            return; // error already sent
        }

        $mapId = $input["mapId"] ?? null;
        $aidWorkerId = $input["aidWorkerId"] ?? null;
        $location = $input["location"] ?? null;

        if (!$mapId || !$location) {
            return $this->sendError(
                "Missing required fields: mapId, location",
                422,
            );
        }

        // Resolve Map
        $mapRepo = $this->entityManager->getRepository(Map::class);
        $map = $mapRepo->findOneBy(["mapId" => $mapId]);
        if (!$this->validateEntity($map, "mapId", $mapId)) {
            return;
        }

        // Optional AidWorker
        $aidWorker = null;
        if (!empty($aidWorkerId)) {
            $awRepo = $this->entityManager->getRepository(AidWorker::class);
            $aidWorker = $awRepo->findOneBy(["aidWorkerId" => $aidWorkerId]);
            if ($aidWorker === null) {
                return $this->sendError(
                    "Invalid aidWorkerId: {$aidWorkerId}",
                    422,
                );
            }
        }

        // Create and persist MapEntity
        $me = new MapEntity();
        $me->setMap($map);
        $me->setMapLocation($location);
        if ($aidWorker !== null) {
            $me->setAidWorker($aidWorker);
        }

        $this->entityManager->persist($me);
        $this->entityManager->flush();

        return $this->sendResponse($me->toArray(), 201);
    }

    private function handleDelete($id)
    {
        if ($id === null) {
            $this->sendError("ID is required for DELETE requests", 400);
            return;
        }

        $mapEntity = $this->repo->find($id);
        if (!$this->validateEntity($mapEntity, "map", $id)) {
            return;
        }

        $this->entityManager->remove($mapEntity);
        $this->entityManager->flush();

        $this->sendResponse(["message" => "Map Entity deleted successfully"]);
    }
}
?>
