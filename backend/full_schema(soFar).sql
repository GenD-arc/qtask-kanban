-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Apr 22, 2026 at 03:28 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `qtask_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `taskId` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `action` text NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `taskId`, `userId`, `action`, `createdAt`) VALUES
(1, 1, NULL, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 15:26:00'),
(2, 1, NULL, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-18 15:26:01'),
(3, 2, NULL, 'Phase changed from \"In Progress\" to \"For Review (Dev Done)\"', '2026-04-18 15:26:03'),
(4, 3, NULL, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 15:26:05'),
(5, 3, NULL, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-18 15:26:06'),
(6, 2, NULL, 'Phase changed from \"For Review (Dev Done)\" to \"In Progress\"', '2026-04-18 15:26:07'),
(7, 1, NULL, 'Phase changed from \"In Progress\" to \"Client Review - UAT\"', '2026-04-18 15:27:48'),
(8, 1, NULL, 'Phase changed from \"Client Review - UAT\" to \"In Progress\"', '2026-04-18 15:27:56'),
(9, 1, NULL, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 15:37:35'),
(10, 1, NULL, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-18 15:37:37'),
(11, 2, NULL, 'Phase changed from \"In Progress\" to \"For Review (Dev Done)\"', '2026-04-18 15:37:41'),
(12, 2, NULL, 'Phase changed from \"For Review (Dev Done)\" to \"In Progress\"', '2026-04-18 15:37:42'),
(13, 1, NULL, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 15:38:03'),
(14, 1, NULL, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-18 15:38:12'),
(15, 1, NULL, 'Phase changed from \"In Progress\" to \"For Review (Dev Done)\"', '2026-04-18 15:38:53'),
(16, 1, NULL, 'Phase changed from \"For Review (Dev Done)\" to \"In Progress\"', '2026-04-18 15:39:04'),
(17, 5, NULL, 'Phase changed from \"Deployed (Go-Live)\" to \"QA Execution\"', '2026-04-18 16:53:01'),
(18, 5, NULL, 'Phase changed from \"QA Execution\" to \"Deployed (Go-Live)\"', '2026-04-18 16:53:02'),
(19, 1, NULL, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 16:53:05'),
(20, 1, NULL, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-18 16:53:05'),
(21, 4, NULL, 'Phase changed from \"In Progress\" to \"QA Execution\"', '2026-04-18 16:55:41'),
(22, 4, NULL, 'Phase changed from \"QA Execution\" to \"In Progress\"', '2026-04-18 16:55:43'),
(23, 1, NULL, 'Phase changed from \"In Progress\" to \"For Review (Dev Done)\"', '2026-04-18 17:02:38'),
(24, 1, NULL, 'Phase changed from \"For Review (Dev Done)\" to \"In Progress\"', '2026-04-18 17:34:30'),
(25, 2, NULL, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 17:34:38'),
(26, 2, NULL, 'Phase changed from \"To Do (Ready for Dev)\" to \"QA Execution\"', '2026-04-18 17:34:43'),
(27, 3, NULL, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 18:08:00'),
(28, 3, NULL, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-18 18:08:10'),
(29, 4, NULL, 'Phase changed from \"In Progress\" to \"Deployed (Go-Live)\"', '2026-04-18 18:08:44'),
(30, 4, 6, 'Phase changed from \"For Review (Dev Done)\" to \"In Progress\"', '2026-04-18 18:41:02'),
(31, 2, 5, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-18 18:42:01'),
(32, 2, 5, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-18 18:42:08'),
(33, 3, 2, 'Phase changed from \"In Progress\" to \"Backlog (Requirements)\"', '2026-04-18 18:42:25'),
(34, 3, 2, 'Phase changed from \"Backlog (Requirements)\" to \"In Progress\"', '2026-04-18 18:42:29'),
(35, 4, 6, 'Phase changed from \"In Progress\" to \"For Review (Dev Done)\"', '2026-04-18 18:43:07'),
(36, 4, 6, 'Task details updated', '2026-04-18 18:43:48'),
(37, 4, 6, 'Phase changed from \"For Review (Dev Done)\" to \"In Progress\"', '2026-04-18 18:48:38'),
(38, 4, 6, 'Phase changed from \"In Progress\" to \"Deployed (Go-Live)\"', '2026-04-18 18:48:49'),
(39, 4, 6, 'Phase changed from \"Deployed (Go-Live)\" to \"For Review (Dev Done)\"', '2026-04-18 18:48:57'),
(40, 4, 6, 'Phase changed from \"For Review (Dev Done)\" to \"Deployed (Go-Live)\"', '2026-04-18 18:49:18'),
(41, 4, 6, 'Task details updated', '2026-04-18 18:49:36'),
(42, 4, 4, 'Phase changed from \"Deployed (Go-Live)\" to \"Completed\" — Actual End Date: 2026-04-18', '2026-04-18 18:50:10'),
(43, 4, 4, 'Phase changed from \"Completed\" to \"Deployed (Go-Live)\"', '2026-04-18 18:50:13'),
(44, 6, 6, 'Task created', '2026-04-19 11:29:17'),
(45, 6, 6, 'Phase changed from \"Backlog (Requirements)\" to \"To Do (Ready for Dev)\"', '2026-04-19 11:29:38'),
(46, 6, 6, 'Phase changed from \"To Do (Ready for Dev)\" to \"Backlog (Requirements)\"', '2026-04-19 11:29:49'),
(47, 6, 7, 'Phase changed from \"Backlog (Requirements)\" to \"To Do (Ready for Dev)\"', '2026-04-19 11:41:14'),
(48, 6, 7, 'Phase changed from \"To Do (Ready for Dev)\" to \"Backlog (Requirements)\"', '2026-04-19 11:41:31'),
(49, 6, 7, 'Task details updated', '2026-04-19 11:42:12'),
(50, 6, 1, 'Task details updated', '2026-04-19 12:43:56'),
(51, 6, 1, 'Phase changed from \"Backlog (Requirements)\" to \"In Progress\"', '2026-04-19 12:47:01'),
(52, 4, 1, 'Phase changed from \"Deployed (Go-Live)\" to \"In Progress\"', '2026-04-19 12:47:04'),
(53, 5, 1, 'Phase changed from \"Deployed (Go-Live)\" to \"In Progress\"', '2026-04-19 12:47:06'),
(54, 4, 1, 'Phase changed from \"In Progress\" to \"Deployed (Go-Live)\"', '2026-04-19 12:47:47'),
(55, 5, 1, 'Phase changed from \"In Progress\" to \"Deployed (Go-Live)\"', '2026-04-19 12:47:49'),
(56, 3, 1, 'Phase changed from \"In Progress\" to \"To Do (Ready for Dev)\"', '2026-04-19 12:47:53'),
(57, 7, 1, 'Task created', '2026-04-22 20:32:28'),
(58, 7, 1, 'Task details updated', '2026-04-22 20:33:25'),
(59, 8, 6, 'Task created', '2026-04-22 20:34:42'),
(60, 8, 6, 'Phase changed from \"Backlog (Requirements)\" to \"To Do (Ready for Dev)\"', '2026-04-22 20:34:46'),
(61, 7, 6, 'Phase changed from \"Backlog (Requirements)\" to \"To Do (Ready for Dev)\"', '2026-04-22 20:34:48'),
(62, 8, 6, 'Task details updated', '2026-04-22 20:35:13'),
(63, 3, 2, 'Phase changed from \"To Do (Ready for Dev)\" to \"In Progress\"', '2026-04-22 20:35:49');

-- --------------------------------------------------------

--
-- Table structure for table `assessments`
--

CREATE TABLE `assessments` (
  `id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `assessments`
