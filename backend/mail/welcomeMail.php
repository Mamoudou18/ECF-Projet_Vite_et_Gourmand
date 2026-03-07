<?php

class WelcomeMail
{
    public static function send(string $toEmail, string $prenom, string $nom): void
    {
        $subject = "Bienvenue chez Vite & Gourmand !";
        $from    = $_ENV['MAIL_FROM_ADRESS'] ?? 'mamoudou.traore240224@gmail.com';

        $message = "
        <html lang='fr'>
        <head><meta charset='UTF-8'></head>
        <body>
            <h1>Bienvenue {$prenom} {$nom} !</h1>
            <p>Nous sommes ravis de vous accueillir sur <strong>Vite & Gourmand</strong>.</p>
            <p>Votre compte a bien été créé avec l'adresse mail : <strong>{$toEmail}</strong></p>
            <p>Vous pouvez dès maintenant vous connecter et passer commande !</p>
            <p>À très bientôt,<br>L'équipe Vite & Gourmand</p>
        </body>
        </html>
        ";

        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: Vite & Gourmand <{$from}>\r\n";

        mail($toEmail, $subject, $message, $headers);
    }
}
