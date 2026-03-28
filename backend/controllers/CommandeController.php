<?php

require_once __DIR__ . '/../models/Commande.php';
require_once __DIR__ . '/../mails/commandeTermineeMail.php';
require_once __DIR__ . '/../models/HistoriqueStatut.php';
require_once __DIR__ . '/../utils/ValidationService.php';
require_once __DIR__ . '/../utils/ResponseService.php';
require_once __DIR__ . '/../config/database.php';

class CommandeController
{
    private Commande $commande;
    private HistoriqueStatut $historique;
    private ValidationService $validator;
    private ResponseService $response;
    private \PDO $pdo;

    public function __construct()
    {
        $this->pdo        = Database::getInstance();
        $this->commande   = new Commande($this->pdo);
        $this->historique = new HistoriqueStatut($this->pdo);
        $this->validator  = new ValidationService();
        $this->response   = new ResponseService();
    }

    // ─────────────────────────────────────────
    // Méthodes privées utilitaires
    // ─────────────────────────────────────────

    private function getId(): int
    {
        return isset($_GET['id']) ? (int) $_GET['id'] : 0;
    }

    private function getJsonBody(): ?array
    {
        $data = json_decode(file_get_contents('php://input'), true);
        return is_array($data) && !empty($data) ? $data : null;
    }

    private function findCommandeOrFail(int $id): ?array
    {
        $commande = $this->commande->getById($id);
        if (!$commande) {
            $this->response->error('Commande introuvable.', 404);
            return null;
        }
        return $commande;
    }

    private function changerStatut(int $commandeId, string $nomStatut, ?int $modifiePar = null, ?string $commentaire = null): void
    {
        $statutId = $this->commande->getStatutId($nomStatut);
        $this->commande->updateStatut($commandeId, $statutId);
        $this->historique->ajouterHistorique($commandeId, $statutId, $modifiePar, $commentaire);
    }

    // ─────────────────────────────────────────
    // GET /api/commande/affiche
    // ─────────────────────────────────────────
    public function afficheCommande(): void
    {
        $commandes = $this->commande->getAllCommande();
        $this->response->success([
            'commandes' => $commandes,
            'total'     => count($commandes)
        ]);
    }

    // ─────────────────────────────────────────
    // GET /api/commande/detail-commande?id={id}
    // ─────────────────────────────────────────
    public function detailCommande(): void
    {
        $id = $this->getId();
        if (!$id) {
            $this->response->error('ID manquant ou invalide.', 400);
            return;
        }

        $commande = $this->findCommandeOrFail($id);
        if (!$commande) return;

        $this->response->success(['commande' => $commande]);
    }

    // ─────────────────────────────────────────
    // GET /api/commande/user-commande?id={user_id}
    // ─────────────────────────────────────────
    public function getByUser(): void
    {
        $userId = $this->getId();
        if (!$userId) {
            $this->response->error('User ID manquant.', 400);
            return;
        }

        $commandes = $this->commande->getByUserId($userId);

        if (empty($commandes)) {
            $this->response->error('Aucune commande trouvée.', 404);
            return;
        }

        $this->response->success(['commandes' => $commandes]);
    }

