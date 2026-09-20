<?php
session_start();
if (!isset($_SESSION['nom'])) {
    header("Location: connexion.php");
    exit;
}
include("configurer.php");

// Lecture seule : on tire les enrôlements de la table `users`, sans rien modifier.
$apprenants = [];
$erreur = null;
try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $pdo->query("SELECT id, nom, prenom, classe, filiere, date_naiss, lieu_naiss, sexe, telephone, matricule, image_path FROM users ORDER BY classe, filiere, nom, prenom");
    $apprenants = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    $erreur = "La liste des apprenants n'a pas pu être lue dans la base de données.";
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>StudentCardPro | Publipostage</title>
  <link rel="stylesheet" href="./css/style.css">
  <link rel="stylesheet" href="./css/carte.css">
  <link rel="stylesheet" href="./css/publipostage.css">
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
          <li><a href="services.php">Services</a></li>
          <li class="current"><a href="publipostage.php">Publipostage</a></li>
          <li><a href="about.html">À propos</a></li>
        </ul>
      </nav>
    </div>
    <div class="container session-bar">
      <span>Connecté en tant que <b><?php echo htmlspecialchars($_SESSION['nom']); ?></b></span>
      <a href="deconnexion.php">Se déconnecter</a>
    </div>
  </header>

  <section class="pub-page">
    <div class="container pub-wide">
      <h1 class="page-title">Publipostage des cartes</h1>
      <p class="subtitle">Choisissez les apprenants, vérifiez l'aperçu, puis téléchargez leurs cartes en PDF.</p>

<?php if ($erreur): ?>
      <div class="notice"><?php echo htmlspecialchars($erreur); ?></div>
<?php elseif (count($apprenants) === 0): ?>
      <div class="notice">
        Aucun apprenant n'est encore enregistré. <a href="services.php">Enrôlez un premier apprenant</a> pour générer sa carte.
      </div>
<?php else: ?>
      <div class="pub-grid">

        <div class="pub-panel pub-list">
          <div class="pub-filters">
            <div class="pub-filter pub-filter-q">
              <label for="f-q">Rechercher</label>
              <input type="search" id="f-q" placeholder="Nom, prénom ou matricule" autocomplete="off">
            </div>
            <div class="pub-filter">
              <label for="f-classe">Classe</label>
              <select id="f-classe"><option value="">Toutes</option></select>
            </div>
            <div class="pub-filter">
              <label for="f-filiere">Spécialité</label>
              <select id="f-filiere"><option value="">Toutes</option></select>
            </div>
          </div>

          <div class="pub-bar">
            <label class="pub-check"><input type="checkbox" id="chk-all"> Tout sélectionner dans la liste affichée</label>
            <span id="pub-count" role="status" aria-live="polite"></span>
          </div>

          <div class="pub-table-wrap">
            <table class="pub-table">
              <thead>
                <tr>
                  <th scope="col" class="c-check"><span class="sr-only">Sélection</span></th>
                  <th scope="col" class="c-photo"><span class="sr-only">Photo</span></th>
                  <th scope="col">Nom et prénom(s)</th>
                  <th scope="col">Classe</th>
                  <th scope="col">Matricule</th>
                </tr>
              </thead>
              <tbody id="pub-rows"></tbody>
            </table>
            <p class="pub-none" id="pub-none" hidden>Aucun apprenant ne correspond à ces critères.</p>
          </div>
        </div>

        <aside class="pub-panel pub-side" aria-label="Aperçu et export">
          <div class="pub-side-head">
            <h2>Aperçu</h2>
            <div class="pub-seg" role="group" aria-label="Face de la carte" data-group="face">
              <button type="button" data-value="recto" aria-pressed="true">Recto</button>
              <button type="button" data-value="verso" aria-pressed="false">Verso</button>
            </div>
          </div>

          <div class="pub-seg pub-seg-mode" role="group" aria-label="Type d'aperçu" data-group="mode">
            <button type="button" data-value="resultat" aria-pressed="true">Résultat</button>
            <button type="button" data-value="champs" aria-pressed="false">Champs de fusion</button>
          </div>

          <div class="carte-slot" id="pv-card"></div>

          <div class="pub-nav">
            <button type="button" class="btn-sm" id="pv-prev">Précédent</button>
            <span id="pv-pos"></span>
            <button type="button" class="btn-sm" id="pv-next">Suivant</button>
          </div>

          <fieldset class="pub-format">
            <legend>Mise en page du PDF</legend>
            <label><input type="radio" name="format" value="cr80" checked>
              <span><b>Une carte par page</b> — 85,6 × 54 mm, recto puis verso</span></label>
            <label><input type="radio" name="format" value="a4">
              <span><b>Planche A4</b> — 10 cartes par feuille, verso en miroir pour l'impression recto-verso</span></label>
          </fieldset>

          <button type="button" class="btn pub-export" id="btn-export" disabled>Télécharger le PDF</button>
          <progress id="pub-progress" max="1" value="0" hidden></progress>
          <p class="carte-status" id="pub-status" role="status" aria-live="polite"></p>
        </aside>

      </div>
<?php endif; ?>
    </div>
  </section>

  <footer>
    <p>StudentCardPro, Copyright &copy; 2024</p>
  </footer>

<?php if (!$erreur && count($apprenants) > 0): ?>
  <script>
    // Enregistrements issus de la base (échappés pour être insérés dans le script)
    window.PUBLIPOSTAGE = <?php echo json_encode($apprenants, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE); ?>;
  </script>
  <script src="js/carte.js"></script>
  <script src="js/publipostage.js"></script>
<?php endif; ?>
</body>
</html>
