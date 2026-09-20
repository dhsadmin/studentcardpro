-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : dim. 06 oct. 2024 à 15:45
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `use_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `registration`
--

CREATE TABLE `registration` (
  `userId` int(11) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `registration`
--

INSERT INTO `registration` (`userId`, `nom`, `password`) VALUES
(16, 'hilariondhs08@gmail.com', '$2y$10$xy7JCV0MEyhIQ7SlDEJzGO5qEqNMNwpoQFrqiY4XhdqOFpqtzpfW6'),
(17, 'hilariondhs08@gmail.com', '$2y$10$ofcHyrny2cdHyjfthb6ereysHvSqTRnRZofl52T5ImxTcC9XA6uwC');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(20) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `date_naiss` date NOT NULL,
  `lieu_naiss` varchar(255) NOT NULL,
  `sexe` varchar(255) NOT NULL,
  `classe` varchar(255) NOT NULL,
  `filiere` varchar(255) NOT NULL,
  `matricule` varchar(255) NOT NULL,
  `telephone` varchar(255) NOT NULL,
  `image_path` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `registration`
--
ALTER TABLE `registration`
  ADD PRIMARY KEY (`userId`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `registration`
--
ALTER TABLE `registration`
  MODIFY `userId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
