<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;


class CommandeTermineeMail
{
    public static function send(string $toEmail, string $prenom, string $numCommande, string $avisLink): bool|string
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
            $mail->addAddress($toEmail);

            // Contenu
            $mail->isHTML(true);
            $mail->Subject = "Commande #{$numCommande} terminée - Donnez-nous votre avis !";
            $mail->Body    = "
                <html lang='fr'>
                <head><meta charset='UTF-8'></head>
                <body>
                    <h1>Merci {$prenom} !</h1>
                    <p>Votre commande <strong>#{$numCommande}</strong> est désormais <strong>terminée</strong>.</p>
                    <p>Nous espérons que tout s'est bien passé et que vous vous êtes régalé(e) !</p>
                    <p>Votre avis compte beaucoup pour nous. Connectez-vous à votre compte pour <strong>noter et commenter</strong> votre commande :</p>
                    <p><a href='{$avisLink}' style='background-color:#ff6600;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;'>Donner mon avis</a></p>
                    <p>À très bientôt,<br>L'équipe Vite & Gourmand</p>
                </body>
                </html>
            ";



            $mail->send();
            return true;

        } catch (Exception $e) {
            error_log("[COMMANDE TERMINEE MAIL ERROR] " . $mail->ErrorInfo);
            return $mail->ErrorInfo;
        }
    }
}
