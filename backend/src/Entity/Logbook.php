<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Entity;
use Doctrine\ORM\Mapping\Column;
use Doctrine\ORM\Mapping\Id;
use Doctrine\ORM\Mapping\Table;
use Doctrine\ORM\Mapping\GeneratedValue;

#[Entity]
#[Table(name: "Logbook")]
class Logbook
{
    #[Id]
    #[Column(type: "integer")]
    #[GeneratedValue]
    private int $logbookId;

    #[ORM\ManyToOne(targetEntity: Notification::class)]
    #[
        ORM\JoinColumn(
            name: "FK_notification",
            referencedColumnName: "notificationId",
            onDelete: "CASCADE",
            nullable: false,
        ),
    ]
    private Notification $notification;

    #[Column(type: "datetime")]
    private \DateTimeInterface $time;

    #[Column(type: "string", length: 255)]
    private string $event;

    public function getLogbookId(): int
    {
        return $this->logbookId;
    }

    public function setLogbookId(int $logbookId): void
    {
        $this->logbookId = $logbookId;
    }

    public function getNotification(): Notification
    {
        return $this->notification;
    }

    public function setNotification(Notification $notification): void
    {
        $this->notification = $notification;
    }

    public function getTime(): \DateTimeInterface
    {
        return $this->time;
    }

    public function setTime(\DateTimeInterface $time): void
    {
        $this->time = $time;
    }

    public function getEvent(): string
    {
        return $this->event;
    }

    public function setEvent(string $event): void
    {
        $this->event = $event;
    }

    public function toArray(): array
    {
        return [
            "id" => $this->getLogbookId(),
            "time" => $this->getTime()->format("H:i"),
            "event" => $this->getEvent(),
        ];
    }
}
