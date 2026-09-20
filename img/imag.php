

<form action="upload.php" method="post" enctype="multipart/form-data">
    <input type="file" name="image" required>
    <input type="submit" value="Upload">
</form>

<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Vérifier si un fichier a été téléchargé
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/';
        $uploadFile = $uploadDir . basename($_FILES['image']['name']);
        
        // Déplacer le fichier téléchargé
        if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadFile)) {
            // Connexion à la base de données
            $pdo = new PDO('mysql:host=localhost;dbname=votre_base', 'utilisateur', 'motdepasse');

$stmt = $pdo->prepare("INSERT INTO images (image_path) VALUES (:image_path)");
$stmt->bindParam(':image_path', $uploadFile);

// Exécuter la requête
if ($stmt->execute()) {
    echo "L'image a été téléchargée avec succès.";
} else {
    echo "Erreur lors de l'enregistrement dans la base de données.";
}
} else {
echo "Erreur lors du téléchargement de l'image.";
}
} else {
echo "Aucun fichier ou erreur dans le téléchargement.";
}
}
?>
```

### Code SQL pour la Table

Voici le code SQL pour créer la table `images` dans votre base de données :

```sql
CREATE TABLE images (
id INT AUTO_INCREMENT PRIMARY KEY,
image_path VARCHAR(255) NOT NULL
);
