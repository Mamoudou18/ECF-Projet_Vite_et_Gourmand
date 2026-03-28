<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class ResetPasswordMail
{
    public static function send(string $toEmail, string $resetLink): bool|string
    {
        $mail = new PHPMailer(true);
        $mail->SMTPDebug = SMTP::DEBUG_OFF;

        try {
            $mail->isSMTP();
            $mail->Host       = $_ENV['MAIL_HOST']     ?? 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = $_ENV['MAIL_USERNAME'] ?? 'vitegourmandecf26@gmail.com';
            $mail->Password   = $_ENV['MAIL_PASSWORD'] ?? '';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $_ENV['MAIL_PORT']     ?? 587;
            $mail->CharSet    = 'UTF-8';

            $from     = $_ENV['MAIL_FROM_ADDRESS'] ?? 'vitegourmandecf26@gmail.com';
            $fromName = $_ENV['MAIL_FROM_NAME']    ?? 'Vite & Gourmand';

            $mail->setFrom($from, $fromName);
            $mail->addAddress($toEmail);

            $mail->isHTML(true);
            $mail->Subject = "Réinitialisation de votre mot de passe";
            $mail->Body    = "
                <html lang='fr'>
                <head><meta charset='UTF-8'></head>
                <body>
                    <p>Bonjour,</p>
                    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                    <p>Cliquez sur le bouton ci-dessous pour le mettre à jour :</p>
                    <p>
                        <a href='{$resetLink}' 
                           style='background:#e44d26;color:#fff;padding:12px 24px;
                                  text-decoration:none;border-radius:5px;display:inline-block;'>
                            Réinitialiser mon mot de passe
                        </a>
                    </p>
                    <p>Ce lien est valable <strong>1 heure</strong>.</p>
                    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
                    <p>À très bientôt,<br>L'équipe Vite &amp; Gourmand</p>
                </body>
                </html>
            ";
            $mail->AltBody = "Réinitialisez votre mot de passe ici : {$resetLink}\nLien valable 1 heure.";

            $mail->send();
            return true;

        } catch (Exception $e) {
            error_log("[RESET PASSWORD MAIL ERROR] " . $mail->ErrorInfo);
            return $mail->ErrorInfo;
        }
    }
}
