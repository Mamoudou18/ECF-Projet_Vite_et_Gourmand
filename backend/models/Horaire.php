<?php

class Horaire {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getAll() {
        $stmt = $this->pdo->query("
            SELECT h.id, h.jour_id, j.libelle AS jour, j.ordre,
                   h.heure_ouverture, h.heure_fermeture, h.is_ferme
            FROM horaires h
            JOIN jours j ON j.id = h.jour_id
            ORDER BY j.ordre
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateAll($horaires) {
        $stmt = $this->pdo->prepare("
            UPDATE horaires 
            SET heure_ouverture = :ouverture,
                heure_fermeture = :fermeture,
                is_ferme = :is_ferme
            WHERE jour_id = :jour_id
        ");

        foreach ($horaires as $h) {
            $stmt->execute([
                'ouverture'  => $h['is_ferme'] ? null : $h['heure_ouverture'],
                'fermeture'  => $h['is_ferme'] ? null : $h['heure_fermeture'],
                'is_ferme'   => $h['is_ferme'] ? 1 : 0,
                'jour_id'    => $h['jour_id']
            ]);
        }

        return true;
    }
}
