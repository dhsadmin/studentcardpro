<?php
session_start();
if (!isset($_SESSION['nom'])) {
    header("Location: connexion.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>StudentCardPro | Services</title>
  <link rel="stylesheet" href="./css/style.css">
  <link rel="icon" href="img/favicon.png">
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
          <li class="current"><a href="services.php">Services</a></li>
          <li><a href="about.html">À propos</a></li>
          <!---<li><a href="publipostage.php">Publipostage</a></li>->
        </ul>
      </nav>
    </div>
    <div class="container session-bar">
      <span>Connecté en tant que <b><?php echo htmlspecialchars($_SESSION['nom']); ?></b></span>
      <a href="deconnexion.php">Se déconnecter</a>
    </div>
  </header>

  <section class="form-page">
    <div class="container">
      <h1 class="page-title">Générer une carte scolaire</h1>
      <p class="subtitle">Renseignez les informations de l'apprenant pour produire sa carte d'identité scolaire.</p>

      <div class="notice">
        <b>Info :</b> cette version de StudentCardPro a des fonctionnalités restreintes et est actuellement paramétrée sur :
        <ul style="margin-top:8px;padding-left:18px;">
          <li>Établissement scolaire : Lycée Technique et Professionnel de Djakotomey</li>
          <li>Année scolaire : 2025-2026</li>
        </ul>
      </div>

      <div class="form-card">
        <form action="generer.php" method="POST" enctype="multipart/form-data">

          <div class="field-row">
            <div class="field">
              <label for="nom">Nom</label>
              <input type="text" id="nom" name="nom" placeholder="Nom" required>
            </div>
            <div class="field">
              <label for="prenom">Prénom(s)</label>
              <input type="text" id="prenom" name="prenom" placeholder="Prénoms" required>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="date_naiss">Date de naissance</label>
              <input type="date" id="date_naiss" name="date_naiss" required>
            </div>
            <div class="field">
              <label for="lieu_naiss">Lieu de naissance</label>
              <input type="text" id="lieu_naiss" name="lieu_naiss" placeholder="DJAKOTOMEY" required>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="sexe">Sexe</label>
              <select id="sexe" name="sexe">
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div class="field">
              <label for="telephone">Numéro de téléphone</label>
              <input type="text" id="telephone" name="telephone" placeholder="90000000" maxlength="8" minlength="8" required>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="classe">Classe</label>
              <select id="classe" name="classe">
                <option value="2nde">Seconde</option>
                <option value="1ère">Première</option>
                <option value="Tle">Terminale</option>
              </select>
            </div>
            <div class="field">
              <label for="filiere">Spécialité</label>
              <select id="filiere" name="filiere">
                <option value="EFS">EFS</option>
                <option value="G1">G1</option>
                <option value="G2">G2</option>
                <option value="F3">F3</option>
                <option value="F4">F4</option>
                <option value="HR">HR</option>
                <option value="IMI">IMI</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label for="matricule">Numéro matricule</label>
            <input type="text" id="matricule" name="matricule" placeholder="000000000000" maxlength="12" minlength="12" required>
          </div>

          <div class="field">
            <label for="image">Photo d'identité</label>
            <input type="file" id="image" accept="image/*" name="image" required>
          </div>

          <input type="submit" name="Générer" value="Générer la carte">
        </form>
      </div>
    </div>
  </section>

  <footer>
    <p>StudentCardPro, Copyright &copy; 2024</p>
  </footer>
</body>
</html>
