<?php

namespace App\Entity;

use App\Entity\AidTeam;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Entity;
use Doctrine\ORM\Mapping\Column;
use Doctrine\ORM\Mapping\Id;
use Doctrine\ORM\Mapping\Table;
use Doctrine\ORM\Mapping\GeneratedValue;

#[Entity]
#[Table(name: "Assistance")]
class Assistance
{
    #[Id]
    #[Column(type: "integer")]
    #[GeneratedValue]
    private $assistanceId;

    #[Column(type: "boolean")]
    private bool $doctor;

    #[Column(type: "boolean")]
    private bool $emergencyCare;

    #[Column(type: "boolean")]
    private bool $basicCareVPK;

    #[Column(type: "boolean")]
    private bool $coordinator;

    #[ORM\ManyToOne(targetEntity: AidTeam::class)]
    #[
        ORM\JoinColumn(
            name: "FK_AidTeam",
            referencedColumnName: "aidTeamId",
            nullable: true,
            onDelete: "SET NULL",
        ),
    ]
    private ?AidTeam $aidTeam = null;

    public function __construct()
    {
        $this->doctor = false;
        $this->emergencyCare = false;
        $this->basicCareVPK = false;
        $this->coordinator = false;
    }

    /**
     * @return mixed
     */
    public function getAssistanceId()
    {
        return $this->assistanceId;
    }

    /**
     * @param mixed $assistanceId
     */
    public function setAssistanceId($assistanceId): void
    {
        $this->assistanceId = $assistanceId;
    }

    public function isDoctor(): bool
    {
        return $this->doctor;
    }

    public function setDoctor(bool $doctor): void
    {
        $this->doctor = $doctor;
    }

    public function isEmergencyCare(): bool
    {
        return $this->emergencyCare;
    }

    public function setEmergencyCare(bool $emergencyCare): void
    {
        $this->emergencyCare = $emergencyCare;
    }

    public function isBasicCareVPK(): bool
    {
        return $this->basicCareVPK;
    }

    public function setBasicCareVPK(bool $basicCareVPK): void
    {
        $this->basicCareVPK = $basicCareVPK;
    }

    public function isCoordinator(): bool
    {
        return $this->coordinator;
    }

    public function setCoordinator(bool $coordinator): void
    {
        $this->coordinator = $coordinator;
    }

    public function getAidTeam(): ?AidTeam
    {
        return $this->aidTeam;
    }

    public function setAidTeam(?AidTeam $aidTeam): void
    {
        $this->aidTeam = $aidTeam;
    }
}
