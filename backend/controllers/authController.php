<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../mail/WelcomeMail.php';
require_once __DIR__ . '/../config/database.php';

class AuthController
{
    private User $userModel;
    
    // Configuration du rate limiting
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const RATE_LIMIT_WINDOW = 900; // 15 minutes en secondes

    public function __construct()
    {
        $this->userModel = new User();
        $pdo = Database::getInstance();
    }

    /**
     * Inscription d'un utilisateur
     */
    public function register(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            $this->sendJson(['success' => false, 'message' => 'Données invalides.'], 400);
            return;
        }

        $errors = $this->validateRegister($data);

        if (!empty($errors)) {
            $this->sendJson([
                'success' => false,
                'message' => 'Erreur de validation.',
                'errors'  => $errors,
            ], 422);
            return;
        }

        if ($this->userModel->emailExists($data['email'])) {
            $this->sendJson([
                'success' => false,
                'message' => 'Cet email est déjà utilisé.',
                'errors'  => ['email' => 'Cet email est déjà utilisé.'],
            ], 409);
            return;
        }

        try {
            $userId = $this->userModel->inscriptionUtilisateur($data);

            if (!$userId) {
                $this->sendJson([
                    'success' => false,
                    'message' => 'Erreur lors de la création du compte.',
                ], 500);
                return;
            }

            // Envoi du mail de bienvenue
            WelcomeMail::send($data['email'], $data['prenom'], $data['nom']);

            $this->sendJson([
                'success' => true,
                'message' => 'Compte créé avec succès. Un email de bienvenue vous a été envoyé.',
            ], 201);
            
        } catch (\Exception $e) {
            error_log("[REGISTER ERROR] " . $e->getMessage());
            $this->sendJson([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'inscription.',
            ], 500);
        }
    }

    /**
     * Connexion d'un utilisateur avec rate limiting
     */
    public function login(): void
    {
        $data = json_decode(file_get_contents("php://input"), true);

        // On vérifie la saisie du mail et du mot de passe
        if (empty($data['email']) || empty($data['password'])) {
            $this->sendJson([
                'success' => false,
                'message' => 'Email et mot de passe requis'
            ], 400);
            return;
        }

        // On vérifie le format du mail
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $this->sendJson([
                'success' => false,
                'message' => 'Format d\'email invalide'
            ], 400);
            return;
        }

        // Nombre de tentatives pour se connecter : 5 tentatives
        if (!$this->checkRateLimit($data['email'])) {
            $this->sendJson([
                'success' => false,
                'message' => 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
            ], 429);
            return;
        }

        try {
            $user = $this->userModel->getUserByEmail($data['email']);

            //utilisateur trouvé?
            if (!$user) {
                $this->logFailedLogin($data['email'], 'User not found');
                $this->sendJson([
                    'success' => false,
                    'message' => 'Email ou mot de passe incorrect'
                ], 401);
                return;
            }

            // Compte actif?
            if (!$user['is_actif']) {
                $this->logFailedLogin($data['email'], 'Account disabled');
                $this->sendJson([
                    'success' => false,
                    'message' => 'Votre compte a été désactivé. Contactez un administrateur.'
                ], 403);
                return;
            }

            // Mot de passe correspond?
            if (!password_verify($data['password'], $user['password'])) {
                $this->logFailedLogin($data['email'], 'Wrong password');
                $this->sendJson([
                    'success' => false,
                    'message' => 'Email ou mot de passe incorrect'
                ], 401);
                return;
            }

            // RESET DU RATE LIMIT EN CAS DE SUCCÈS
            $this->resetRateLimit($data['email']);

            // LOG DE CONNEXION RÉUSSIE
            $this->logSuccessfulLogin($data['email']);

            // PROTECTION XSS SUR LES DONNÉES UTILISATEUR
            $userData = [
                'id' => (int)$user['id'],
                'nom' => htmlspecialchars($user['nom'], ENT_QUOTES, 'UTF-8'),
                'prenom' => htmlspecialchars($user['prenom'], ENT_QUOTES, 'UTF-8'),
                'email' => htmlspecialchars($user['email'], ENT_QUOTES, 'UTF-8'),
                'gsm' => htmlspecialchars($user['gsm'], ENT_QUOTES, 'UTF-8'),
                'adresse' => htmlspecialchars($user['adresse'], ENT_QUOTES, 'UTF-8'),
                'code_postal' => htmlspecialchars($user['code_postal'], ENT_QUOTES, 'UTF-8'),
                'ville' => htmlspecialchars($user['ville'], ENT_QUOTES, 'UTF-8'),
                'role' => htmlspecialchars($user['role'], ENT_QUOTES, 'UTF-8'),
                'created_at' => $user['created_at']
            ];

            $this->sendJson([
                'success' => true,
                'message' => 'Connexion réussie',
                'user' => $userData
            ], 200);

        } catch (\Exception $e) {
            error_log("[LOGIN ERROR] " . $e->getMessage());
            $this->sendJson([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la connexion'
            ], 500);
        }
    }

    /**
     * RATE LIMITING - Vérifier le nombre de tentatives
     */
    private function checkRateLimit(string $email): bool
    {
        $cacheFile = sys_get_temp_dir() . '/login_attempts_' . md5($email);
        
        if (file_exists($cacheFile)) {
            $attempts = json_decode(file_get_contents($cacheFile), true);
            
            // Si max tentatives atteint dans la fenêtre de temps
            if ($attempts['count'] >= self::MAX_LOGIN_ATTEMPTS && 
                (time() - $attempts['first_attempt']) < self::RATE_LIMIT_WINDOW) {
                return false; // Bloqué
            }
            
            // Reset si la fenêtre de temps est dépassée
            if ((time() - $attempts['first_attempt']) > self::RATE_LIMIT_WINDOW) {
                unlink($cacheFile);
                return true;
            }
            
            // Incrémenter le compteur
            $attempts['count']++;
            $attempts['last_attempt'] = time();
            file_put_contents($cacheFile, json_encode($attempts));
        } else {
            // Première tentative
            file_put_contents($cacheFile, json_encode([
                'count' => 1,
                'first_attempt' => time(),
                'last_attempt' => time()
            ]));
        }
        
        return true;
    }

    /**
     * RATE LIMITING - Reset après connexion réussie
     */
    private function resetRateLimit(string $email): void
    {
        $cacheFile = sys_get_temp_dir() . '/login_attempts_' . md5($email);
        if (file_exists($cacheFile)) {
            unlink($cacheFile);
        }
    }

    /**
     * LOG DES TENTATIVES DE CONNEXION ÉCHOUÉES
     */
    private function logFailedLogin(string $email, string $reason): void
    {
        error_log(sprintf(
            "[FAILED LOGIN] Email: %s | Reason: %s | IP: %s | Date: %s",
            $email,
            $reason,
            $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
            date('Y-m-d H:i:s')
        ));
    }

    /**
     * LOG DES CONNEXIONS RÉUSSIES
     */
    private function logSuccessfulLogin(string $email): void
    {
        error_log(sprintf(
            "[SUCCESSFUL LOGIN] Email: %s | IP: %s | Date: %s",
            $email,
            $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
            date('Y-m-d H:i:s')
        ));
    }

    /**
     * Validation des données d'inscription
     */
    private function validateRegister(array $data): array
    {
        $errors = [];

        if (empty(trim($data['nom'] ?? ''))) {
            $errors['nom'] = 'Le nom est requis.';
        }

        if (empty(trim($data['prenom'] ?? ''))) {
            $errors['prenom'] = 'Le prénom est requis.';
        }

        if (empty(trim($data['email'] ?? ''))) {
            $errors['email'] = 'L\'email est requis.';
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'L\'email est invalide.';
        }

        if (empty(trim($data['gsm'] ?? ''))) {
            $errors['gsm'] = 'Le numéro de téléphone est requis.';
        } elseif (!preg_match('/^(\+?\d{10,15})$/', preg_replace('/\s/', '', $data['gsm']))) {
            $errors['gsm'] = 'Le numéro de téléphone est invalide.';
        }

        if (empty(trim($data['adresse'] ?? ''))) {
            $errors['adresse'] = 'L\'adresse est requise.';
        }

        if (empty(trim($data['code_postal'] ?? ''))) {
            $errors['code_postal'] = 'Le code postal est requis.';
        }

        if (empty(trim($data['ville'] ?? ''))) {
            $errors['ville'] = 'La ville est requise.';
        }

        $password = $data['password'] ?? '';

        if (empty($password)) {
            $errors['password'] = 'Le mot de passe est requis.';
        } elseif (strlen($password) < 10) {
            $errors['password'] = 'Le mot de passe doit contenir au minimum 10 caractères.';
        } elseif (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/', $password)) {
            $errors['password'] = 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.';
        }

        if (empty($data['confirm_password'] ?? '')) {
            $errors['confirm_password'] = 'La confirmation du mot de passe est requise.';
        } elseif ($data['password'] !== $data['confirm_password']) {
            $errors['confirm_password'] = 'Les mots de passe ne correspondent pas.';
        }

        return $errors;
    }

    /**
     * Envoi de réponse JSON
     */
    private function sendJson(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
