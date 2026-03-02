<?php
namespace App\Api\Controllers;

use App\Entity\AidTeam;
use App\Entity\AidWorker;
use App\Entity\Event;
use App\Entity\Status;
use Doctrine\ORM\EntityManagerInterface;

class AidTeamController
{
    private EntityManagerInterface $em;

    public function __construct(EntityManagerInterface $em)
    {
        $this->em = $em;
        header("Content-Type: application/json");
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");

        if ($em->getConnection()->getDatabase() === null) {
            throw new \Exception("Database connection not available.");
        }
    }

    public function handleRequest(string $method, ?string $id = null): void
    {
        if ($method === "OPTIONS") {
            http_response_code(200);
            exit();
        }

        switch ($method) {
            case "GET":
                $this->handleGet($id);
                break;
            case "POST":
                $this->handlePost();
                break;
            case "PUT":
                $this->handlePut($id);
                break;
            case "DELETE":
                $this->handleDelete($id);
                break;
            default:
                http_response_code(405);
                echo json_encode(["error" => "Method not allowed"]);
        }
    }

    // -------------------------------------------------------------------------
    // GET /aidteam              — all teams (optionally filtered by ?eventId=X)
    // GET /aidteam/:id          — single team with its workers
    // -------------------------------------------------------------------------
    private function handleGet(?string $id = null): void
    {
        try {
            if ($id !== null) {
                $team = $this->em->getRepository(AidTeam::class)->find($id);
                if (!$team) {
                    http_response_code(404);
                    echo json_encode(["error" => "Team not found"]);
                    return;
                }
                echo json_encode($team->toArray());
                return;
            }

            $eventId = $_GET["eventId"] ?? null;

            if ($eventId !== null) {
                $teams = $this->em
                    ->createQueryBuilder()
                    ->select("t")
                    ->from(AidTeam::class, "t")
                    ->leftJoin("t.event", "e")
                    ->where("e.eventId = :eventId")
                    ->setParameter("eventId", (int) $eventId)
                    ->getQuery()
                    ->getResult();
            } else {
                $teams = $this->em->getRepository(AidTeam::class)->findAll();
            }

            echo json_encode(array_map(fn($t) => $t->toArray(), $teams));
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------------------
    // POST /aidteam
    // Required: teamName, workerIds (array of 2+ AidWorker IDs), eventId
    // Optional: callNumber, note, status
    //
    // All referenced workers must:
    //   - exist in the database
    //   - belong to the same event
    //   - not already be assigned to another team
    // -------------------------------------------------------------------------
    private function handlePost(): void
    {
        $data = $this->parseJsonBody();
        if ($data === null) {
            return;
        }

        // Validate required fields
        if (empty($data["teamName"])) {
            http_response_code(400);
            echo json_encode(["error" => "teamName is required"]);
            return;
        }

        if (empty($data["eventId"])) {
            http_response_code(400);
            echo json_encode(["error" => "eventId is required"]);
            return;
        }

        if (
            !isset($data["workerIds"]) ||
            !is_array($data["workerIds"]) ||
            count($data["workerIds"]) < 2
        ) {
            http_response_code(400);
            echo json_encode([
                "error" =>
                    "workerIds must be an array of at least 2 worker IDs",
            ]);
            return;
        }

        try {
            $event = $this->em
                ->getRepository(Event::class)
                ->find($data["eventId"]);
            if (!$event) {
                http_response_code(404);
                echo json_encode([
                    "error" => "Event with id {$data["eventId"]} not found",
                ]);
                return;
            }

            // Resolve and validate all workers before touching anything
            $workers = $this->resolveWorkers(
                $data["workerIds"],
                (int) $data["eventId"],
            );
            if ($workers === null) {
                // resolveWorkers already sent the error response
                return;
            }

            $team = new AidTeam();
            $team->setAidTeamName($data["teamName"]);
            $team->setCallNumber($data["callNumber"] ?? null);
            $team->setDescription($data["note"] ?? null);
            $team->setUpdatedAt(new \DateTime());
            $team->setIsActive(true);
            $team->setEvent($event);

            $statusEnum =
                Status::tryFrom($data["status"] ?? "AVAILABLE") ??
                Status::AVAILABLE;
            $team->setStatus($statusEnum);

            // addAidWorker() also calls worker->setTeam($team) which sets isActive = true
            foreach ($workers as $worker) {
                $team->addAidWorker($worker);
            }

            $this->em->persist($team);
            $this->em->flush();

            http_response_code(201);
            echo json_encode($team->toArray());
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                "error" => "Error creating team: " . $e->getMessage(),
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // PUT /aidteam/:id
    // Accepts the same fields as POST.
    // When workerIds is provided the team's worker list is fully replaced:
    //   - workers removed from the list have isActive set back to false
    //   - newly added workers have isActive set to true
    // -------------------------------------------------------------------------
    private function handlePut(?string $id): void
    {
        if ($id === null) {
            http_response_code(400);
            echo json_encode(["error" => "Team ID is required for update"]);
            return;
        }

        $data = $this->parseJsonBody();
        if ($data === null) {
            return;
        }

        try {
            $team = $this->em->getRepository(AidTeam::class)->find($id);
            if (!$team) {
                http_response_code(404);
                echo json_encode(["error" => "Team not found"]);
                return;
            }

            if (isset($data["teamName"])) {
                $team->setAidTeamName($data["teamName"]);
            }
            if (isset($data["callNumber"])) {
                $team->setCallNumber($data["callNumber"]);
            }
            if (isset($data["note"])) {
                $team->setDescription($data["note"]);
            }
            if (isset($data["status"])) {
                $statusEnum = Status::tryFrom($data["status"]);
                if ($statusEnum === null) {
                    http_response_code(422);
                    echo json_encode([
                        "error" => "Invalid status value: {$data["status"]}",
                    ]);
                    return;
                }
                $team->setStatus($statusEnum);
            }
            if (isset($data["eventId"])) {
                $event = $this->em
                    ->getRepository(Event::class)
                    ->find($data["eventId"]);
                if (!$event) {
                    http_response_code(404);
                    echo json_encode([
                        "error" => "Event with id {$data["eventId"]} not found",
                    ]);
                    return;
                }
                $team->setEvent($event);
            }

            // Replace the worker list if workerIds is provided
            if (isset($data["workerIds"])) {
                if (
                    !is_array($data["workerIds"]) ||
                    count($data["workerIds"]) < 2
                ) {
                    http_response_code(400);
                    echo json_encode([
                        "error" =>
                            "workerIds must be an array of at least 2 worker IDs",
                    ]);
                    return;
                }

                $eventId = $team->getEvent()?->getEventId();
                $newWorkers = $this->resolveWorkers(
                    $data["workerIds"],
                    $eventId,
                    $team, // pass current team so currently-assigned workers are allowed
                );
                if ($newWorkers === null) {
                    return;
                }

                $this->syncWorkers($team, $newWorkers);
            }

            $team->setUpdatedAt(new \DateTime());
            $this->em->flush();

            echo json_encode($team->toArray());
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                "error" => "Error updating team: " . $e->getMessage(),
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // DELETE /aidteam/:id
    // Unassigns all workers (isActive = false) before removing the team.
    // -------------------------------------------------------------------------
    private function handleDelete(?string $id): void
    {
        if ($id === null) {
            http_response_code(400);
            echo json_encode(["error" => "Team ID is required"]);
            return;
        }

        try {
            $team = $this->em->getRepository(AidTeam::class)->find($id);
            if (!$team) {
                http_response_code(404);
                echo json_encode(["error" => "Team not found"]);
                return;
            }

            // Unassign all workers so they become available again
            foreach ($team->getAidWorkers()->toArray() as $worker) {
                $team->removeAidWorker($worker);
            }

            $this->em->remove($team);
            $this->em->flush();

            http_response_code(204);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                "error" => "Error deleting team: " . $e->getMessage(),
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Resolve an array of worker IDs to AidWorker entities with validation.
     *
     * Rules:
     *  - Each ID must point to an existing AidWorker.
     *  - Each worker must belong to the given event (when eventId is provided).
     *  - A worker must not already be assigned to a *different* team.
     *    (If $currentTeam is supplied workers already in that team are allowed.)
     *
     * Returns the array of AidWorker objects, or null if any validation failed
     * (the method sends the HTTP error response itself in that case).
     *
     * @param int[]         $workerIds
     * @param int|null      $eventId
     * @param AidTeam|null  $currentTeam  Pass when updating so existing members are not rejected
     * @return AidWorker[]|null
     */
    private function resolveWorkers(
        array $workerIds,
        ?int $eventId,
        ?AidTeam $currentTeam = null,
    ): ?array {
        $workerRepo = $this->em->getRepository(AidWorker::class);
        $workers = [];

        foreach ($workerIds as $workerId) {
            $worker = $workerRepo->find($workerId);

            if (!$worker) {
                http_response_code(404);
                echo json_encode([
                    "error" => "AidWorker with id {$workerId} not found",
                ]);
                return null;
            }

            // Make sure the worker belongs to the correct event
            if (
                $eventId !== null &&
                $worker->getEvent()?->getEventId() !== $eventId
            ) {
                http_response_code(400);
                echo json_encode([
                    "error" => "AidWorker {$workerId} does not belong to event {$eventId}",
                ]);
                return null;
            }

            // Make sure the worker is not already assigned to a *different* team
            $assignedTeam = $worker->getTeam();
            if ($assignedTeam !== null) {
                $isSameTeam =
                    $currentTeam !== null &&
                    $assignedTeam->getAidTeamId() ===
                        $currentTeam->getAidTeamId();

                if (!$isSameTeam) {
                    http_response_code(400);
                    echo json_encode([
                        "error" =>
                            "AidWorker {$workerId} is already assigned to team " .
                            "'{$assignedTeam->getAidTeamName()}' (id {$assignedTeam->getAidTeamId()}). " .
                            "Remove them from that team first.",
                    ]);
                    return null;
                }
            }

            $workers[] = $worker;
        }

        return $workers;
    }

    /**
     * Synchronise the team's worker collection to exactly match $newWorkers.
     *
     * - Workers in the team but NOT in $newWorkers are removed (isActive → false).
     * - Workers in $newWorkers but NOT yet in the team are added (isActive → true).
     */
    private function syncWorkers(AidTeam $team, array $newWorkers): void
    {
        $newIds = array_map(fn($w) => $w->getAidWorkerId(), $newWorkers);

        // Remove workers no longer in the list
        foreach ($team->getAidWorkers()->toArray() as $existing) {
            if (!in_array($existing->getAidWorkerId(), $newIds, true)) {
                $team->removeAidWorker($existing); // sets worker->isActive = false
            }
        }

        // Add new workers
        foreach ($newWorkers as $worker) {
            $team->addAidWorker($worker); // idempotent, sets worker->isActive = true
        }
    }

    /**
     * Parse the request body as JSON.
     * Sends a 400 response and returns null on failure.
     */
    private function parseJsonBody(): ?array
    {
        $data = json_decode(file_get_contents("php://input"), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid JSON body"]);
            return null;
        }
        return $data;
    }
}
