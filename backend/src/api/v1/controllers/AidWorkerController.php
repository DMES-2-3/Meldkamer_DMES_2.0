<?php
namespace App\Api\Controllers;

use App\Entity\AidTeam;
use App\Entity\AidWorker;
use App\Entity\Status;
use TypeError;
use ValueError;

require_once __DIR__ . "/BaseController.php";
require_once __DIR__ . "/IController.php";

class AidWorkerController extends BaseController implements IController
{
    private $repo;

    public function __construct($entityManager)
    {
        parent::__construct($entityManager);
        $this->repo = $this->entityManager->getRepository(AidWorker::class);
        header("Content-Type: application/json");
        header("Access-Control-Allow-Origin: *");
    }

    public function handleRequest($method, $id = null)
    {
        switch ($method) {
            case "GET":
                return $this->handleGet($id);
            case "POST":
                return $this->handlePost();
            case "PATCH":
                return $this->handlePatch($id);
            case "DELETE":
                return $this->handleDelete($id);
            default:
                $this->sendError("Method not allowed", 405);
        }
    }

    private function handleGet($id = null)
    {
        if ($id === null) {
            $response = $this->repo->findAll();
            $this->sendResponse(
                array_map(fn($r) => $this->workerToArray($r), $response),
            );
        } else {
            $aidWorker = $this->repo->find($id);
            if (!$this->validateEntity($aidWorker, "AidWorker", $id)) {
                return;
            }
            $this->sendResponse($this->workerToArray($aidWorker));
        }
    }

    private function workerToArray($worker)
    {
        $status = $worker->getStatus();
        $statusValue = $status ? $status->value : "AVAILABLE";

        // Map status to color
        $colorMap = [
            "AVAILABLE" => "#10B981",
            "BUSY" => "#F59E0B",
            "UNAVAILABLE" => "#EF4444",
            "OFF_DUTY" => "#6B7280",
        ];

        return [
            "id" => $worker->getAidWorkerId(),
            "name" => trim(
                $worker->getFirstname() . " " . $worker->getLastname(),
            ),
            "firstName" => $worker->getFirstname(),
            "lastName" => $worker->getLastname(),
            "role" => $worker->getAidWorkerType() ?? "N/A",
            "callNumber" => $worker->getCallSign() ?? "",
            "note" => $worker->getDescription() ?? "",
            "status" => $statusValue,
            "color" => $colorMap[$statusValue] ?? "#10B981",
            "teamName" => $worker->getTeam()
                ? $worker->getTeam()->getAidTeamName()
                : "N/A",
            "teamId" => $worker->getTeam()
                ? $worker->getTeam()->getAidTeamId()
                : null,
        ];
    }

    private function handlePost()
    {
        $input = $this->getJsonInput();
        if ($input === null) {
            return;
        }

        $team = $this->entityManager
            ->getRepository(AidTeam::class)
            ->findOneBy(["aidTeamName" => $input["teamName"] ?? null]);

        if (!$team) {
            $this->sendError(
                "Team " . ($input["teamName"] ?? "") . " does not exist",
                400,
            );
            return;
        }

        try {
            $aidWorker = new AidWorker();
            $aidWorker->setAidWorkerType($input["workerType"] ?? "");
            $aidWorker->setFirstname($input["firstName"] ?? "");
            $aidWorker->setLastname($input["lastName"] ?? "");
            $aidWorker->setCallSign($input["callNumber"] ?? "");
            $aidWorker->setDescription($input["note"] ?? "");
            if (isset($input["status"])) {
                $aidWorker->setStatus(Status::from($input["status"]));
            }
            $aidWorker->setTeam($team);
            $aidWorker->setIsActive(true);

            $this->entityManager->persist($aidWorker);
            $this->entityManager->flush();

            $this->sendResponse($this->workerToArray($aidWorker), 200);
        } catch (ValueError | TypeError $e) {
            $this->sendError(
                "Invalid or missing argument(s): " . $e->getMessage(),
                422,
            );
        }
    }

    private function handlePatch($id)
    {
        if ($id === null) {
            $this->sendError("ID is required for PATCH requests", 400);
            return;
        }

        $aidWorker = $this->repo->find($id);
        if (!$this->validateEntity($aidWorker, "AidWorker", $id)) {
            return;
        }

        $input = $this->getJsonInput();
        if ($input === null) {
            return;
        }

        try {
            $inputFields = [
                "workerType",
                "firstName",
                "lastName",
                "callNumber",
                "note",
                "status",
                "teamName",
            ];
            foreach ($inputFields as $field) {
                if (!isset($input[$field])) {
                    continue;
                }
                switch ($field) {
                    case "workerType":
                        $aidWorker->setAidWorkerType($input[$field]);
                        break;
                    case "firstName":
                        $aidWorker->setFirstname($input[$field]);
                        break;
                    case "lastName":
                        $aidWorker->setLastname($input[$field]);
                        break;
                    case "callNumber":
                        $aidWorker->setCallSign($input[$field]);
                        break;
                    case "note":
                        $aidWorker->setDescription($input[$field]);
                        break;
                    case "status":
                        $aidWorker->setStatus(Status::from($input[$field]));
                        break;
                    case "teamName":
                        $team = $this->entityManager
                            ->getRepository(AidTeam::class)
                            ->findOneBy(["aidTeamName" => $input[$field]]);
                        if (!$team) {
                            $this->sendError(
                                "Team " . $input[$field] . " does not exist",
                                400,
                            );
                            return;
                        }
                        $aidWorker->setTeam($team);
                        break;
                }
            }

            $this->entityManager->flush();
            $this->sendResponse($this->workerToArray($aidWorker));
        } catch (ValueError | TypeError $e) {
            $this->sendError(
                "Invalid value provided: " . $e->getMessage(),
                422,
            );
        }
    }

    private function handleDelete($id)
    {
        if ($id === null) {
            $this->sendError("ID is required for DELETE requests", 400);
            return;
        }

        $aidWorker = $this->repo->find($id);
        if (!$this->validateEntity($aidWorker, "AidWorker", $id)) {
            return;
        }

        $this->entityManager->remove($aidWorker);
        $this->entityManager->flush();
        $this->sendResponse(["message" => "AidWorker deleted successfully"]);
    }
}
?>
