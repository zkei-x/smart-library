-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 18, 2026 at 05:02 PM
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
-- Database: `smart_library`
--

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(200) NOT NULL,
  `author` varchar(150) NOT NULL,
  `genre` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `available` tinyint(1) NOT NULL DEFAULT 1,
  `total_copies` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `available_copies` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `interests` varchar(255) DEFAULT NULL,
  `symbol` varchar(10) NOT NULL DEFAULT '▤',
  `color` varchar(20) NOT NULL DEFAULT '#477b70'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`id`, `title`, `author`, `genre`, `description`, `available`, `total_copies`, `available_copies`, `created_at`, `interests`, `symbol`, `color`) VALUES
(1, 'The Silent Patient', 'Alex Michaelides', 'Mystery', 'A psychological mystery surrounding a painter who stops speaking after a shocking crime.', 1, 2, 1, '2026-10-18 08:33:54', 'Mystery,Thriller,Psychology,Relationships', '◈', '#35546a'),
(2, 'The Hobbit', 'J.R.R. Tolkien', 'Fantasy', 'Join an unlikely hero on an unforgettable journey through a magical world.', 1, 2, 2, '2026-10-18 08:33:54', 'Fantasy,Adventure,Creativity', '✦', '#63774b'),
(4, 'Sapiens', 'Yuval Noah Harari', 'History', 'Explore the major developments that shaped human civilization.', 1, 2, 2, '2026-10-18 08:33:54', 'History,Science,Philosophy,Educational,Education', '⌘', '#895d50'),
(5, 'Dune', 'Frank Herbert', 'Science Fiction', 'Politics, ecology, and destiny collide on a desert planet.', 1, 2, 2, '2026-10-18 08:33:54', 'Science Fiction,Adventure,Philosophy,Technology', '☼', '#b47b4e'),
(6, 'The Psychology of Money', 'Morgan Housel', 'Psychology', 'Discover how behavior and personal experiences influence financial decisions.', 1, 2, 2, '2026-10-18 08:33:54', 'Psychology,Self-Help,Finance,Business,Personal Growth', '◎', '#477b70'),
(7, 'Harry Potter', 'J.K. Rowling', 'Fantasy', 'A young wizard discovers a hidden world of friendship and danger.', 1, 2, 2, '2026-10-18 08:33:54', 'Fantasy,Adventure,Mystery,Creativity', '✧', '#76537f'),
(9, 'Sherlock Holmes', 'Arthur Conan Doyle', 'Mystery', 'Follow a brilliant detective as he solves puzzling cases through observation.', 1, 2, 2, '2026-10-18 08:33:54', 'Mystery,Thriller,History,Psychology', '⌕', '#6d7162'),
(10, 'The Alchemist', 'Paulo Coelho', 'Philosophy', 'A young shepherd travels in search of treasure and discovers his purpose.', 1, 2, 2, '2026-10-18 08:33:54', 'Philosophy,Adventure,Self-Help,Personal Growth,Personal Development', '◇', '#b58a50'),
(11, 'Deep Work', 'Cal Newport', 'Productivity', 'Learn strategies for focused work and meaningful accomplishments.', 1, 2, 2, '2026-10-18 08:33:54', 'Productivity,Self-Help,Personal Development,Business,Technology,Psychology', '▤', '#466a5b'),
(12, 'The Martian', 'Andy Weir', 'Science Fiction', 'An astronaut uses ingenuity and science to survive alone on Mars.', 0, 0, 0, '2026-10-18 08:33:54', 'Science Fiction,Science,Adventure,Technology,Educational', '♂', '#a75f45'),
(13, 'Pride and Prejudice', 'Jane Austen', 'Romance', 'A witty story of love, manners, and family in Regency England.', 1, 2, 2, '2026-10-18 09:38:40', 'Romance,Relationships', '♡', '#a65d6f'),
(14, 'Dracula', 'Bram Stoker', 'Horror', 'A gothic classic about Count Dracula and the people who try to stop him.', 1, 2, 2, '2026-10-18 09:38:40', 'Horror,Thriller,Adventure', '☾', '#4a3b52'),
(15, 'Steve Jobs', 'Walter Isaacson', 'Biography', 'The life of the Apple co-founder, told through interviews with Jobs and those around him.', 1, 2, 2, '2026-10-18 09:38:40', 'Biography,Technology,Business,Creativity', '◐', '#5c6b73');

-- --------------------------------------------------------

--
-- Table structure for table `borrowings`
--

CREATE TABLE `borrowings` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `book_id` int(10) UNSIGNED NOT NULL,
  `borrowed_at` datetime NOT NULL DEFAULT current_timestamp(),
  `due_date` date NOT NULL,
  `returned_at` datetime DEFAULT NULL,
  `status` enum('borrowed','returned') NOT NULL DEFAULT 'borrowed'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `borrowings`
--

INSERT INTO `borrowings` (`id`, `user_id`, `book_id`, `borrowed_at`, `due_date`, `returned_at`, `status`) VALUES
(3, 2, 1, '2026-10-18 22:46:11', '2026-11-01', '2026-10-18 22:48:00', 'returned'),
(4, 2, 1, '2026-10-18 22:48:02', '2026-11-01', '2026-10-18 22:50:51', 'returned'),
(5, 2, 1, '2026-10-18 22:50:52', '2026-11-01', NULL, 'borrowed');

-- --------------------------------------------------------

--
-- Table structure for table `reading_lists`
--

CREATE TABLE `reading_lists` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `book_id` int(10) UNSIGNED NOT NULL,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `role`, `created_at`) VALUES
(1, 'Zack Astilla', 'zackdastilla@gmail.com', '$2y$10$p5SEOvOR9f1FREGJG5TZs.AIKyV3LW094Akbr8iLiI43fl8K5G/iq', 'admin', '2026-10-12 16:44:20'),
(2, 'Joseph Joestar', 'z4ckulit@gmail.com', '$2y$10$UqHTXaBwGBAdNhLo3yj3XOAVFR2RGHZ0rOReCU8ioQaKifPIy3S/y', 'user', '2026-10-12 17:04:38');

-- --------------------------------------------------------

--
-- Table structure for table `user_preferences`
--

CREATE TABLE `user_preferences` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `favorite_genres` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_preferences`
--

INSERT INTO `user_preferences` (`id`, `user_id`, `favorite_genres`, `updated_at`) VALUES
(1, 1, 'Romance', '2026-10-18 09:47:04');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `borrowings`
--
ALTER TABLE `borrowings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `book_id` (`book_id`);

--
-- Indexes for table `reading_lists`
--
ALTER TABLE `reading_lists`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_book` (`user_id`,`book_id`),
  ADD KEY `book_id` (`book_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `books`
--
ALTER TABLE `books`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `borrowings`
--
ALTER TABLE `borrowings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `reading_lists`
--
ALTER TABLE `reading_lists`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `user_preferences`
--
ALTER TABLE `user_preferences`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `borrowings`
--
ALTER TABLE `borrowings`
  ADD CONSTRAINT `borrowings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `borrowings_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reading_lists`
--
ALTER TABLE `reading_lists`
  ADD CONSTRAINT `reading_lists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reading_lists_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD CONSTRAINT `user_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
