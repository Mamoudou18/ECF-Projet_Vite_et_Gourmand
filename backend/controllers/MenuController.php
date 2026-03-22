<?php

require_once __DIR__ . '/../models/Menu.php';
require_once __DIR__ . '/../utils/ValidationService.php';
require_once __DIR__ . '/../utils/ResponseService.php';
require_once __DIR__ . '/../config/database.php';

class MenuController
{
    private Menu $menu;
    private ValidationService $validator;
    private ResponseService $response;
    private \PDO $pdo;

    private string $uploadDir;
    private string $uploadUrl = '/uploads/menus/';

    public function __construct()
    {
        $this->pdo       = Database::getInstance();
        $this->menu      = new Menu($this->pdo);
        $this->validator = new ValidationService();
        $this->response  = new ResponseService();
        $this->uploadDir = __DIR__ . '/../public/uploads/menus/';
    }

    // ─────────────────────────────────────────
    // GET /api/menus
    // ─────────────────────────────────────────
    public function list(): void
    {
        $menus = $this->menu->getTous();
        $this->response->success([
            'menus' => $menus,
            'total' => count($menus)
        ]);
    }

    // ─────────────────────────────────────────
    // GET /api/menus?id={id}
    // ─────────────────────────────────────────
    public function detail(): void
    {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

        if (!$id) {
            $this->response->error('ID manquant ou invalide.', 400);
            return;
        }

        $menu = $this->menu->getById($id);

        if (!$menu) {
            $this->response->error('Menu introuvable.', 404);
            return;
        }

        $this->response->success(['menu' => $menu]);
    }