--

INSERT INTO `assessments` (`id`, `label`, `sortOrder`) VALUES
(1, 'Existing', 1),
(2, 'Development / Customization', 2),
(3, 'Enhancement', 3),
(4, 'Not Applicable', 4),
(5, 'Out of Scope', 5),
(6, 'Defect', 6);

-- --------------------------------------------------------

--
-- Table structure for table `phases`
--

CREATE TABLE `phases` (
  `id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `isFinal` tinyint(1) NOT NULL DEFAULT 0,
  `grouping` enum('dev','qa') NOT NULL DEFAULT 'dev'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `phases`
--

INSERT INTO `phases` (`id`, `label`, `sortOrder`, `isDefault`, `isFinal`, `grouping`) VALUES
(1, 'Backlog (Requirements)', 1, 1, 0, 'dev'),
(2, 'To Do (Ready for Dev)', 2, 0, 0, 'dev'),
(3, 'In Progress', 3, 0, 0, 'dev'),
(4, 'For Review (Dev Done)', 4, 0, 0, 'dev'),
(5, 'Client Review - UAT', 5, 0, 0, 'qa'),
(6, 'QA Execution', 6, 0, 0, 'qa'),
(7, 'Deployed (Go-Live)', 7, 0, 0, 'qa'),
(8, 'Completed', 8, 0, 1, 'qa');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `pmId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `title`, `description`, `pmId`, `createdAt`) VALUES
(1, 'QTask Development', 'Default project for existing tasks', 7, '2026-04-19 11:53:14'),
(2, 'Test Project 1', 'test data to simulate the separation of workloads', 6, '2026-04-19 12:10:09');

