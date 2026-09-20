<?php 
session_start();
if (!isset($_SESSION['nom'])) {
    header("Location: connexion.php");
    exit;
}
@include("configurer.php");

if ($_SERVER['REQUEST_METHOD'] === 'POST') { 
    $nom = $_POST['nom']; 
    $prenom = $_POST['prenom']; 
    $classe = $_POST['classe']; 
    $filiere = $_POST['filiere']; 
    $date_naiss = $_POST['date_naiss']; 
    $lieu_naiss = $_POST['lieu_naiss']; 
    $sexe = $_POST['sexe']; 
    $telephone = $_POST['telephone']; 
    $matricule = $_POST['matricule']; 
    
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) { 
        $uploadDir = 'uploads/'; 
        $uploadFile = $uploadDir . basename($_FILES['image']['name']); 
        if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadFile)) { 
            try { 
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); 
                $stmt = $pdo->prepare("INSERT INTO users (nom, prenom, classe, filiere, date_naiss, lieu_naiss, sexe, telephone, matricule, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"); 
                if ($stmt->execute([$nom, $prenom, $classe, $filiere, $date_naiss, $lieu_naiss, $sexe, $telephone, $matricule, $uploadFile])) { 
                    $userId = $pdo->lastInsertId(); // Récupérer l'ID de l'utilisateur inséré
                    echo "Enrollement effectué avec succès."; 
                    header("Location: carte.php?id=$userId"); // Rediriger vers la carte de l'utilisateur
                    exit; // Terminer le script après la redirection
                } else { 
                    echo "Erreur lors de l'enregistrement dans la base de données."; 
                } 
            } catch (PDOException $e) { 
                echo "Erreur de connexion à la base de données : " . $e->getMessage(); 
            } 
        } else { 
            echo "Erreur lors du déplacement de l'image."; 
        } 
    } else { 
        echo "Aucun fichier ou erreur dans le téléchargement."; 
    } 
}
?>