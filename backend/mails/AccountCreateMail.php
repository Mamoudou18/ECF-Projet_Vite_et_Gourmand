<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;


class AccountCreatedMail
{
        public static function send(string $toEmail, string $prenom, string $nom): bool|string
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
            $mail->Subject = "Votre compte a été créé !";
            $mail->Body    = "
                <html lang='fr'>
                <head><meta charset='UTF-8'></head>
                <body>
                    <h1>Bienvenue {$prenom} {$nom} !</h1>
                    <p>Un compte a été créé pour vous sur notre site Vite & Gourmand.</p>
                    <p>Pour obtenir votre mot de passe, veuillez <strong>vous rapprocher de votre administrateur</strong>.</p>
                    <p>Cordialement,<br>L'équipe Vite & Gourmand</p>
                </body>
                </html>
            ";

            $mail->send();
            return true;

        } catch (Exception $e) {
            error_log(" [WELCOME MAIL ERROR] " . $mail->ErrorInfo);
            return $mail->ErrorInfo;
        }
    }
}
