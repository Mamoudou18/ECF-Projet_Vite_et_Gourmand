<?php

class ConfigController {
    public function getMapsKey() {
        $key = $_ENV['GOOGLE_MAPS_API_KEY'] ?? null;

        if (!$key) {
            http_response_code(500);
            echo json_encode(['error' => 'Clé API non configurée']);
            return;
        }

        echo json_encode(['key' => $key]);
    }
}