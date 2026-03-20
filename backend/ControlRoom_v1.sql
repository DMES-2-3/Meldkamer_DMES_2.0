-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Nov 24, 2025 at 04:05 PM
-- Server version: 8.0.44
-- PHP Version: 8.3.26

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

-- --------------------------------------------------------

--
-- Table structure for table `AidTeam`
--

CREATE TABLE `AidTeam` (
  `aidTeamId` int NOT NULL,
  `aidTeamName` varchar(255) NOT NULL,
  `isActive` tinyint(1) NOT NULL,
  `status` varchar(255) NOT NULL,
  `description` longtext NOT NULL,
  `fk_aidWorkerId` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `AidWorker`
--

CREATE TABLE `AidWorker` (
  `aidWorkerId` int NOT NULL,
  `aidWorkerType` varchar(255) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `birthday` date NOT NULL,
  `callSign` varchar(7) NOT NULL,
  `status` varchar(255) NOT NULL,
  `isActive` tinyint(1) NOT NULL,
  `description` longtext NOT NULL,
  `FK_Event` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `AidWorker`
--

INSERT INTO `AidWorker` (`aidWorkerId`, `aidWorkerType`, `firstname`, `lastname`, `birthday`, `callSign`, `status`, `isActive`, `description`, `FK_Event`) VALUES
(1, 'Coordinator', 'Tobias', 'Schipper', '2017-11-01', '', '', 0, 'Lorem', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `Assistance`
--

CREATE TABLE `Assistance` (
  `assistanceId` int NOT NULL,
  `doctor` tinyint(1) NOT NULL,
  `emergencyCare` tinyint(1) NOT NULL,
  `basicCareVPK` tinyint(1) NOT NULL,
  `coordinator` tinyint(1) NOT NULL,
  `fk_aidTeamId` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `AVPU`
--

CREATE TABLE `AVPU` (
  `AVPUId` int NOT NULL,
  `alert` tinyint(1) NOT NULL,
  `verbal` tinyint(1) NOT NULL,
  `pain` tinyint(1) NOT NULL,
  `unresponsive` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Event`
--

CREATE TABLE `Event` (
  `eventId` int NOT NULL,
  `eventName` varchar(255) NOT NULL,
  `ambulanceOnStandby` tinyint(1) NOT NULL,
  `materialOnStandby` tinyint(1) NOT NULL,
  `securityOnStandby` tinyint(1) NOT NULL,
  `trafficControllersOnStandby` tinyint(1) NOT NULL,
  `FK_mapId_event` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Map`
--

CREATE TABLE `Map` (
  `mapId` int NOT NULL,
  `mapName` varchar(255) NOT NULL,
  `description` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `MapEntity`
--

CREATE TABLE `MapEntity` (
  `mapEntityId` int NOT NULL,
  `mapLocation` varchar(255) NOT NULL,
  `FK_mapId` int DEFAULT NULL,
  `FK_AidWorker` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Notification`
--

CREATE TABLE `Notification` (
  `notificationId` int NOT NULL,
  `mapLocation` varchar(255) NOT NULL,
  `time` datetime NOT NULL,
  `status` varchar(255) NOT NULL,
  `priority` varchar(255) NOT NULL,
  `ambulanceNeeded` tinyint(1) NOT NULL,
  `FK_user` int DEFAULT NULL,
  `FK_victim` int DEFAULT NULL,
  `FK_event` int DEFAULT NULL,
  `FK_AVPU` int DEFAULT NULL,
  `FK_AidTeam` int DEFAULT NULL,
  `FK_SITRAP` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `SITRAP`
--

CREATE TABLE `SITRAP` (
  `SITRAPId` int NOT NULL,
  `injury` longtext NOT NULL,
  `description` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `userId` int NOT NULL,
  `username` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `birthday` date NOT NULL,
  `isAdmin` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Victim`
--

CREATE TABLE `Victim` (
  `victimId` int NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `gender` varchar(255) NOT NULL,
  `description` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `AidTeam`
--
ALTER TABLE `AidTeam`
  ADD PRIMARY KEY (`aidTeamId`),
  ADD KEY `IDX_79CFF8915AA6D75` (`fk_aidWorkerId`);

--
-- Indexes for table `AidWorker`
--
ALTER TABLE `AidWorker`
  ADD PRIMARY KEY (`aidWorkerId`),
  ADD KEY `IDX_B661CB7BD495D1C` (`FK_Event`);

--
-- Indexes for table `Assistance`
--
ALTER TABLE `Assistance`
  ADD PRIMARY KEY (`assistanceId`),
  ADD KEY `IDX_541286221229AE7B` (`fk_aidTeamId`);

--
-- Indexes for table `AVPU`
--
ALTER TABLE `AVPU`
  ADD PRIMARY KEY (`AVPUId`);

--
-- Indexes for table `Event`
--
ALTER TABLE `Event`
  ADD PRIMARY KEY (`eventId`),
  ADD KEY `IDX_FA6F25A360D2AFF9` (`FK_mapId_event`);

--
-- Indexes for table `Map`
--
ALTER TABLE `Map`
  ADD PRIMARY KEY (`mapId`);

--
-- Indexes for table `MapEntity`
--
ALTER TABLE `MapEntity`
  ADD PRIMARY KEY (`mapEntityId`),
  ADD UNIQUE KEY `UNIQ_81BB600D499548C4` (`FK_AidWorker`),
  ADD KEY `IDX_81BB600DECA99565` (`FK_mapId`);

--
-- Indexes for table `Notification`
--
ALTER TABLE `Notification`
  ADD PRIMARY KEY (`notificationId`),
  ADD KEY `IDX_A765AD32C9BC34DD` (`FK_user`),
  ADD KEY `IDX_A765AD325EE5874C` (`FK_victim`),
  ADD KEY `IDX_A765AD32CC887218` (`FK_event`),
  ADD KEY `IDX_A765AD328F48A8FD` (`FK_AVPU`),
  ADD KEY `IDX_A765AD32444C44CE` (`FK_AidTeam`),
  ADD KEY `IDX_A765AD329C4C243C` (`FK_SITRAP`);

--
-- Indexes for table `SITRAP`
--
ALTER TABLE `SITRAP`
  ADD PRIMARY KEY (`SITRAPId`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`userId`);

--
-- Indexes for table `Victim`
--
ALTER TABLE `Victim`
  ADD PRIMARY KEY (`victimId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `AidTeam`
--
ALTER TABLE `AidTeam`
  MODIFY `aidTeamId` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `AidWorker`
--
ALTER TABLE `AidWorker`
  MODIFY `aidWorkerId` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Assistance`
--
ALTER TABLE `Assistance`
  MODIFY `assistanceId` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `AVPU`
--
ALTER TABLE `AVPU`
  MODIFY `AVPUId` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Event`
--
ALTER TABLE `Event`
  MODIFY `eventId` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Map`
--
ALTER TABLE `Map`
  MODIFY `mapId` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `MapEntity`
--
ALTER TABLE `MapEntity`
  MODIFY `mapEntityId` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Notification`
--
ALTER TABLE `Notification`
  MODIFY `notificationId` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `SITRAP`
--
ALTER TABLE `SITRAP`
  MODIFY `SITRAPId` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `userId` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Victim`
--
ALTER TABLE `Victim`
  MODIFY `victimId` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `AidTeam`
--
ALTER TABLE `AidTeam`
  ADD CONSTRAINT `FK_79CFF8915AA6D75` FOREIGN KEY (`fk_aidWorkerId`) REFERENCES `AidWorker` (`aidWorkerId`) ON DELETE CASCADE;

--
-- Constraints for table `AidWorker`
--
ALTER TABLE `AidWorker`
  ADD CONSTRAINT `FK_B661CB7BD495D1C` FOREIGN KEY (`FK_Event`) REFERENCES `Event` (`eventId`) ON DELETE CASCADE;

--
-- Constraints for table `Assistance`
--
ALTER TABLE `Assistance`
  ADD CONSTRAINT `FK_541286221229AE7B` FOREIGN KEY (`fk_aidTeamId`) REFERENCES `AidTeam` (`aidTeamId`) ON DELETE CASCADE;

--
-- Constraints for table `Event`
--
ALTER TABLE `Event`
  ADD CONSTRAINT `FK_FA6F25A360D2AFF9` FOREIGN KEY (`FK_mapId_event`) REFERENCES `Map` (`mapId`) ON DELETE CASCADE;

--
-- Constraints for table `MapEntity`
--
ALTER TABLE `MapEntity`
  ADD CONSTRAINT `FK_81BB600D499548C4` FOREIGN KEY (`FK_AidWorker`) REFERENCES `AidWorker` (`aidWorkerId`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_81BB600DECA99565` FOREIGN KEY (`FK_mapId`) REFERENCES `Map` (`mapId`) ON DELETE CASCADE;

--
-- Constraints for table `Notification`
--
ALTER TABLE `Notification`
  ADD CONSTRAINT `FK_A765AD32444C44CE` FOREIGN KEY (`FK_AidTeam`) REFERENCES `AidTeam` (`aidTeamId`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_A765AD325EE5874C` FOREIGN KEY (`FK_victim`) REFERENCES `Victim` (`victimId`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_A765AD328F48A8FD` FOREIGN KEY (`FK_AVPU`) REFERENCES `AVPU` (`AVPUId`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_A765AD329C4C243C` FOREIGN KEY (`FK_SITRAP`) REFERENCES `SITRAP` (`SITRAPId`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_A765AD32C9BC34DD` FOREIGN KEY (`FK_user`) REFERENCES `user` (`userId`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_A765AD32CC887218` FOREIGN KEY (`FK_event`) REFERENCES `Event` (`eventId`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
