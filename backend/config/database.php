<?php
class Database {
    private static ?PDO $instance = null;

    private function __construct() {}

    public static function getInstance(): PDO {
        if (self::$instance === null) {
            $host     = $_ENV['DB_HOST']     ?? 'localhost';
            $dbname   = $_ENV['DB_NAME']     ?? 'ViteGourmandRestaurent_db';
            $user     = $_ENV['DB_USER']     ?? 'mamoudou';
            $password = $_ENV['DB_PASSWORD'] ?? '';
            $charset  = 'utf8mb4';

            $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

            self::$instance = new PDO($dsn, $user, $password, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
            
            // Timezone Paris automatique (été +02:00, hiver +01:00)
            $offset = (new DateTimeZone('Europe/Paris'))->getOffset(new DateTime());
            $signe  = $offset >= 0 ? '+' : '-';
            $tz     = sprintf("%s%02d:00", $signe, abs($offset) / 3600);
            self::$instance->exec("SET time_zone = '$tz'");
        }

        return self::$instance;
    }
}
