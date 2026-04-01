<?php

/**
 * One-time admin account seeder.
 *
 * Usage:
 *   docker-compose exec php php seed-admin.php
 */

// -----------------------------------------------------
// Load dependencies
// -----------------------------------------------------
require __DIR__ . "/vendor/autoload.php";
require __DIR__ . "/bootstrap.php";

use App\Entity\User;
use Dotenv\Dotenv;

global $entityManager;

// -----------------------------------------------------
// Load .env
// -----------------------------------------------------
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// -----------------------------------------------------
// Read admin credentials from .env
// -----------------------------------------------------
$adminEmail = $_ENV["ADMIN_EMAIL"] ?? null;
$adminPassword = $_ENV["ADMIN_PASSWORD"] ?? null;

if (!$adminEmail || !$adminPassword) {
    echo "[ERROR] ADMIN_EMAIL or ADMIN_PASSWORD not set in .env\n";
    exit(1);
}

// -----------------------------------------------------
// Check if user already exists
// -----------------------------------------------------
$repo = $entityManager->getRepository(User::class);

if ($repo->findOneBy(["email" => strtolower(trim($adminEmail))])) {
    echo "[INFO] An account with email '{$adminEmail}' already exists. Nothing was changed.\n";
    exit(0);
}

// -----------------------------------------------------
// Create admin user
// -----------------------------------------------------
$user = new User();
$user->setEmail($adminEmail);
$user->setPassword(password_hash($adminPassword, PASSWORD_BCRYPT));
$user->setIsAdmin(true);

try {
    $entityManager->persist($user);
    $entityManager->flush();

    echo "[OK] Admin account created successfully.\n";
    echo "     Email   : {$adminEmail}\n";
    echo "     Password: [HIDDEN]\n";
    echo "\n[!] Change the password after the first login.\n";
} catch (\Exception $e) {
    echo "[ERROR] Could not create admin account: " . $e->getMessage() . "\n";
    exit(1);
}