<?php

require_once __DIR__ . '/../vendor/autoload.php';

class Contact
{
    /** @var \MongoDB\Collection $collection */
    private $collection;

    public function __construct()
    {
        $client = new MongoDB\Client($_ENV['MONGO_URI'] ?? 'mongodb://localhost:27017');
        $db = $client->selectDatabase($_ENV['MONGO_DB'] ?? 'vite_gourmand_db');
        $this->collection = $db->selectCollection('demandesClient');
    }

    public function creerDemande(array $data): string
    {
        $demandes = [
            'email'          => $data['email'],
            'titre'          => $data['titre'],
            'description'    => $data['description'],
            'created_at'     => new MongoDB\BSON\UTCDateTime(),
        ];

        $result = $this->collection->insertOne($demandes);
        return (string) $result->getInsertedId();
    }

    private function formatDoc($doc): array
    {
        $parisTimezone = new DateTimeZone('Europe/Paris');

        return [
            'id'             => (string) $doc['_id'],
            'email'          => $doc['email'],
            'titre'          => $doc['titre'],
            'description'    => $doc['description'],
            'created_at'     => isset($doc['created_at']) ? $doc['created_at']->toDateTime()->setTimezone($parisTimezone)->format('Y-m-d H:i:s') : null
        ];
    }

}
