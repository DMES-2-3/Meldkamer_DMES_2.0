<?php

namespace App\Entity;

use Doctrine\ORM\Mapping\Entity;
use Doctrine\ORM\Mapping\Column;
use Doctrine\ORM\Mapping\Id;
use Doctrine\ORM\Mapping\Table;
use Doctrine\ORM\Mapping\GeneratedValue;

#[Entity]
#[Table(name: "AVPU")]
class AVPU
{
    #[Id]
    #[Column(type: "integer")]
    #[GeneratedValue]
    private int $AVPUId;

    #[Column(type: "boolean")]
    private bool $alert;

    #[Column(type: "boolean")]
    private bool $verbal;

    #[Column(type: "boolean")]
    private bool $pain;

    #[Column(type: "boolean")]
    private bool $unresponsive;

    public function getAVPUId(): int
    {
        return $this->AVPUId;
    }

    public function setAVPUId(int $AVPUId): void
    {
        $this->AVPUId = $AVPUId;
    }

    public function isAlert(): bool
    {
        return $this->alert;
    }

    public function setAlert(bool $alert): void
    {
        $this->alert = $alert;
    }

    public function isVerbal(): bool
    {
        return $this->verbal;
    }

    public function setVerbal(bool $verbal): void
    {
        $this->verbal = $verbal;
    }

    public function isPain(): bool
    {
        return $this->pain;
    }

    public function setPain(bool $pain): void
    {
        $this->pain = $pain;
    }

    public function isUnresponsive(): bool
    {
        return $this->unresponsive;
    }

    public function setUnresponsive(bool $unresponsive): void
    {
        $this->unresponsive = $unresponsive;
    }
}
