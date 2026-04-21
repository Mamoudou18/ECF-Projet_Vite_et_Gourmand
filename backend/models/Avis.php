<?php

require_once __DIR__ . '/../vendor/autoload.php';

class Avis
{
    /** @var \MongoDB\Collection $collection */
    private $collection;

    public function __construct()
    {
        $client = new MongoDB\Client($_ENV['MONGO_URI'] ?? 'mongodb://mongodb:27017');
        $db = $client->selectDatabase($_ENV['MONGO_DB'] ?? 'vite_gourmand_db');
        $this->collection = $db->selectCollection('avis');
    }

    public function creerAvis(array $data): string
    {
        $avis = [
            'id_user'          => (int) $data['id_user'],
            'id_commande'      => (int) $data['id_commande'],
            'numero_commande'  => $data['numero_commande'],
            'nom_client'       => $data['nom_client'],
            'prenom_client'    => $data['prenom_client'],
            'note'             => (float) $data['note'],
            'commentaire'      => trim($data['commentaire']),
            'statut'           => 'en_attente', // modération obligatoire
            'created_at'       => new MongoDB\BSON\UTCDateTime(),
            'updated_at'       => null
        ];

        $result = $this->collection->insertOne($avis);
        return (string) $result->getInsertedId();
    }

    public function getAvisByUserId(int $idUser): array
    {
        $cursor = $this->collection->find(
            ['id_user' => $idUser],
            ['sort' => ['created_at' => -1]]
        );

        $avis = [];
        foreach ($cursor as $doc) {
            $avis[] = $this->formatDoc($doc);
        }
        return $avis;
    }

    public function getAvisByCommandeId(int $idCommande): ?array
    {
        $doc = $this->collection->findOne(['id_commande' => $idCommande]);
        return $doc ? $this->formatDoc($doc) : null;
    }

    public function getAllAvis(?string $statut = null): array
    {
        $filter = $statut ? ['statut' => $statut] : [];
        $cursor = $this->collection->find($filter, ['sort' => ['created_at' => -1]]);

        $avis = [];
        foreach ($cursor as $doc) {
            $avis[] = $this->formatDoc($doc);
        }
        return $avis;
    }

    public function getAvisApprouves(): array
    {
        return $this->getAllAvis('approuve');
    }

    public function modererAvis(string $id, string $statut): bool
    {
        $result = $this->collection->updateOne(
            ['_id' => new MongoDB\BSON\ObjectId($id)],
            ['$set' => [
                'statut'     => $statut, // 'approuve' ou 'refuse'
                'updated_at' => new MongoDB\BSON\UTCDateTime()
            ]]
        );
        return $result->getModifiedCount() > 0;
    }

    private function formatDoc($doc): array
    {
        $parisTimezone = new DateTimeZone('Europe/Paris');

        return [
            'id'               => (string) $doc['_id'],
            'id_user'          => $doc['id_user'],
            'id_commande'      => $doc['id_commande'],
            'numero_commande'  => $doc['numero_commande'] ?? '',
            'nom_client'       => $doc['nom_client'] ?? '',
            'prenom_client'    => $doc['prenom_client'] ?? '',
            'note'             => $doc['note'],
            'commentaire'      => $doc['commentaire'],
            'statut'           => $doc['statut'],
            'created_at'       => isset($doc['created_at']) ? $doc['created_at']->toDateTime()->setTimezone($parisTimezone)->format('Y-m-d H:i:s') : null,
            'updated_at'       => isset($doc['updated_at']) ? $doc['updated_at']->toDateTime()->setTimezone($parisTimezone)->format('Y-m-d H:i:s') : null,

        ];
    }

    public function countByStatut(string $statut): int
    {
        return $this->collection->countDocuments(['statut' => $statut]);
    }

    public function getNoteMoyenne(): ?float
    {
        $pipeline = [
            ['$match' => ['statut' => 'approuve']],
            ['$group' => ['_id' => null, 'moyenne' => ['$avg' => '$note']]]
        ];
        /** @var array $result */
        $result = iterator_to_array($this->collection->aggregate($pipeline));
        return !empty($result) ? round($result[0]['moyenne'], 1) : null;
    }


}
