<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Entity;
use Doctrine\ORM\Mapping\Column;
use Doctrine\ORM\Mapping\Id;
use Doctrine\ORM\Mapping\Table;
use Doctrine\ORM\Mapping\GeneratedValue;

#[Entity]
#[Table(name: "SITRAP")]
class SITRAP
{
    #[Id]
    #[Column(type: "integer")]
    #[GeneratedValue]
    private int $SITRAPId;

    #[Column(type: "text", nullable: true)]
    private ?string $injury;

    #[Column(type: "text", nullable: true)]
    private ?string $description;

    public function __construct()
    {
        $this->injury = null;
        $this->description = null;
    }

    public function getSITRAPId(): int
    {
        return $this->SITRAPId;
    }

    public function setSITRAPId(int $SITRAPId): void
    {
        $this->SITRAPId = $SITRAPId;
    }

    public function getInjury(): ?string
    {
        return $this->injury;
    }

    public function setInjury(?string $injury): void
    {
        $this->injury = $injury;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): void
    {
        $this->description = $description;
    }
}
