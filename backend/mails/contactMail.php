<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class ContactMail
{
    public static function send(string $email, string $titre, string $description): bool|string
    {
        $mail = new PHPMailer(true);
        $mail->SMTPDebug = SMTP::DEBUG_OFF;

        try {
            $mail->isSMTP();
            $mail->Host       = $_ENV['MAIL_HOST'] ?? 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = $_ENV['MAIL_USERNAME'] ?? 'vitegourmandecf26@gmail.com';
            $mail->Password   = $_ENV['MAIL_PASSWORD'] ?? '';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $_ENV['MAIL_PORT'] ?? 587;
            $mail->CharSet    = 'UTF-8';

            $from     = $_ENV['MAIL_FROM_ADDRESS'] ?? 'vitegourmandecf26@gmail.com';
            $fromName = $_ENV['MAIL_FROM_NAME'] ?? 'Vite & Gourmand';

            $mail->setFrom($from, $fromName);
            $mail->addAddress($from, $fromName);
            $mail->addReplyTo($email); // pour répondre directement au client

            $mail->isHTML(true);
            $mail->Subject = "Nouvelle demande : {$titre}";
            $mail->Body    = "
                <html lang='fr'>
                <head><meta charset='UTF-8'></head>
                <body>
                    <h1>Nouvelle demande client</h1>
                    <p><strong>Email :</strong> {$email}</p>
                    <p><strong>Titre :</strong> {$titre}</p>
                    <p><strong>Description :</strong></p>
                    <p>{$description}</p>
                </body>
                </html>
            ";

            $mail->send();
            return true;

        } catch (Exception $e) {
            error_log("[CONTACT MAIL ERROR] " . $mail->ErrorInfo);
            return $mail->ErrorInfo;
        }
    }
}
