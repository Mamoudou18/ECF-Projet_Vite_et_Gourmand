<?php

require_once __DIR__ .'/../config/database.php';

class User
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getInstance();
    }

    /**
    * Vérifie si l'email existe
     */
    public function emailExists(string $email, ?int $excludeUserId = null): bool
    {
        if ($excludeUserId === null) {
            // Cas inscription
            $stm = $this->pdo->prepare("SELECT id FROM users WHERE email = :email");
            $stm->execute(['email' => $email]);
        } else {
            // Cas modification : exclure l'utilisateur actuel
            $stm = $this->pdo->prepare("
                SELECT id FROM users 
                WHERE email = :email 
                AND id != :exclude_id
            ");
            $stm->execute([
                'email' => $email,
                'exclude_id' => $excludeUserId
            ]);
        }
        
        return $stm->fetch() !== false;
    }

    // Pour le middleware
    public function findByToken(string $token): array|false
    {
        $stm = $this->pdo->prepare("
            SELECT users.*, roles.libelle AS role 
            FROM users 
            JOIN roles ON users.role_id = roles.id 
            WHERE users.api_token = :api_token
        ");
        $stm->execute([':api_token' => $token]);
        return $stm->fetch();
    }


    //  Récupère l'id du rôle
    private function getRoleId(string $roleName): int
    {
        $stm = $this->pdo->prepare("SELECT id FROM roles WHERE libelle = :libelle");
        $stm->execute(['libelle' => $roleName]);
        $role = $stm->fetch();

        if (!$role) {
            throw new \Exception("Rôle '{$roleName}' introuvable en base de données.");
        }

        return (int) $role['id'];
    }

    // Inscription utilisateur
    public function inscriptionUtilisateur(array $data): int
    {
        $token = bin2hex(random_bytes(32)); //Génération du token unique

        $roleId = $this->getRoleId('utilisateur');

        $stm = $this->pdo->prepare("
            INSERT INTO users
                (nom, prenom, email, gsm, adresse, code_postal, ville, password, role_id, api_token, is_actif, created_at)
            VALUES
                (:nom, :prenom, :email, :gsm, :adresse, :code_postal, :ville, :password, :role_id, :api_token, 1, NOW())    
        ");
        
        $stm->execute([
            'nom'           => $data['nom'],
            'prenom'        => $data['prenom'],
            'email'         => $data['email'],
            'gsm'           => $data['gsm'],
            'adresse'       => $data['adresse'],
            'code_postal'   => $data['code_postal'],
            'ville'         => $data['ville'],
            'password'      => password_hash($data['password'], PASSWORD_BCRYPT),
            'role_id'       => $roleId,
            'api_token'    => $token

        ]);

        return (int) $this->pdo->lastInsertId();
    }

    // Récupère un utilisateur par son id avec son rôle
    public function findById(int $id): array|false
    {
        $stm = $this->pdo->prepare("
            SELECT u.*, r.libelle AS role
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = :id
        ");
        $stm->execute(['id' => $id]);
        return $stm->fetch();
    }

    // Récupère un utilisateur par email avec son rôle
    public function getUserByEmail(string $email): array|false
    {
        $stm = $this->pdo->prepare("
            SELECT u.*, r.libelle AS role
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.email = :email
        ");
        $stm->execute(['email' => $email]);
        return $stm->fetch();
    }

    // Mise à jour des informations utilisateur
    public function updateUser(int $id, array $data): bool
    {
        $stm = $this->pdo->prepare("
            UPDATE users 
            SET nom = :nom,
                prenom = :prenom,
                gsm = :gsm,
                adresse = :adresse,
                code_postal = :code_postal,
                ville = :ville
            WHERE id = :id
        ");

        return $stm->execute([
            'id'            => $id,
            'nom'           => $data['nom'],
            'prenom'        => $data['prenom'],
            'gsm'           => $data['gsm'],
            'adresse'       => $data['adresse'],
            'code_postal'   => $data['code_postal'],
            'ville'         => $data['ville'],
        ]);
    }


    // Désactiver un utilisateur
    public function desactiverUtilisateur(int $id): bool
    {
        $stm = $this->pdo->prepare("UPDATE users SET is_actif = 0 WHERE id = :id");
        return $stm->execute(['id' => $id]);
    }

    // Réactiver un utilisateur
    public function activerUtilisateur(int $id): bool
    {
        $stm = $this->pdo->prepare("UPDATE users SET is_actif = 1 WHERE id = :id");
        return $stm->execute(['id' => $id]);
    }

    // Changer le mot de passe
    public function updatePassword(int $id, string $newPassword): bool
    {
        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
        $stm = $this->pdo->prepare("UPDATE users SET password = :password WHERE id = :id");
        return $stm->execute([
            'id' => $id,
            'password' => $hashedPassword
        ]);
    }

    // Récupérer tous les utilisateurs (pour admin)
    public function getAllUsers(): array
    {
        $stm = $this->pdo->query("
            SELECT u.*, r.libelle AS role
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.created_at DESC
        ");
        return $stm->fetchAll();
    }

    // Changer le rôle d'un utilisateur (pour admin)
    public function updateRole(int $userId, string $roleName): bool
    {
        $roleId = $this->getRoleId($roleName);
        $stm = $this->pdo->prepare("UPDATE users SET role_id = :role_id WHERE id = :id");
        return $stm->execute([
            'id' => $userId,
            'role_id' => $roleId
        ]);
    }

    // Sauvegarder le token de réinitialisation
    public function saveResetToken(int $id, string $token, string $expires): bool
    {
        $stm = $this->pdo->prepare("
            UPDATE users 
            SET reset_token = :token, 
                reset_token_expires_at = :expires 
            WHERE id = :id
        ");
        return $stm->execute([
            'token'   => $token,
            'expires' => $expires,
            'id'      => $id
        ]);
    }

    // Trouver un utilisateur par reset token
    public function findByResetToken(string $token): array|false
    {
        $stm = $this->pdo->prepare("
            SELECT * FROM users 
            WHERE reset_token = :token
        ");
        $stm->execute([':token' => $token]);
        return $stm->fetch();
    }

    // Effacer le reset token après utilisation
    public function clearResetToken(int $id): bool
    {
        $stm = $this->pdo->prepare("
            UPDATE users 
            SET reset_token = NULL, 
                reset_token_expires_at = NULL 
            WHERE id = :id
        ");
        return $stm->execute(['id' => $id]);
    }

    public function creerEmploye(array $data): int
    {
        $token = bin2hex(random_bytes(32));
        $roleId = $this->getRoleId('employe');

        $stm = $this->pdo->prepare("
            INSERT INTO users
                (nom, prenom, email, gsm, adresse, code_postal, ville, password, role_id, api_token, is_actif, created_at)
            VALUES
                (:nom, :prenom, :email, :gsm, :adresse, :code_postal, :ville, :password, :role_id, :api_token, 1, NOW())    
        ");

        $stm->execute([
            'nom'         => $data['nom'],
            'prenom'      => $data['prenom'],
            'email'       => $data['email'],
            'gsm'         => $data['gsm'],
            'adresse'     => $data['adresse'],
            'code_postal' => $data['code_postal'],
            'ville'       => $data['ville'],
            'password'    => password_hash($data['password'], PASSWORD_BCRYPT),
            'role_id'     => $roleId,
            'api_token'   => $token
        ]);

        return (int) $this->pdo->lastInsertId();
    }

}
