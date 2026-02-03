<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\Entity;
use Doctrine\ORM\Mapping\Column;
use Doctrine\ORM\Mapping\Id;
use Doctrine\ORM\Mapping\Table;
use Doctrine\ORM\Mapping\GeneratedValue;


#[Entity]
#[Table(name: 'Victim')]
class Victim
{

    #[Id]
    #[Column(type: 'integer')]
    #[GeneratedValue]
    private int $victimId;

    #[Column(type: 'string', length:255, nullable:true)]
    private String $firstname;

    #[Column(type: 'string', length:255, nullable: true)]
    private String $lastname;

    #[Column(length: 255, enumType: Gender::class)]
    private Gender $gender;

    #[Column(type: 'text', nullable:true)]
    private string $description;

    public function getVictimId(): int
    {
        return $this->victimId;
    }

    public function setVictimId(int $victimId): void
    {
        $this->victimId = $victimId;
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

    public function getGender(): Gender
    {
        return $this->gender;
    }

    public function setGender(Gender $gender): void
    {
        $this->gender = $gender;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function setDescription(string $description): void
    {
        $this->description = $description;
    }
}