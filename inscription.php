<?php 

session_start();
@include("configurer.php");

if ($_SERVER['REQUEST_METHOD'] === 'POST') { 
    $nom = $_POST['nom']; 
    $password = $_POST['password']; 
    $cpassword = $_POST['cpassword']; 

    // Vérification que les mots de passe correspondent
    if ($password === $cpassword) {
        // Hachage du mot de passe
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        try {
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); 
            $stmt = $pdo->prepare("INSERT INTO registration (nom, password) VALUES (?, ?)"); 
            if ($stmt->execute([$nom, $hashedPassword])) { 
                echo "Inscription effectuée avec succès."; 
                $_SESSION['nom'] = $nom;
                header("Location: services.php");
                exit; // Terminer le script après redirection
            } else { 
                echo "<center>Erreur lors de l'enregistrement dans la base de données.</center>"; 
            } 
        } catch (PDOException $e) {
            echo "<center>Erreur de connexion à la base de données : " . htmlspecialchars($e->getMessage()) . "</center>";
        }
    } else {
        echo "<center>Les mots de passe ne correspondent pas.</center>";
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
    <title>Inscription | StudentCardPro</title>
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
            <h2>Inscription</h2>
            <p>Un compte est nécessaire pour générer une carte scolaire.</p>
            <label for="nom">Nom d'utilisateur</label>
            <input type="text" id="nom" name="nom" required>
            <label for="password">Mot de passe</label>
            <input type="password" id="password" name="password" required>
            <label for="cpassword">Confirmer le mot de passe</label>
            <input type="password" id="cpassword" name="cpassword" required>
            <input type="submit" name="inscrire" value="S'inscrire" class="submit">
            <center>ou <a href="connexion.php">Se connecter</a></center>
        </form>
    </main>

    <footer>
        <p>StudentCardPro, Copyright &copy; 2024</p>
    </footer>
</body>
</html>