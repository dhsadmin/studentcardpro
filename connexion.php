<?php 

session_start();
@include("configurer.php");

if ($_SERVER['REQUEST_METHOD'] === 'POST') { 
    $nom = $_POST['nom']; 
    $password = $_POST['password'];

    try {
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); 
        
        // Préparer la requête pour sélectionner l'utilisateur
        $stmt = $pdo->prepare("SELECT password FROM registration WHERE nom = ?");
        $stmt->execute([$nom]);
        
        // Vérifier si l'utilisateur existe
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            // Vérifier le mot de passe
            if (password_verify($password, $row['password'])) {
                echo "<center>Connexion réussie. Bienvenue, $nom!</center>";
                // Redirection vers une page d'accueil ou tableau de bord
                $_SESSION['nom'] = $nom;
                header("Location: services.php");
                exit; // Terminer le script après redirection
            } else {
                echo "<center>Nom d'utilisateur ou mot de passe incorrect.</center>";
            }
        } else {
            echo "<center>Nom d'utilisateur non trouvé.</center>";
        }
    } catch (PDOException $e) {
        echo "<center>Erreur de connexion à la base de données : " . htmlspecialchars($e->getMessage()) . "</center>";
    }
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="./css/style.css">
    <link rel="stylesheet" href="inscription.css">
    <title>Connexion | StudentCardPro</title>
</head>
<body>
    <header>
      <div class="container">
        <div id="branding">
          <span class="seal">SC</span>
          <h1><span class="highlight">Student</span>CardPro</h1>
        </div>
        <nav aria-label="Navigation principale">
          <ul>
            <li><a href="index.html">Accueil</a></li>
            <li><a href="services.php">Services</a></li>
          <!--  <li><a href="publipostage.php">Publipostage</a></li>-->
            <li><a href="about.html">À propos</a></li>
          </ul>
        </nav>
      </div>
    </header>

    <main class="auth-page">
        <form action="" method="POST">
            <h2>Connexion</h2>
            <p>Connectez-vous pour accéder au générateur de carte.</p>
            <label for="nom">Nom d'utilisateur</label>
            <input type="text" id="nom" name="nom" required>
            <label for="password">Mot de passe</label>
            <input type="password" id="password" name="password" required>
            <input type="submit" name="connecter" value="Se connecter" class="submit">
            <center>Pas encore de compte ? <a href="inscription.php">S'inscrire</a></center>
        </form>
    </main>

    <footer>
        <p>StudentCardPro, Copyright &copy; 2024</p>
    </footer>
</body>
</html>