    // ─────────────────────────────────────────
    // POST /api/menus
    // ─────────────────────────────────────────
    public function create(): void
    {
        $data  = $_POST;
        $files = $_FILES;

        $plats     = json_decode($data['plats']      ?? '[]', true) ?? [];
        $regimeIds = json_decode($data['regime_ids'] ?? '[]', true) ?? [];
        $themeId   = isset($data['theme_id']) ? (int) $data['theme_id'] : null;

        $data['theme_id']   = $themeId;
        $data['plats']      = $plats;
        $data['regime_ids'] = $regimeIds;

        $errors = $this->validator->validateMenu($data);
        if (!empty($errors)) {
            $this->response->error('Données invalides.', 422, $errors);
            return;
        }

        try {
            $this->pdo->beginTransaction();

            $menuId = $this->menu->creer([
                'titre'            => $data['titre'],
                'description'      => $data['description']      ?? '',
                'conditions'       => $data['conditions']        ?? '',
                'stock'            => (int)   ($data['stock']            ?? 0),
                'prix_base'        => (float) ($data['prix_base']        ?? 0),
                'nb_personnes_min' => (int)   ($data['nb_personnes_min'] ?? 1),
            ]);

            if ($themeId) {
                $this->menu->ajouterTheme($menuId, $themeId);
            }

            if (!empty($regimeIds)) {
                $this->menu->ajouterRegimes($menuId, $regimeIds);
            }

            $typeMap = ['entree' => 1, 'plat' => 2, 'dessert' => 3];

            if (!empty($plats)) {
                foreach ($plats as $trio) {
                    foreach ($typeMap as $cle => $typeId) {
                        if (!empty($trio[$cle])) {
                            $this->menu->ajouterPlat($menuId, [
                                'nom'         => $trio[$cle]['nom'],
                                'description' => $trio[$cle]['description'] ?? '',
                                'type_id'     => $typeId,
                                'allergenes'  => $trio[$cle]['allergenes']  ?? [],
                            ]);
                        }
                    }
                }
            }

            // ── Image principale
            if (!empty($files['img_principale']['name'])) {
                $url = $this->uploadImage([
                    'tmp_name' => $files['img_principale']['tmp_name'],
                    'name'     => $files['img_principale']['name'],
                    'type'     => mime_content_type($files['img_principale']['tmp_name']),
                    'size'     => filesize($files['img_principale']['tmp_name'])
                ]);
                if (!$url) {
                    $this->pdo->rollBack();
                    $this->response->error("Erreur upload image principale", 422);
                    return;
                }
                $this->menu->ajouterImage($menuId, $url, 0);
            }

            // ── Images des plats indexées (img_entree_0, img_plat_0, img_dessert_0, ...)
            $typeOrdreMap = ['img_entree' => 1, 'img_plat' => 2, 'img_dessert' => 3];

            foreach ($plats as $index => $trio) {
                foreach ($typeOrdreMap as $prefix => $ordre) {
                    $key = "{$prefix}_{$index}";
                    if (empty($files[$key]['name'])) continue;

                    $url = $this->uploadImage([
                        'tmp_name' => $files[$key]['tmp_name'],
                        'name'     => $files[$key]['name'],
                        'type'     => mime_content_type($files[$key]['tmp_name']),
                        'size'     => filesize($files[$key]['tmp_name'])
                    ]);

                    if (!$url) {
                        $this->pdo->rollBack();
                        $this->response->error("Erreur upload image : $key", 422);
                        return;
                    }
                    $this->menu->ajouterImage($menuId, $url, $ordre);
                }
            }


            $this->pdo->commit();
            $this->response->success(['message' => 'Menu créé avec succès.', 'id' => $menuId], 201);

        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->response->error('Erreur lors de la création : ' . $e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────
    // PUT /api/menus?id={id}
    // ─────────────────────────────────────────
    public function update(): void
    {
        
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

        if (!$id) {
            $this->response->error('ID manquant ou invalide.', 400);
            return;
        }

        $existing = $this->menu->getById($id);
        if (!$existing) {
            $this->response->error('Menu introuvable.', 404);
            return;
        }

        $data  = $_POST;
        $files = $_FILES;
        
        // ── null = non envoyé = ne pas toucher
        // ── []   = envoyé vide = intention de tout vider
        // ── [..] = remplacer
        $plats            = isset($data['plats'])              ? (json_decode($data['plats'], true)              ?? []) : null;
        $regimeIds        = isset($data['regime_ids'])         ? (json_decode($data['regime_ids'], true)         ?? []) : null;
        $themeId          = isset($data['theme_id'])           ? (int) $data['theme_id']                               : null;
        $imagesASupprimer = isset($data['images_a_supprimer']) ? (json_decode($data['images_a_supprimer'], true) ?? []) : [];

        $errors = $this->validator->validateMenuUpdate($data);
        if (!empty($errors)) {
            $this->response->error('Données invalides.', 422, $errors);
            return;
        }

        try {
            $this->pdo->beginTransaction();

            // ── Champs de base : fallback sur l'existant si absent
            $this->menu->majBase($id, [
                'titre'            => $data['titre']            ?? $existing['titre'],
                'description'      => $data['description']      ?? $existing['description'],
                'conditions'       => $data['conditions']       ?? $existing['conditions'],
                'stock'            => (int)   ($data['stock']            ?? $existing['stock']),
                'prix_base'        => (float) ($data['prix_base']        ?? $existing['prix_base']),
                'nb_personnes_min' => (int)   ($data['nb_personnes_min'] ?? $existing['nb_personnes_min']),
            ]);

            // ── Thème : on ne touche que si theme_id est envoyé
            if (array_key_exists('theme_id', $data)) {
                $this->menu->supprimerTheme($id);
                if ($themeId) {
                    $this->menu->ajouterTheme($id, $themeId);
                }
            }

            // ── Régimes : null = inchangé | [] = tout vider | [...] = remplacer
            if ($regimeIds !== null) {
                $this->menu->supprimerRegimes($id);
                if (!empty($regimeIds)) {
                    $this->menu->ajouterRegimes($id, $regimeIds);
                }
            }

            // ── Plats : null = inchangé | [] = tout vider | [...] = remplacer
            if ($plats !== null) {
                // Supprime les anciens plats + leurs allergènes
                $stmtPlats = $this->pdo->prepare("SELECT plat_id FROM menu_plat WHERE menu_id = :id");
                $stmtPlats->execute([':id' => $id]);
                $ancienPlats = $stmtPlats->fetchAll(PDO::FETCH_COLUMN);

                foreach ($ancienPlats as $platId) {
                    $this->pdo->prepare("DELETE FROM plat_allergene WHERE plat_id = :id")
                              ->execute([':id' => $platId]);
                    $this->pdo->prepare("DELETE FROM plats WHERE id = :id")
                              ->execute([':id' => $platId]);
                }
                $this->menu->supprimerPlats($id);

                // Recrée si non vide
                if (!empty($plats)) {
                    $typeMap = ['entree' => 1, 'plat' => 2, 'dessert' => 3];
                    foreach ($plats as $trio) {
                        foreach ($typeMap as $cle => $typeId) {
                            if (!empty($trio[$cle])) {
                                $this->menu->ajouterPlat($id, [
                                    'nom'         => $trio[$cle]['nom'],
                                    'description' => $trio[$cle]['description'] ?? '',
                                    'type_id'     => $typeId,
                                    'allergenes'  => $trio[$cle]['allergenes']  ?? [],
                                ]);
                            }
                        }
                    }
                }
            }

            // ── Images à supprimer : suppression ciblée par ID
            $urlsASupprimer = [];
            if (!empty($imagesASupprimer)) {
                $stmtImg = $this->pdo->prepare("SELECT url FROM menu_images WHERE id = :id AND menu_id = :menu_id");
                $delImg  = $this->pdo->prepare("DELETE FROM menu_images WHERE id = :id");

                foreach ($imagesASupprimer as $imageId) {
                    $stmtImg->execute([':id' => $imageId, ':menu_id' => $id]);
                    $row = $stmtImg->fetch(PDO::FETCH_ASSOC);
                    if ($row) {
                        $urlsASupprimer[] = $row['url'];
                        $delImg->execute([':id' => $imageId]);
                    }
                }
            }

            // ── Nouvelles images : on ajoute seulement si envoyées
            $imageKeys = [
                'img_principale' => 0,
                'img_entree'     => 1,
                'img_plat'       => 2,
                'img_dessert'    => 3,
            ];

            foreach ($imageKeys as $key => $ordre) {
                if (empty($files[$key]['name'])) continue;

                $names        = (array) $files[$key]['name'];
                $tmps         = (array) $files[$key]['tmp_name'];
                $uploadErrors = (array) $files[$key]['error'];

                foreach ($names as $i => $name) {
                    if ($uploadErrors[$i] !== UPLOAD_ERR_OK) continue;

                    $url = $this->uploadImage([
                        'tmp_name' => $tmps[$i],
                        'name'     => $name,
                        'type'     => mime_content_type($tmps[$i]),
                        'size'     => filesize($tmps[$i])
                    ]);

                    if (!$url) {
                        $this->pdo->rollBack();
                        $this->response->error("Erreur upload image : $key", 422);
                        return;
                    }
                    $this->menu->ajouterImage($id, $url, $ordre);
                }
            }

            $this->pdo->commit();

            // ── Suppression fichiers physiques APRÈS commit
            foreach ($urlsASupprimer as $url) {
                $chemin = __DIR__ . '/../../' . ltrim($url, '/');
                if (file_exists($chemin)) unlink($chemin);
            }

            $this->response->success(['message' => 'Menu mis à jour avec succès.', 'id' => $id]);

        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->response->error('Erreur lors de la mise à jour : ' . $e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────
    // PATCH /api/menus?id={id}
    // ─────────────────────────────────────────
    public function toggle(): void
    {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

        if (!$id) {
            $this->response->error('ID manquant ou invalide.', 400);
            return;
        }

        $existing = $this->menu->getById($id);
        if (!$existing) {
            $this->response->error('Menu introuvable.', 404);
            return;
        }

        try {
            $newStatut = $existing['is_active'] ? 0 : 1;
            $this->menu->toggleActif($id, $newStatut);

            $this->response->success([
                'message' => 'Statut mis à jour.',
                'is_active'   => (bool) $newStatut
            ]);

        } catch (Exception $e) {
            $this->response->error('Erreur lors du toggle : ' . $e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────
    // DELETE /api/menus?id={id}
    // ─────────────────────────────────────────
    public function delete(): void
    {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

        if (!$id) {
            $this->response->error('ID manquant ou invalide.', 400);
            return;
        }

        $existing = $this->menu->getById($id);
        if (!$existing) {
            $this->response->error('Menu introuvable.', 404);
            return;
        }

        try {
            $this->pdo->beginTransaction();

            $urlsASupprimer = [];
            if (!empty($existing['images'])) {
                foreach (explode(', ', $existing['images']) as $imageUrl) {
                    $urlsASupprimer[] = trim($imageUrl);
                }
            }

            $stmt = $this->pdo->prepare("DELETE FROM menus WHERE id = :id");
            $stmt->execute([':id' => $id]);

            $this->pdo->commit();

            foreach ($urlsASupprimer as $url) {
                $this->deleteImage($url);
            }

            $this->response->success(['message' => 'Menu supprimé avec succès.']);

        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->response->error('Erreur lors de la suppression : ' . $e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────
    // Méthodes privées
    // ─────────────────────────────────────────

    private function uploadImage(array $file): string|false
    {
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        $maxSize      = 10 * 1024 * 1024; //10Mo

        if (!in_array($file['type'], $allowedTypes)) {
            error_log('type not allowed: ' . $file['type']);
            return false;
        }
        if ($file['size'] > $maxSize) {
            error_log('file too big');
            return false;
        }

        if (!is_dir($this->uploadDir)) {
            error_log('creating dir: ' . $this->uploadDir);
            mkdir($this->uploadDir, 0755, true);
        }

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename  = uniqid('menu_', true) . '.' . $extension;
        $dest      = $this->uploadDir . $filename;

        error_log('dest: ' . $dest);

        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            error_log('move_uploaded_file failed');
            return false;
        }

        return $this->uploadUrl . $filename;
    }


    private function deleteImage(string $imageUrl): void
    {
        $filename = basename($imageUrl);
        $path     = $this->uploadDir . $filename;

        if (file_exists($path)) {
            unlink($path);
        }
    }
}
