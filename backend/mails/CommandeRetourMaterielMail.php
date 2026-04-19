<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class CommandeRetourMaterielMail
{
    public static function send(string $toEmail, string $prenom, string $numCommande): bool|string
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

            // Coordonnées société
            $contactEmail = $_ENV['MAIL_USERNAME'] ?? 'vitegourmandecf26@gmail.com';
            $contactTel   = $_ENV['CONTACT_PHONE'] ?? '03 88 40 00 00';

            // Contenu
            $mail->isHTML(true);
            $mail->Subject = "Commande #{$numCommande} - Restitution du matériel prêté";
            $mail->Body    = "
                <html lang='fr'>
                <head><meta charset='UTF-8'></head>
                <body style='font-family: Arial, sans-serif; color:#333;'>
                    <h1>Bonjour {$prenom},</h1>
                    <p>Votre commande <strong>#{$numCommande}</strong> est désormais au statut
                    <strong>« en attente du retour de matériel »</strong>.</p>

                    <p>Lors de votre commande, du matériel vous a été prêté. Nous vous remercions
                    de bien vouloir le restituer dans les meilleurs délais.</p>

                    <div style='background:#fff3cd; border-left:4px solid #ffc107; padding:15px; margin:20px 0;'>
                        <p style='margin:0;'><strong>⚠️ Important :</strong></p>
                        <p style='margin:5px 0 0 0;'>
                            Conformément à nos <strong>conditions générales de vente</strong>, si le matériel
                            n'est pas restitué sous <strong>10 jours ouvrés</strong> à compter de la réception
                            de ce mail, des <strong>frais de 600 €</strong> vous seront facturés.
                        </p>
                    </div>

                    <p>Pour organiser la restitution, merci de prendre contact avec notre société :</p>
                    <ul>
                        <li>📧 Email : <a href='mailto:{$contactEmail}'>{$contactEmail}</a></li>
                        <li>📞 Téléphone : {$contactTel}</li>
                    </ul>

                    <p>Nous vous remercions pour votre compréhension.</p>
                    <p>Cordialement,<br>L'équipe Vite & Gourmand</p>
                </body>
                </html>
            ";

            $mail->send();
            return true;

        } catch (Exception $e) {
            error_log("[RETOUR MATERIEL MAIL ERROR] " . $mail->ErrorInfo);
            return $mail->ErrorInfo;
        }
    }
}
