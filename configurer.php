<?php


$host = 'localhost'; 
$db = 'use_db'; 
$user = 'root'; 
$pass = ''; 

// Connexion à la base de données
$conn = new mysqli($host, $user, $pass, $db);

$pdo = new PDO('mysql:host=localhost;dbname=use_db', 'root', ''); 

?>