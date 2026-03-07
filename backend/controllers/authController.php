<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../mail/WelcomeMail.php';

class AuthController
{
    private User $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    public function register(): void
    {
        // Récupère le JSON envoyé par le front
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            $this->sendJson(['success' => false, 'message' => 'Données invalides.'], 400);
            return;
        }

        // Validation
        $errors = $this->validateRegister($data);

        if (!empty($errors)) {
            $this->sendJson([
                'success' => false,
                'message' => 'Erreur de validation.',
                'errors'  => $errors,
            ], 422);
            return;
        }

        // Vérification email unique
        if ($this->userModel->emailExists($data['email'])) {
            $this->sendJson([
                'success' => false,
                'message' => 'Cet email est déjà utilisé.',
                'errors'  => ['email' => 'Cet email est déjà utilisé.'],
            ], 409);
            return;
        }

        // Création du compte
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
    }

    // -------------------------
    // Validation
    // -------------------------
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

    // -------------------------
    // Helper réponse JSON
    // -------------------------
    private function sendJson(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
