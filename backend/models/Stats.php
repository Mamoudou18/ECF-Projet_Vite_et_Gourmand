<?php
// backend/models/Stats.php

require_once __DIR__ . '/../vendor/autoload.php';

class Stats
{
    private $collection;
    private $parisTimezone;

    public function __construct()
    {
        $client = new MongoDB\Client($_ENV['MONGO_URI'] ?? 'mongodb://localhost:27017');
        $db = $client->selectDatabase($_ENV['MONGO_DB'] ?? 'vite_gourmand_db');
        $this->collection = $db->selectCollection('commandes');
        $this->parisTimezone = new DateTimeZone('Europe/Paris');
    }

    /**
     * Synchro MySQL → MongoDB
     */
    public function syncFromMySQL(PDO $pdo): int
    {
        $this->collection->drop();

        $stmt = $pdo->query("SELECT * FROM vue_commandes_details");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($rows)) return 0;

        $documents = array_map(function ($row) {
            return [
                'id_commande'            => (int) $row['id'],
                'numero_commande'        => $row['numero_commande'],
                'nom_client'             => $row['nom_client'],
                'prenom_client'          => $row['prenom_client'],
                'email_client'           => $row['email_client'],
                'gsm_client'             => $row['gsm_client'],
                'adresse_prestation'     => $row['adresse_prestation'],
                'ville_prestation'       => $row['ville_prestation'],
                'code_postal_prestation' => $row['code_postal_prestation'],
                'date_prestation'        => $row['date_prestation'],
                'heure_prestation'       => $row['heure_prestation'],
                'nb_personnes'           => (int) $row['nb_personnes'],
                'prix_menu'              => (float) $row['prix_menu'],
                'prix_livraison'         => (float) $row['prix_livraison'],
                'prix_total'             => (float) $row['prix_total'],
                'commentaire'            => $row['commentaire'],
                'location_materiel'      => $row['location_materiel'],
                'motif_annulation'       => $row['motif_annulation'],
                'mode_contact'           => $row['mode_contact'],
                'user_id'                => (int) $row['user_id'],
                'menu_id'                => (int) $row['menu_id'],
                'menu_titre'             => $row['menu_titre'],
                'statut'                 => $row['statut'],
                'created_at'             => $this->toUTCDateTime($row['created_at']),
                'updated_at'             => $row['updated_at'] ? $this->toUTCDateTime($row['updated_at']) : null,
                'synced_at'              => new MongoDB\BSON\UTCDateTime()
            ];
        }, $rows);