-- --------------------------------------------------------

--
-- Table structure for table `severities`
--

CREATE TABLE `severities` (
  `id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `severities`
--

INSERT INTO `severities` (`id`, `label`, `sortOrder`) VALUES
(1, '1 - Critical / Showstopper', 1),
(2, '2 - High', 2),
(3, '3 - Medium', 3),
(4, '4 - Low', 4),
(5, '5 - Cosmetic Fix', 5),
(6, 'Nice to Have', 6);

-- --------------------------------------------------------

--
-- Table structure for table `statuses`
--

CREATE TABLE `statuses` (
  `id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `isFinal` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `statuses`
--

INSERT INTO `statuses` (`id`, `label`, `sortOrder`, `isDefault`, `isFinal`) VALUES
(1, 'Not Started', 1, 1, 0),
(2, 'Active', 2, 0, 0),
(3, 'Blocked', 3, 0, 0),
(4, 'Bug Fixing', 4, 0, 0),
(5, 'Clarification Needed', 5, 0, 0),
(6, 'For Verification', 6, 0, 0),
(7, 'Failed', 7, 0, 0),
(8, 'Passed', 8, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `subtasks`
--

CREATE TABLE `subtasks` (
  `id` int(11) NOT NULL,
  `taskId` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `isDone` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `subtasks`
--

INSERT INTO `subtasks` (`id`, `taskId`, `title`, `isDone`) VALUES
(12, 7, 'subtask 1', 0),
(22, 8, '1', 0),
(23, 8, '2', 0);

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `projectId` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `statusId` int(11) NOT NULL,
  `phaseId` int(11) DEFAULT NULL,
  `severityId` int(11) DEFAULT NULL,
  `assigneeId` int(11) DEFAULT NULL,
  `targetDate` date DEFAULT NULL,
  `actualEndDate` date DEFAULT NULL,
  `progress` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `projectId`, `title`, `description`, `statusId`, `phaseId`, `severityId`, `assigneeId`, `targetDate`, `actualEndDate`, `progress`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'Design login page', 'Create Figma mockup and implement HTML/CSS.', 1, 3, 2, 3, '2025-04-10', NULL, 0, '2026-04-18 14:45:08', '2026-04-19 11:53:14'),
(2, 1, 'Write API docs', 'Document all Express routes via Postman.', 1, 3, 4, 5, '2025-04-20', NULL, 0, '2026-04-18 14:45:08', '2026-04-19 11:53:14'),
(3, 1, 'Build dashboard UI', 'Implement analytics dashboard with charts.', 2, 3, 2, 2, '2025-04-15', NULL, 55, '2026-04-18 14:45:08', '2026-04-22 20:35:49'),
(4, 1, 'Auth endpoints', 'Express JWT auth with bcrypt hashing.', 6, 7, 1, 4, '2025-04-10', '2026-04-18', 100, '2026-04-18 14:45:08', '2026-04-19 12:47:47'),
(5, 1, 'Project repo setup', 'Initialise GitHub repo and branch rules.', 8, 7, 3, 2, '2025-04-01', NULL, 100, '2026-04-18 14:45:08', '2026-04-19 12:47:49'),
(6, 1, 'Kanban Frontend', 'test data no. 1', 1, 3, 2, 3, '2026-04-22', NULL, 0, '2026-04-19 11:29:17', '2026-04-19 12:47:01'),
(7, 2, 'Backshot ugh', 'mwehehe', 1, 2, 2, 6, '2026-04-29', NULL, 0, '2026-04-22 20:32:28', '2026-04-22 20:34:48'),
(8, 2, 'blow work', 'dipindi', 1, 2, 3, 2, '2026-04-23', NULL, 0, '2026-04-22 20:34:42', '2026-04-22 20:35:44');

-- --------------------------------------------------------

--
-- Table structure for table `task_attachments`
--

CREATE TABLE `task_attachments` (
  `id` int(11) NOT NULL,
  `taskId` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `originalName` varchar(255) NOT NULL,
  `mimetype` varchar(100) NOT NULL,
  `size` int(11) NOT NULL,
  `uploadedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Admin','ProjectManager','Developer','QA') NOT NULL DEFAULT 'Developer',
  `isActive` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `username`, `password`, `role`, `isActive`) VALUES
(1, 'Admin User', 'admin', '$2b$10$YuJ6Or8HNFOKs3w3elGep.4JPfegjkjPzEogdb86q.fz.z7hjilOS', 'Admin', 1),
(2, 'Carlo Reyes', 'carlo', '$2b$10$YuJ6Or8HNFOKs3w3elGep.4JPfegjkjPzEogdb86q.fz.z7hjilOS', 'Developer', 1),
(3, 'Ana Santos', 'ana', '$2b$10$YuJ6Or8HNFOKs3w3elGep.4JPfegjkjPzEogdb86q.fz.z7hjilOS', 'Developer', 1),
(4, 'Dana Cruz', 'dana', '$2b$10$YuJ6Or8HNFOKs3w3elGep.4JPfegjkjPzEogdb86q.fz.z7hjilOS', 'QA', 1),
(5, 'Ben Torres', 'ben', '$2b$10$YuJ6Or8HNFOKs3w3elGep.4JPfegjkjPzEogdb86q.fz.z7hjilOS', 'Developer', 1),
(6, 'Maria Lopez', 'maria', '$2b$10$YuJ6Or8HNFOKs3w3elGep.4JPfegjkjPzEogdb86q.fz.z7hjilOS', 'ProjectManager', 1),
(7, 'Mark Yyu', 'markyyu', '$2b$10$bf2rKJo.iivVeXrMRo2gKu1SHI71ZL.Hf4n1M1xRnqPR6FcXdpjoO', 'ProjectManager', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_log_task` (`taskId`);

--
-- Indexes for table `assessments`
--
ALTER TABLE `assessments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_assessment_label` (`label`);

--
-- Indexes for table `phases`
--
ALTER TABLE `phases`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_phase_label` (`label`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_title` (`title`),
  ADD KEY `fk_project_pm` (`pmId`);

--
-- Indexes for table `severities`
--
ALTER TABLE `severities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_severity_label` (`label`);

--
-- Indexes for table `statuses`
--
ALTER TABLE `statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_status_label` (`label`);

--
-- Indexes for table `subtasks`
--
ALTER TABLE `subtasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_subtask_task` (`taskId`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_task_status` (`statusId`),
  ADD KEY `fk_task_phase` (`phaseId`),
  ADD KEY `fk_task_severity` (`severityId`),
  ADD KEY `fk_task_assignee` (`assigneeId`),
  ADD KEY `fk_task_project` (`projectId`);

--
-- Indexes for table `task_attachments`
--
ALTER TABLE `task_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_attachment_task` (`taskId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `assessments`
--
ALTER TABLE `assessments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `phases`
--
ALTER TABLE `phases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `severities`
--
ALTER TABLE `severities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `statuses`
--
ALTER TABLE `statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `subtasks`
--
ALTER TABLE `subtasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `task_attachments`
--
ALTER TABLE `task_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `fk_log_task` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `fk_project_pm` FOREIGN KEY (`pmId`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `subtasks`
--
ALTER TABLE `subtasks`
  ADD CONSTRAINT `fk_subtask_task` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_task_assignee` FOREIGN KEY (`assigneeId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_task_phase` FOREIGN KEY (`phaseId`) REFERENCES `phases` (`id`),
  ADD CONSTRAINT `fk_task_project` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_task_severity` FOREIGN KEY (`severityId`) REFERENCES `severities` (`id`),
  ADD CONSTRAINT `fk_task_status` FOREIGN KEY (`statusId`) REFERENCES `statuses` (`id`);

--
-- Constraints for table `task_attachments`
--
ALTER TABLE `task_attachments`
  ADD CONSTRAINT `fk_attachment_task` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
