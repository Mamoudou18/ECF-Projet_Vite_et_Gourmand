<?php
class AuthMiddleware
{
    private $userModel;

    public function __construct()
    {
        require_once __DIR__ . '/../models/User.php';
        $this->userModel = new User();
    }

    public function handle(): array
    {
        // 1. Lit le token dans le header
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        preg_match('/Bearer\s(\S+)/', $header, $matches);
        $token = $matches[1] ?? null;

        if (!$token) {
            $this->abort(401, 'Token manquant');
        }

        // 2. Cherche l'user en BDD avec ce token
        $user = $this->userModel->findByToken($token);

        if (!$user) {
            $this->abort(401, 'Token invalide');
        }

        // 3. Retourne l'user → dispo dans la route
        return $user;
    }

    private function abort(int $code, string $message): void
    {
        http_response_code($code);
        echo json_encode(['success' => false, 'message' => $message]);
        exit;
    }
}
