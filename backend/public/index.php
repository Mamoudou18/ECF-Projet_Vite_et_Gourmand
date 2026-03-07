<?php

require_once __DIR__ . '/../config/database.php';

// Headers CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Gestion requête OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Récupération de l'URI et de la méthode HTTP
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts  = explode('/', trim($uri, '/'));
$method = $_SERVER['REQUEST_METHOD'];

// Structure attendue : /api/{ressource}/{action}
// Exemple : /api/auth/register
$ressource = $parts[1] ?? null; // auth
$action    = $parts[2] ?? null; // register

// Route de test (optionnelle mais très pratique)
if ($ressource === 'test' || $uri === '/api/' || $uri === '/api') {
    echo json_encode([
        'status' => 'success',
        'message' => 'API Backend Vite & Gourmand opérationnelle ',
        'version' => '1.0.0',
        'timestamp' => date('Y-m-d H:i:s'),
        'routes_disponibles' => [
            'POST /api/auth/register' => 'Inscription utilisateur'
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit();
}

// Routage
switch ($ressource) {

    case 'auth':
        // Vérification que le controller existe
        $controllerPath = __DIR__ . '/../controllers/AuthController.php';
        
        if (!file_exists($controllerPath)) {
            http_response_code(501);
            echo json_encode([
                'error' => 'Controller non trouvé',
                'details' => 'AuthController.php manquant dans Backend/controllers/'
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit();
        }

        require_once $controllerPath;
        $controller = new AuthController();

        switch ($action) {
            case 'register':
                if ($method === 'POST') {
                    // Vérification que la méthode register existe
                    if (method_exists($controller, 'register')) {
                        $controller->register();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error' => 'Méthode non implémentée',
                            'details' => 'La méthode register() n\'existe pas dans AuthController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error' => 'Méthode HTTP non autorisée',
                        'details' => 'Utilisez POST pour /api/auth/register',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            default:
                http_response_code(404);
                echo json_encode([
                    'error' => 'Action non trouvée',
                    'details' => "L'action '$action' n'existe pas pour auth",
                    'actions_disponibles' => ['register']
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode([
            'error' => 'Ressource non trouvée',
            'uri' => $uri,
            'ressource_demandee' => $ressource,
            'ressources_disponibles' => ['auth']
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
