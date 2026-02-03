<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Entity;
use Doctrine\ORM\Mapping\Column;
use Doctrine\ORM\Mapping\Id;
use Doctrine\ORM\Mapping\Table;
use Doctrine\ORM\Mapping\GeneratedValue;

#[Entity]
#[Table(name: "Notification")]
class Notification
{
    #[Id]
    #[Column(type: "integer")]
    #[GeneratedValue]
    private int $notificationId;

    #[Column(type: "string", length: 255, nullable: true)]
    private ?string $reportedBy;

    #[ORM\ManyToOne(targetEntity: Event::class, inversedBy: "Notification")]
    #[
        ORM\JoinColumn(
            name: "FK_event",
            referencedColumnName: "eventId",
            onDelete: "CASCADE",
        ),
    ]
    private Event $event;

    #[column(enumType: Gender::class, nullable: true)]
    private ?Gender $gender;

    #[ORM\OneToOne(targetEntity: AVPU::class, cascade: ["persist", "remove"])]
    #[
        ORM\JoinColumn(
            name: "FK_AVPU",
            referencedColumnName: "AVPUId",
            onDelete: "CASCADE",
            nullable: true,
        ),
    ]
    private ?AVPU $AVPU;

    #[ORM\ManyToOne(targetEntity: AidTeam::class, inversedBy: "Notification")]
    #[
        ORM\JoinColumn(
            name: "FK_AidTeam",
            referencedColumnName: "aidTeamId",
            onDelete: "CASCADE",
            nullable: true,
        ),
    ]
    private ?AidTeam $AidTeam;

    #[ORM\OneToOne(targetEntity: SITRAP::class, cascade: ["persist", "remove"])]
    #[
        ORM\JoinColumn(
            name: "FK_SITRAP",
            referencedColumnName: "SITRAPId",
            onDelete: "CASCADE",
            nullable: true,
        ),
    ]
    private ?SITRAP $SITRAP;

    #[
        ORM\OneToOne(
            targetEntity: Assistance::class,
            cascade: ["persist", "remove"],
        ),
    ]
    #[
        ORM\JoinColumn(
            name: "FK_Assistance",
            referencedColumnName: "assistanceId",
            onDelete: "CASCADE",
            nullable: true,
        ),
    ]
    private ?Assistance $assistance;

    #[Column(type: "string", length: 255, nullable: true)]
    private ?string $subject;

    # TODO needs to be updated to point datatype in the future
    #[Column(type: "string", length: 255)]
    private string $mapLocation;

    #[Column(type: "datetime")]
    private \DateTimeInterface $time;

    #[column(enumType: Status::class)]
    private Status $status;

    #[column(enumType: Priority::class)]
    private Priority $priority;

    #[Column(type: "boolean")]
    private bool $ambulanceNeeded;

    #[Column(type: "text", nullable: true)]
    private ?string $description;

    #[Column(type: "text", nullable: true)]
    private ?string $notepad;

    public function __construct()
    {
        $this->reportedBy = null;
        $this->AVPU = null;
        $this->AidTeam = null;
        $this->SITRAP = null;
        $this->assistance = null;
        $this->subject = null;
        $this->description = null;
        $this->notepad = null;
        $this->gender = null;
    }

    public function getNotificationId(): int
    {
        return $this->notificationId;
    }

    public function setNotificationId(int $notificationId): void
    {
        $this->notificationId = $notificationId;
    }

    public function getReportedBy(): ?string
    {
        return $this->reportedBy;
    }

    public function setReportedBy(?string $reportedBy): void
    {
        $this->reportedBy = $reportedBy;
    }

    public function getGender(): ?Gender
    {
        return $this->gender;
    }

    public function setGender(?Gender $gender): void
    {
        $this->gender = $gender;
    }

    public function getEvent(): Event
    {
        return $this->event;
    }

    public function setEvent(Event $event): void
    {
        $this->event = $event;
    }

    public function getAVPU(): ?AVPU
    {
        return $this->AVPU;
    }

    public function setAVPU(?AVPU $AVPU): void
    {
        $this->AVPU = $AVPU;
    }

    public function getAidTeam(): ?AidTeam
    {
        return $this->AidTeam;
    }

    public function setAidTeam(?AidTeam $AidTeam): void
    {
        $this->AidTeam = $AidTeam;
    }

    public function getSITRAP(): ?SITRAP
    {
        return $this->SITRAP;
    }

    public function setSITRAP(?SITRAP $SITRAP): void
    {
        $this->SITRAP = $SITRAP;
    }

    public function getAssistance(): ?Assistance
    {
        return $this->assistance;
    }

    public function setAssistance(?Assistance $assistance): void
    {
        $this->assistance = $assistance;
    }

    public function getSubject(): ?string
    {
        return $this->subject;
    }

    public function setSubject(?string $subject): void
    {
        $this->subject = $subject;
    }

    public function getMapLocation(): string
    {
        return $this->mapLocation;
    }

    public function setMapLocation(string $mapLocation): void
    {
        $this->mapLocation = $mapLocation;
    }

    public function getTime(): \DateTimeInterface
    {
        return $this->time;
    }

    public function setTime(\DateTimeInterface $time): void
    {
        $this->time = $time;
    }

    public function getStatus(): Status
    {
        return $this->status;
    }

    public function setStatus(Status $status): void
    {
        $this->status = $status;
    }

    public function getPriority(): Priority
    {
        return $this->priority;
    }

    public function setPriority(Priority $priority): void
    {
        $this->priority = $priority;
    }

    public function isAmbulanceNeeded(): bool
    {
        return $this->ambulanceNeeded;
    }

    public function setAmbulanceNeeded(bool $ambulanceNeeded): void
    {
        $this->ambulanceNeeded = $ambulanceNeeded;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): void
    {
        $this->description = $description;
    }

    public function getNotepad(): ?string
    {
        return $this->notepad;
    }

    public function setNotepad(?string $notepad): void
    {
        $this->notepad = $notepad;
    }

    public function toArray(): array
    {
        return [
            "id" => $this->getNotificationId(),
            "ReportedBy" => $this->getReportedBy(),
            "NameEvent" => $this->getEvent()?->getEventName(),
            "Subject" => $this->getSubject(),
            "Location" => $this->getMapLocation(),
            "Note" => $this->getDescription(),
            "Notepad" => $this->getNotepad(),
            "Team" => $this->getAidTeam()?->getAidTeamName(),
            "Prioriteit" => $this->getPriority(),
            "Status" => $this->getStatus(),
            "Time" => $this->getTime()->format("H:i"),
            "Ambulance" => $this->isAmbulanceNeeded(),
            "SITRAP" => [
                "Gender" => $this->getGender()?->value,
                "Event" => $this->getSITRAP()?->getDescription(),
                "Condition" => $this->getSITRAP()?->getInjury(),
            ],
            "AVPU" => [
                "Alert" => $this->getAVPU()?->isAlert(),
                "Verbal" => $this->getAVPU()?->isVerbal(),
                "Pain" => $this->getAVPU()?->isPain(),
                "Unresponsive" => $this->getAVPU()?->isUnresponsive(),
            ],
            "Assistance" => [
                "Coordinator" => $this->getAssistance()?->isCoordinator(),
                "Doctor" => $this->getAssistance()?->isDoctor(),
                "Spoedzorg" => $this->getAssistance()?->isEmergencyCare(),
                "BasiszorgVPK" => $this->getAssistance()?->isBasicCareVPK(),
                "Team" => $this->getAssistance()
                    ?->getAidTeam()
                    ?->getAidTeamName(),
            ],
        ];
    }
}
