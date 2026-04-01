<?php

namespace App\Entity;

enum NotificationStatus: string
{
    case NEW = "NEW";
    case PENDING = "PENDING";
    case CLOSED = "CLOSED";
}
