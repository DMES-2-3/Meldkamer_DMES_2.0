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
use App\Entity\Event;
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
                return;
        }
    }

    private function handleGet($id = null)
    {
        if ($id === null) {
            $eventId = $_GET["eventId"] ?? null;

            if ($eventId !== null) {
                $event = $this->entityManager
                    ->getRepository(Event::class)
                    ->findOneBy(["eventId" => (int) $eventId]);

                if (!$event) {
                    $this->sendError("Event not found", 404);
                    return;
                }

                $response = $this->repo->findBy(["event" => $event]);
            } else {
                $response = $this->repo->findAll();
            }

            $this->sendResponse(array_map(fn($r) => $r->toArray(), $response));
            return;
        }

        $response = $this->repo->findOneBy(["notificationId" => $id]);
        if (!$this->validateEntity($response, "Notification", $id)) {
            return;
        }

        $this->sendResponse($response->toArray());
    }

    private function handlePost()
    {
        $json = $this->getJsonInput();
        $input = is_array($json) ? ($json["Report"] ?? null) : null;

        if ($input === null || !is_array($input)) {
            $this->sendError("Invalid JSON input", 400);
            return;
        }

        $notification = new Notification();

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
            $notification->setReportedBy($input["ReportedBy"] ?? null);
            $notification->setEvent($event);
            $notification->setSubject($input["Subject"] ?? null);
            $notification->setMapLocation($input["Location"] ?? "");
            $notification->setDescription($input["Note"] ?? null);
            $notification->setNotepad($input["Notepad"] ?? null);

            if ($team) {
                $notification->setAidTeam($team);
                $statusVal = $input["Status"] ?? null;
                $newStatus =
                    $statusVal === NotificationStatus::CLOSED->value
                        ? Status::AVAILABLE
                        : Status::NOTIFICATION;
                $team->setStatus($newStatus);
                $this->entityManager->persist($team);
            }

            if (isset($input["Prioriteit"])) {
                $notification->setPriority(Priority::from($input["Prioriteit"]));
            }

            if (isset($input["Status"])) {
                $newStatus = NotificationStatus::from($input["Status"]);
                $notification->setStatus($newStatus);

                if ($newStatus === NotificationStatus::PENDING && $notification->getAssignedAt() === null) {
                    $notification->setAssignedAt(new \DateTime());
                }

                if ($newStatus === NotificationStatus::CLOSED && $notification->getClosedAt() === null) {
                    $notification->setClosedAt(new \DateTime());
                }
            }

            $notification->setAmbulanceNeeded(
                isset($input["Ambulance"]) ? (bool) $input["Ambulance"] : false
            );

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

            if (!empty($input["SITrap"]) && is_array($input["SITrap"])) {
                $sitrapEntity = new SITRAP();
                $sitr = $input["SITrap"];

                $sitrapEntity->setDescription($sitr["Event"] ?? null);
                $sitrapEntity->setInjury($sitr["Condition"] ?? null);
                $notification->setSITRAP($sitrapEntity);

                if (isset($sitr["Gender"])) {
                    $notification->setGender(Gender::from($sitr["Gender"]));
                }

                $this->entityManager->persist($sitrapEntity);
            }

            if (!empty($input["AVPU"]) && is_array($input["AVPU"])) {
                $avpuEntity = new AVPU();
                $avpu = $input["AVPU"];

                $avpuEntity->setAlert($avpu["Alert"] ?? null);
                $avpuEntity->setVerbal($avpu["Verbal"] ?? null);
                $avpuEntity->setPain($avpu["Pain"] ?? null);
                $avpuEntity->setUnresponsive($avpu["Unresponsive"] ?? null);

                $notification->setAVPU($avpuEntity);
                $this->entityManager->persist($avpuEntity);
            }

            if (!empty($input["Assistance"]) && is_array($input["Assistance"])) {
                $assistanceEntity = new Assistance();
                $ass = $input["Assistance"];

                $assistanceEntity->setCoordinator($ass["Coordinator"] ?? null);
                $assistanceEntity->setDoctor($ass["Doctor"] ?? null);
                $assistanceEntity->setEmergencyCare($ass["Spoedzorg"] ?? null);
                $assistanceEntity->setBasicCareVPK($ass["BasiszorgVPK"] ?? null);

                if (!empty($ass["Team"])) {
                    $assistanceTeam = $this->entityManager
                        ->getRepository(AidTeam::class)
                        ->findOneBy(["aidTeamName" => $ass["Team"]]);

                    if ($assistanceTeam) {
                        $assistanceEntity->setAidTeam($assistanceTeam);
                        $statusVal = $input["Status"] ?? null;
                        $newStatus =
                            $statusVal === NotificationStatus::CLOSED->value
                                ? Status::AVAILABLE
                                : Status::NOTIFICATION;
                        $assistanceTeam->setStatus($newStatus);
                        $this->entityManager->persist($assistanceTeam);
                    }
                }

                $notification->setAssistance($assistanceEntity);
            }

            if (isset($input["Logbook"]) && is_array($input["Logbook"])) {
                foreach ($input["Logbook"] as $logbookData) {
                    $logbook = new \App\Entity\Logbook();
                    $logbook->setNotification($notification);
                    $logbook->setEvent($logbookData["event"] ?? "");

                    $timeStr = $logbookData["time"] ?? "";
                    $time = \DateTime::createFromFormat("H:i", $timeStr);
                    if (!$time) {
                        $time = new \DateTime();
                    }

                    $logbook->setTime($time);
                    $this->entityManager->persist($logbook);
                    $notification->addLogbook($logbook);
                }
            }

            $this->entityManager->persist($notification);
            $this->entityManager->flush();

            $this->sendResponse($notification->toArray());
        } catch (ValueError | TypeError $e) {
            $this->sendError(
                "Ongeldige waarde ingevoerd: " . $e->getMessage(),
                422,
            );
            return;
        } catch (\Throwable $e) {
            error_log("Notification POST failed: " . $e->getMessage());
            $message = $e->getMessage();

            if (strpos($message, "Data too long") !== false) {
                $this->sendError("Invoer te groot voor één van de velden.", 400);
            } else {
                $this->sendError("Er is een interne fout opgetreden.", 500);
            }
            return;
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
        if ($input === null || !is_array($input)) {
            $this->sendError("Invalid JSON input", 400);
            return;
        }

        if (isset($input["Report"]) && is_array($input["Report"])) {
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
                "Ongeldige waarde ingevoerd: " . $e->getMessage(),
                422,
            );
            return;
        } catch (\Throwable $e) {
            error_log("Notification PATCH failed: " . $e->getMessage());
            $message = $e->getMessage();

            if (strpos($message, "Data too long") !== false) {
                $this->sendError("Invoer te groot voor één van de velden.", 400);
            } else {
                $this->sendError("Er is een interne fout opgetreden.", 500);
            }
            return;
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
           
            if ($newStatus === NotificationStatus::PENDING) {
                $notification->setAssignedAt(new \DateTime());
                $notification->setClosedAt(null);
            }

            if ($newStatus === NotificationStatus::CLOSED && $notification->getClosedAt() === null) {
                $notification->setClosedAt(new \DateTime());
            }

            $notification->setStatus($newStatus);

            if ($newStatus === NotificationStatus::CLOSED) {
                $primaryTeam = $notification->getAidTeam();
                if ($primaryTeam !== null) {
                    $primaryTeam->setStatus(Status::AVAILABLE);
                }

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

                $statusVal =
                    $input["Status"] ??
                    ($notification->getStatus()
                        ? $notification->getStatus()->value
                        : null);

                $newStatus =
                    $statusVal === NotificationStatus::CLOSED->value
                        ? Status::AVAILABLE
                        : Status::NOTIFICATION;

                $team->setStatus($newStatus);
                $this->entityManager->persist($team);
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
        if (isset($input["SITrap"]) && is_array($input["SITrap"])) {
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

        if (isset($input["AVPU"]) && is_array($input["AVPU"])) {
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

        if (isset($input["SITrap"]["Gender"])) {
            $notification->setGender(Gender::from($input["SITrap"]["Gender"]));
        }

        if (isset($input["Assistance"]) && is_array($input["Assistance"])) {
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

                        $statusVal =
                            $input["Status"] ??
                            ($notification->getStatus()
                                ? $notification->getStatus()->value
                                : null);

                        $newStatus =
                            $statusVal === NotificationStatus::CLOSED->value
                                ? Status::AVAILABLE
                                : Status::NOTIFICATION;

                        $assistanceTeam->setStatus($newStatus);
                        $this->entityManager->persist($assistanceTeam);
                    }
                }
            }
        }

        if (isset($input["Logbook"]) && is_array($input["Logbook"])) {
            $existingLogbooks = $notification->getLogbooks();

            foreach ($existingLogbooks as $logbook) {
                $this->entityManager->remove($logbook);
            }

            $notification->getLogbooks()->clear();

            foreach ($input["Logbook"] as $logbookData) {
                $logbook = new \App\Entity\Logbook();
                $logbook->setNotification($notification);
                $logbook->setEvent($logbookData["event"] ?? "");

                $timeStr = $logbookData["time"] ?? "";
                $time = \DateTime::createFromFormat("H:i", $timeStr);
                if (!$time) {
                    $time = new \DateTime();
                }

                $logbook->setTime($time);
                $this->entityManager->persist($logbook);
                $notification->addLogbook($logbook);
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

        $team = $notification->getAidTeam();
        if ($team) {
            $activeForTeam = $this->repo
                ->createQueryBuilder("n")
                ->leftJoin("n.assistance", "a")
                ->where("(n.AidTeam = :team OR a.aidTeam = :team)")
                ->andWhere("n.status != :closed")
                ->andWhere("n.notificationId != :id")
                ->setParameter("team", $team)
                ->setParameter("closed", NotificationStatus::CLOSED->value)
                ->setParameter("id", $notification->getNotificationId())
                ->getQuery()
                ->getResult();

            if (empty($activeForTeam)) {
                $team->setStatus(Status::AVAILABLE);
                $this->entityManager->persist($team);
            }
        }

        $assistance = $notification->getAssistance();
        if ($assistance && $assistance->getAidTeam()) {
            $assistanceTeam = $assistance->getAidTeam();
            $activeForAssistanceTeam = $this->repo
                ->createQueryBuilder("n")
                ->leftJoin("n.assistance", "a")
                ->where("(n.AidTeam = :team OR a.aidTeam = :team)")
                ->andWhere("n.status != :closed")
                ->andWhere("n.notificationId != :id")
                ->setParameter("team", $assistanceTeam)
                ->setParameter("closed", NotificationStatus::CLOSED->value)
                ->setParameter("id", $notification->getNotificationId())
                ->getQuery()
                ->getResult();

            if (empty($activeForAssistanceTeam)) {
                $assistanceTeam->setStatus(Status::AVAILABLE);
                $this->entityManager->persist($assistanceTeam);
            }
        }

        $this->entityManager->remove($notification);
        $this->entityManager->flush();

        $this->sendResponse(["message" => "Notification deleted successfully"]);
    }
}