    // ─────────────────────────────────────────
    // POST /api/commande/create-commande
    // ─────────────────────────────────────────
    public function createCommande(): void
    {
        $data = $this->getJsonBody();
        if (!$data) {
            $this->response->error('Données invalides.', 400);
            return;
        }

        $errors = $this->validator->validateCommande($data);
        if (!empty($errors)) {
            $this->response->error('Erreur de validation.', 422, $errors);
            return;
        }

        try {
            $this->pdo->beginTransaction();

            $commandeId = $this->commande->createCommande($data);
            if (!$commandeId) {
                $this->pdo->rollBack();
                $this->response->error('Erreur lors de la création.', 500);
                return;
            }

            $this->changerStatut($commandeId, 'en_attente', $data['user_id'] ?? null, 'Commande créée');

            $mailCreateCommande = CommandeCreateMail::send(
                $data['email_client'],
                $data['prenom_client'],
                $data['nom_client'], 
                $data['numero_commande'], 
                $data['prix_total'], 
                $data['adresse_prestation'], 
                $data['ville_prestation'],
                $data['code_postal_prestation']
            );

            $this->pdo->commit();
            $this->response->success([
                'message'     => 'Commande créée avec succès.',
                'commande_id' => $commandeId,
                'mail_debug' => $mailCreateCommande
            ], 201);

        } catch (\Exception $e) {
            $this->pdo->rollBack();
            $this->response->error('Erreur : ' . $e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────
    // PUT /api/commande/update-commande?id={id}
    // ─────────────────────────────────────────
    public function updateCommande(): void
    {
        $id = $this->getId();
        if (!$id) {
            $this->response->error('ID invalide.', 400);
            return;
        }

        $commande = $this->findCommandeOrFail($id);
        if (!$commande) return;

        // Vérifier que la commande est encore modifiable (en_attente)
        if ($commande['statut'] !== 'en_attente') {
            $this->response->error('Seules les commandes en attente peuvent être modifiées.', 403);
            return;
        }

        $data = $this->getJsonBody();
        if (!$data) {
            $this->response->error('Données invalides.', 400);
            return;
        }

        $errors = $this->validator->validateCommandeUpdate($data);
        if (!empty($errors)) {
            $this->response->error('Erreur de validation.', 422, $errors);
            return;
        }

        try {
            $success = $this->commande->updateCommande($id, $data);
            if (!$success) {
                $this->response->error('Erreur lors de la mise à jour.', 500);
                return;
            }

            $this->response->success(['message' => 'Commande mise à jour avec succès.']);

        } catch (\Exception $e) {
            $this->response->error('Erreur : ' . $e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────
    // PUT /api/commande/change-statut?id={id}
    // ─────────────────────────────────────────
    public function changerStatutCommande(): void
    {
        $id = $this->getId();
        if (!$id) {
            $this->response->error('ID invalide.', 400);
            return;
        }

        $commande = $this->findCommandeOrFail($id);
        if (!$commande) return;

        $data = $this->getJsonBody();
        if (!$data) {
            $this->response->error('Données manquantes.', 400);
            return;
        }

        $nouveauStatut = $data['statut'] ?? null;
        $modifiePar    = $data['modifie_par'] ?? null;
        $commentaire   = $data['commentaire'] ?? null;

        if (!$nouveauStatut) {
            $this->response->error('Le statut est requis.', 422);
            return;
        }

        // Transitions autorisées
        $transitions = [
            'en_attente'              => ['accepte', 'annulee'],
            'accepte'                 => ['en_preparation'],
            'en_preparation'          => ['en_cours_livraison'],
            'en_cours_livraison'      => ['livre'],
            'livre'                   => ['attente_retour_materiel', 'terminee'],
            'attente_retour_materiel' => ['terminee'],
            'terminee'                => [],
            'annulee'                 => []
        ];

        $statutActuel = $commande['statut'];

        if (!isset($transitions[$statutActuel]) || !in_array($nouveauStatut, $transitions[$statutActuel])) {
            $this->response->error(
                "Transition impossible : '$statutActuel' → '$nouveauStatut'.", 403
            );
            return;
        }

        try {
            $this->pdo->beginTransaction();
            $this->changerStatut($id, $nouveauStatut, $modifiePar, $commentaire);
            $this->pdo->commit();

            if ($nouveauStatut === 'terminee') {
                $avisLink = ($_ENV['FRONTEND_URL'] ?? 'http://localhost:3000') . '/utilisateur';

                $client = $this->commande->getById($id);
                if ($client) {
                    CommandeTermineeMail::send(
                        $client['email_client'],
                        $client['prenom_client'],
                        $client['numero_commande'],
                        $avisLink
                    );
                }
            }


            $this->response->success(['message' => "Statut changé en '$nouveauStatut'."]);

        } catch (\Exception $e) {
            $this->pdo->rollBack();
            $this->response->error('Erreur : ' . $e->getMessage(), 500);
        }
    }


    // ─────────────────────────────────────────
    // DELETE /api/commande/delete-commande?id={id}
    // ─────────────────────────────────────────
    public function deleteCommande(): void
    {
        $id = $this->getId();
        if (!$id) {
            $this->response->error('ID invalide.', 400);
            return;
        }

        $commande = $this->findCommandeOrFail($id);
        if (!$commande) return;

        try {
            $success = $this->commande->deleteCommande($id);
            if (!$success) {
                $this->response->error('Erreur lors de la suppression.', 500);
                return;
            }

            $this->response->success(['message' => 'Commande supprimée avec succès.']);

        } catch (\Exception $e) {
            $this->response->error('Erreur : ' . $e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────
    // PUT /api/commande/annule-commande?id={id}
    // ─────────────────────────────────────────
    public function annulerCommande(): void
    {
        $id = $this->getId();
        if (!$id) {
            $this->response->error('ID invalide.', 400);
            return;
        }

        $commande = $this->findCommandeOrFail($id);
        if (!$commande) return;

        if ($commande['statut'] === 'annulee') {
            $this->response->error('Cette commande est déjà annulée.', 400);
            return;
        }

        if ($commande['statut'] === 'accepte') {
            $this->response->error('Impossible d\'annuler une commande déjà acceptée.', 403);
            return;
        }

        $data = $this->getJsonBody();
        $motif      = $data['motif_annulation'] ?? null;
        $modifiePar = $data['modifie_par'] ?? null;

        if (!$motif || trim($motif) === '') {
            $this->response->error('Le motif d\'annulation est requis.', 422);
            return;
        }

        try {
            $this->pdo->beginTransaction();

            // Récupérer le menu_id depuis la table commandes
            $stmMenu = $this->pdo->prepare("SELECT menu_id FROM commandes WHERE id = :id");
            $stmMenu->execute(['id' => $id]);
            $menuData = $stmMenu->fetch();

            $this->commande->restaurerStock($menuData['menu_id']);

            $this->commande->updateMotifAnnulation($id, $motif);
            $this->changerStatut($id, 'annulee', $modifiePar, "Annulation : $motif");

            $this->pdo->commit();
            $this->response->success(['message' => 'Commande annulée et stock restauré.']);

        } catch (\Exception $e) {
            $this->pdo->rollBack();
            $this->response->error('Erreur : ' . $e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────
    // GET /api/commande/historique?id={id}
    // ─────────────────────────────────────────
    public function historiqueCommande(): void
    {
        $id = $this->getId();
        if (!$id) {
            $this->response->error('ID invalide.', 400);
            return;
        }

        try {
            $historique = $this->historique->getByCommandeId($id);

            // Vérifier si la commande a dépassé le statut "en_attente"
            $statuts = array_column($historique, 'statut_libelle');
            if (count($statuts) === 1 && $statuts[0] === 'en_attente') {
                $this->response->error('Le suivi n\'est pas encore disponible pour cette commande.', 403);
                return;
            }

            $this->response->success([
                'commande_id' => $id,
                'historique'  => $historique,
                'total'       => count($historique)
            ]);

        } catch (\Exception $e) {
            $this->response->error('Erreur : ' . $e->getMessage(), 500);
        }
    }

}
