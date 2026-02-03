<?php
return [
    "name" => "DMES Migrations",
    "migrations_namespace" => "Migrations",
    "table_name" => "doctrine_migration_versions",
    "column_name" => "version",
    "column_length" => 14,
    "executed_at_column_name" => "executed_at",
    "migrations_directory" => __DIR__ . "/migrations",
    "all_or_nothing" => true,
    "check_database_platform" => true,
    "organize_migrations" => "none",
    "connection" => [
        "url" => "mysql://app_user:app_pass@mysql_db:3306/ControlRoom",
    ],
];
