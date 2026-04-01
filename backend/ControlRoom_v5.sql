-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql_db
-- Gegenereerd op: 30 mrt 2026 om 14:48
-- Serverversie: 8.0.44
-- PHP-versie: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ControlRoom`
--
CREATE DATABASE IF NOT EXISTS `ControlRoom` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `ControlRoom`;

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `AidTeam`
--

DROP TABLE IF EXISTS `AidTeam`;
CREATE TABLE IF NOT EXISTS `AidTeam` (
  `aidTeamId` int NOT NULL AUTO_INCREMENT,
  `aidTeamName` varchar(255) NOT NULL,
  `isActive` tinyint NOT NULL,
  `status` varchar(255) NOT NULL,
  `description` longtext,
  `callNumber` varchar(50) DEFAULT NULL,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `FK_Event` int DEFAULT NULL,
  PRIMARY KEY (`aidTeamId`),
  KEY `IDX_79CFF891D495D1C` (`FK_Event`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Gegevens worden geëxporteerd voor tabel `AidTeam`
--

INSERT INTO `AidTeam` (`aidTeamId`, `aidTeamName`, `isActive`, `status`, `description`, `callNumber`, `updatedAt`, `FK_Event`) VALUES
(1, '1', 1, 'AVAILABLE', '', '1', '2026-03-21 17:08:54', 1),
(2, '2', 1, 'AVAILABLE', '', '2', '2026-03-21 17:09:08', 1),
(3, 'TEST1', 1, 'AVAILABLE', '', '1', '2026-03-22 10:37:04', 2),
(4, 'TEST2', 1, 'AVAILABLE', '', '2', '2026-03-22 10:37:02', 2);

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `AidWorker`
--

DROP TABLE IF EXISTS `AidWorker`;
CREATE TABLE IF NOT EXISTS `AidWorker` (
  `aidWorkerId` int NOT NULL AUTO_INCREMENT,
  `aidWorkerType` varchar(255) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `callSign` varchar(7) NOT NULL,
  `status` varchar(255) NOT NULL,
  `isActive` tinyint NOT NULL,
  `description` longtext,
  `FK_Event` int DEFAULT NULL,
  `FK_AidTeam` int DEFAULT NULL,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`aidWorkerId`),
  KEY `IDX_B661CB7BD495D1C` (`FK_Event`),
  KEY `IDX_B661CB7B444C44CE` (`FK_AidTeam`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Gegevens worden geëxporteerd voor tabel `AidWorker`
--

INSERT INTO `AidWorker` (`aidWorkerId`, `aidWorkerType`, `firstname`, `lastname`, `callSign`, `status`, `isActive`, `description`, `FK_Event`, `FK_AidTeam`, `updatedAt`) VALUES
(5, 'EHBO', 'TEST', '1', '1', 'SHORT_BREAK', 1, '', 2, 3, '2026-03-22 10:36:43'),
(6, 'ARTS', 'TEST', '2', '2', 'AVAILABLE', 1, '', 2, 4, '2026-03-22 10:32:05');

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `Assistance`
--

DROP TABLE IF EXISTS `Assistance`;
CREATE TABLE IF NOT EXISTS `Assistance` (
  `assistanceId` int NOT NULL AUTO_INCREMENT,
  `doctor` tinyint NOT NULL,
  `emergencyCare` tinyint NOT NULL,
  `basicCareVPK` tinyint NOT NULL,
  `coordinator` tinyint NOT NULL,
  `FK_AidTeam` int DEFAULT NULL,
  PRIMARY KEY (`assistanceId`),
  KEY `IDX_54128622444C44CE` (`FK_AidTeam`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Gegevens worden geëxporteerd voor tabel `Assistance`
--

INSERT INTO `Assistance` (`assistanceId`, `doctor`, `emergencyCare`, `basicCareVPK`, `coordinator`, `FK_AidTeam`) VALUES
(1, 1, 1, 0, 0, 2),
(2, 0, 0, 0, 0, NULL),
(4, 0, 0, 1, 0, 2),
(5, 0, 1, 0, 1, 2),
(6, 0, 0, 0, 0, NULL),
(7, 1, 0, 0, 0, 2),
(8, 0, 0, 0, 0, NULL),
(9, 1, 0, 0, 1, 2),
(10, 0, 0, 0, 0, NULL),
(11, 0, 0, 0, 1, 2),
(12, 0, 0, 0, 0, NULL),
(13, 0, 0, 0, 0, NULL),
(14, 0, 0, 0, 0, NULL),
(15, 0, 0, 0, 0, NULL),
(16, 0, 0, 0, 0, NULL),
(17, 0, 0, 0, 0, NULL),
(18, 0, 0, 0, 0, NULL),
(19, 0, 0, 0, 0, NULL),
(20, 0, 0, 0, 0, NULL),
(21, 0, 0, 0, 0, NULL),
(22, 0, 0, 0, 0, NULL),
(23, 0, 0, 0, 0, NULL),
(24, 0, 0, 0, 0, NULL),
(25, 1, 0, 0, 0, 3),
(26, 0, 0, 0, 0, NULL),
(27, 0, 0, 0, 0, NULL);

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `AVPU`
--

DROP TABLE IF EXISTS `AVPU`;
CREATE TABLE IF NOT EXISTS `AVPU` (
  `AVPUId` int NOT NULL AUTO_INCREMENT,
  `alert` tinyint NOT NULL,
  `verbal` tinyint NOT NULL,
  `pain` tinyint NOT NULL,
  `unresponsive` tinyint NOT NULL,
  PRIMARY KEY (`AVPUId`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Gegevens worden geëxporteerd voor tabel `AVPU`
--

INSERT INTO `AVPU` (`AVPUId`, `alert`, `verbal`, `pain`, `unresponsive`) VALUES
(1, 1, 0, 0, 0),
(2, 1, 0, 0, 0),
(4, 0, 0, 1, 0),
(5, 1, 0, 0, 0),
(6, 0, 0, 0, 1),
(7, 0, 0, 1, 0),
(8, 0, 0, 0, 0),
(9, 1, 0, 0, 0),
(10, 0, 0, 0, 0),
(11, 0, 0, 1, 0),
(12, 0, 0, 0, 0),
(13, 0, 0, 0, 0),
(14, 0, 0, 0, 0),
(15, 0, 0, 0, 0),
(16, 0, 0, 0, 0),
(17, 0, 0, 0, 0),
(18, 0, 0, 0, 0),
(19, 0, 0, 0, 0),
(20, 0, 0, 0, 0),
(21, 0, 0, 0, 0),
(22, 0, 0, 0, 0),
(23, 0, 0, 0, 0),
(24, 0, 0, 0, 0),
(25, 1, 0, 0, 0),
(26, 0, 0, 0, 0),
(27, 0, 0, 0, 0);

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `Event`
--

DROP TABLE IF EXISTS `Event`;
CREATE TABLE IF NOT EXISTS `Event` (
  `eventId` int NOT NULL AUTO_INCREMENT,
  `eventName` varchar(255) NOT NULL,
  `postcode` varchar(10) DEFAULT NULL,
  `updatedAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`eventId`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Gegevens worden geëxporteerd voor tabel `Event`
