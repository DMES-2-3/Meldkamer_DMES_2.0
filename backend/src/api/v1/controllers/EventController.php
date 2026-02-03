<?php
namespace App\Api\Controllers;

use App\Entity\Event;
use TypeError;
use ValueError;

require_once __DIR__ . "/BaseController.php";
require_once __DIR__ . "/IController.php";

class EventController extends BaseController implements IController
{
    private $repo;

    public function __construct($entityManager)
    {
        parent::__construct($entityManager);
        $this->repo = $this->entityManager->getRepository(Event::class);
    }

    public function handleRequest($method, $id = null)
    {
        switch ($method) {
            case "GET":
                return $this->handleGet($id);
            case "POST":
                return $this->handlePost($id);
            case "PUT":
                return $this->handlePut($id);
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
            $response = $this->repo->findOneBy(["eventId" => $id]);
            if (!$this->validateEntity($response, "eventId", $id)) {
                return;
            }
            $this->sendResponse($response->toArray());
        }
    }

    private function handlePost()
    {
        $event = new Event();

        $input = $this->getJsonInput();
        if ($input === null) {
            return;
        }

        try {
            if (isset($input["eventName"])) {
                $event->setEventName($input["eventName"]);
            }
            if (isset($input["postcode"])) {
                $event->setPostcode($input["postcode"]);
            }
            $this->entityManager->persist($event);
            $this->entityManager->flush();

            $this->sendResponse($event->toArray(), 200);
        } catch (ValueError | TypeError $e) {
            $this->sendError("Missing argument(s)", 422);
        }
    }

    private function handleDelete($id)
    {
        if ($id === null) {
            $this->sendError("ID is required for DELETE requests", 400);
            return;
        }

        $event = $this->repo->findOneBy(["eventId" => $id]);
        if (!$this->validateEntity($event, "eventId", $id)) {
            return;
        }

        try {
            $this->entityManager->remove($event);
            $this->entityManager->flush();

            $this->sendResponse(
                ["message" => "Event deleted successfully"],
                200,
            );
        } catch (TypeError $e) {
            $this->sendError("Error deleting event", 500);
        }
    }

    private function handlePut($id)
    {
        if ($id === null) {
            $this->sendError("ID is required for PUT requests", 400);
            return;
        }

        $event = $this->repo->findOneBy(["eventId" => $id]);
        if (!$this->validateEntity($event, "eventId", $id)) {
            return;
        }

        $input = $this->getJsonInput();
        if ($input === null) {
            return;
        }

        try {
            if (isset($input["eventName"])) {
                $event->setEventName($input["eventName"]);
            }
            if (isset($input["postcode"])) {
                $event->setPostcode($input["postcode"]);
            }

            $this->entityManager->persist($event);
            $this->entityManager->flush();

            $this->sendResponse($event->toArray(), 200);
        } catch (ValueError | TypeError $e) {
            $this->sendError("Missing argument(s)", 422);
        }
    }
}
