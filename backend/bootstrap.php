<?php
date_default_timezone_set("Europe/Amsterdam");

use Doctrine\DBAL\DriverManager;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\ORMSetup;

require_once __DIR__ . "/vendor/autoload.php";

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$paths = [__DIR__ . "/src/Entity"];

$dbParams = [
    "driver" => "pdo_mysql",
    "host" => $_ENV["DB_HOST"],
    "user" => $_ENV["DB_USER"],
    "password" => $_ENV["DB_PASS"],
    "dbname" => $_ENV["DB_NAME"],
    "charset" => "utf8mb4",
    "mapping_types" => [
        "point" => "string",
    ],
];

$config = ORMSetup::createAttributeMetadataConfiguration(
    paths: $paths,
    isDevMode: true,
    proxyDir: __DIR__ . "/var/proxies",
);

$connection = DriverManager::getConnection($dbParams, $config);
$connection
    ->getDatabasePlatform()
    ->registerDoctrineTypeMapping("point", "string");

$entityManager = new EntityManager($connection, $config);

return $entityManager;
?>
