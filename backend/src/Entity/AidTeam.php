<?php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Entity;
use Doctrine\ORM\Mapping\Column;
use Doctrine\ORM\Mapping\Id;
use Doctrine\ORM\Mapping\Table;
use Doctrine\ORM\Mapping\GeneratedValue;

#[Entity]
#[Table(name: "AidTeam")]
class AidTeam
{
    #[Id]
    #[Column(type: "integer")]
    #[GeneratedValue]
    private int $aidTeamId;

    #[Column(type: "string", length: 255)]
    private string $aidTeamName;

    #[Column(type: "boolean")]
    private bool $isActive;

    #[Column(enumType: Status::class)]
    private Status $status;

    #[Column(type: "text")]
    private string $description;

    #[Column(type: "string", length: 50, nullable: true)]
    private ?string $callNumber = null;

    #[
        Column(
            type: "datetime",
            nullable: true,
            options: ["default" => "CURRENT_TIMESTAMP"],
        ),
    ]
    private ?\DateTime $updatedAt = null;

    #[ORM\ManyToOne(targetEntity: Event::class)]
    #[
        ORM\JoinColumn(
            name: "FK_Event",
            referencedColumnName: "eventId",
            nullable: true,
            onDelete: "CASCADE",
        ),
    ]
    private ?Event $event = null;

    public function getAidTeamId(): int
    {
        return $this->aidTeamId;
    }

    public function setAidTeamId(int $aidTeamId): void
    {
        $this->aidTeamId = $aidTeamId;
    }

    public function getAidTeamName(): string
    {
        return $this->aidTeamName;
    }

    public function setAidTeamName(string $aidTeamName): void
    {
        $this->aidTeamName = $aidTeamName;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): void
    {
        $this->isActive = $isActive;
    }

    public function getStatus(): Status
    {
        return $this->status;
    }

    public function setStatus(Status $status): void
    {
        $this->status = $status;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function setDescription(string $description): void
    {
        $this->description = $description;
    }

    public function getCallNumber(): ?string
    {
        return $this->callNumber;
    }

    public function setCallNumber(?string $callNumber): void
    {
        $this->callNumber = $callNumber;
    }

    public function getUpdatedAt(): ?\DateTime
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTime $updatedAt): void
    {
        $this->updatedAt = $updatedAt;
    }

    public function getEvent(): ?Event
    {
        return $this->event;
    }

    public function setEvent(?Event $event): void
    {
        $this->event = $event;
    }
}
