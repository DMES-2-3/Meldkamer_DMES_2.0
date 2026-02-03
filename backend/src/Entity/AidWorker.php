<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Entity;
use Doctrine\ORM\Mapping\Column;
use Doctrine\ORM\Mapping\Id;
use Doctrine\ORM\Mapping\Table;
use Doctrine\ORM\Mapping\GeneratedValue;

#[Entity]
#[Table(name: "AidWorker")]
class AidWorker
{
    #[Id]
    #[Column(type: "integer")]
    #[GeneratedValue]
    private int $aidWorkerId;

    #[Column(type: "string", length: 255)]
    private string $aidWorkerType;

    #[Column(type: "string", length: 255)]
    private string $firstname;

    #[Column(type: "string", length: 255)]
    private string $lastname;

    #[Column(type: "string", length: 7)]
    private string $callSign;

    #[column(enumType: Status::class)]
    private Status $status;

    #[Column(type: "boolean")]
    private bool $isActive;

    #[Column(type: "text")]
    private string $description;

    #[ORM\OneToMany(targetEntity: AidTeam::class, mappedBy: "AidWorker")]
    private $aidTeam;

    #[ORM\ManyToOne(targetEntity: Event::class, inversedBy: "AidWorker")]
    #[
        ORM\JoinColumn(
            name: "FK_Event",
            referencedColumnName: "eventId",
            onDelete: "CASCADE",
        ),
    ]
    private Event $event;

    #[ORM\ManyToOne(targetEntity: AidTeam::class, inversedBy: "AidWorker")]
    #[
        ORM\JoinColumn(
            name: "FK_Aidteam",
            referencedColumnName: "aidTeamId",
            onDelete: "CASCADE",
        ),
    ]
    private AidTeam $team;

    public function getAidWorkerId(): int
    {
        return $this->aidWorkerId;
    }

    public function setAidWorkerId(int $aidWorkerId): void
    {
        $this->aidWorkerId = $aidWorkerId;
    }

    public function getAidWorkerType(): string
    {
        return $this->aidWorkerType;
    }

    public function setAidWorkerType(string $aidWorkerType): void
    {
        $this->aidWorkerType = $aidWorkerType;
    }

    public function getFirstname(): string
    {
        return $this->firstname;
    }

    public function setFirstname(string $firstname): void
    {
        $this->firstname = $firstname;
    }

    public function getLastname(): string
    {
        return $this->lastname;
    }

    public function setLastname(string $lastname): void
    {
        $this->lastname = $lastname;
    }

    public function getCallSign(): string
    {
        return $this->callSign;
    }

    public function setCallSign(string $callSign): void
    {
        $this->callSign = $callSign;
    }

    public function getStatus(): Status
    {
        return $this->status;
    }

    public function setStatus(Status $status): void
    {
        $this->status = $status;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): void
    {
        $this->isActive = $isActive;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function setDescription(string $description): void
    {
        $this->description = $description;
    }

    public function getTeam(): AidTeam
    {
        return $this->team;
    }

    public function setTeam(AidTeam $team)
    {
        $this->team = $team;
    }

    public function toArray(): array
    {
        $data = [
            "id" => $this->getAidWorkerId(),
            "firstName" => $this->getFirstname(),
            "lastName" => $this->getLastname(),
            "teamName" => $this->getTeam()->getAidTeamName(),
            "callNumber" => $this->getCallSign(),
            "status" => $this->getStatus()->value,
            "note" => $this->getDescription(),
            "workerType" => $this->getAidWorkerType(),
        ];
        return $data;
    }
}
