<?php

namespace App\Entity;

enum Priority: string
{
    case RED = 'RED';
    case ORANGE = 'ORANGE';
    case GREEN = 'GREEN';
    case YELLOW = "YELLOW";
}
