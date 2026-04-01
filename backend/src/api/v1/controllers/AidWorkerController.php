<?php
namespace App\Api\Controllers;

use App\Entity\AidWorker;
use App\Entity\AidTeam;
use App\Entity\Event;
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
        header(
            "Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS",
        );
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
    }

    public function handleRequest($method, $id = null)
    {
        if ($method === "OPTIONS") {
            http_response_code(200);
            exit();
        }

        switch ($method) {
            case "GET":
                return $this->handleGet($id);
            case "POST":
                return $this->handlePost();
            case "PUT":
                return $this->handlePut($id);
            case "PATCH":
                return $this->handlePatch($id);
            case "DELETE":
                return $this->handleDelete($id);
            default:
                $this->sendError("Method not allowed", 405);
        }
    }

    // -------------------------------------------------------------------------
    // GET /aidworker          — all workers (optionally filtered by ?eventId=X)
    // GET /aidworker?available=1&eventId=X — only unassigned workers for event
    // GET /aidworker/:id      — single worker
    // -------------------------------------------------------------------------
    private function handleGet($id = null)
    {
        if ($id !== null) {
            $worker = $this->repo->find($id);
            if (!$this->validateEntity($worker, "AidWorker", $id)) {
                return;
            }
            $this->sendResponse($worker->toArray());
            return;
        }

        $eventId = $_GET["eventId"] ?? null;
        $available = isset($_GET["available"]) && $_GET["available"] !== "0";

        $qb = $this->entityManager
            ->createQueryBuilder()
            ->select("w")
            ->from(AidWorker::class, "w");

        if ($eventId !== null) {
            $qb->andWhere("w.event = :eventId")->setParameter(
                "eventId",
                (int) $eventId,
            );
        }

        // ?available=1 returns only workers not yet assigned to a team
        if ($available) {
            $qb->andWhere("w.team IS NULL");
        }

        $workers = $qb->getQuery()->getResult();

        $this->sendResponse(array_map(fn($w) => $w->toArray(), $workers));
    }

    // -------------------------------------------------------------------------
    // POST /aidworker
    // Required: firstName, lastName, callNumber, workerType, eventId
    // Optional: status, note
    // Workers are created WITHOUT a team — they become available for selection.
    // -------------------------------------------------------------------------
    private function handlePost()
    {
        $input = $this->getJsonInput();
        if ($input === null) {
            return;
        }

        // Validate required fields
        $required = [
            "firstName",
            "lastName",
            "callNumber",
            "workerType",
            "eventId",
        ];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                $this->sendError("Missing required field: {$field}", 400);
                return;
            }
        }

        $event = $this->entityManager
            ->getRepository(Event::class)
            ->find($input["eventId"]);
        if (!$event) {
            $this->sendError(
                "Event with id {$input["eventId"]} not found",
                404,
            );
            return;
        }

        try {
            $worker = new AidWorker();
            $worker->setFirstname($input["firstName"]);
            $worker->setLastname($input["lastName"]);
            $worker->setCallSign($input["callNumber"]);
            $worker->setAidWorkerType($input["workerType"]);
            $worker->setEvent($event);
            $worker->setDescription($input["note"] ?? null);
            $worker->setIsActive(false); // not active until assigned to a team

            $statusEnum =
                Status::tryFrom($input["status"] ?? "AVAILABLE") ??
                Status::AVAILABLE;
            $worker->setStatus($statusEnum);

            // Team is intentionally NOT set here — workers start unassigned
            // setTeam() on AidTeam will call worker->setTeam() which sets isActive

            $this->entityManager->persist($worker);
            $this->entityManager->flush();

            $this->sendResponse($worker->toArray(), 201);
        } catch (ValueError | TypeError $e) {
            $this->sendError(
                "Invalid of ontbrekend argument: " . $e->getMessage(),
                422,
            );
        } catch (\Exception $e) {
            $message = $e->getMessage();
            if (strpos($message, 'Data too long') !== false) {
                $this->sendError("Invoer te groot voor één van de velden (bijv. roepnummer of naam).", 400);
            } else {
                $this->sendError("Er is een interne fout opgetreden: " . $message, 500);
            }
        }
    }

    // -------------------------------------------------------------------------
    // PUT /aidworker/:id  — full update (all fields)
    // -------------------------------------------------------------------------
    private function handlePut($id)
    {
        if ($id === null) {
            $this->sendError("ID is required for PUT requests", 400);
            return;
        }

        $worker = $this->repo->find($id);
        if (!$this->validateEntity($worker, "AidWorker", $id)) {
            return;
        }

        $input = $this->getJsonInput();
        if ($input === null) {
            return;
        }

        try {
            $worker->setFirstname(
                $input["firstName"] ?? $worker->getFirstname(),
            );
            $worker->setLastname($input["lastName"] ?? $worker->getLastname());
            $worker->setCallSign(
                $input["callNumber"] ?? $worker->getCallSign(),
            );
            $worker->setAidWorkerType(
                $input["workerType"] ?? $worker->getAidWorkerType(),
            );
            $worker->setDescription(
                $input["note"] ?? $worker->getDescription(),
            );

            if (isset($input["status"])) {
                $statusEnum = Status::tryFrom($input["status"]);
                if ($statusEnum === null) {
                    $this->sendError(
                        "Invalid status value: {$input["status"]}",
                        422,
                    );
                    return;
                }
                $worker->setStatus($statusEnum);
            }

            if (isset($input["eventId"])) {
                $event = $this->entityManager
                    ->getRepository(Event::class)
                    ->find($input["eventId"]);
                if (!$event) {
                    $this->sendError(
                        "Event with id {$input["eventId"]} not found",
                        404,
                    );
                    return;
                }
                $worker->setEvent($event);
            }

            // Allow explicitly unassigning a worker from a team via PUT
            if (array_key_exists("teamId", $input)) {
                if ($input["teamId"] === null) {
                    // Remove from current team cleanly
                    $currentTeam = $worker->getTeam();
                    if ($currentTeam) {
                        $currentTeam->removeAidWorker($worker);
                    } else {
                        $worker->setTeam(null);
                    }
                } else {
                    $team = $this->entityManager
                        ->getRepository(AidTeam::class)
                        ->find($input["teamId"]);
                    if (!$team) {
                        $this->sendError(
                            "Team with id {$input["teamId"]} not found",
                            404,
                        );
                        return;
                    }
                    $team->addAidWorker($worker);
                }
            }

            $this->entityManager->flush();
            $this->sendResponse($worker->toArray());
        } catch (ValueError | TypeError $e) {
            $this->sendError(
                "Ongeldige waarde ingevoerd: " . $e->getMessage(),
                422,
            );
        } catch (\Exception $e) {
            $message = $e->getMessage();
            if (strpos($message, 'Data too long') !== false) {
                $this->sendError("Invoer te groot voor één van de velden (bijv. roepnummer of naam).", 400);
            } else {
                $this->sendError("Er is een interne fout opgetreden: " . $message, 500);
            }
        }
    }

    // -------------------------------------------------------------------------
    // PATCH /aidworker/:id  — partial update
    // -------------------------------------------------------------------------
    private function handlePatch($id)
    {
        if ($id === null) {
            $this->sendError("ID is required for PATCH requests", 400);
            return;
        }

        $worker = $this->repo->find($id);
        if (!$this->validateEntity($worker, "AidWorker", $id)) {
            return;
        }

        $input = $this->getJsonInput();
        if ($input === null) {
            return;
        }

        try {
            if (isset($input["firstName"])) {
                $worker->setFirstname($input["firstName"]);
            }
            if (isset($input["lastName"])) {
                $worker->setLastname($input["lastName"]);
            }
            if (isset($input["callNumber"])) {
                $worker->setCallSign($input["callNumber"]);
            }
            if (isset($input["workerType"])) {
                $worker->setAidWorkerType($input["workerType"]);
            }
            if (isset($input["note"])) {
                $worker->setDescription($input["note"]);
            }

            if (isset($input["status"])) {
                $statusEnum = Status::tryFrom($input["status"]);
                if ($statusEnum === null) {
                    $this->sendError(
                        "Invalid status value: {$input["status"]}",
                        422,
                    );
                    return;
                }
                $worker->setStatus($statusEnum);
            }

            if (isset($input["eventId"])) {
                $event = $this->entityManager
                    ->getRepository(Event::class)
                    ->find($input["eventId"]);
                if (!$event) {
                    $this->sendError(
                        "Event with id {$input["eventId"]} not found",
                        404,
                    );
                    return;
                }
                $worker->setEvent($event);
            }

            // array_key_exists so we can explicitly pass null to unassign
            if (array_key_exists("teamId", $input)) {
                if ($input["teamId"] === null) {
                    $currentTeam = $worker->getTeam();
                    if ($currentTeam) {
                        $currentTeam->removeAidWorker($worker);
                    } else {
                        $worker->setTeam(null);
                    }
                } else {
                    $team = $this->entityManager
                        ->getRepository(AidTeam::class)
                        ->find($input["teamId"]);
                    if (!$team) {
                        $this->sendError(
                            "Team with id {$input["teamId"]} not found",
                            404,
                        );
                        return;
                    }
                    $team->addAidWorker($worker);
                }
            }

            $this->entityManager->flush();
            $this->sendResponse($worker->toArray());
        } catch (ValueError | TypeError $e) {
            $this->sendError(
                "Ongeldige waarde ingevoerd: " . $e->getMessage(),
                422,
            );
        } catch (\Exception $e) {
            $message = $e->getMessage();
            if (strpos($message, 'Data too long') !== false) {
                $this->sendError("Invoer te groot voor één van de velden (bijv. roepnummer of naam).", 400);
            } else {
                $this->sendError("Er is een interne fout opgetreden: " . $message, 500);
            }
        }
    }

    // -------------------------------------------------------------------------
    // DELETE /aidworker/:id
    // Removes the worker from their team (if any) before deleting.
    // -------------------------------------------------------------------------
    private function handleDelete($id)
    {
        if ($id === null) {
            $this->sendError("ID is required for DELETE requests", 400);
            return;
        }

        $worker = $this->repo->find($id);
        if (!$this->validateEntity($worker, "AidWorker", $id)) {
            return;
        }

        // Cleanly remove from team so the team's collection stays consistent
        $team = $worker->getTeam();
        if ($team) {
            $team->removeAidWorker($worker);
        }

        $this->entityManager->remove($worker);
        $this->entityManager->flush();

        http_response_code(204);
        exit();
    }
}
