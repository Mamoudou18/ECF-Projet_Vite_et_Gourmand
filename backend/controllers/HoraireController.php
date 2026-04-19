<?php

require_once __DIR__ . '/../models/Horaire.php';
require_once __DIR__ . '/../utils/ValidationService.php';
require_once __DIR__ . '/../utils/ResponseService.php';
require_once __DIR__ . '/../utils/LogService.php';
require_once __DIR__ . '/../config/database.php';

class HoraireController
{
    private Horaire $horaireModel;
    private ValidationService $validator;
    private ResponseService $response;
    private LogService $logger;
    private \PDO $pdo;

    public function __construct()
    {
        $this->pdo        = Database::getInstance();
        $this->horaireModel = new Horaire($this->pdo);
        $this->validator    = new ValidationService();
        $this->response     = new ResponseService();
        $this->logger       = new LogService();
    }

    /**
     * Liste de tous les horaires (public)
     */
    public function listHoraire(): void
    {
        try {
            $horaires = $this->horaireModel->getAll();

            $this->response->success([
                'message'  => 'Liste des horaires',
                'horaires' => $horaires
            ], 200);

        } catch (\Exception $e) {
            $this->logger->error($e->getMessage());
            $this->response->error('Erreur lors de la récupération des horaires.', 500);
        }
    }

    /**
     * Mise à jour de tous les horaires (admin uniquement)
     */
    public function updateHoraire(): void
    {
        $currentUser = $_REQUEST['auth_user'] ?? null;

        if (!$currentUser || !in_array($currentUser['role'], ['admin', 'employe'])) {
            $this->response->error('Accès refusé.', 403);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!is_array($data) || !isset($data['horaires']) || !is_array($data['horaires'])) {
            $this->response->error('Données invalides.', 400);
            return;
        }

        // Validation de chaque horaire
        foreach ($data['horaires'] as $h) {
            if (!isset($h['jour_id']) || !is_numeric($h['jour_id'])) {
                $this->response->error('jour_id manquant ou invalide.', 422);
                return;
            }

            $isFerme = !empty($h['is_ferme']);

            if (!$isFerme) {
                if (empty($h['heure_ouverture']) || empty($h['heure_fermeture'])) {
                    $this->response->error("Heures manquantes pour jour_id {$h['jour_id']}.", 422);
                    return;
                }
                if ($h['heure_ouverture'] >= $h['heure_fermeture']) {
                    $this->response->error("L'heure d'ouverture doit être avant la fermeture (jour_id {$h['jour_id']}).", 422);
                    return;
                }
            }
        }

        try {
            $this->horaireModel->updateAll($data['horaires']);

            $this->response->success([
                'message' => 'Horaires mis à jour avec succès.'
            ], 200);

        } catch (\Exception $e) {
            $this->logger->error($e->getMessage());
            $this->response->error('Erreur lors de la mise à jour des horaires.', 500);
        }
    }
}
