<?php

require_once __DIR__ .'/../config/database.php';
class User{
    private PDO $pdo;

    public function __construct()
    {
        $this ->pdo = Database::getInstance();
    }

    //On vérifie si l'adresse mail existe déjà:
    public function emailExists(string $email): bool{
        $stm = $this ->pdo ->prepare("SELECT id FROM users WHERE email= :email");
        $stm->execute(['email'=>$email]);
        return $stm->fetch() !== false;
    }

    // Récupère l'id du rôle "utilisateur"
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

    // On crée l'utilisateur
    public function inscriptionUtilisateur(array $data): int{

        // Récupère l'id du rôle "utilisateur"
        $roleId = $this->getRoleId('utilisateur');

        $stm = $this->pdo->prepare("
            INSERT INTO users
                (nom, prenom,email, gsm, adresse, code_postal, ville, password, role_id, is_actif, created_at)
            VALUES
                (:nom, :prenom, :email, :gsm, :adresse, :code_postal, :ville, :password, :role_id, 1, NOW())    
        ");
        $stm->execute([
            'nom'           =>$data['nom'],
            'prenom'        =>$data['prenom'],
            'email'         =>$data['email'],
            'gsm'           =>$data['gsm'],
            'adresse'       =>$data['adresse'],
            'code_postal'   =>$data['code_postal'],
            'ville'         =>$data['ville'],
            'password'      =>password_hash($data['password'], PASSWORD_BCRYPT),
            'role_id'       =>$roleId,

        ]);

        return (int) $this->pdo->lastInsertId();
    }


    // Récupère un utilisateur par son id avec son rôle
    public function findById(int $id): array|false
    {
        $stm = $this->pdo->prepare("
            SELECT u.*, r.nom AS role
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = :id
        ");
        $stm->execute(['id' => $id]);
        return $stm->fetch();
    }
}