<?php
namespace App\Api;

require __DIR__ . "/../../../bootstrap.php";

$allowedOrigin =
    $_ENV['CORS_ALLOWED_ORIGIN']
    ?? $_SERVER['CORS_ALLOWED_ORIGIN']
    ?? getenv('CORS_ALLOWED_ORIGIN')
    ?? '';

if ($allowedOrigin !== '') {
    header("Access-Control-Allow-Origin: $allowedOrigin");
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Origin");
    header("Access-Control-Allow-Credentials: true");
}

header("Content-Type: application/json; charset=utf-8");
error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
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

require_once __DIR__ . "/controllers/AidWorkerController.php";
require_once __DIR__ . "/controllers/NotificationController.php";
require_once __DIR__ . "/controllers/EventController.php";
require_once __DIR__ . "/controllers/MapController.php";
require_once __DIR__ . "/controllers/MapEntityController.php";
require_once __DIR__ . "/controllers/MapUploadController.php";
require_once __DIR__ . "/controllers/AidTeamController.php";
require_once __DIR__ . "/controllers/UserController.php";

global $entityManager;

// Parse the request URI
$path = trim(parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH), "/");
$path = explode("/", $path);

$resource = $path[3] ?? null;
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

    case "user":
        $controller = new UserController($entityManager);
        $action = $id;
        $controller->handleRequest($method, $action);
        break;

    case null:
        echo json_encode(["message" => "API running"]);
        break;

    default:
        http_response_code(404);
        echo json_encode(["error" => "Resource '" . $resource . "' not found"]);
        break;
}