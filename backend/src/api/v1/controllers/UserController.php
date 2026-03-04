<?php
namespace App\Api\Controllers;

use App\Api\Controllers\BaseController;
use App\Entity\User;

class UserController extends BaseController
{
    public function handleRequest($method, $action = null)
    {
        switch ($action) {
            case "register":
                if ($method === "POST") {
                    $this->requireAdminSession();
                    $this->register();
                } else {
                    $this->sendError("Method not allowed", 405);
                }
                break;
            case "login":
                if ($method === "POST") {
                    $this->login();
                } else {
                    $this->sendError("Method not allowed", 405);
                }
                break;
            case "logout":
                if ($method === "DELETE") {
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
                "Please fill in the following fields: " .
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
            $this->sendError("Please enter a valid email address.", 400);
        }

        $passwordErrors = [];
        if (strlen($password) < 12) {
            $passwordErrors[] = "at least 12 characters";
        }
        if (!preg_match("/[A-Z]/", $password)) {
            $passwordErrors[] = "an uppercase letter";
        }
        if (!preg_match("/[a-z]/", $password)) {
            $passwordErrors[] = "a lowercase letter";
        }
        if (!preg_match("/[0-9]/", $password)) {
            $passwordErrors[] = "a number";
        }
        if (!preg_match("/[\W]/", $password)) {
            $passwordErrors[] = "a special character";
        }

        if (!empty($passwordErrors)) {
            $this->sendError(
                "Your password must include: " .
                    implode(", ", $passwordErrors) .
                    ".",
                400,
            );
        }

        try {
            $birthday = new \DateTime($data["birthday"]);
        } catch (\Exception $e) {
            $this->sendError(
                "Please enter a valid birthday (YYYY-MM-DD).",
                400,
            );
        }

        $repo = $this->entityManager->getRepository(User::class);
        if ($repo->findOneBy(["email" => $email])) {
            $this->sendError(
                "This email is already in use. Try logging in or use a different email.",
                409,
            );
        }
        if ($repo->findOneBy(["username" => $username])) {
            $this->sendError(
                "This username is taken. Please choose another one.",
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
                "Registration failed. Please try again later.",
                500,
            );
        }

        $this->sendResponse(
            [
                "success" => true,
                "message" => "Registration successful! You can now log in.",
            ],
            201,
        );
    }

    private function login()
    {
        $data = $this->getJsonInput();

        if (empty($data["email"]) || empty($data["pass"])) {
            $this->sendError("Please enter both your email and password.", 400);
        }

        $repo = $this->entityManager->getRepository(User::class);
        $email = strtolower(trim($data["email"]));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->sendError("Please enter a valid email address.", 400);
        }

        $user = $repo->findOneBy(["email" => $email]);
        if (!$user || !password_verify($data["pass"], $user->getPassword())) {
            $this->sendError(
                "Email or password is incorrect. Please try again.",
                401,
            );
        }

        $this->startSecureSession();
        session_regenerate_id(true);
        $_SESSION["user_id"] = $user->getUserId();

        $this->sendResponse([
            "success" => true,
            "message" => "Login successful! Welcome back.",
        ]);
    }

    private function checkSession()
    {
        $this->startSecureSession();

        if (!isset($_SESSION["user_id"])) {
            $this->sendResponse([
                "success" => false,
                "message" => "You are not logged in.",
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
                        "Your session has expired. Please log in again.",
                ],
                401,
            );
        }

        $this->sendResponse([
            "success" => true,
            "message" => "You are logged in.",
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
            "message" => "You have been logged out successfully.",
        ]);
    }

    private function startSecureSession()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_set_cookie_params([
                "lifetime" => 0,
                "path" => "/",
                "secure" => isset($_SERVER["HTTPS"]),
                "httponly" => true,
                "samesite" => "Strict",
            ]);
            session_start();
        }
    }
}
?>
