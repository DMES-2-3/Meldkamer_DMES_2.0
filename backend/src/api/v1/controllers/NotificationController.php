<?php
namespace App\Api\Controllers;

use App\Entity\AidTeam;
use App\Entity\Assistance;
use App\Entity\AVPU;
use App\Entity\Gender;
use App\Entity\Notification;
use App\Entity\Priority;
use App\Entity\SITRAP;
use App\Entity\NotificationStatus;
use App\Entity\Status;
use App\Entity\AidWorker;
use DoctrineProxies\__CG__\App\Entity\Event;
use TypeError;
use ValueError;
use DateTime;

require_once __DIR__ . "/BaseController.php";
require_once __DIR__ . "/IController.php";

class NotificationController extends BaseController implements IController
{
    private $repo;

    public function __construct($entityManager)
    {
        parent::__construct($entityManager);
        $this->repo = $this->entityManager->getRepository(Notification::class);
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
            $this->sendResponse(array_map(fn($r) => $r->toArray(), $response));
        } else {
            $response = $this->repo->findOneBy(["notificationId" => $id]);
            if (!$this->validateEntity($response, "Notification", $id)) {
                return;
            }
            $this->sendResponse($response->toArray());
        }
    }

    private function handlePost()
    {
        $input = $this->getJsonInput()["Report"] ?? null;
        if ($input === null) {
            $this->sendError("Invalid JSON input", 400);
            return;
        }

        $notification = new Notification();

        // Validate required entities
        $team = null;
        if (!empty($input["Team"])) {
            $team = $this->entityManager
                ->getRepository(AidTeam::class)
                ->findOneBy(["aidTeamName" => $input["Team"]]);
        }

        $event = $this->entityManager
            ->getRepository(Event::class)
            ->findOneBy(["eventName" => $input["NameEvent"] ?? null]);

        $missing = [];
        if (empty($event)) {
            $missing[] = "event '" . ($input["NameEvent"] ?? "") . "'";
        }

        if (!empty($missing)) {
            $suffix = count($missing) > 1 ? " do not exist" : " does not exist";
            $this->sendError(implode(", ", $missing) . $suffix, 400);
            return;
        }

        try {
            // Set notification properties
            $notification->setReportedBy($input["ReportedBy"] ?? null);
            $notification->setEvent($event);
            $notification->setSubject($input["Subject"] ?? null);
            $notification->setMapLocation($input["Location"] ?? null);
            $notification->setDescription($input["Note"] ?? null);
            $notification->setNotepad($input["Notepad"] ?? null);
            if ($team) {
                $notification->setAidTeam($team);
            }

            if (isset($input["Prioriteit"])) {
                $notification->setPriority(
                    Priority::from($input["Prioriteit"]),
                );
            }
            if (isset($input["Status"])) {
                $notification->setStatus(
                    NotificationStatus::from($input["Status"]),
                );
            }

            $notification->setAmbulanceNeeded(
                isset($input["Ambulance"]) ? (bool) $input["Ambulance"] : false,
            );

            // Set timestamp
            if (!empty($input["Time"])) {
                $dt = DateTime::createFromFormat("H:i", $input["Time"]);
                if ($dt === false) {
                    $this->sendError("Invalid time format, expected HH:mm", 400);
                    return;
                }
                $notification->setTime($dt);
            } else {
                $notification->setTime(new DateTime());
            }

            // Setup SITRAP
            if (!empty($input["SITrap"])) {
                $SITRAP = new SITRAP();
                $sitr = $input["SITrap"];
                $SITRAP->setDescription($sitr["Event"] ?? null);
                $SITRAP->setInjury($sitr["Condition"] ?? null);
                $notification->setSITRAP($SITRAP);
                if (isset($sitr["Gender"])) {
                    $notification->setGender(Gender::from($sitr["Gender"]));
                }
                $this->entityManager->persist($SITRAP);
            }

            // Setup AVPU
            if (!empty($input["AVPU"])) {
                $AVPU = new AVPU();
                $avpu = $input["AVPU"];
                $AVPU->setAlert($avpu["Alert"] ?? null);
                $AVPU->setVerbal($avpu["Verbal"] ?? null);
                $AVPU->setPain($avpu["Pain"] ?? null);
                $AVPU->setUnresponsive($avpu["Unresponsive"] ?? null);
                $notification->setAVPU($AVPU);
                $this->entityManager->persist($AVPU);
            }

            // Setup Assistance
            if (!empty($input["Assistance"])) {
                $Assistance = new Assistance();
                $ass = $input["Assistance"];
                $Assistance->setCoordinator($ass["Coordinator"] ?? null);
                $Assistance->setDoctor($ass["Doctor"] ?? null);
                $Assistance->setEmergencyCare($ass["Spoedzorg"] ?? null);
                $Assistance->setBasicCareVPK($ass["BasiszorgVPK"] ?? null);

                if (!empty($ass["Team"])) {
                    $assistanceTeam = $this->entityManager
                        ->getRepository(AidTeam::class)
                        ->findOneBy(["aidTeamName" => $ass["Team"]]);
                    if ($assistanceTeam) {
                        $Assistance->setAidTeam($assistanceTeam);
                    }
                }

                $notification->setAssistance($Assistance);
            }

            // Persist all entities
            $this->entityManager->persist($notification);
            $this->entityManager->flush();

            $this->sendResponse($notification->toArray());
        } catch (ValueError | TypeError $e) {
            $this->sendError(
                "Invalid value provided: " . $e->getMessage(),
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

        $notification = $this->repo->find($id);
        if (!$this->validateEntity($notification, "notification", $id)) {
            return;
        }

        $input = $this->getJsonInput();
        if ($input === null) {
            return;
        }

        // Handle nested Report structure if provided
        if (isset($input["Report"])) {
            $input = $input["Report"];
        }

        try {
            $this->updateNotificationFields($notification, $input);
            $this->updateRelatedEntities($notification, $input);
            $this->updateNestedEntities($notification, $input);

            $this->entityManager->flush();
            $this->sendResponse($notification->toArray());
        } catch (ValueError | TypeError $e) {
            $this->sendError(
                "Invalid value provided: " . $e->getMessage(),
                422,
            );
        }
    }

    private function updateNotificationFields($notification, $input)
    {
        if (isset($input["Subject"])) {
            $notification->setSubject($input["Subject"]);
        }

        if (isset($input["Location"])) {
            $notification->setMapLocation($input["Location"]);
        }

        if (isset($input["Note"])) {
            $notification->setDescription($input["Note"]);
        }

        if (isset($input["Notepad"])) {
            $notification->setNotepad($input["Notepad"]);
        }

        if (isset($input["Prioriteit"])) {
            $notification->setPriority(Priority::from($input["Prioriteit"]));
        }

        if (isset($input["Status"])) {
            $newStatus = NotificationStatus::from($input["Status"]);
            $notification->setStatus($newStatus);

            if ($newStatus === NotificationStatus::CLOSED) {
                // Reset the primary AidTeam status to AVAILABLE
                $primaryTeam = $notification->getAidTeam();
                if ($primaryTeam !== null) {
                    $primaryTeam->setStatus(Status::AVAILABLE);
                }

                // Reset the Assistance AidTeam status to AVAILABLE
                $assistance = $notification->getAssistance();
                if ($assistance !== null) {
                    $assistanceTeam = $assistance->getAidTeam();
                    if ($assistanceTeam !== null) {
                        $assistanceTeam->setStatus(Status::AVAILABLE);
                    }
                }
            }
        }

        if (isset($input["Ambulance"])) {
            $notification->setAmbulanceNeeded((bool) $input["Ambulance"]);
        }

        if (array_key_exists("ReportedBy", $input)) {
            $notification->setReportedBy($input["ReportedBy"]);
        }

        if (isset($input["Time"])) {
            $dt = DateTime::createFromFormat("H:i", $input["Time"]);
            if ($dt === false) {
                $this->sendError("Invalid time format, expected HH:mm", 400);
                return;
            }
            $notification->setTime($dt);
        }
    }

    private function updateRelatedEntities($notification, $input)
    {
        if (array_key_exists("Team", $input)) {
            if ($input["Team"] === null || $input["Team"] === "") {
                $notification->setAidTeam(null);
            } else {
                $team = $this->entityManager
                    ->getRepository(AidTeam::class)
                    ->findOneBy(["aidTeamName" => $input["Team"]]);
                if (empty($team)) {
                    $this->sendError(
                        "team " . $input["Team"] . " does not exist",
                        400,
                    );
                    return;
                }
                $notification->setAidTeam($team);
            }
        }

        if (isset($input["NameEvent"])) {
            $event = $this->entityManager
                ->getRepository(Event::class)
                ->findOneBy(["eventName" => $input["NameEvent"]]);
            if (empty($event)) {
                $this->sendError(
                    "event " . $input["NameEvent"] . " does not exist",
                    400,
                );
                return;
            }
            $notification->setEvent($event);
        }
    }

    private function updateNestedEntities($notification, $input)
    {
        // Update SITRAP
        if (isset($input["SITrap"])) {
            $sitrap = $notification->getSITRAP();
            if (!$sitrap) {
                $sitrap = new SITRAP();
                $notification->setSITRAP($sitrap);
                $this->entityManager->persist($sitrap);
            }
            $sitrapData = $input["SITrap"];

            if (array_key_exists("Event", $sitrapData)) {
                $sitrap->setDescription($sitrapData["Event"]);
            }
            if (array_key_exists("Condition", $sitrapData)) {
                $sitrap->setInjury($sitrapData["Condition"]);
            }
        }

        // Update AVPU
        if (isset($input["AVPU"])) {
            $avpu = $notification->getAVPU();
            if (!$avpu) {
                $avpu = new AVPU();
                $notification->setAVPU($avpu);
                $this->entityManager->persist($avpu);
            }
            $avpuData = $input["AVPU"];

            if (isset($avpuData["Alert"])) {
                $avpu->setAlert($avpuData["Alert"]);
            }
            if (isset($avpuData["Verbal"])) {
                $avpu->setVerbal($avpuData["Verbal"]);
            }
            if (isset($avpuData["Pain"])) {
                $avpu->setPain($avpuData["Pain"]);
            }
            if (isset($avpuData["Unresponsive"])) {
                $avpu->setUnresponsive($avpuData["Unresponsive"]);
            }
        }

        // Update Gender
        if (isset($input["SITrap"]["Gender"])) {
            $notification->setGender(Gender::from($input["SITrap"]["Gender"]));
        }

        // Update Assistance
        if (isset($input["Assistance"])) {
            $assistance = $notification->getAssistance();
            if (!$assistance) {
                $assistance = new Assistance();
                $notification->setAssistance($assistance);
            }
            $assistanceData = $input["Assistance"];

            if (isset($assistanceData["Coordinator"])) {
                $assistance->setCoordinator($assistanceData["Coordinator"]);
            }
            if (isset($assistanceData["Doctor"])) {
                $assistance->setDoctor($assistanceData["Doctor"]);
            }
            if (isset($assistanceData["Spoedzorg"])) {
                $assistance->setEmergencyCare($assistanceData["Spoedzorg"]);
            }
            if (isset($assistanceData["BasiszorgVPK"])) {
                $assistance->setBasicCareVPK($assistanceData["BasiszorgVPK"]);
            }

            if (array_key_exists("Team", $assistanceData)) {
                if (empty($assistanceData["Team"])) {
                    $assistance->setAidTeam(null);
                } else {
                    $assistanceTeam = $this->entityManager
                        ->getRepository(AidTeam::class)
                        ->findOneBy(["aidTeamName" => $assistanceData["Team"]]);
                    if ($assistanceTeam) {
                        $assistance->setAidTeam($assistanceTeam);
                    }
                }
            }
        }
    }

    private function handleDelete($id)
    {
        if ($id === null) {
            $this->sendError("ID is required for DELETE requests", 400);
            return;
        }

        $notification = $this->repo->find($id);
        if (!$this->validateEntity($notification, "notification", $id)) {
            return;
        }

        $this->entityManager->remove($notification);
        $this->entityManager->flush();

        $this->sendResponse(["message" => "Notification deleted successfully"]);
    }
}
?>
