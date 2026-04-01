<?php

/**
 * One-time admin account seeder.
 *
 * Usage (from the project root inside the PHP container):
 *   docker-compose exec php php seed-admin.php
 *
 * The script is idempotent: if an account with the given email already
 * exists it will print a notice and exit without making any changes.
 */

require __DIR__ . "/bootstrap.php";

use App\Entity\User;

global $entityManager;

// ---------------------------------------------------------------------------
// Admin credentials – change these before running for the first time!
// ---------------------------------------------------------------------------
$adminEmail = "admin@dmes.nl";
$adminPassword = "Wachtwoord123!"; // Must satisfy the password policy
// ---------------------------------------------------------------------------

$repo = $entityManager->getRepository(User::class);

if ($repo->findOneBy(["email" => strtolower(trim($adminEmail))])) {
    echo "[INFO] An account with email '{$adminEmail}' already exists. Nothing was changed.\n";
    exit(0);
}

$user = new User();
$user->setEmail($adminEmail);
$user->setPassword(password_hash($adminPassword, PASSWORD_BCRYPT));
$user->setIsAdmin(true);

try {
    $entityManager->persist($user);
    $entityManager->flush();
    echo "[OK] Admin account created successfully.\n";
    echo "     Email   : {$adminEmail}\n";
    echo "     Password: {$adminPassword}\n";
    echo "\n[!] Change the password after the first login or update the\n";
    echo "    credentials in this file before running it.\n";
} catch (\Exception $e) {
    echo "[ERROR] Could not create admin account: " . $e->getMessage() . "\n";
    exit(1);
}
