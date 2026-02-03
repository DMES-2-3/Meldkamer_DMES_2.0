<?php

namespace App\Entity;

enum MapType: string
{
    case GOOGLE_MAPS = 'GOOGLE_MAPS';
    case PDF_MAP = 'PDF_MAP';
}