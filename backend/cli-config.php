<?php
use Doctrine\ORM\Tools\Console\ConsoleRunner;
use Doctrine\ORM\EntityManager;

require_once 'bootstrap.php';

if (!isset($entityManager) || !$entityManager instanceof EntityManager) {
    throw new \RuntimeException('The $entityManager variable is not defined or not an instance of EntityManager in bootstrap.php.');
}

return ConsoleRunner::createHelperSet($entityManager);
