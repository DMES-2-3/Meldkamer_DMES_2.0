<?php
namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
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
    private bool $isActive = false;

    #[Column(enumType: Status::class)]
    private Status $status;

    #[Column(type: "text", nullable: true)]
    private ?string $description = null;

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

    #[ORM\ManyToOne(targetEntity: Event::class, inversedBy: "aidTeams")]
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
     * The aid workers that belong to this team.
     * A team requires at least two workers (enforced at the controller level).
     */
    #[
        ORM\OneToMany(
            targetEntity: AidWorker::class,
            mappedBy: "team",
            cascade: ["persist"],
        ),
    ]
    private Collection $aidWorkers;

    public function __construct()
    {
        $this->aidWorkers = new ArrayCollection();
        $this->status = Status::AVAILABLE;
    }

    // -------------------------------------------------------------------------
    // Getters & Setters
    // -------------------------------------------------------------------------

    public function getAidTeamId(): int
    {
        return $this->aidTeamId;
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
        if ($this->status !== $status) {
            $this->status = $status;
            $this->updatedAt = new \DateTime();
        }
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): void
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

    public function getAidWorkers(): Collection
    {
        return $this->aidWorkers;
    }

    /**
     * Add a worker to this team and mark them active.
     */
    public function addAidWorker(AidWorker $worker): void
    {
        if (!$this->aidWorkers->contains($worker)) {
            $this->aidWorkers->add($worker);
            $worker->setTeam($this); // also sets isActive = true on the worker
        }
    }

    /**
     * Remove a worker from this team and mark them inactive.
     */
    public function removeAidWorker(AidWorker $worker): void
    {
        if ($this->aidWorkers->contains($worker)) {
            $this->aidWorkers->removeElement($worker);
            $worker->setTeam(null); // also sets isActive = false on the worker
        }
    }

    // -------------------------------------------------------------------------
    // Serialisation
    // -------------------------------------------------------------------------

    public function toArray(): array
    {
        $workers = array_values(
            array_map(
                fn(AidWorker $w) => [
                    "id" => $w->getAidWorkerId(),
                    "name" => trim(
                        $w->getFirstname() . " " . $w->getLastname(),
                    ),
                    "firstName" => $w->getFirstname(),
                    "lastName" => $w->getLastname(),
                    "workerType" => $w->getAidWorkerType(),
                    "callNumber" => $w->getCallSign(),
                    "status" => $w->getStatus()->value,
                    "isActive" => $w->isActive(),
                    "updatedAt" => $w->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
                ],
                $this->aidWorkers->toArray(),
            ),
        );

        return [
            "id" => $this->aidTeamId,
            "name" => $this->aidTeamName,
            "callNumber" => $this->callNumber,
            "status" => $this->status->value,
            "note" => $this->description ?? "",
            "isActive" => $this->isActive,
            "eventId" => $this->event?->getEventId(),
            "updatedAt" => $this->updatedAt?->format(\DateTimeInterface::ATOM),
            "workers" => $workers,
            "workerCount" => count($workers),
        ];
    }
}
