<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../mails/WelcomeMail.php';
require_once __DIR__ . '/../mails/AccountCreateMail.php';
require_once __DIR__ . '/../mails/ResetPasswordMail.php';
require_once __DIR__ . '/../utils/ValidationService.php';
require_once __DIR__ . '/../utils/ResponseService.php';
require_once __DIR__ . '/../utils/RateLimitService.php';
require_once __DIR__ . '/../utils/LogService.php';


class AuthController
{
    private User $userModel;
    private ValidationService $validator;
    private ResponseService $response;
    private RateLimitService $rateLimit;
    private LogService $logger;
    

    public function __construct()
    {
        $this->userModel = new User();

        $this->validator = new ValidationService();
        $this->response  = new ResponseService();
        $this->rateLimit = new RateLimitService();
        $this->logger    = new LogService();
    }

    /**
     * Inscription d'un utilisateur
     */
    public function register(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if(!is_array($data) || empty($data)) {
            $this->response->error('Données invalides.', 400);
            return;
        }

        $errors = $this->validator->validateRegister($data);

        if (!empty($errors)) {
            $this->response->error('Erreur de validation.', 422, $errors);
            return;
        }

        if ($this->userModel->emailExists($data['email'])) {
            $this->response->error('Cet email est déjà utilisé.', 409);
            return;
        }

        try {
            $userId = $this->userModel->inscriptionUtilisateur($data);

            if (!$userId) {
                $this->response->error('Erreur lors de la création du compte.', 500);
                return;
            }
            $mailResult = WelcomeMail::send($data['email'], $data['prenom'], $data['nom']);

            $this->response->success([
                'message' => 'Compte créé avec succès. Un email de bienvenue vous a été envoyé.',
                'mail_debug' => $mailResult
            ], 201);

        } catch (\Exception $e) {
            $this->logger->error($e->getMessage());
            $this->response->error('Une erreur est survenue lors de l\'inscription.', 500);
        }
    }


    /**
     * Connexion d'un utilisateur avec rate limiting
     */
    public function login(): void
    {
        $data = json_decode(file_get_contents("php://input"), true);

        if(!is_array($data) || empty($data)) {
            $this->response->error('Données invalides.', 400);
            return;
        }

        //validation
        $errors = $this->validator->validateLogin($data);
        if(!empty($errors)){
            $this->response->error($errors[0], 400);
            return;
        }

        // Nombre de tentatives pour se connecter : 5 tentatives
        if (!$this->rateLimit->check($data['email']) || !$this->rateLimit->check($_SERVER['REMOTE_ADDR'])) {
            $this->response->error('Trop de tentatives de connexion. Réessayez dans 15 minutes.', 429);
            return;
        }

        try {
            $user = $this->userModel->getUserByEmail($data['email']);

            //utilisateur trouvé?
            if (!$user) {
                $this->rateLimit->increment($data['email']);
                $this->rateLimit->increment($_SERVER['REMOTE_ADDR']);
                $this->logger->loginFailed($data['email'], 'User not found');
                $this->response->error('Email ou mot de passe incorrect',401);
                return;
            }

            // Compte actif?
            if (!$user['is_actif']) {
                $this->logger->loginFailed($data['email'], 'Account disabled');
                $this->response->error('Votre compte a été désactivé. Contactez un administrateur.',403);
                return;
            }

            // Mot de passe correspond?
            if (!password_verify($data['password'], $user['password'])) {
                $this->rateLimit->increment($data['email']);
                $this->rateLimit->increment($_SERVER['REMOTE_ADDR']);
                $this->logger->loginFailed($data['email'], 'Wrong password');
                $this->response->error('Email ou mot de passe incorrect', 401);
                return;
            }

            // RESET DU RATE LIMIT EN CAS DE SUCCÈS
            $this->rateLimit->reset($data['email']);
            $this->rateLimit->reset($_SERVER['REMOTE_ADDR']);

            // LOG DE CONNEXION RÉUSSIE
            $this->logger->loginSuccess($data['email']);
            
            // Ne pas seter le password
            unset($user['password']);

            $this->response->success([
                'message' => 'Connexion réussie',
                'user' => $user
            ], 200);

        } catch (\Exception $e) {
            $this->logger->error($e->getMessage());
            $this->response->error('Une erreur est survenue lors de la connexion', 500);
        }
    }

