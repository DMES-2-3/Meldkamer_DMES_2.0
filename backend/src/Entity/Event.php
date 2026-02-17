<?php

namespace App\Entity;

use DateTimeInterface;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Entity;
use Doctrine\ORM\Mapping\Column;
use Doctrine\ORM\Mapping\Id;
use Doctrine\ORM\Mapping\Table;
use Doctrine\ORM\Mapping\GeneratedValue;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping\OneToMany;

#[Entity]
#[ORM\HasLifecycleCallbacks]
#[Table(name: "Event")]
class Event
{
    #[Id]
    #[Column(type: "integer")]
    #[GeneratedValue]
    private int $eventId;

    #[Column(type: "string", length: 255)]
    private string $eventName;

    #[Column(type: "string", length: 10, nullable: true)]
    private ?string $postcode = null;

    #[ORM\Column(type: "datetime")]
    private \DateTimeInterface $updatedAt;

    #[ORM\Column(type: "datetime")]
    private \DateTimeInterface $createdAt;

    #[
        OneToMany(
            mappedBy: "event",
            targetEntity: Map::class,
            cascade: ["persist", "remove"],
        ),
    ]
    private Collection $maps;

    public function __construct()
    {
        $this->maps = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function initializeTimestamps(): void
    {
        $now = new \DateTime();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    public function updateTimestamp(): void
    {
        $this->updatedAt = new \DateTime();
    }

    public function getEventId(): int
    {
        return $this->eventId;
    }

    public function setEventId(int $eventId): void
    {
        $this->eventId = $eventId;
    }

    public function getEventName(): string
    {
        return $this->eventName;
    }

    public function setEventName(string $eventName): void
    {
        $this->eventName = $eventName;
    }

    public function getPostcode(): ?string
    {
        return $this->postcode;
    }

    public function setPostcode(?string $postcode): void
    {
        $this->postcode = $postcode;
    }

    public function getUpdatedAt(): DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function getCreatedAt(): DateTimeInterface
    {
        return $this->createdAt;
    }

    public function getMaps(): Collection
    {
        return $this->maps;
    }

    public function toArray(): array
    {
        $mapsData = [];
        foreach ($this->maps as $map) {
            $mapsData[] = $map->toArray();
        }

        return [
            "id" => $this->getEventId(),
            "eventName" => $this->getEventName(),
            "postcode" => $this->getPostcode(),
            "updatedAt" => $this->getUpdatedAt()->format("Y-m-d H:i:s"),
            "createdAt" => $this->getCreatedAt()->format("Y-m-d H:i:s"),
            "maps" => $mapsData,
        ];
    }
}
