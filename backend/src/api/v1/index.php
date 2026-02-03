<?php
namespace App\Api;

// Set headers and error reporting at the very beginning
header("Content-Type: application/json; charset=utf-8");
error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);

// Handle pre-flight OPTIONS requests
if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") {
    http_response_code(204); // No Content
    exit();
}

use App\Api\Controllers\AidWorkerController;
use App\Api\Controllers\EventController;
use App\Api\Controllers\MapController;
use App\Api\Controllers\MapEntityController;
use App\Api\Controllers\MapUploadController;
use App\Api\Controllers\NotificationController;
use App\Api\Controllers\AidTeamController;
use App\Api\Controllers\UserController;

require __DIR__ . "/../../../bootstrap.php";
require_once __DIR__ . "/controllers/AidWorkerController.php";
require_once __DIR__ . "/controllers/NotificationController.php";
require_once __DIR__ . "/controllers/EventController.php";
require_once __DIR__ . "/controllers/MapController.php";
require_once __DIR__ . "/controllers/MapEntityController.php";
require_once __DIR__ . "/controllers/MapUploadController.php";
require_once __DIR__ . "/controllers/MapUploadController.php";
require_once __DIR__ . "/controllers/AidTeamController.php";
require_once __DIR__ . "/controllers/UserController.php";

global $entityManager;

// Parse the request URI
$path = trim($_SERVER["REQUEST_URI"], "/");
$path = explode("/", $path);

$resource = $path[3] ?? null;
// Handle query strings in resource name
if ($resource && strpos($resource, "?") !== false) {
    $resource = substr($resource, 0, strpos($resource, "?"));
}
$id = $path[4] ?? null;
$subResource = $path[5] ?? null;
$subId = $path[6] ?? null;
$method = $_SERVER["REQUEST_METHOD"];

// Route requests to appropriate controllers
switch ($resource) {
    case "aidteam":
        $controller = new AidTeamController($entityManager);
        $controller->handleRequest($method, $id);
        break;

    case "aidworker":
        $controller = new AidWorkerController($entityManager);
        $controller->handleRequest($method, $id);
        break;

    case "notification":
        $controller = new NotificationController($entityManager);
        $controller->handleRequest($method, $id);
        break;

    case "event":
    case "events":
        $controller = new EventController($entityManager);
        $controller->handleRequest($method, $id);
        break;

    case "maps":
        $controller = new MapController($entityManager);
        $controller->handleRequest($method, $id, $subResource, $subId);
        break;

    case "map-entities":
        $controller = new MapEntityController($entityManager);
        $controller->handleRequest($method, $id);
        break;

    case null:
        header("Content-Type: application/json");
        echo json_encode(["message" => "API running"]);
        break;
    case "user":
        $controller = new \App\Api\Controllers\UserController($entityManager);
        $action = $id;
        $controller->handleRequest($method, $action);
        break;

    default:
        http_response_code(404);
        header("Content-Type: application/json");
        echo json_encode(["error" => "Resource '" . $resource . "' not found"]);
        break;
}
?>
