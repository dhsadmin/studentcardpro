<?php
include("configurer.php");

// Vérification de la connexion à la base de données
if ($conn->connect_error) {
    die("Connexion échouée: " . $conn->connect_error);
}

// Récupération de l'ID de l'utilisateur depuis l'URL
$userId = isset($_GET['id']) ? intval($_GET['id']) : 0;

// Requête SQL pour récupérer les données d'un utilisateur spécifique
$sql = "SELECT nom, prenom, classe, filiere, date_naiss, lieu_naiss, sexe, telephone, matricule, image_path FROM users WHERE id = ?";

// Préparation de la requête
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $userId); // "i" pour integer
$stmt->execute();
$result = $stmt->get_result();

$carte = null;

// Vérification si des résultats ont été trouvés
if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();

    // Formatage de la date de naissance
    $date_naiss = DateTime::createFromFormat('Y-m-d', $row['date_naiss']);
    $row['date_naiss'] = $date_naiss ? $date_naiss->format('d/m/Y') : 'Date invalide';

    $carte = $row;
}

// Fermeture de la connexion
$stmt->close();
$conn->close();
?>
<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>StudentCardPro | Ma carte</title>
    <link rel="stylesheet" href="./css/style.css">
    <link rel="stylesheet" href="./css/carte.css">
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
                  <!--  <li><a href="publipostage.php">Publipostage</a></li>-->
                </ul>
            </nav>
        </div>
    </header>

    <section class="carte-page">
        <div class="container">
<?php if ($carte): ?>
            <p class="intro">
                Cher(e) <b><?php echo htmlspecialchars($carte['prenom']) . ' ' . htmlspecialchars($carte['nom']); ?></b>,
                ci-jointe la version numérique de votre carte scolaire.
            </p>

            <div class="carte-faces">
                <figure class="carte-face">
                    <div class="carte-slot" id="slot-recto"></div>
                    <figcaption>Recto</figcaption>
                </figure>
                <figure class="carte-face">
                    <div class="carte-slot" id="slot-verso"></div>
                    <figcaption>Verso</figcaption>
                </figure>
            </div>

            <div class="carte-actions">
                <button type="button" class="btn" id="btn-pdf">Télécharger la carte (PDF)</button>
                <a class="btn-outline" href="services.php">Enrôler un autre apprenant</a>
            </div>
            <p class="carte-status" id="pdf-status" role="status" aria-live="polite"></p>
<?php else: ?>
            <div class="carte-empty">
                <p class="intro">Utilisateur introuvable.</p>
                <a class="btn-outline" href="services.php">Retour au formulaire</a>
            </div>
<?php endif; ?>
        </div>
    </section>

    <footer>
        <p>StudentCardPro, Copyright &copy; 2024</p>
    </footer>

<?php if ($carte): ?>
    <script src="js/carte.js"></script>
    <script>
        (function () {
            // Données de l'apprenant issues de la base (échappées pour être insérées dans le script)
            var carte = <?php echo json_encode($carte, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE); ?>;

            CartePro.preview(document.getElementById('slot-recto'), 'recto', carte);
            CartePro.preview(document.getElementById('slot-verso'), 'verso', carte);

            var btn = document.getElementById('btn-pdf');
            var status = document.getElementById('pdf-status');

            btn.addEventListener('click', function () {
                btn.disabled = true;
                status.className = 'carte-status';
                status.textContent = 'Préparation du PDF…';
                CartePro.exportPDF([carte], { mode: 'cr80', filename: CartePro.fileName(carte) })
                    .then(function () {
                        status.textContent = 'Carte téléchargée (recto et verso, format 85,6 × 54 mm).';
                    })
                    .catch(function (e) {
                        status.className = 'carte-status error';
                        status.textContent = 'Le PDF n’a pas pu être généré : ' + (e && e.message ? e.message : 'erreur inconnue') + '. Réessayez.';
                    })
                    .then(function () { btn.disabled = false; });
            });
        })();
    </script>
<?php endif; ?>
</body>

</html>