--

INSERT INTO `Event` (`eventId`, `eventName`, `postcode`, `updatedAt`, `createdAt`) VALUES
(1, 'event', '8334RE', '2026-03-08 18:38:17', '2026-03-08 18:38:17'),
(2, 'dafdafaffa', '6773ER', '2026-03-08 18:39:32', '2026-03-08 18:39:32');

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `Map`
--

DROP TABLE IF EXISTS `Map`;
CREATE TABLE IF NOT EXISTS `Map` (
  `mapId` int NOT NULL AUTO_INCREMENT,
  `mapName` varchar(255) DEFAULT NULL,
  `filePath` varchar(512) NOT NULL,
  `mapType` varchar(255) NOT NULL,
  `FK_Event` int DEFAULT NULL,
  PRIMARY KEY (`mapId`),
  KEY `IDX_ABE0EC5BD495D1C` (`FK_Event`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Gegevens worden geëxporteerd voor tabel `Map`
--

INSERT INTO `Map` (`mapId`, `mapName`, `filePath`, `mapType`, `FK_Event`) VALUES
(2, 'Wireframe 1', 'map_69aebc143340f9.78665581.pdf', 'PDF_MAP', 1),
(4, 'Wireframe 1', 'map_69bebb15b485a1.28959706.pdf', 'PDF_MAP', 1),
(5, 'Wireframe 1', 'map_69bebd202b01c8.91002315.pdf', 'PDF_MAP', 1),
(6, 'Wireframe 5', 'map_69bebd4e88b487.28467189.pdf', 'PDF_MAP', 1),
(7, 'Wireframe 4', 'map_69bebe52414f06.99691676.pdf', 'PDF_MAP', 1),
(9, 'Wireframe 1', 'map_69bec268006722.75357675.pdf', 'PDF_MAP', 1),
(10, 'Wireframe 1', 'map_69bfb764588094.94273031.pdf', 'PDF_MAP', 2);

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `MapEntity`
--

DROP TABLE IF EXISTS `MapEntity`;
CREATE TABLE IF NOT EXISTS `MapEntity` (
  `mapEntityId` int NOT NULL AUTO_INCREMENT,
  `mapLocation` varchar(255) NOT NULL,
  `FK_mapId` int DEFAULT NULL,
  `FK_AidWorker` int DEFAULT NULL,
  PRIMARY KEY (`mapEntityId`),
  KEY `IDX_81BB600DECA99565` (`FK_mapId`),
  KEY `IDX_81BB600D499548C4` (`FK_AidWorker`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `Notification`
--

DROP TABLE IF EXISTS `Notification`;
CREATE TABLE IF NOT EXISTS `Notification` (
  `notificationId` int NOT NULL AUTO_INCREMENT,
  `reportedBy` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `mapLocation` varchar(255) NOT NULL,
  `time` datetime NOT NULL,
  `status` varchar(255) NOT NULL,
  `priority` varchar(255) NOT NULL,
  `ambulanceNeeded` tinyint NOT NULL,
  `description` longtext,
  `notepad` longtext,
  `FK_event` int DEFAULT NULL,
  `FK_AVPU` int DEFAULT NULL,
  `FK_AidTeam` int DEFAULT NULL,
  `FK_SITRAP` int DEFAULT NULL,
  `FK_Assistance` int DEFAULT NULL,
  PRIMARY KEY (`notificationId`),
  UNIQUE KEY `UNIQ_A765AD328F48A8FD` (`FK_AVPU`),
  UNIQUE KEY `UNIQ_A765AD329C4C243C` (`FK_SITRAP`),
  UNIQUE KEY `UNIQ_A765AD32F33DCBC` (`FK_Assistance`),
  KEY `IDX_A765AD32CC887218` (`FK_event`),
  KEY `IDX_A765AD32444C44CE` (`FK_AidTeam`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Gegevens worden geëxporteerd voor tabel `Notification`
--

INSERT INTO `Notification` (`notificationId`, `reportedBy`, `gender`, `subject`, `mapLocation`, `time`, `status`, `priority`, `ambulanceNeeded`, `description`, `notepad`, `FK_event`, `FK_AVPU`, `FK_AidTeam`, `FK_SITRAP`, `FK_Assistance`) VALUES
(1, 'ws', 'OTHER', 'fsfss', 'sfsfsf', '2026-03-08 18:44:17', 'NEW', 'ORANGE', 1, 'sfsfsf', '', 1, 1, 1, 1, 1),
(2, 'afgsgfdsg', 'MALE', 'dadada', 'adada', '2026-03-08 18:44:55', 'CLOSED', 'GREEN', 0, 'dsgfsgfgdfs', '', 1, 2, 2, 2, 2),
(4, 'fdffsd', 'MALE', 'sfsff', 'sfsfsf', '2026-03-09 12:48:40', 'NEW', 'GREEN', 1, 'sfsfsfs', '', 1, 4, 2, 4, 4),
(5, 'fgfggs', 'FEMALE', 'fsgfsgs', 'fsgfsgs', '2026-03-11 13:15:28', 'NEW', 'GREEN', 1, 'sfgsfgfsg', '', 1, 5, 1, 5, 5),
(6, 'fffffff', 'FEMALE', 'ffffff', 'ffffff', '2026-03-11 13:16:24', 'NEW', 'GREEN', 0, 'ffffff', '', 1, 6, 1, 6, 6),
(7, 'eeee', 'FEMALE', 'eeeee', 'eeee', '2026-03-11 14:50:00', 'CLOSED', 'GREEN', 0, 'eeeee', '', 1, 7, 1, 7, 7),
(8, '', NULL, '', '', '2026-03-16 15:04:45', 'NEW', 'GREEN', 0, '', '', 1, 8, NULL, 8, 8),
(9, 'Ikke', 'FEMALE', 'fdsfdfs', 'sfdsfd', '2026-03-17 14:43:55', 'NEW', 'RED', 1, 'sfsffssfs', '', 1, 9, 1, 9, 9),
(10, '', NULL, '', '', '2026-03-17 14:47:27', 'NEW', 'GREEN', 0, '', '', 1, 10, NULL, 10, 10),
(11, 'dgdgdg', 'FEMALE', 'fgfdgdg', 'dgddgdgd', '2026-03-17 14:47:53', 'NEW', 'GREEN', 0, 'dgdgdd', '', 1, 11, 1, 11, 11),
(12, '', 'FEMALE', 'ffffff', 'ffff', '2026-03-17 14:48:26', 'NEW', 'GREEN', 0, 'sfdsfdsfs', '', 1, 12, 1, 12, 12),
(13, '', NULL, '', '', '2026-03-17 14:48:47', 'NEW', 'GREEN', 0, 'fdsfdss', '', 1, 13, NULL, 13, 13),
(14, '', NULL, 'sfsf', 'sfsfs', '2026-03-17 14:49:33', 'NEW', 'GREEN', 0, 'sfsfs', '', 1, 14, NULL, 14, 14),
(15, '', NULL, 'fsssf', 'ssfss', '2026-03-17 14:50:49', 'NEW', 'GREEN', 0, '', '', 1, 15, NULL, 15, 15),
(16, '', NULL, '', '', '2026-03-17 14:52:33', 'NEW', 'GREEN', 0, '', '', 1, 16, NULL, 16, 16),
(17, '', NULL, '', '', '2026-03-17 14:54:03', 'NEW', 'GREEN', 0, '', '', 1, 17, NULL, 17, 17),
(18, '', NULL, '', '', '2026-03-17 15:10:42', 'NEW', 'GREEN', 0, '', '', 1, 18, NULL, 18, 18),
(19, '', NULL, '', '', '2026-03-21 16:57:58', 'NEW', 'GREEN', 0, '', '', 1, 19, NULL, 19, 19),
(20, '', NULL, '', '', '2026-03-21 17:06:56', 'NEW', 'GREEN', 0, '', '', 1, 20, NULL, 20, 20),
(21, '', NULL, '', '', '2026-03-21 17:07:13', 'NEW', 'GREEN', 0, '', '', 1, 21, NULL, 21, 21),
(22, '', NULL, '', '', '2026-03-21 17:07:21', 'NEW', 'GREEN', 0, '', '', 1, 22, NULL, 22, 22),
(23, '', NULL, '', '', '2026-03-21 17:08:16', 'NEW', 'GREEN', 0, '', '', 1, 23, NULL, 23, 23),
(24, '', NULL, '', '', '2026-03-21 17:08:25', 'NEW', 'GREEN', 0, '', '', 1, 24, NULL, 24, 24),
(25, 'TEST', 'MALE', 'TEST', 'EMMEN', '2026-03-22 10:50:00', 'CLOSED', 'GREEN', 1, 'TEST', '', 2, 25, 4, 25, 25),
(26, '', NULL, '', '', '2026-03-22 11:44:00', 'NEW', 'ORANGE', 0, '', '', 2, 26, NULL, 26, 26),
(27, '', NULL, '', '', '2026-03-22 11:44:00', 'NEW', 'RED', 0, '', '', 2, 27, NULL, 27, 27);

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `SITRAP`
--

DROP TABLE IF EXISTS `SITRAP`;
CREATE TABLE IF NOT EXISTS `SITRAP` (
  `SITRAPId` int NOT NULL AUTO_INCREMENT,
  `injury` longtext,
  `description` longtext,
  PRIMARY KEY (`SITRAPId`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Gegevens worden geëxporteerd voor tabel `SITRAP`
--

INSERT INTO `SITRAP` (`SITRAPId`, `injury`, `description`) VALUES
(1, 'afafa', 'afadfdaf'),
(2, 'gssfgsfgs', 'dgfsgfsdgs'),
(4, 'sfsfss', 'sfsfsf'),
(5, 'sgsgsg', 'fdsgfsgsg'),
(6, 'fffff', 'ffff'),
(7, 'eee', 'eee'),
(8, '', ''),
(9, 'sfsfssfs', 'sfsfsf'),
(10, '', ''),
(11, 'dgdgd', 'dgdg'),
(12, 'sfsfsfsf', 'fsfsfs'),
(13, '', ''),
(14, '', ''),
(15, '', ''),
(16, '', ''),
(17, '', ''),
(18, '', ''),
(19, '', ''),
(20, '', ''),
(21, '', ''),
(22, '', ''),
(23, '', ''),
(24, '', ''),
(25, 'TEST', 'TEST'),
(26, '', ''),
(27, '', '');

-- --------------------------------------------------------

--
-- Tabelstructuur voor tabel `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
  `userId` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `isAdmin` tinyint NOT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `uniq_user_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Gegevens worden geëxporteerd voor tabel `user`
--

INSERT INTO `user` (`userId`, `email`, `password`, `isAdmin`) VALUES
(1, 'admin@dmes.nl', '$2y$12$IyFibZ9C5WQ6xJAftz3w5OlNtrUeoHSCvqxYBSZG9TyxOilI8z8q.', 1),
(2, 'dinand@hahah.nl', '$2y$12$fMTiUyMytegRUoceuZlgU.kxYmLVB1zy4G1NSBMzokZU2yzRKmjka', 0);

--
-- Beperkingen voor geëxporteerde tabellen
--

--
-- Beperkingen voor tabel `AidTeam`
--
ALTER TABLE `AidTeam`
  ADD CONSTRAINT `FK_79CFF891D495D1C` FOREIGN KEY (`FK_Event`) REFERENCES `Event` (`eventId`) ON DELETE CASCADE;

--
-- Beperkingen voor tabel `AidWorker`
--
ALTER TABLE `AidWorker`
  ADD CONSTRAINT `FK_B661CB7B444C44CE` FOREIGN KEY (`FK_AidTeam`) REFERENCES `AidTeam` (`aidTeamId`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_B661CB7BD495D1C` FOREIGN KEY (`FK_Event`) REFERENCES `Event` (`eventId`) ON DELETE CASCADE;

--
-- Beperkingen voor tabel `Assistance`
--
ALTER TABLE `Assistance`
  ADD CONSTRAINT `FK_54128622444C44CE` FOREIGN KEY (`FK_AidTeam`) REFERENCES `AidTeam` (`aidTeamId`) ON DELETE SET NULL;

--
-- Beperkingen voor tabel `Map`
--
ALTER TABLE `Map`
  ADD CONSTRAINT `FK_ABE0EC5BD495D1C` FOREIGN KEY (`FK_Event`) REFERENCES `Event` (`eventId`) ON DELETE CASCADE;

--
-- Beperkingen voor tabel `MapEntity`
--
ALTER TABLE `MapEntity`
  ADD CONSTRAINT `FK_81BB600D499548C4` FOREIGN KEY (`FK_AidWorker`) REFERENCES `AidWorker` (`aidWorkerId`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_81BB600DECA99565` FOREIGN KEY (`FK_mapId`) REFERENCES `Map` (`mapId`) ON DELETE CASCADE;

--
-- Beperkingen voor tabel `Notification`
--
ALTER TABLE `Notification`
  ADD CONSTRAINT `FK_A765AD32444C44CE` FOREIGN KEY (`FK_AidTeam`) REFERENCES `AidTeam` (`aidTeamId`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_A765AD328F48A8FD` FOREIGN KEY (`FK_AVPU`) REFERENCES `AVPU` (`AVPUId`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_A765AD329C4C243C` FOREIGN KEY (`FK_SITRAP`) REFERENCES `SITRAP` (`SITRAPId`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_A765AD32CC887218` FOREIGN KEY (`FK_event`) REFERENCES `Event` (`eventId`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_A765AD32F33DCBC` FOREIGN KEY (`FK_Assistance`) REFERENCES `Assistance` (`assistanceId`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
