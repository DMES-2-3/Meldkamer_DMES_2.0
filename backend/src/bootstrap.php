<?php

use Doctrine\ORM\EntityManager;
use Doctrine\ORM\ORMSetup;
use Doctrine\DBAL\DriverManager;
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . "/vendor/autoload.php";

$config = ORMSetup::createAttributeMetadataConfiguration(
    [__DIR__ . "/src/Entity"],
    true
);

$connection = [
    'dbname' => $_ENV['DB_NAME'] ?? 'ControlRoom',
    'user' => $_ENV['DB_USER'] ?? 'app_user',
    'password' => $_ENV['DB_PASS'] ?? 'app_pass',
    'host' => $_ENV['DB_HOST'] ?? 'db',
    'port' => $_ENV['DB_PORT'] ?? 3306,
    'driver' => 'pdo_mysql',
];

$entityManager = new EntityManager(
    DriverManager::getConnection($connection, $config),
    $config
);