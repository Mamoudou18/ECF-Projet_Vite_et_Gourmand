<?php

class Menu
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ── CREATE ─────────────────────────────────────────────

    public function creer(array $data): int
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO menus (titre, description, conditions, stock, prix_base, nb_personnes_min)
            VALUES (:titre, :description, :conditions, :stock, :prix_base, :nb_personnes_min)
        ");
        $stmt->execute([
            'titre'            => $data['titre'],
            'description'      => $data['description'],
            'conditions'       => $data['conditions'],
            'stock'            => $data['stock'],
            'prix_base'        => $data['prix_base'],
            'nb_personnes_min' => $data['nb_personnes_min'],
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    // ── UPDATE BASE ────────────────────────────────────────

    public function majBase(int $id, array $data): void
    {
        $stmt = $this->pdo->prepare("
            UPDATE menus SET
                titre            = :titre,
                description      = :description,
                conditions       = :conditions,
                stock            = :stock,
                prix_base        = :prix_base,
                nb_personnes_min = :nb_personnes_min
            WHERE id = :id
        ");
        $stmt->execute([...$data, ':id' => $id]);
    }

    // ── TOGGLE ─────────────────────────────────────────────

    public function toggleActif(int $id, int $statut): void
    {
        $stmt = $this->pdo->prepare("UPDATE menus SET is_active = :is_active WHERE id = :id");
        $stmt->execute([':is_active' => $statut, ':id' => $id]);
    }

    // ── THÈME ──────────────────────────────────────────────

    public function ajouterTheme(int $menuId, int $themeId): void
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO menu_theme (menu_id, theme_id) VALUES (:menu_id, :theme_id)
        ");
        $stmt->execute([':menu_id' => $menuId, ':theme_id' => $themeId]);
    }

    public function supprimerTheme(int $menuId): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM menu_theme WHERE menu_id = :id");
        $stmt->execute([':id' => $menuId]);
    }

    // ── RÉGIMES ────────────────────────────────────────────

    public function ajouterRegimes(int $menuId, array $regimeIds): void
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO menu_regime (menu_id, regime_id) VALUES (:menu_id, :regime_id)
        ");
        foreach ($regimeIds as $regimeId) {
            $stmt->execute([':menu_id' => $menuId, ':regime_id' => $regimeId]);
        }
    }

    public function supprimerRegimes(int $menuId): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM menu_regime WHERE menu_id = :id");
        $stmt->execute([':id' => $menuId]);
    }

    // ── PLATS ──────────────────────────────────────────────

    public function ajouterPlat(int $menuId, array $plat): void
    {
        // Crée le plat
        $stmt = $this->pdo->prepare("
            INSERT INTO plats (nom, description, type_id) 
            VALUES (:nom, :description, :type_id)
        ");
        $stmt->execute([
            ':nom'         => $plat['nom'],
            ':description' => $plat['description'],
            ':type_id'     => $plat['type_id'],
        ]);
        $platId = $this->pdo->lastInsertId();

        // Lie au menu
        $this->pdo->prepare("INSERT INTO menu_plat (menu_id, plat_id) VALUES (:menu_id, :plat_id)")
                ->execute([':menu_id' => $menuId, ':plat_id' => $platId]);

        // Allergènes
        foreach ($plat['allergenes'] as $allergeneNom) {
            // Insère si n'existe pas
            $this->pdo->prepare("INSERT IGNORE INTO allergenes (libelle) VALUES (:libelle)")
                    ->execute([':libelle' => $allergeneNom]);

            // Récupère l'ID
            $stmt = $this->pdo->prepare("SELECT id FROM allergenes WHERE libelle = :libelle");
            $stmt->execute([':libelle' => $allergeneNom]);
            $allergene = $stmt->fetch();

            // Lie au plat
            $this->pdo->prepare("INSERT INTO plat_allergene (plat_id, allergene_id) VALUES (:plat_id, :allergene_id)")
                    ->execute([':plat_id' => $platId, ':allergene_id' => $allergene['id']]);
        }
    }


    public function supprimerPlats(int $menuId): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM menu_plat WHERE menu_id = :id");
        $stmt->execute([':id' => $menuId]);
    }

    // ── IMAGES ─────────────────────────────────────────────

    public function ajouterImage(int $menuId, string $url, int $ordre): void
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO menu_images (menu_id, url, ordre) VALUES (:menu_id, :url, :ordre)
        ");
        $stmt->execute([':menu_id' => $menuId, ':url' => $url, ':ordre' => $ordre]);
    }

    public function getImageById(int $imageId): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM menu_images WHERE id = :id");
        $stmt->execute([':id' => $imageId]);
        $image = $stmt->fetch(PDO::FETCH_ASSOC);
        return $image ?: null;
    }

    public function supprimerImageById(int $imageId): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM menu_images WHERE id = :id");
        $stmt->execute([':id' => $imageId]);
    }

    public function getMaxOrdreImage(int $menuId): int
    {
        $stmt = $this->pdo->prepare("SELECT MAX(ordre) FROM menu_images WHERE menu_id = :id");
        $stmt->execute([':id' => $menuId]);
        return (int) $stmt->fetchColumn();
    }

    // ── READ ───────────────────────────────────────────────

    public function getTous(): array
    {
        return $this->pdo->query("SELECT * FROM vue_menus_complets WHERE is_active=1 ORDER BY id DESC")
            ->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById(int $id): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM vue_menus_complets WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $menu = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$menu) return null;

        $stmt2 = $this->pdo->prepare("
            SELECT vpa.*
            FROM vue_plats_allergenes vpa
            JOIN menu_plat mp ON vpa.id = mp.plat_id
            WHERE mp.menu_id = :id
        ");
        $stmt2->execute([':id' => $id]);
        $menu['plats'] = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        return $menu;
    }

    public function getPlatsParMenu(int $menuId): array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM vue_menus_plats WHERE menu_id = :id");
        $stmt->execute([':id' => $menuId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