    /**
     * Mise à jour d'un utilisateur
     */
    public function updateUser(): void{
        $id = isset($_GET['id']) ? (int)$_GET['id'] : null; // ou depuis l'URL /api/utilisateurs/5

        if (!$id) {
            $this->response->error('ID invalide.', 400);
            return;
        }

        // Vérifier que l'utilisateur existe
        $user = $this->userModel->findById($id);
        if (!$user) {
            $this->response->error('Utilisateur non trouvé.', 404);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if(!is_array($data) || empty($data)) {
            $this->response->error('Données invalides.', 400);
            return;
        }

        $errors = $this->validator->validateUpdateUser($data);

        if (!empty($errors)) {
            $this->response->error('Erreur de validation.', 422, $errors);
            return;
        }

        try {
            $success = $this->userModel->updateUser($id, $data);

            if (!$success) {
                $this->response->error('Erreur lors de la mise à jour.', 500);
                return;
            }

            $this->response->success(['message' => 'Profil mis à jour avec succès.'], 200);

        } catch (\Exception $e) {
            $this->logger->error($e->getMessage());
            $this->response->error('Une erreur est survenue.', 500);
        }
    }

    /**
     * Initialisation mot de passe
     */
    public function updatePassword(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!is_array($data) || empty($data)) {
            $this->response->error('Données invalides.', 400);
            return;
        }

        $errors = $this->validator->validateUpdatePassword($data);

        if (!empty($errors)) {
            $this->response->error('Erreur de validation.', 422, $errors);
            return;
        }

        // Récupérer l'id via query string
        $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

        if (!$id) {
            $this->response->error('ID manquant.', 400);
            return;
        }

        try {
            // Vérifier l'ancien mot de passe
            $user = $this->userModel->findById($id);

            if (!$user || !password_verify($data['old_password'], $user['password'])) {
                $this->response->error('Ancien mot de passe incorrect.', 401);
                return;
            }

            $success = $this->userModel->updatePassword($id, $data['new_password']);

            if ($success) {
                $this->response->success(['message' => 'Mot de passe mis à jour avec succès.'], 200);
            } else {
                $this->response->error('Erreur lors de la mise à jour.', 500);
            }

        } catch (Exception $e) {
            $this->response->error('Erreur serveur.', 500);
        }
    }

    /**
    * Demande de réinitialisation de mot de passe
    */
    public function forgotPassword(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!is_array($data) || empty($data['email'])) {
            $this->response->error('Email manquant.', 400);
            return;
        }

