<?php

namespace App\Entity;

use DateTimeInterface;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Entity;
use Doctrine\ORM\Mapping\Column;
use Doctrine\ORM\Mapping\Id;
use Doctrine\ORM\Mapping\Table;
use Doctrine\ORM\Mapping\GeneratedValue;

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

    public function toArray(): array
    {
        $data = [
            "id" => $this->getEventId(),
            "eventName" => $this->getEventName(),
            "postcode" => $this->getPostcode(),
            "updatedAt" => $this->getUpdatedAt()->format("Y-m-d H:i:s"),
            "createdAt" => $this->getCreatedAt()->format("Y-m-d H:i:s"),
        ];
        return $data;
    }
}
