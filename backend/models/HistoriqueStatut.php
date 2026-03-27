<?php
class HistoriqueStatut
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }
    public function ajouterHistorique(int $commandeId, int $statutId, int $modifiePar, ?string $commentaire = null): bool
    {
        $stm = $this->pdo->prepare("
            INSERT INTO commande_historique_statuts (commande_id, statut_id, modifie_par, commentaire)
            VALUES (:commande_id, :statut_id, :modifie_par, :commentaire)
        ");
        return $stm->execute([
            ':commande_id' => $commandeId,
            ':statut_id'   => $statutId,
            ':modifie_par'  => $modifiePar,
            ':commentaire'  => $commentaire
        ]);
    }
    public function getByCommandeId(int $commandeId): array
    {
        $stm = $this->pdo->prepare("
            SELECT h.*, s.libelle AS statut_libelle
            FROM commande_historique_statuts h
            JOIN statuts_commande s ON s.id = h.statut_id
            WHERE h.commande_id = :commande_id
            ORDER BY h.created_at ASC
        ");

        $stm->execute([':commande_id' => $commandeId]);
        return $stm->fetchAll(PDO::FETCH_ASSOC);
    }
}