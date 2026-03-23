<?php
namespace App\Api\Controllers;

use App\Api\Controllers\BaseController;
use App\Entity\User;

class UserController extends BaseController
{
    public function handleRequest($method, $action = null)
    {
        switch ($action) {
            case "csrf":
                if ($method === "GET") {
                    $this->csrf();
                } else {
                    $this->sendError("Method not allowed", 405);
                }
                break;

            case "register":
                if ($method === "POST") {
                    $this->requireAdminSession();
                    $this->validateCsrfToken();
                    $this->register();
                } else {
                    $this->sendError("Method not allowed", 405);
                }
                break;

            case "login":
                if ($method === "POST") {
                    $this->validateCsrfToken();
                    $this->login();
                } else {
                    $this->sendError("Method not allowed", 405);
                }
                break;

            case "logout":
                if ($method === "DELETE") {
                    $this->validateCsrfToken();
                    $this->logout();
                } else {
                    $this->sendError("Method not allowed", 405);
                }
                break;

            case "session":
                if ($method === "GET") {
                    $this->checkSession();
                } else {
                    $this->sendError("Method not allowed", 405);
                }
                break;

            default:
                $this->sendError("Action not found", 404);
        }
    }

    private function requireAdminSession()
    {
        $this->startSecureSession();

        if (!isset($_SESSION["user_id"])) {
            $this->sendError(
                "Je moet ingelogd zijn als beheerder om een gebruiker te registreren.",
                401,
            );
        }

        $repo = $this->entityManager->getRepository(User::class);
        $user = $repo->find($_SESSION["user_id"]);

        if (!$user || !$user->isAdmin()) {
            $this->sendError(
                "Alleen beheerders mogen nieuwe gebruikers aanmaken.",
                403,
            );
        }
    }

