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

    #[Column(type: "string", length: 40)]
    private string $callSign;

    #[Column(enumType: Status::class)]
    private Status $status;

    #[Column(type: "boolean")]
    private bool $isActive = false;

    #[
        Column(
            type: "datetime",
            nullable: true,
            options: ["default" => "CURRENT_TIMESTAMP"],
        ),
    ]
    private ?\DateTime $updatedAt = null;

    #[Column(type: "text", nullable: true)]
    private ?string $description = null;

    /**
     * The event this aid worker belongs to.
     * Workers are created per-event, so this is the primary grouping.
     */
    #[ORM\ManyToOne(targetEntity: Event::class, inversedBy: "aidWorkers")]
    #[
        ORM\JoinColumn(
            name: "FK_Event",
            referencedColumnName: "eventId",
            nullable: true,
            onDelete: "CASCADE",
        ),
    ]
    private ?Event $event = null;

    /**
     * The team this aid worker is assigned to.
     * Null means the worker is available (not yet in a team).
     * When set, isActive becomes true.
     */
    #[ORM\ManyToOne(targetEntity: AidTeam::class, inversedBy: "aidWorkers")]
    #[
        ORM\JoinColumn(
            name: "FK_AidTeam",
            referencedColumnName: "aidTeamId",
            nullable: true,
            onDelete: "SET NULL",
        ),
    ]
    private ?AidTeam $team = null;

    // -------------------------------------------------------------------------
    // Getters & Setters
    // -------------------------------------------------------------------------

    public function getAidWorkerId(): int
    {
        return $this->aidWorkerId;
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
        if (!isset($this->status) || $this->status !== $status) {
            $this->status = $status;
            $this->updatedAt = new \DateTime();
        }
    }

    public function getUpdatedAt(): ?\DateTime
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTime $updatedAt): void
    {
        $this->updatedAt = $updatedAt;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): void
    {
        $this->isActive = $isActive;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): void
    {
        $this->description = $description;
    }

    public function getEvent(): ?Event
    {
        return $this->event;
    }

    public function setEvent(?Event $event): void
    {
        $this->event = $event;
    }

    public function getTeam(): ?AidTeam
    {
        return $this->team;
    }

    /**
     * Assign (or unassign) this worker to a team.
     * Automatically sets isActive based on whether a team is assigned.
     */
    public function setTeam(?AidTeam $team): void
    {
        $this->team = $team;
        $this->isActive = $team !== null;
    }

    // -------------------------------------------------------------------------
    // Serialisation
    // -------------------------------------------------------------------------

    public function toArray(): array
    {
        $statusValue = $this->status->value;

        $colorMap = [
            "AVAILABLE" => "#10B981",
            "BUSY" => "#F59E0B",
            "UNAVAILABLE" => "#EF4444",
            "OFF_DUTY" => "#6B7280",
        ];

        return [
            "id" => $this->aidWorkerId,
            "firstName" => $this->firstname,
            "lastName" => $this->lastname,
            "name" => trim($this->firstname . " " . $this->lastname),
            "workerType" => $this->aidWorkerType,
            "callNumber" => $this->callSign,
            "status" => $statusValue,
            "color" => $colorMap[$statusValue] ?? "#10B981",
            "note" => $this->description ?? "",
            "isActive" => $this->isActive,
            "eventId" => $this->event?->getEventId(),
            "teamId" => $this->team?->getAidTeamId(),
            "teamName" => $this->team?->getAidTeamName() ?? null,
            "updatedAt" => $this->updatedAt?->format(\DateTimeInterface::ATOM),
        ];
    }
}
