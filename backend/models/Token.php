<?php
class Token {
    private $conn;
    public $table_name = "tokens";

    public $id;
    public $user_id;
    public $token;
    public $expires_at;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * ✅ Générer un token sécurisé
     */
    public function genererToken() {
        return bin2hex(random_bytes(32)); // 64 caractères hexadécimaux
    }

    /**
     * ✅ Créer un nouveau token d'authentification
     */
    public function creerToken($user_id, $duree_heures = 24) {
        // Générer le token
        $this->token = $this->genererToken();
        $this->user_id = $user_id;
        $this->expires_at = date('Y-m-d H:i:s', time() + ($duree_heures * 3600));

        $query = "INSERT INTO " . $this->table_name . "
                  (user_id, token, expires_at)
                  VALUES 
                  (:user_id, :token, :expires_at)";

        $stmt = $this->conn->prepare($query);

        // Lier les paramètres
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':token', $this->token);
        $stmt->bindParam(':expires_at', $this->expires_at);

        if ($stmt->execute()) {
            return $this->token;
        }

        return false;
    }

    /**
     * ✅ Vérifier si un token est valide et retourner les infos utilisateur
     */
    public function verifierToken($token) {
        $query = "SELECT t.*, u.id, u.nom, u.prenom, u.email, u.role, u.is_actif
                  FROM " . $this->table_name . " t
                  INNER JOIN users u ON t.user_id = u.id
                  WHERE t.token = :token 
                  AND t.expires_at > NOW()
                  AND u.is_actif = 1
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':token', $token);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }

        return false;
    }

    /**
     * ✅ Supprimer un token spécifique (déconnexion)
     */
    public function supprimerToken($token) {
        $query = "DELETE FROM " . $this->table_name . "
                  WHERE token = :token";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':token', $token);

        return $stmt->execute();
    }

    /**
     * ✅ Supprimer TOUS les tokens d'un utilisateur (déconnexion complète)
     */
    public function supprimerTousTokens($user_id) {
        $query = "DELETE FROM " . $this->table_name . "
                  WHERE user_id = :user_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);

        return $stmt->execute();
    }

    /**
     * ✅ Nettoyer les tokens expirés (à exécuter régulièrement)
     */
    public function nettoyerTokensExpires() {
        $query = "DELETE FROM " . $this->table_name . "
                  WHERE expires_at < NOW()";

        $stmt = $this->conn->prepare($query);
        return $stmt->execute();
    }

    /**
     * ✅ Récupérer tous les tokens actifs d'un utilisateur
     */
    public function getTokensActifs($user_id) {
        $query = "SELECT id, token, expires_at, created_at
                  FROM " . $this->table_name . "
                  WHERE user_id = :user_id 
                  AND expires_at > NOW()
                  ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * ✅ Prolonger la durée de vie d'un token
     */
    public function prolongerToken($token, $duree_heures = 24) {
        $nouvelle_expiration = date('Y-m-d H:i:s', time() + ($duree_heures * 3600));
        
        $query = "UPDATE " . $this->table_name . "
                  SET expires_at = :expires_at
                  WHERE token = :token";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':expires_at', $nouvelle_expiration);
        $stmt->bindParam(':token', $token);

        return $stmt->execute();
    }

    /**
     * ✅ Compter le nombre de sessions actives d'un utilisateur
     */
    public function compterSessionsActives($user_id) {
        $query = "SELECT COUNT(*) as total
                  FROM " . $this->table_name . "
                  WHERE user_id = :user_id 
                  AND expires_at > NOW()";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'] ?? 0;
    }
}
