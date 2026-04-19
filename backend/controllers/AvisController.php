<?php

require_once __DIR__ . '/../models/Avis.php';
require_once __DIR__ . '/../models/Commande.php';
require_once __DIR__ . '/../utils/ValidationService.php';
require_once __DIR__ . '/../utils/ResponseService.php';
require_once __DIR__ . '/../config/database.php';

class AvisController
{
    private Avis $avis;
    private Commande $commande;
    private ValidationService $validator;
    private ResponseService $response;

    public function __construct()
    {
        $pdo = Database::getInstance();
        $this->avis      = new Avis();
        $this->commande  = new Commande($pdo);
        $this->validator = new ValidationService();
        $this->response  = new ResponseService();
    }

    public function creerAvis(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $errors = $this->validator->validateAvis($data);
        if (!empty($errors)) {
            $this->response->error('Données invalides', 400, $errors);
            return;
        }

        $commande = $this->commande->getById($data['id_commande']);
        if (!$commande) {
            $this->response->error('Commande introuvable', 404);
            return;
        }

        if ((int) $commande['user_id'] !== (int) $data['user_id']) {
            $this->response->error('Cette commande ne vous appartient pas', 403);
            return;
        }

        if ($commande['statut'] !== 'terminee') {
            $this->response->error('Vous ne pouvez donner un avis que sur une commande terminée', 400);
            return;
        }

        $existant = $this->avis->getAvisByCommandeId((int) $data['id_commande']);
        if ($existant) {
            $this->response->error('Vous avez déjà donné un avis pour cette commande', 409);
            return;
        }

        $id = $this->avis->creerAvis([
            'id_user'         => $data['user_id'],
            'id_commande'     => $data['id_commande'],
            'numero_commande' => $commande['numero_commande'],
            'nom_client'      => $commande['nom_client'] ?? '',
            'prenom_client'   => $commande['prenom_client'] ?? '',
            'note'            => (float) $data['note'],
            'commentaire'     => $data['commentaire']
        ]);

        $this->response->success(['message' => 'Avis enregistré, en attente de modération', 'id' => $id], 201);
    }

    public function getAvisByUser(): void
    {
        $idUser = (int) ($_GET['user_id'] ?? 0);
        if (!$idUser) {
            $this->response->error('user_id requis', 400);
            return;
        }

        $this->response->success(['avis' => $this->avis->getAvisByUserId($idUser)]);
    }

    public function getAvisApprouves(): void
    {
        $this->response->success(['avis' => $this->avis->getAvisApprouves()]);
    }

    public function getAllAvis(): void
    {
        $statut = $_GET['statut'] ?? null;
        $this->response->success(['avis' => $this->avis->getAllAvis($statut)]);
    }

    public function modererAvis(string $id): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $errors = $this->validator->validateModerationAvis($data);
        if (!empty($errors)) {
            $this->response->error('Données invalides', 400, $errors);
            return;
        }

        $success = $this->avis->modererAvis($id, $data['statut']);
        if ($success) {
            $this->response->success(['message' => 'Avis modéré avec succès']);
        } else {
            $this->response->error('Avis introuvable', 404);
        }
    }
}
