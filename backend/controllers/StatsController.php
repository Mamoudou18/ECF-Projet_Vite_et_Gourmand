<?php
// backend/controllers/StatsController.php

require_once __DIR__ . '/../models/Stats.php';
require_once __DIR__ . '/../utils/ResponseService.php';
require_once __DIR__ . '/../config/database.php';

class StatsController
{
    private Stats $stats;
    private ResponseService $response;
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo      = Database::getInstance();
        $this->stats    = new Stats();
        $this->response = new ResponseService();
    }

    /**
     * POST /stats/sync — Synchroniser MySQL → MongoDB
     */
    public function sync(): void
    {
        $count = $this->stats->syncFromMySQL($this->pdo);
        $this->response->success([
            'message' => "Synchronisation terminée",
            'nb_commandes_synchronisees' => $count
        ]);
    }

    /**
     * GET /stats/dashboard — Toutes les stats
     */
    public function getDashboard(): void
    {
        $this->response->success($this->stats->getDashboard());
    }

    /**
     * GET /stats/commandes-par-menu?date_debut=&date_fin=
     */
    public function getCommandesParMenu(): void
    {
        $dateDebut = $_GET['date_debut'] ?? null;
        $dateFin   = $_GET['date_fin'] ?? null;

        $this->response->success([
            'commandes_par_menu' => $this->stats->getCommandesParMenu($dateDebut, $dateFin)
        ]);
    }

    /**
     * GET /stats/chiffre-affaires?menu_id=&date_debut=&date_fin=
     */
    public function getChiffreAffaires(): void
    {
        $menuId    = isset($_GET['menu_id']) ? (int) $_GET['menu_id'] : null;
        $dateDebut = $_GET['date_debut'] ?? null;
        $dateFin   = $_GET['date_fin'] ?? null;

        $this->response->success(
            $this->stats->getChiffreAffaires($menuId, $dateDebut, $dateFin)
        );
    }

    /**
     * GET /stats/top-clients?limit=10
     */
    public function getTopClients(): void
    {
        $limit = (int) ($_GET['limit'] ?? 10);
        $this->response->success(['top_clients' => $this->stats->getTopClients($limit)]);
    }

    /**
     * GET /stats/menus — Liste des menus pour les filtres
     */
    public function getMenusDisponibles(): void
    {
        $this->response->success([
            'menus' => $this->stats->getMenusDisponibles()
        ]);
    }

    /**
     * GET /stats/top-menus — Top 3 menus les plus commandés (public)
     */
    public function topMenus(): void
    {
        // Récupérer les stats depuis MongoDB
        $commandesParMenu = $this->stats->getCommandesParMenu(null, null);

        // Prendre les 3 premiers (déjà triés par nb_commandes décroissant)
        $top3 = array_slice($commandesParMenu, 0, 3);

        // Récupérer les détails des menus depuis MySQL
        $top3Ids = array_map(fn($item) => $item['menu_id'], $top3);

        if (empty($top3Ids)) {
            $this->response->success(['top_menus' => []]);
            return;
        }

        $placeholders = implode(',', array_fill(0, count($top3Ids), '?'));
        $stmt = $this->pdo->prepare("SELECT * FROM vue_menus_complets WHERE is_active = 1 AND id IN ($placeholders)");
        $stmt->execute($top3Ids);
        $menus = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 4. Combiner stats + détails menu
        $result = array_map(function ($item) use ($menus) {
            $menu = null;
            foreach ($menus as $m) {
                if ($m['id'] == $item['menu_id']) {
                    $menu = $m;
                    break;
                }
            }
            return [
                'menu' => $menu,
                'nb_commandes' => $item['nb_commandes']
            ];
        }, $top3);

        $this->response->success(['top_menus' => $result]);
    }


}
