<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../mail/WelcomeMail.php';
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

            WelcomeMail::send($data['email'], $data['prenom'], $data['nom']);

            $this->response->success(['message' => 'Compte créé avec succès. Un email de bienvenue vous a été envoyé.'], 201);

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
}
