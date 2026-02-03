<?php

namespace App\Entity;

enum Status: string
{
    case REGISTERED = "REGISTERED";
    case AVAILABLE = "AVAILABLE";
    case WAIT = "WAIT";
    case SHORT_BREAK = "SHORT_BREAK";
    case LONG_BREAK = "LONG_BREAK";
    case NOTIFICATION = "NOTIFICATION";
    case SIGNED_OUT = "SIGNED_OUT";
    case ACTIVE = "ACTIVE";
    case BUSY = "BUSY";
    case RESOLVED = "RESOLVED";
    case UNAVAILABLE = "UNAVAILABLE";
}
