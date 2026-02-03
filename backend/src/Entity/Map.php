<?php
namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Entity;
use Doctrine\ORM\Mapping\Column;
use Doctrine\ORM\Mapping\Id;
use Doctrine\ORM\Mapping\Table;
use Doctrine\ORM\Mapping\GeneratedValue;
use Doctrine\Common\Collections\Collection;

#[Entity]
#[Table(name: "Map")]
class Map
{
    #[Id]
    #[Column(type: "integer")]
    #[GeneratedValue]
    private int $mapId;

    #[Column(type: "string", length: 255, nullable: true)]
    private ?string $mapName = null;

    public function getMapName(): ?string
    {
        return $this->mapName;
    }

    public function setMapName(?string $mapName): void
    {
        $this->mapName = $mapName;
    }

    #[Column(type: "string", length: 512)]
    private ?string $filePath = null;

    #[Column(length: 255, enumType: MapType::class)]
    private MapType $mapType;

    #[ORM\ManyToOne(targetEntity: Event::class, inversedBy: "maps")]
    #[
        ORM\JoinColumn(
            name: "FK_Event",
            referencedColumnName: "eventId",
            onDelete: "CASCADE",
        ),
    ]
    private Event $event;

    #[ORM\OneToMany(mappedBy: "map", targetEntity: MapEntity::class)]
    private Collection $mapEntities;

    public function __construct()
    {
        $this->mapEntities = new ArrayCollection();
    }

    public function getMapId(): int
    {
        return $this->mapId;
    }
    public function getFilePath(): ?string
    {
        return $this->filePath;
    }
    public function setFilePath(string $filePath): void
    {
        $this->filePath = $filePath;
    }
    public function getMapType(): MapType
    {
        return $this->mapType;
    }
    public function setMapType(MapType $mapType): void
    {
        $this->mapType = $mapType;
    }
    public function getEvent(): Event
    {
        return $this->event;
    }
    public function setEvent(Event $event): void
    {
        $this->event = $event;
    }
    public function getMapEntities(): Collection
    {
        return $this->mapEntities;
    }

    public function toArray(): array
    {
        return [
            "mapId" => $this->getMapId(),
            "eventId" => $this->getEvent()->getEventId(),
            "name" => $this->mapName,
            "hasFile" => !empty($this->filePath),
        ];
    }
}
