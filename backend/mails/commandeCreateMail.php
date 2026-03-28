<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;


class CommandeCreateMail
{
    public static function send(string $toEmail, string $prenom, string $nom, string $numCommande, float $total, string $adresseLivraison, string $villeLivraison, int $codePostalLivraison): bool|string
    {
        $mail = new PHPMailer(true);
        $mail->SMTPDebug = SMTP::DEBUG_OFF;

        try {
            // Configuration SMTP
            $mail->isSMTP();
            $mail->Host       = $_ENV['MAIL_HOST'] ?? 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = $_ENV['MAIL_USERNAME'] ?? 'vitegourmandecf26@gmail.com';
            $mail->Password   = $_ENV['MAIL_PASSWORD'] ?? '';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $_ENV['MAIL_PORT'] ?? 587;
            $mail->CharSet    = 'UTF-8';

            // Expéditeur & destinataire
            $from     = $_ENV['MAIL_FROM_ADDRESS'] ?? 'vitegourmandecf26@gmail.com';
            $fromName = $_ENV['MAIL_FROM_NAME'] ?? 'Vite & Gourmand';

            $mail->setFrom($from, $fromName);
            $mail->addAddress($toEmail, "$prenom $nom");

            // Contenu
            $mail->isHTML(true);
            $mail->Subject = "Confirmation de votre commande numéro #{$numCommande} - Vite & Gourmand";
            $mail->Body    = "
                <html lang='fr'>
                <head><meta charset='UTF-8'></head>
                <body>
                    <h1>Merci pour votre commande, {$prenom} !</h1>
                    <p>Votre commande numéro <strong>#{$numCommande}</strong> a bien été enregistrée.</p>
                    <p><strong>Récapitulatif :</strong></p>
                    <p><strong>Total : {$total} €</strong></p>
                    <p><strong>Adresse :</strong> {$adresseLivraison}, {$villeLivraison} {$codePostalLivraison}</p>
                    <p>Vous pouvez suivre l'évolution de votre commande dans votre espace mon compte.</p>
                    <p>À très bientôt,<br>L'équipe Vite & Gourmand</p>
                </body>
                </html>
            ";


            $mail->send();
            return true;

        } catch (Exception $e) {
            error_log("COMMANDE MAIL ERROR] " . $mail->ErrorInfo);
            return $mail->ErrorInfo;
        }
    }
}
