<?php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$extension = pathinfo($uri, PATHINFO_EXTENSION);

// Liste des extensions de fichiers statiques
$static = ['css', 'js', 'jpg', 'png', 'gif', 'svg', 'woff', 'ico'];

// Laisser passer les routes /api/*
if (strpos($uri, '/api/') === 0) {
    return false; // Laisse le serveur PHP gérer normalement
}

// Si c'est un fichier statique, le servir normalement
if (in_array($extension, $static)) {
    return false;
}

// Si le fichier existe, le servir
if (is_file(__DIR__ . $uri)) {
    return false;
}

// Sinon, renvoyer index.html (Router.js prend le relais)
readfile(__DIR__ . '/index.html');
?>
