<?php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Entity;
use Doctrine\ORM\Mapping\Column;
use Doctrine\ORM\Mapping\Id;
use Doctrine\ORM\Mapping\Table;
use Doctrine\ORM\Mapping\GeneratedValue;

#[Entity]
#[Table(name: "MapEntity")]
class MapEntity
{
    #[Id]
    #[Column(type: "integer")]
    #[GeneratedValue]
    private int $mapEntityId;

    #[ORM\ManyToOne(targetEntity: Map::class)]
    #[
        ORM\JoinColumn(
            name: "FK_mapId",
            referencedColumnName: "mapId",
            onDelete: "CASCADE",
        ),
    ]
    private Map $map;

    #[ORM\ManyToOne(targetEntity: AidWorker::class)]
    #[
        ORM\JoinColumn(
            name: "FK_AidWorker",
            referencedColumnName: "aidWorkerId",
            onDelete: "CASCADE",
            nullable: true,
        ),
    ]
    private ?AidWorker $aidWorker = null;

    #[Column(type: "string", length: 255)]
    private string $mapLocation = "";

    public function getMapEntityId(): int
    {
        return $this->mapEntityId;
    }
    public function getMap(): Map
    {
        return $this->map;
    }
    public function setMap(Map $map): void
    {
        $this->map = $map;
    }
    public function getAidWorker(): ?AidWorker
    {
        return $this->aidWorker;
    }
    public function setAidWorker(?AidWorker $aidWorker): void
    {
        $this->aidWorker = $aidWorker;
    }
    public function getMapLocation(): string
    {
        return $this->mapLocation;
    }
    public function setMapLocation(string $mapLocation): void
    {
        $this->mapLocation = $mapLocation;
    }

    public function toArray(): array
    {
        return [
            "mapEntityId" => $this->getMapEntityId(),
            "mapId" => $this->getMap()->getMapId(),
            ...$this->getAidWorker()
                ? ["aidworker" => $this->getAidWorker()->getAidWorkerId()]
                : [],
            "location" => $this->getMapLocation(),
        ];
    }
}