        try {
            $user = $this->userModel->getUserByEmail($data['email']);

            if ($user) {
                $token     = bin2hex(random_bytes(32));
                $expires   = date('Y-m-d H:i:s', time() + 3600);
                $resetLink = ($_ENV['FRONTEND_URL'] ?? 'http://localhost:3000') . '/reset-password?token=' . $token;

                $this->userModel->saveResetToken($user['id'], $token, $expires);
                ResetPasswordMail::send($user['email'], $resetLink);
            }

            $this->response->success([
                'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.'
            ], 200);

        } catch (\Exception $e) {
            $this->logger->error($e->getMessage());
            $this->response->error('Erreur serveur.', 500);
        }
    }

    /**
     * Réinitialisation du mot de passe via token
    */
    public function resetPassword(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!is_array($data) || empty($data)) {
            $this->response->error('Données invalides.', 400);
            return;
        }

        $errors = $this->validator->validateResetPassword($data);

        if (!empty($errors)) {
            $this->response->error('Erreur de validation.', 422, $errors);
            return;
        }

        try {
            $user = $this->userModel->findByResetToken($data['token']);

            if (!$user) {
                $this->response->error('Token invalide ou expiré.', 400);
                return;
            }

            // Vérifier expiration
            if (strtotime($user['reset_token_expires_at']) < time()) {
                $this->response->error('Token expiré.', 400);
                return;
            }

            // Update password + clear token
            $this->userModel->updatePassword($user['id'], $data['new_password']);
            $this->userModel->clearResetToken($user['id']);

            $this->response->success(['message' => 'Mot de passe réinitialisé avec succès.'], 200);

        } catch (\Exception $e) {
            $this->logger->error($e->getMessage());
            $this->response->error('Erreur serveur.', 500);
        }
    }

    /**
    * Création d'un employé (admin uniquement)
    */
    public function createEmploye(): void
    {
        // Vérifier que c'est un admin (via le middleware)
        $currentUser = $_REQUEST['auth_user'] ?? null;

        error_log('currentUser: ' . json_encode($currentUser));

        if (!$currentUser || $currentUser['role'] !== 'admin') {
            $this->response->error('Accès refusé.', 403);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!is_array($data) || empty($data)) {
            $this->response->error('Données invalides.', 400);
            return;
        }

        $errors = $this->validator->validateRegister($data);

        if (!empty($errors)) {
            $this->response->error('Erreur de validation.', 422, $errors);
            return;
        }

        if ($this->userModel->emailExists($data['email'])) {
            $this->response->error('Cet email est déjà utilisé.', 409);
            return;
        }

        try {
            $userId = $this->userModel->creerEmploye($data);

            if (!$userId) {
                $this->response->error('Erreur lors de la création de l\'employé.', 500);
                return;
            }

            AccountCreatedMail::send($data['email'], $data['prenom'], $data['nom']);

            $this->response->success([
                'message' => 'Employé créé avec succès. Un email de notification lui a été envoyé.',
                'user_id' => $userId
            ], 201);

        } catch (\Exception $e) {
            $this->logger->error($e->getMessage());
            $this->response->error('Une erreur est survenue.', 500);
        }
    }

    /**
     * Activer/Désactiver un utilisateur (admin uniquement)
     */
    public function toggleUserStatus(): void
    {
        $currentUser = $_REQUEST['auth_user'] ?? null;

        if (!$currentUser || $currentUser['role'] !== 'admin') {
            $this->response->error('Accès refusé.', 403);
            return;
        }

        $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

        if (!$id) {
            $this->response->error('ID invalide.', 400);
            return;
        }

        $user = $this->userModel->findById($id);

        if (!$user) {
            $this->response->error('Utilisateur non trouvé.', 404);
            return;
        }

        try {
            if ($user['is_actif']) {
                $this->userModel->desactiverUtilisateur($id);
                $message = 'Utilisateur désactivé.';
            } else {
                $this->userModel->activerUtilisateur($id);
                $message = 'Utilisateur activé.';
            }

            $this->response->success(['message' => $message], 200);

        } catch (\Exception $e) {
            $this->logger->error($e->getMessage());
            $this->response->error('Erreur serveur.', 500);
        }
    }

    public function getUsers(): void
    {
        $admin = $_REQUEST['auth_user'];

        if ($admin['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['message' => 'Accès refusé']);
            return;
        }

        $users = $this->userModel->getAllUsers();

        // Retirer les mots de passe
        $users = array_map(function ($u) {
            unset($u['password'], $u['api_token'], $u['reset_token'], $u['reset_token_expires_at']);
            return $u;
        }, $users);

        echo json_encode([
            'message' => 'Liste des utilisateurs',
            'users'   => $users
        ]);
    }

    /**
    * Mise à jour d'un employé par l'admin
    */
    public function updateEmploye(): void
    {
        $currentUser = $_REQUEST['auth_user'] ?? null;

        if (!$currentUser || $currentUser['role'] !== 'admin') {
            $this->response->error('Accès refusé.', 403);
            return;
        }

        $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

        if (!$id) {
            $this->response->error('ID invalide.', 400);
            return;
        }

        $user = $this->userModel->findById($id);

        if (!$user) {
            $this->response->error('Utilisateur non trouvé.', 404);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!is_array($data) || empty($data)) {
            $this->response->error('Données invalides.', 400);
            return;
        }

        $errors = $this->validator->validateUpdateEmploye($data);

        if (!empty($errors)) {
            $this->response->error('Erreur de validation.', 422, $errors);
            return;
        }

        // Vérifier si l'email est pris par un autre utilisateur
        if ($data['email'] !== $user['email'] && $this->userModel->emailExists($data['email'])) {
            $this->response->error('Cet email est déjà utilisé.', 409);
            return;
        }

        try {
            $success = $this->userModel->updateEmployeByAdmin($id, $data);

            if (!$success) {
                $this->response->error('Erreur lors de la mise à jour.', 500);
                return;
            }

            $this->response->success(['message' => 'Employé mis à jour avec succès.'], 200);

        } catch (\Exception $e) {
            $this->logger->error($e->getMessage());
            $this->response->error('Erreur serveur.', 500);
        }
    }

}
