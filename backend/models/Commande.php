<?php

class Commande
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ==================== STATUTS ====================

    public function getStatutId(string $statutName): int
    {
        $stm = $this->pdo->prepare("SELECT id FROM statuts_commande WHERE libelle = :libelle");
        $stm->execute(['libelle' => $statutName]);
        $statutCommande = $stm->fetch();

        if (!$statutCommande) {
            throw new \Exception("Statut '{$statutName}' introuvable en base de données.");
        }

        return (int) $statutCommande['id'];
    }

    public function getAllStatuts(): array
    {
        return $this->pdo->query("SELECT * FROM statuts_commande ORDER BY ordre ASC")
            ->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getStatutOrdreByCommandeId(int $commandeId): ?int
    {
        $stm = $this->pdo->prepare("
            SELECT sc.ordre 
            FROM commandes c 
            JOIN statuts_commande sc ON c.statut_id = sc.id 
            WHERE c.id = :id
        ");
        $stm->execute([':id' => $commandeId]);
        $result = $stm->fetch();

        return $result ? (int) $result['ordre'] : null;
    }

    public function getNextStatutId(int $currentOrdre): ?int
    {
        $stm = $this->pdo->prepare("
            SELECT id FROM statuts_commande 
            WHERE ordre = :next_ordre
        ");
        $stm->execute([':next_ordre' => $currentOrdre + 1]);
        $result = $stm->fetch();

        return $result ? (int) $result['id'] : null;
    }

    public function updateStatut(int $id, int $statutId): bool
    {
        $stm = $this->pdo->prepare("UPDATE commandes SET statut_id = :statut_id WHERE id = :id");
        return $stm->execute([':statut_id' => $statutId, ':id' => $id]);
    }

    // ==================== CRUD ====================

    public function getAllCommande(): array
    {
        return $this->pdo->query("SELECT * FROM vue_commandes_details ORDER BY id DESC")
            ->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById(int $id): ?array
    {
        $stm = $this->pdo->prepare("SELECT * FROM vue_commandes_details WHERE id = :id");
        $stm->execute([':id' => $id]);
        $commande = $stm->fetch(PDO::FETCH_ASSOC);

        return $commande ?: null;
    }

    public function getByUserId(int $userId): array
    {
        $stm = $this->pdo->prepare("SELECT * FROM vue_commandes_details WHERE user_id = :user_id ORDER BY created_at DESC");
        $stm->execute(['user_id' => $userId]);
        return $stm->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createCommande(array $data): int
    {
        $statutId = $this->getStatutId('en_attente');

        $stm = $this->pdo->prepare("
            INSERT INTO commandes (
                user_id, menu_id, statut_id, nom_client, prenom_client, 
                email_client, gsm_client, adresse_prestation, ville_prestation, 
                code_postal_prestation, date_prestation, heure_prestation, 
                nb_personnes, prix_menu, prix_livraison, prix_total, 
                commentaire, location_materiel, mode_contact, numero_commande
            ) VALUES (
                :user_id, :menu_id, :statut_id, :nom_client, :prenom_client, 
                :email_client, :gsm_client, :adresse_prestation, :ville_prestation, 
                :code_postal_prestation, :date_prestation, :heure_prestation, 
                :nb_personnes, :prix_menu, :prix_livraison, :prix_total, 
                :commentaire, :location_materiel, :mode_contact, :numero_commande
            )
        ");

        $stm->execute([
            'user_id'                => $data['user_id'],
            'menu_id'                => $data['menu_id'],
            'statut_id'              => $statutId,
            'nom_client'             => $data['nom_client'],
            'prenom_client'          => $data['prenom_client'],
            'email_client'           => $data['email_client'],
            'gsm_client'             => $data['gsm_client'],
            'adresse_prestation'     => $data['adresse_prestation'],
            'ville_prestation'       => $data['ville_prestation'],
            'code_postal_prestation' => $data['code_postal_prestation'],
            'date_prestation'        => $data['date_prestation'],
            'heure_prestation'       => $data['heure_prestation'],
            'nb_personnes'           => $data['nb_personnes'],
            'prix_menu'              => $data['prix_menu'],
            'prix_livraison'         => $data['prix_livraison'],
            'prix_total'             => $data['prix_total'],
            'commentaire'            => $data['commentaire'] ?? null,
            'location_materiel'      => $data['location_materiel'],
            'mode_contact'           => $data['mode_contact'] ?? null,
            'numero_commande'        => $data['numero_commande']
        ]);
        $commandeId = (int) $this->pdo->lastInsertId();

        // Déduire le stock du menu
        $stmStock = $this->pdo->prepare("UPDATE menus SET stock = stock - 1 WHERE id = :menu_id AND stock > 0");
        $stmStock->execute(['menu_id' => $data['menu_id']]);

        if ($stmStock->rowCount() === 0) {
            throw new \Exception('Ce menu n\'est plus disponible (stock épuisé).');
        }

        return($commandeId);
    }

    public function updateCommande(int $id, array $data): bool
    {
        $allowedFields = [
            'nom_client', 'prenom_client', 'email_client', 'gsm_client',
            'adresse_prestation', 'ville_prestation', 'code_postal_prestation',
            'date_prestation', 'heure_prestation', 'nb_personnes',
            'prix_menu', 'prix_livraison', 'prix_total',
            'commentaire', 'location_materiel', 'mode_contact'
        ];

        $filtered = array_intersect_key($data, array_flip($allowedFields));

        if (empty($filtered)) return false;

        $fields = [];
        $params = [':id' => $id];

        foreach ($filtered as $key => $value) {
            $fields[] = "$key = :$key";
            $params[":$key"] = $value;
        }

        $stm = $this->pdo->prepare("UPDATE commandes SET " . implode(', ', $fields) . " WHERE id = :id");
        return $stm->execute($params);
    }

    public function deleteCommande(int $id): bool
    {
        $stm = $this->pdo->prepare("DELETE FROM commandes WHERE id = :id");
        return $stm->execute([':id' => $id]);
    }

    // ==================== UTILITAIRES ====================

    public function restaurerStock(int $menuId): void
    {
        $stmt = $this->pdo->prepare("UPDATE menus SET stock = stock + 1 WHERE id = :menu_id");
        $stmt->execute(['menu_id' => $menuId]);
    }

    public function updateMotifAnnulation(int $id, string $motif): bool
    {
        $stm = $this->pdo->prepare("UPDATE commandes SET motif_annulation = :motif WHERE id = :id");
        return $stm->execute([':motif' => $motif, ':id' => $id]);
    }
}