    private function register()
    {
        $data = $this->getJsonInput();

        $required = [
            "firstname",
            "lastname",
            "username",
            "birthday",
            "email",
            "pass",
        ];
        $missing = [];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $missing[] = $field;
            }
        }
        if (!empty($missing)) {
            $this->sendError(
                "Vul alstublieft de volgende velden in: " .
                    implode(", ", $missing),
                400,
            );
        }

        $firstname = trim($data["firstname"]);
        $lastname = trim($data["lastname"]);
        $username = trim($data["username"]);
        $email = strtolower(trim($data["email"]));
        $password = $data["pass"];

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->sendError("Vul alstublieft een geldig email adres in.", 400);
        }

        $passwordErrors = [];
        if (strlen($password) < 12) {
            $passwordErrors[] = "ten minste 12 karakters";
        }
        if (!preg_match("/[A-Z]/", $password)) {
            $passwordErrors[] = "een hoofdletter";
        }
        if (!preg_match("/[a-z]/", $password)) {
            $passwordErrors[] = "een kleine letter";
        }
        if (!preg_match("/[0-9]/", $password)) {
            $passwordErrors[] = "een getal";
        }
        if (!preg_match("/[\W]/", $password)) {
            $passwordErrors[] = "een speciaal karakter";
        }

        if (!empty($passwordErrors)) {
            $this->sendError(
                "Wachtwoord moet het volgende bevatten: " .
                    implode(", ", $passwordErrors) .
                    ".",
                400,
            );
        }

        try {
            $birthday = new \DateTime($data["birthday"]);
        } catch (\Exception $e) {
            $this->sendError(
                "Vul alstublieft een geldige geboortedatum in (YYYY-MM-DD).",
                400,
            );
        }

        $repo = $this->entityManager->getRepository(User::class);
        if ($repo->findOneBy(["email" => $email])) {
            $this->sendError(
                "Dit email adres is al in gebruik. Probeer in te loggen of gebruik een ander email adres.",
                409,
            );
        }
        if ($repo->findOneBy(["username" => $username])) {
            $this->sendError(
                "Deze gebruikersnaam is al in gebruik. Probeer een andere gebruikersnaam.",
                409,
            );
        }

        $user = new User();
        $user->setFirstname($firstname);
        $user->setLastname($lastname);
        $user->setUsername($username);
        $user->setBirthday($birthday);
        $user->setEmail($email);
        $user->setPassword(password_hash($password, PASSWORD_BCRYPT));
        $user->setIsAdmin(0);

        try {
            $this->entityManager->persist($user);
            $this->entityManager->flush();
        } catch (\Exception $e) {
            $this->sendError(
                "Registratie mislukt. Probeer het later opnieuw.",
                500,
            );
        }

        $this->sendResponse(
            [
                "success" => true,
                "message" => "Registratie gelukt! U kunt nu inloggen.",
            ],
            201,
        );
    }

    private function login()
    {
        $data = $this->getJsonInput();

        if (empty($data["email"]) || empty($data["pass"])) {
            $this->sendError("Vul alstublieft uw email en wachtwoord in.", 400);
        }

        $repo = $this->entityManager->getRepository(User::class);
        $email = strtolower(trim($data["email"]));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->sendError("Vul alstublieft een geldig email adres in.", 400);
        }

        $user = $repo->findOneBy(["email" => $email]);
        if (!$user || !password_verify($data["pass"], $user->getPassword())) {
            $this->sendError(
                "Email of wachtwoord is onjuist, probeer het opnieuw.",
                401,
            );
        }

        $this->startSecureSession();
        session_regenerate_id(true);
        $_SESSION["user_id"] = $user->getUserId();
        $_SESSION["csrf_token"] = bin2hex(random_bytes(32));

        $this->sendResponse([
            "success" => true,
            "message" => "Login succesvol! Welkom terug!.",
        ]);
    }

    private function checkSession()
    {
        $this->startSecureSession();

        if (!isset($_SESSION["user_id"])) {
            $this->sendResponse([
                "success" => false,
                "message" => "Je bent niet ingelogd.",
            ]);
        }

        $repo = $this->entityManager->getRepository(User::class);
        $user = $repo->find($_SESSION["user_id"]);

        if (!$user) {
            session_destroy();
            $this->sendResponse(
                [
                    "success" => false,
                    "message" =>
                        "De sessie is verlopen. Log alstublieft opnieuw in.",
                ],
                401,
            );
        }

        $this->sendResponse([
            "success" => true,
            "message" => "Je bent ingelogd.",
            "user_id" => $user->getUserId(),
            "is_admin" => $user->isAdmin(),
        ]);
    }

    private function logout()
    {
        $this->startSecureSession();

        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                "",
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"],
            );
        }
        session_destroy();

        $this->sendResponse([
            "success" => true,
            "message" => "Je bent nu uitgelogd.",
        ]);
    }

    private function startSecureSession()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_set_cookie_params([
                "lifetime" => 0,
                "path" => "/",
                "secure" =>
                    (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ||
                    (isset($_SERVER["HTTP_X_FORWARDED_PROTO"]) &&
                        $_SERVER["HTTP_X_FORWARDED_PROTO"] === "https"),
                "httponly" => true,
                "samesite" => "Strict",
            ]);
            session_start();
        }
    }

    private function csrf()
    {
        $this->startSecureSession();

        if (empty($_SESSION["csrf_token"])) {
            $_SESSION["csrf_token"] = bin2hex(random_bytes(32));
        }

        $this->sendResponse([
            "success" => true,
            "csrf_token" => $_SESSION["csrf_token"],
        ]);
    }

    private function validateCsrfToken()
    {
        $this->startSecureSession();

        $headerToken = $_SERVER["HTTP_X_CSRF_TOKEN"] ?? null;

        if (
            empty($_SESSION["csrf_token"]) ||
            empty($headerToken) ||
            !hash_equals($_SESSION["csrf_token"], $headerToken)
        ) {
            $this->sendError("Ongeldig of ontbrekend CSRF-token.", 403);
        }
    }
}
?>
