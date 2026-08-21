<?php

class Menu
{
    private PDO $pdo;
    private MenuFilterBuilder $menuFilterBuilder;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->menuFilterBuilder = new MenuFilterBuilder();
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

    // Pagination 

    public function countAll(array $filters = []): int
    {
        [$where, $params] = $this->menuFilterBuilder->build($filters);

        $query = "SELECT COUNT(*) FROM vue_menus_complets $where";
        $stm = $this->pdo->prepare($query);
        $stm->execute($params);

        return (int) $stm->fetchColumn();
    }

    public function getPaginated(int $page, int $perPage, array $filters = [], string $orderBy = 'id DESC'): array
    {
        $offset = ($page - 1) * $perPage;

        [$where, $params] = $this->menuFilterBuilder->build($filters);

        $query = "SELECT * FROM vue_menus_complets $where ORDER BY $orderBy LIMIT :limit OFFSET :offset";

        $stm = $this->pdo->prepare($query);

        foreach ($params as $key => $value) {
            $stm->bindValue($key, $value);
        }

        $stm->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stm->bindValue(':offset', $offset, PDO::PARAM_INT);

        $stm->execute();

        return $stm->fetchAll(PDO::FETCH_ASSOC);
    }

    // Fonction qui assemble tout + VALIDATIONS
public function getPaginatedMenus(int $page, int $perPage, array $filters = []): array
{
    $page = max(1, $page);
    $perPage = max(1, min(100, $perPage));

    $cleanFilters = [];

    if (isset($filters['minPrice']) && $filters['minPrice'] !== '') {
        $cleanFilters['minPrice'] = (float) $filters['minPrice'];
    }
    if (isset($filters['maxPrice']) && $filters['maxPrice'] !== '') {
        $cleanFilters['maxPrice'] = (float) $filters['maxPrice'];
    }
    if (isset($filters['minPersons']) && $filters['minPersons'] !== '') {
        $cleanFilters['minPersons'] = (int) $filters['minPersons'];
    }
    if (!empty($filters['titre'])) {
        $cleanFilters['titre'] = trim((string) $filters['titre']);
    }
    if (isset($filters['stock']) && $filters['stock'] !== '') {
        $cleanFilters['stock'] = (string) $filters['stock'];
    }
    if (!empty($filters['themes']) && is_array($filters['themes'])) {
        $cleanFilters['themes'] = array_filter($filters['themes']);
    }
    if (!empty($filters['regimes']) && is_array($filters['regimes'])) {
        $cleanFilters['regimes'] = array_filter($filters['regimes']);
    }

    // === Whitelist du tri (sécurité SQL obligatoire) ===
    $allowedSorts = [
        'id-desc'      => 'id DESC',
        'id-asc'       => 'id ASC',
        'prix-asc'     => 'prix_base ASC',
        'prix-desc'    => 'prix_base DESC',
        'titre-asc'    => 'titre ASC',
        'titre-desc'   => 'titre DESC',
        'stock-asc'    => 'stock ASC',
        'stock-desc'   => 'stock DESC',
    ];

    $orderBy = 'id DESC'; // défaut
    if (isset($filters['sort']) && array_key_exists($filters['sort'], $allowedSorts)) {
        $orderBy = $allowedSorts[$filters['sort']];
    }

    $total = $this->countAll($cleanFilters);
    $totalPages = $total > 0 ? (int) ceil($total / $perPage) : 1;
    $page = min($page, $totalPages);

    $menus = $this->getPaginated($page, $perPage, $cleanFilters, $orderBy);

    return [
        'data' => $menus,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => $totalPages,
        ]
    ];
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
