<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../vendor/autoload.php';

//chargé le .env
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
$dotenv->load();



// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Gestion requête OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Récupération de l'URI et de la méthode HTTP
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts  = explode('/', trim($uri, '/'));
$method = $_SERVER['REQUEST_METHOD'];
// Support _method pour simuler PUT/PATCH avec form-data
if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}


// Structure attendue : /api/{ressource}/{action}
// Exemple : /api/auth/register
$ressource = $parts[1] ?? null; // auth
$action    = $parts[2] ?? null; // register

// Route de test (optionnelle mais très pratique)
if ($ressource === 'test' || $uri === '/api/' || $uri === '/api') {
    echo json_encode([
        'status' => 'success',
        'message' => 'API Backend Vite & Gourmand opérationnelle',
        'version' => '1.0.0',
        'timestamp' => date('Y-m-d H:i:s'),
        'routes_disponibles' => [
            'POST /api/auth/register'                           => 'Inscription utilisateur',
            'POST /api/auth/login'                              => 'Connexion utilisateur',
            'PUT /api/auth/user?id={id}'                        => 'Modification profil utilisateur',
            'PUT /api/auth/password?id={id}'                    => 'Initialisation mot de passe',
            'POST /api/auth/forgot-password'                    => 'Demande réinitialisation mot de passe',
            'POST /api/auth/reset-password'                     => 'Initialisation mot de passe oublié',              
            'GET /api/menu/list'                                => 'Liste des menus',
            'GET /api/menu/detail?id={id}'                      => 'Détail d\'un menu',
            'POST /api/menu/create'                             => 'Créer un menu',
            'PUT /api/menu/update?id={id}'                      => 'Modifier un menu',
            'PATCH /api/menu/toggle?id={id}'                    => 'Activer/désactiver un menu',
            'DELETE /api/menu/delete?id={id}'                   => 'Supprimer un menu',
            'POST /api/commande/create-commande'                => 'Commander un menu',
            'PUT /api/commande/update-commande?id={id}'         => 'Modifier une commande',
            'GET /api/commande/detail-commande?id={id}'         => 'Détail d\'une commande',
            'GET /api/commande/affiche'                         => 'Afficher toutes les commandes',
            'GET /api/commande/user-commande?id={user_id}'      => 'Commandes d\'un utilisateur',
            'PUT /api/commande/change-statut?id={id}'           => 'Changer statut commande',
            'DELETE /api/commande/delete-commande?id={id}'      => 'Supprimer une commande',
            'PUT /api/commande/annule-commande?id={id}'         => 'Annuler une commande',
            'GET /api/commande/historique?id={id}'              => 'Historique statuts commande',
            'POST /api/avis/create'                             => 'Créer un avis',
            'GET /api/avis/user?id_user={id}'                   => 'Avis d\'un utilisateur',
            'GET /api/avis/approuves'                           => 'Avis approuvés (public)',
            'GET /api/avis/list'                                => 'Tous les avis (admin)',
            'PUT /api/avis/moderer?id={id}'                     => 'Modérer un avis (employé et admin)',
            'POST /api/admin/create-employe'                    => 'créer un compte employé',
            'PATCH /api/admin/toggle-user'                    => 'Activer ou désactiver un utilisateur'
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

            // NOUVELLE ROUTE : LOGIN
            case 'login':
                if ($method === 'POST') {
                    // Vérification que la méthode login existe
                    if (method_exists($controller, 'login')) {
                        $controller->login();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error' => 'Méthode non implémentée',
                            'details' => 'La méthode login() n\'existe pas dans AuthController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error' => 'Méthode HTTP non autorisée',
                        'details' => 'Utilisez POST pour /api/auth/login',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            // Nouvelle route:  user
            case 'user':
                if ($method === 'PUT') {
                    // Vérification que la méthode login existe
                    if (method_exists($controller, 'updateUser')) {
                        $controller->updateUser();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error' => 'Méthode non implémentée',
                            'details' => 'La méthode updateUser() n\'existe pas dans AuthController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error' => 'Méthode HTTP non autorisée',
                        'details' => 'Utilisez PUT pour /api/auth/user?id={id}',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            //Nouvelle route:passeword
            case 'password':
                if ($method === 'PUT') {
                    // Vérification que la méthode login existe
                    if (method_exists($controller, 'updatePassword')) {
                        $controller->updatePassword();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error' => 'Méthode non implémentée',
                            'details' => 'La méthode updatePassword() n\'existe pas dans AuthController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error' => 'Méthode HTTP non autorisée',
                        'details' => 'Utilisez PUT pour /api/auth/password?id={id}',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            // Nouvelle route : forgot-password
            case 'forgot-password':
                if ($method === 'POST') {
                    if (method_exists($controller, 'forgotPassword')) {
                        $controller->forgotPassword();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error' => 'Méthode non implémentée',
                            'details' => 'La méthode forgotPassword() n\'existe pas dans AuthController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error' => 'Méthode HTTP non autorisée',
                        'details' => 'Utilisez POST pour /api/auth/forgot-password',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            // Nouvelle route : reset-password
            case 'reset-password':
                if ($method === 'POST') {
                    if (method_exists($controller, 'resetPassword')) {
                        $controller->resetPassword();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error' => 'Méthode non implémentée',
                            'details' => 'La méthode resetPassword() n\'existe pas dans AuthController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error' => 'Méthode HTTP non autorisée',
                        'details' => 'Utilisez POST pour /api/auth/reset-password',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            default:
                http_response_code(404);
                echo json_encode([
                    'error' => 'Action non trouvée',
                    'details' => "L'action '$action' n'existe pas pour auth",
                    'actions_disponibles' => ['register', 'login','user','password','forgot-password','reset-password']
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'menu':
        $controllerPath = __DIR__ . '/../controllers/MenuController.php';

        if (!file_exists($controllerPath)) {
            http_response_code(501);
            echo json_encode([
                'error'   => 'Controller non trouvé',
                'details' => 'MenuController.php manquant dans Backend/controllers/'
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit();
        }

        require_once $controllerPath;
        $controller = new MenuController();

        switch ($action) {

            case 'list':
                if ($method === 'GET') {
                    if (method_exists($controller, 'list')) {
                        $controller->list();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode list() n\'existe pas dans MenuController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'          => 'Méthode HTTP non autorisée',
                        'details'        => 'Utilisez GET pour /api/menu/list',
                        'methode_recue'  => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'detail':
                if ($method === 'GET') {
                    if (method_exists($controller, 'detail')) {
                        $controller->detail();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode detail() n\'existe pas dans MenuController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez GET pour /api/menu/detail?id={id}',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'create':
                if ($method === 'POST') {
                    if (method_exists($controller, 'create')) {
                        $controller->create();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode create() n\'existe pas dans MenuController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez POST pour /api/menu/create',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'update':
                if ($method === 'PUT') {
                    if (method_exists($controller, 'update')) {
                        $controller->update();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode update() n\'existe pas dans MenuController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez PUT pour /api/menu/update?id={id}',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'toggle':
                if ($method === 'PATCH') {
                    if (method_exists($controller, 'toggle')) {
                        $controller->toggle();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode toggle() n\'existe pas dans MenuController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez PATCH pour /api/menu/toggle?id={id}',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'delete':
                if ($method === 'DELETE') {
                    if (method_exists($controller, 'delete')) {
                        $controller->delete();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode delete() n\'existe pas dans MenuController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez DELETE pour /api/menu/delete?id={id}',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            default:
                http_response_code(404);
                echo json_encode([
                    'error'               => 'Action non trouvée',
                    'details'             => "L'action '$action' n'existe pas pour menu",
                    'actions_disponibles' => ['list', 'detail', 'create', 'update', 'toggle', 'delete']
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'commande':
        $controllerPath = __DIR__ . '/../controllers/CommandeController.php';

        if (!file_exists($controllerPath)) {
            http_response_code(501);
            echo json_encode([
                'error'   => 'Controller non trouvé',
                'details' => 'CommandeController.php manquant dans Backend/controllers/'
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit();
        }

        require_once $controllerPath;
        $controller = new CommandeController();

        switch ($action) {

            case 'affiche':
                if ($method === 'GET') {
                    if (method_exists($controller, 'afficheCommande')) {
                        $controller->afficheCommande();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode afficheCommande() n\'existe pas dans MenuController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'          => 'Méthode HTTP non autorisée',
                        'details'        => 'Utilisez GET pour /api/commande/affiche',
                        'methode_recue'  => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'detail-commande':
                if ($method === 'GET') {
                    if (method_exists($controller, 'detailCommande')) {
                        $controller->detailCommande();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode detailCommande() n\'existe pas dans MenuController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez GET pour /api/commande/detail-commande?id={id}',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'create-commande':
                if ($method === 'POST') {
                    if (method_exists($controller, 'createCommande')) {
                        $controller->createCommande();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode createCommande() n\'existe pas dans MenuController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez POST pour /api/commande/create-commande',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'update-commande':
                if ($method === 'PUT') {
                    if (method_exists($controller, 'updateCommande')) {
                        $controller->updateCommande();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode updateCommande() n\'existe pas dans CommandeController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez PUT pour /api/commande/update-commande?id={id}',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;


            case 'user-commande':
                if ($method === 'GET') {
                    if (method_exists($controller, 'getByUser')) {
                        $controller->getByUser();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode getByUser() n\'existe pas dans CommandeController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez GET pour /api/commande/user-commande?id={user_id}',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'change-statut':
                if ($method === 'PUT') {
                    if (method_exists($controller, 'changerStatutCommande')) {
                        $controller->changerStatutCommande();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode changerStatutCommande() n\'existe pas dans CommandeController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez PUT pour /api/commande/change-statut?id={id}',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'delete-commande':
                if ($method === 'DELETE') {
                    if (method_exists($controller, 'deleteCommande')) {
                        $controller->deleteCommande();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode deleteCommande() n\'existe pas dans CommandeController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez DELETE pour /api/commande/delete-commande?id={id}',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'annule-commande':
                if ($method === 'PUT') {
                    if (method_exists($controller, 'annulerCommande')) {
                        $controller->annulerCommande();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode annulerCommande() n\'existe pas dans CommandeController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez PUT pour /api/commande/annule-commande?id={id}',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'historique':
                if ($method === 'GET') {
                    if (method_exists($controller, 'historiqueCommande')) {
                        $controller->historiqueCommande();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode historiqueCommande() n\'existe pas dans CommandeController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez GET pour /api/commande/historique?id={id}',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;    

            default:
                http_response_code(404);
                echo json_encode([
                    'error'               => 'Action non trouvée',
                    'details'             => "L'action '$action' n'existe pas pour commande",
                    'actions_disponibles' => ['affiche', 'detail-commande', 'user-commande', 'create-commande', 'update-commande', 'change-statut', 'delete-commande', 'annule-commande', 'historique']
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'avis':
        $controllerPath = __DIR__ . '/../controllers/AvisController.php';

        if (!file_exists($controllerPath)) {
            http_response_code(501);
            echo json_encode([
                'error'   => 'Controller non trouvé',
                'details' => 'AvisController.php manquant dans Backend/controllers/'
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit();
        }

        require_once $controllerPath;
        $controller = new AvisController();

        switch ($action) {

            case 'create':
                if ($method === 'POST') {
                    if (method_exists($controller, 'creerAvis')) {
                        $controller->creerAvis();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode creerAvis() n\'existe pas dans AvisController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez POST pour /api/avis/create',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'user':
                if ($method === 'GET') {
                    if (method_exists($controller, 'getAvisByUser')) {
                        $controller->getAvisByUser();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode getAvisByUser() n\'existe pas dans AvisController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez GET pour /api/avis/user?id_user={id}',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'approuves':
                if ($method === 'GET') {
                    if (method_exists($controller, 'getAvisApprouves')) {
                        $controller->getAvisApprouves();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode getAvisApprouves() n\'existe pas dans AvisController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez GET pour /api/avis/approuves',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'list':
                if ($method === 'GET') {
                    if (method_exists($controller, 'getAllAvis')) {
                        $controller->getAllAvis();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode getAllAvis() n\'existe pas dans AvisController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez GET pour /api/avis/list',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'moderer':
                if ($method === 'PUT') {
                    if (method_exists($controller, 'modererAvis')) {
                        $id = $_GET['id'] ?? null;
                        if ($id) {
                            $controller->modererAvis($id);
                        } else {
                            http_response_code(400);
                            echo json_encode([
                                'error'   => 'Paramètre manquant',
                                'details' => 'id requis dans l\'URL : /api/avis/moderer?id={id}'
                            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                        }
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode modererAvis() n\'existe pas dans AvisController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez PUT pour /api/avis/moderer?id={id}',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            default:
                http_response_code(404);
                echo json_encode([
                    'error'               => 'Action non trouvée',
                    'details'             => "L'action '$action' n'existe pas pour avis",
                    'actions_disponibles' => ['create', 'user', 'approuves', 'list', 'moderer']
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'admin':
        require_once __DIR__ . '/../middleware/AuthMiddleware.php';
        $middleware = new AuthMiddleware();
        $middleware->handle();
        
        $controllerPath = __DIR__ . '/../controllers/AuthController.php';

        if (!file_exists($controllerPath)) {
            http_response_code(501);
            echo json_encode([
                'error'   => 'Controller non trouvé',
                'details' => 'AuthController.php manquant dans Backend/controllers/'
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit();
        }

        require_once $controllerPath;
        $controller = new AuthController();

        switch ($action) {

            case 'create-employe':
                if ($method === 'POST') {
                    if (method_exists($controller, 'createEmploye')) {
                        $controller->createEmploye();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode createEmploye() n\'existe pas dans AuthController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez POST pour /api/admin/create-employe',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'toggle-user':
                if ($method === 'PATCH') {
                    if (method_exists($controller, 'toggleUserStatus')) {
                        $controller->toggleUserStatus();
                    } else {
                        http_response_code(501);
                        echo json_encode([
                            'error'   => 'Méthode non implémentée',
                            'details' => 'La méthode toggleUserStatus() n\'existe pas dans AuthController'
                        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    http_response_code(405);
                    echo json_encode([
                        'error'         => 'Méthode HTTP non autorisée',
                        'details'       => 'Utilisez GET pour /api/admin/toggle-user',
                        'methode_recue' => $method
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                }
                break;

            default:
                http_response_code(404);
                echo json_encode([
                    'error'               => 'Action non trouvée',
                    'details'             => "L'action '$action' n'existe pas pour admin",
                    'actions_disponibles' => ['create-employe', 'toggle-user']
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode([
            'error' => 'Ressource non trouvée',
            'uri' => $uri,
            'ressource_demandee' => $ressource,
            'ressources_disponibles' => ['auth','menu', 'commande', 'avis', 'admin']
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
