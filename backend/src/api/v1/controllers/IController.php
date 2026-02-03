<?php
namespace App\Api\Controllers;

interface IController {
    public function handleRequest($method, $id = null);
}