        $this->collection->insertMany($documents);
        return count($documents);
    }

    /**
     * Convertit une date MySQL (heure Paris) en UTCDateTime MongoDB
     */
    private function toUTCDateTime(string $dateStr): MongoDB\BSON\UTCDateTime
    {
        $dt = new DateTime($dateStr, $this->parisTimezone);
        $dt->setTimezone(new DateTimeZone('UTC'));
        return new MongoDB\BSON\UTCDateTime($dt->getTimestamp() * 1000);
    }

    /**
     * Nombre de commandes par menu (pour graphique comparatif)
     * Filtres optionnels : date_debut, date_fin
     */
    public function getCommandesParMenu(?string $dateDebut = null, ?string $dateFin = null): array
    {
        $pipeline = [];

        // Filtre par durée si fourni
        $match = $this->buildDateMatch($dateDebut, $dateFin);
        if (!empty($match)) {
            $pipeline[] = ['$match' => $match];
        }

        $pipeline[] = [
            '$group' => [
                '_id'           => ['menu_id' => '$menu_id', 'menu_titre' => '$menu_titre'],
                'nb_commandes'  => ['$sum' => 1]
            ]
        ];
        $pipeline[] = ['$sort' => ['nb_commandes' => -1]];

        $cursor = $this->collection->aggregate($pipeline);

        $stats = [];
        foreach ($cursor as $doc) {
            $stats[] = [
                'menu_id'       => $doc['_id']['menu_id'],
                'menu'          => $doc['_id']['menu_titre'],
                'nb_commandes'  => $doc['nb_commandes']
            ];
        }
        return $stats;
    }

    /**
     * Chiffre d'affaires par menu avec filtres (menu + durée)
     */
    public function getChiffreAffaires(?int $menuId = null, ?string $dateDebut = null, ?string $dateFin = null): array
    {
        $pipeline = [];

        // Construction du filtre
        $match = $this->buildDateMatch($dateDebut, $dateFin);
        if ($menuId) {
            $match['menu_id'] = $menuId;
        }
        if (!empty($match)) {
            $pipeline[] = ['$match' => $match];
        }

        $pipeline[] = [
            '$group' => [
                '_id'           => ['menu_id' => '$menu_id', 'menu_titre' => '$menu_titre'],
                'nb_commandes'  => ['$sum' => 1],
                'ca'            => ['$sum' => '$prix_total']
            ]
        ];
        $pipeline[] = ['$sort' => ['ca' => -1]];

        $cursor = $this->collection->aggregate($pipeline);

        $stats = [];
        $totalCA = 0;
        $totalCommandes = 0;

        foreach ($cursor as $doc) {
            $ca = round((float) $doc['ca'], 2);
            $nb = $doc['nb_commandes'];
            $totalCA += $ca;
            $totalCommandes += $nb;

            $stats[] = [
                'menu_id'       => $doc['_id']['menu_id'],
                'menu'          => $doc['_id']['menu_titre'],
                'nb_commandes'  => $nb,
                'ca'            => $ca
            ];
        }

        return [
            'details'          => $stats,
            'total_ca'         => round($totalCA, 2),
            'total_commandes'  => $totalCommandes
        ];
    }

    /**
     * Top clients
     */
    public function getTopClients(int $limit = 10): array
    {
        $cursor = $this->collection->aggregate([
            ['$group' => [
                '_id' => [
                    'nom'    => '$nom_client',
                    'prenom' => '$prenom_client'
                ],
                'nb_commandes' => ['$sum' => 1],
                'ca'           => ['$sum' => '$prix_total']
            ]],
            ['$sort' => ['ca' => -1]],
            ['$limit' => $limit]
        ]);

        $stats = [];
        foreach ($cursor as $doc) {
            $stats[] = [
                'client'       => $doc['_id']['prenom'] . ' ' . $doc['_id']['nom'],
                'nb_commandes' => $doc['nb_commandes'],
                'ca'           => round((float) $doc['ca'], 2)
            ];
        }
        return $stats;
    }

    /**
     * Liste des menus distincts (pour alimenter les filtres côté front)
     */
    public function getMenusDisponibles(): array
    {
        $cursor = $this->collection->distinct('menu_titre');
        $menus = [];

        // Récupérer aussi les IDs
        $pipeline = [
            ['$group' => [
                '_id' => ['menu_id' => '$menu_id', 'menu_titre' => '$menu_titre']
            ]],
            ['$sort' => ['_id.menu_titre' => 1]]
        ];

        $result = $this->collection->aggregate($pipeline);

        foreach ($result as $doc) {
            $menus[] = [
                'menu_id'    => $doc['_id']['menu_id'],
                'menu_titre' => $doc['_id']['menu_titre']
            ];
        }

        return $menus;
    }

    /**
     * Dashboard admin complet
     */
    public function getDashboard(): array
    {
        return [
            'commandes_par_menu' => $this->getCommandesParMenu(),
            'chiffre_affaires'   => $this->getChiffreAffaires(),
            'top_clients'        => $this->getTopClients(),
            'menus_disponibles'  => $this->getMenusDisponibles()
        ];
    }

    /**
     * Construit le filtre $match pour les dates
     */
    private function buildDateMatch(?string $dateDebut, ?string $dateFin): array
    {
        $match = [];

        if ($dateDebut || $dateFin) {
            $dateFilter = [];
            if ($dateDebut) {
                $dateFilter['$gte'] = $this->toUTCDateTime($dateDebut . ' 00:00:00');
            }
            if ($dateFin) {
                $dateFilter['$lte'] = $this->toUTCDateTime($dateFin . ' 23:59:59');
            }
            $match['created_at'] = $dateFilter;
        }

        return $match;
    }
}
