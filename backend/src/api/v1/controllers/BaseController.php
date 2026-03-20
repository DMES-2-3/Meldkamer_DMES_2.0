<?php
namespace App\Api\Controllers;

use Exception;

class BaseController
{
    protected $entityManager;
    protected $uploadsDir;

    public function __construct($entityManager)
    {
        $this->entityManager = $entityManager;

        $this->uploadsDir = "/var/www/html/uploads/";
        if (!is_dir($this->uploadsDir) && !mkdir($this->uploadsDir, 0775, true)) {
            $this->sendError("Cannot create uploads directory", 500);
        }

        $this->setupHeaders();
    }

    protected function setupHeaders()
    {
        header("Content-Type: application/json; charset=utf-8");

        ini_set("display_errors", 0);
        ini_set("display_startup_errors", 0);
        error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED & ~E_NOTICE & ~E_WARNING);
    }

    protected function sendResponse($data, $statusCode = 200)
    {
        http_response_code($statusCode);
        if (is_array($data) && array_is_list($data)) {
            echo json_encode([
                "success" => true,
                "data" => $data,
            ]);
        } else {
            if (!isset($data["success"])) {
                $data["success"] = true;
            }
            echo json_encode($data);
        }

        exit();
    }

    protected function sendError($message, $statusCode = 400)
    {
        http_response_code($statusCode);
        echo json_encode([
            "success" => false,
            "error" => $message,
        ]);
        exit();
    }

    protected function getJsonInput()
    {
        $input = json_decode(file_get_contents("php://input"), true);
        if ($input === null) {
            $this->sendError("Invalid JSON input", 400);
        }
        return $input;
    }

    protected function validateEntity($entity, $entityName, $id)
    {
        if ($entity === null) {
            $this->sendError("Could not find {$entityName} with id {$id}", 404);
        }
        return true;
    }
}
?>
