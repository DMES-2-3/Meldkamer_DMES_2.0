<?php
namespace App\Api\Controllers;

use App\Entity\AidTeam;
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

    public function handleRequest(string $method, ?string $id = null)
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
            case "DELETE":
                return $this->handleDelete($id);
            default:
                http_response_code(405);
                echo json_encode(["error" => "Method not allowed"]);
        }
    }

    private function handleGet(?string $id = null)
    {
        try {
            if ($id) {
                $team = $this->em->getRepository(AidTeam::class)->find($id);
                if (!$team) {
                    http_response_code(404);
                    echo json_encode(["error" => "Team not found"]);
                    return;
                }
                echo json_encode($this->teamToArray($team));
                return;
            }

            // Check for event filter parameter
            $eventId = $_GET["eventId"] ?? null;

            if ($eventId) {
                $queryBuilder = $this->em->createQueryBuilder();
                $queryBuilder
                    ->select("t")
                    ->from(AidTeam::class, "t")
                    ->leftJoin("t.event", "e")
                    ->where("e.eventId = :eventId")
                    ->setParameter("eventId", $eventId);

                $teams = $queryBuilder->getQuery()->getResult();
            } else {
                $teams = $this->em->getRepository(AidTeam::class)->findAll();
            }

            $teamsArray = array_map([$this, "teamToArray"], $teams);

            echo json_encode($teamsArray);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    }

    private function handlePost()
    {
        $data = json_decode(file_get_contents("php://input"), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid JSON"]);
            return;
        }

        try {
            $team = new AidTeam();
            $team->setAidTeamName($data["teamName"] ?? "");
            $team->setCallNumber($data["callNumber"] ?? null);
            $team->setDescription($data["note"] ?? "");
            $team->setIsActive(true);
            $team->setUpdatedAt(new \DateTime());

            $statusEnum = Status::tryFrom($data["status"] ?? "AVAILABLE");
            if ($statusEnum === null) {
                $statusEnum = Status::AVAILABLE;
            }
            $team->setStatus($statusEnum);

            // Set event if provided
            if (isset($data["eventId"])) {
                $event = $this->em
                    ->getRepository(Event::class)
                    ->find($data["eventId"]);
                if ($event) {
                    $team->setEvent($event);
                }
            }

            $this->em->persist($team);
            $this->em->flush();

            http_response_code(201);
            echo json_encode($this->teamToArray($team));
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                "error" => "Error creating team: " . $e->getMessage(),
            ]);
        }
    }

    private function handlePut(?string $id)
    {
        if ($id === null) {
            http_response_code(400);
            echo json_encode(["error" => "Team ID is required for update"]);
            return;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid JSON"]);
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
            if (isset($data["status"])) {
                $statusEnum = Status::tryFrom($data["status"]);
                if ($statusEnum) {
                    $team->setStatus($statusEnum);
                }
            }
            if (isset($data["note"])) {
                $team->setDescription($data["note"]);
            }
            if (isset($data["callNumber"])) {
                $team->setCallNumber($data["callNumber"]);
            }
            if (isset($data["eventId"])) {
                $event = $this->em
                    ->getRepository(Event::class)
                    ->find($data["eventId"]);
                $team->setEvent($event);
            }

            $team->setUpdatedAt(new \DateTime());
            $this->em->flush();

            echo json_encode($this->teamToArray($team));
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                "error" => "Error updating team: " . $e->getMessage(),
            ]);
        }
    }

    private function handleDelete(?string $id)
    {
        if ($id === null) {
            http_response_code(400);
            echo json_encode(["error" => "Team ID required"]);
            return;
        }

        try {
            $team = $this->em->getRepository(AidTeam::class)->find($id);

            if (!$team) {
                http_response_code(404);
                echo json_encode(["error" => "Team not found"]);
                return;
            }

            $this->em->remove($team);
            $this->em->flush();

            http_response_code(204); // No Content
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                "error" => "Error deleting team: " . $e->getMessage(),
            ]);
        }
    }

    private function teamToArray(AidTeam $team): array
    {
        $statusValue = $team->getStatus()?->value ?? "AVAILABLE";

        return [
            "id" => $team->getAidTeamId(),
            "name" => $team->getAidTeamName(),
            "callNumber" => $team->getCallNumber(),
            "status" => $statusValue,
            "note" => $team->getDescription(),
            "isActive" => $team->isActive(),
            "eventId" => $team->getEvent()?->getEventId(),
            "updatedAt" => $team->getUpdatedAt()
                ? $team->getUpdatedAt()->format("Y-m-d\TH:i:s.u\Z")
                : null,
        ];
    }
}
