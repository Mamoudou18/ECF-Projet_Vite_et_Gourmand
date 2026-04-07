<?php

class ValidationService
{
    /**
     * Valider les données de connexion
     */
    public function validateLogin(array $data): array
    {
        $errors = [];

        if (empty($data['email']) || empty($data['password'])) {
            $errors[] = 'Email et mot de passe requis';
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Format d\'email invalide';
        }

        return $errors;
    }

    /**
     * Valider les données d'inscription
     */
    public function validateRegister(array $data): array
    {
        $errors = [];

        if (empty(trim($data['nom'] ?? ''))) {
            $errors['nom'] = 'Le nom est requis.';
        }

        if (empty(trim($data['prenom'] ?? ''))) {
            $errors['prenom'] = 'Le prénom est requis.';
        }

        if (empty(trim($data['email'] ?? ''))) {
            $errors['email'] = 'L\'email est requis.';
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'L\'email est invalide.';
        }

        if (empty(trim($data['gsm'] ?? ''))) {
            $errors['gsm'] = 'Le numéro de téléphone est requis.';
        } elseif (!preg_match('/^(\+?\d{10,15})$/', preg_replace('/\s/', '', $data['gsm']))) {
            $errors['gsm'] = 'Le numéro de téléphone est invalide.';
        }

        if (empty(trim($data['adresse'] ?? ''))) {
            $errors['adresse'] = 'L\'adresse est requise.';
        }

        if (empty(trim($data['code_postal'] ?? ''))) {
            $errors['code_postal'] = 'Le code postal est requis.';
        }

        if (empty(trim($data['ville'] ?? ''))) {
            $errors['ville'] = 'La ville est requise.';
        }

        $this->validatePassword($data, $errors);

        return $errors;
    }

    /**
     * Valider le mot de passe
     */
    private function validatePassword(array $data, array &$errors): void
    {
        $password = $data['password'] ?? '';

        if (empty($password)) {
            $errors['password'] = 'Le mot de passe est requis.';
        } elseif (strlen($password) < 10) {
            $errors['password'] = 'Le mot de passe doit contenir au minimum 10 caractères.';
        } elseif (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/', $password)) {
            $errors['password'] = 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.';
        }

        if (empty($data['confirm_password'] ?? '')) {
            $errors['confirm_password'] = 'La confirmation du mot de passe est requise.';
        } elseif ($data['password'] !== $data['confirm_password']) {
            $errors['confirm_password'] = 'Les mots de passe ne correspondent pas.';
        }
    }

    /**
     * Valider les données de mise à jour de l'utilisateur
     */
    public function validateUpdateUser( array $data) : array
    {
        $errors = [];

        if (empty(trim($data['nom'] ?? ''))) {
            $errors['nom'] = 'Le nom est requis.';
        }

        if (empty(trim($data['prenom'] ?? ''))) {
            $errors['prenom'] = 'Le prénom est requis.';
        }

        if (empty(trim($data['gsm'] ?? ''))) {
            $errors['gsm'] = 'Le numéro de téléphone est requis.';
        } elseif (!preg_match('/^(\+?\d{10,15})$/', preg_replace('/\s/', '', $data['gsm']))) {
            $errors['gsm'] = 'Le numéro de téléphone est invalide.';
        }

        if (empty(trim($data['adresse'] ?? ''))) {
            $errors['adresse'] = 'L\'adresse est requise.';
        }

        if (empty(trim($data['code_postal'] ?? ''))) {
            $errors['code_postal'] = 'Le code postal est requis.';
        }

        if (empty(trim($data['ville'] ?? ''))) {
            $errors['ville'] = 'La ville est requise.';
        }

        return $errors;
    }

    /**
     * validés les champs réquis pour le changement de password
     */

    public function validateUpdatePassword(array $data): array
    {
        $oldPassword = $data['old_password'] ?? '';
        $newPassword = $data['new_password'] ?? '';
        $confirmPassword = $data['confirm_password'] ?? '';

        $errors = [];

        if (empty($oldPassword)) {
            $errors['old_password'] = 'L\'ancien mot de passe est requis.';
        }

        if (empty($newPassword)) {
            $errors['new_password'] = 'Le nouveau mot de passe est requis.';
        } elseif (strlen($newPassword) < 10) {
            $errors['new_password'] = 'Le mot de passe doit contenir au moins 10 caractères.';
        }  elseif (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/', $newPassword)) {
            $errors['new_password'] = 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.';
        }

        if (empty($confirmPassword)) {
            $errors['confirm_password'] = 'La confirmation est requise.';
        } elseif ($newPassword !== $confirmPassword) {
            $errors['confirm_password'] = 'Les mots de passe ne correspondent pas.';
        }

        return $errors;
    }

    public function validateResetPassword(array $data): array
    {
        $errors = [];
        $newPassword = $data['new_password'] ?? '';

        if (empty($newPassword)) {
            $errors['new_password'] = 'Le mot de passe est requis.';
        } elseif (strlen($newPassword) < 10) {
            $errors['new_password'] = 'Le mot de passe doit contenir au minimum 10 caractères.';
        } elseif (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/', $newPassword)) {
            $errors['password'] = 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.';
        }

        if (empty($data['confirm_password'] ?? '')) {
            $errors['confirm_password'] = 'La confirmation du mot de passe est requise.';
        } elseif ($data['new_password'] !== $data['confirm_password']) {
            $errors['confirm_password'] = 'Les mots de passe ne correspondent pas.';
        }
        return $errors;
    }

    /**
     * Validation création (tous les champs obligatoires)
     */
    public function validateMenu(array $data): array
    {
        $errors = [];

        // --- Champs de base ---
        if (empty(trim($data['titre'] ?? ''))) {
            $errors['titre'] = 'Le titre est requis.';
        }

        if (!isset($data['prix_base']) || $data['prix_base'] === '') {
            $errors['prix_base'] = 'Le prix de base est requis.';
        } elseif (!is_numeric($data['prix_base']) || $data['prix_base'] < 0) {
            $errors['prix_base'] = 'Le prix de base doit être un nombre positif.';
        }

        if (!isset($data['nb_personnes_min']) || $data['nb_personnes_min'] === '') {
            $errors['nb_personnes_min'] = 'Le nombre de personnes est requis.';
        } elseif (!is_numeric($data['nb_personnes_min']) || (int)$data['nb_personnes_min'] < 1) {
            $errors['nb_personnes_min'] = 'Le nombre de personnes doit être au moins 1.';
        }

        if (!isset($data['stock']) || $data['stock'] === '') {
            $errors['stock'] = 'Le stock est requis.';
        } elseif (!is_numeric($data['stock']) || (int)$data['stock'] < 0) {
            $errors['stock'] = 'Le stock doit être un nombre positif ou zéro.';
        }

        // --- Thème ---
        if (empty($data['theme_id']) || !is_numeric($data['theme_id'])) {
            $errors['theme_id'] = 'Un thème valide est requis.';
        }

        // --- Régimes (optionnel) ---
        if (isset($data['regime_ids']) && !is_array($data['regime_ids'])) {
            $errors['regime_ids'] = 'Les régimes doivent être un tableau.';
        }

        // --- Plats ---
        if (!is_array($data['plats'] ?? null) || empty($data['plats'])) {
            $errors['plats'] = 'Au moins un plat est requis.';
        } else {
            $auMoinsUnPlat = false;
            foreach ($data['plats'] as $i => $trio) {
                foreach (['entree', 'plat', 'dessert'] as $cle) {
                    if (!empty($trio[$cle])) {
                        $auMoinsUnPlat = true;
                        if (empty(trim($trio[$cle]['nom'] ?? ''))) {
                            $errors["plats.$i.$cle.nom"] = "Le nom du $cle #" . ($i + 1) . " est requis.";
                        }
                    }
                }
            }
            if (!$auMoinsUnPlat) {
                $errors['plats'] = 'Au moins un plat est requis.';
            }
        }

        return $errors;
    }

    /**
     * Validation mise à jour (seuls les champs envoyés sont validés)
     */
    public function validateMenuUpdate(array $data): array
    {
        $errors = [];

        // --- Champs de base : validés seulement si présents ---
        if (array_key_exists('titre', $data) && empty(trim($data['titre']))) {
            $errors['titre'] = 'Le titre ne peut pas être vide.';
        }

        if (array_key_exists('prix_base', $data)) {
            if ($data['prix_base'] === '') {
                $errors['prix_base'] = 'Le prix de base ne peut pas être vide.';
            } elseif (!is_numeric($data['prix_base']) || $data['prix_base'] < 0) {
                $errors['prix_base'] = 'Le prix de base doit être un nombre positif.';
            }
        }

        if (array_key_exists('nb_personnes_min', $data)) {
            if ($data['nb_personnes_min'] === '') {
                $errors['nb_personnes_min'] = 'Le nombre de personnes ne peut pas être vide.';
            } elseif (!is_numeric($data['nb_personnes_min']) || (int)$data['nb_personnes_min'] < 1) {
                $errors['nb_personnes_min'] = 'Le nombre de personnes doit être au moins 1.';
            }
        }

        if (array_key_exists('stock', $data)) {
            if ($data['stock'] === '') {
                $errors['stock'] = 'Le stock ne peut pas être vide.';
            } elseif (!is_numeric($data['stock']) || (int)$data['stock'] < 0) {
                $errors['stock'] = 'Le stock doit être un nombre positif ou zéro.';
            }
        }

        // --- Thème : validé seulement si présent ---
        if (array_key_exists('theme_id', $data)) {
            if (!empty($data['theme_id']) && !is_numeric($data['theme_id'])) {
                $errors['theme_id'] = 'Le thème doit être un identifiant valide.';
            }
        }

        // --- Régimes : validés seulement si présents ---
        if (isset($data['regime_ids']) && !is_array($data['regime_ids'])) {
            $errors['regime_ids'] = 'Les régimes doivent être un tableau.';
        }

        // --- Plats : validés seulement si présents (null = inchangé) ---
        if (isset($data['plats'])) {
            if (!is_array($data['plats'])) {
                $errors['plats'] = 'Les plats doivent être un tableau.';
            } elseif (!empty($data['plats'])) {
                // Si envoyé non vide → au moins un plat valide
                $auMoinsUnPlat = false;
                foreach ($data['plats'] as $i => $trio) {
                    foreach (['entree', 'plat', 'dessert'] as $cle) {
                        if (!empty($trio[$cle])) {
                            $auMoinsUnPlat = true;
                            if (empty(trim($trio[$cle]['nom'] ?? ''))) {
                                $errors["plats.$i.$cle.nom"] = "Le nom du $cle #" . ($i + 1) . " est requis.";
                            }
                        }
                    }
                }
                if (!$auMoinsUnPlat) {
                    $errors['plats'] = 'Au moins un plat est requis.';
                }
            }
            // [] vide = intention de tout vider → on laisse passer
        }

        return $errors;
    }

    /**
     * Valider les données de création d'une commande
     */
    public function validateCommande(array $data): array
    {
        $errors = [];

        // --- IDs ---
        if (empty($data['user_id']) || !is_numeric($data['user_id'])) {
            $errors['user_id'] = 'L\'utilisateur est requis.';
        }

        if (empty($data['menu_id']) || !is_numeric($data['menu_id'])) {
            $errors['menu_id'] = 'Le menu est requis.';
        }

        // --- Client ---
        if (empty(trim($data['nom_client'] ?? ''))) {
            $errors['nom_client'] = 'Le nom du client est requis.';
        }

        if (empty(trim($data['prenom_client'] ?? ''))) {
            $errors['prenom_client'] = 'Le prénom du client est requis.';
        }

        if (empty(trim($data['email_client'] ?? ''))) {
            $errors['email_client'] = 'L\'email du client est requis.';
        } elseif (!filter_var($data['email_client'], FILTER_VALIDATE_EMAIL)) {
            $errors['email_client'] = 'L\'email du client est invalide.';
        }

        if (empty(trim($data['gsm_client'] ?? ''))) {
            $errors['gsm_client'] = 'Le numéro de téléphone est requis.';
        } elseif (!preg_match('/^(\+?\d{10,15})$/', preg_replace('/\s/', '', $data['gsm_client']))) {
            $errors['gsm_client'] = 'Le numéro de téléphone est invalide.';
        }

        // --- Prestation ---
        if (empty(trim($data['adresse_prestation'] ?? ''))) {
            $errors['adresse_prestation'] = 'L\'adresse de prestation est requise.';
        }

        if (empty(trim($data['ville_prestation'] ?? ''))) {
            $errors['ville_prestation'] = 'La ville de prestation est requise.';
        }

        if (empty(trim($data['code_postal_prestation'] ?? ''))) {
            $errors['code_postal_prestation'] = 'Le code postal est requis.';
        }

        if (empty(trim($data['date_prestation'] ?? ''))) {
            $errors['date_prestation'] = 'La date de prestation est requise.';
        } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date_prestation'])) {
            $errors['date_prestation'] = 'La date doit être au format AAAA-MM-JJ.';
        } elseif (strtotime($data['date_prestation']) < strtotime(date('Y-m-d'))) {
            $errors['date_prestation'] = 'La date de prestation ne peut pas être dans le passé.';
        }

        if (empty(trim($data['heure_prestation'] ?? ''))) {
            $errors['heure_prestation'] = 'L\'heure de prestation est requise.';
        } elseif (!preg_match('/^\d{2}:\d{2}$/', $data['heure_prestation'])) {
            $errors['heure_prestation'] = 'L\'heure doit être au format HH:MM.';
        }

        // --- Quantité / Prix ---
        if (!isset($data['nb_personnes']) || $data['nb_personnes'] === '') {
            $errors['nb_personnes'] = 'Le nombre de personnes est requis.';
        } elseif (!is_numeric($data['nb_personnes']) || (int)$data['nb_personnes'] < 1) {
            $errors['nb_personnes'] = 'Le nombre de personnes doit être au moins 1.';
        }

        if (!isset($data['prix_menu']) || $data['prix_menu'] === '') {
            $errors['prix_menu'] = 'Le prix du menu est requis.';
        } elseif (!is_numeric($data['prix_menu']) || $data['prix_menu'] < 0) {
            $errors['prix_menu'] = 'Le prix du menu doit être un nombre positif.';
        }

        if (!isset($data['prix_livraison']) || $data['prix_livraison'] === '') {
            $errors['prix_livraison'] = 'Le prix de livraison est requis.';
        } elseif (!is_numeric($data['prix_livraison']) || $data['prix_livraison'] < 0) {
            $errors['prix_livraison'] = 'Le prix de livraison doit être un nombre positif.';
        }

        if (!isset($data['prix_total']) || $data['prix_total'] === '') {
            $errors['prix_total'] = 'Le prix total est requis.';
        } elseif (!is_numeric($data['prix_total']) || $data['prix_total'] < 0) {
            $errors['prix_total'] = 'Le prix total doit être un nombre positif.';
        }

        // --- Numéro de commande ---
        if (empty(trim($data['numero_commande'] ?? ''))) {
            $errors['numero_commande'] = 'Le numéro de commande est requis.';
        }

        // --- Location matériel ---
        if (!isset($data['location_materiel']) || !in_array($data['location_materiel'], [0, 1, '0', '1', true, false], true)) {
            $errors['location_materiel'] = 'La location de matériel doit être 0 ou 1.';
        }

        return $errors;
    }

    /**
    * Validation mise à jour commande (seuls les champs envoyés sont validés)
    */
    public function validateCommandeUpdate(array $data): array
    {
        $errors = [];

        $allowed = [
            'nom_client', 'prenom_client', 'email_client', 'gsm_client',
            'adresse_prestation', 'ville_prestation', 'code_postal_prestation',
            'date_prestation', 'heure_prestation', 'nb_personnes',
            'menu_id', 'prix_livraison', 'commentaire',
            'location_materiel', 'statut_id', 'motif_annulation'
        ];

        // Vérifier qu'il y a au moins un champ valide
        $filtered = array_intersect_key($data, array_flip($allowed));
        if (empty($filtered)) {
            $errors['general'] = 'Aucun champ valide à mettre à jour.';
            return $errors;
        }

        // --- Client ---
        if (array_key_exists('nom_client', $data) && empty(trim($data['nom_client']))) {
            $errors['nom_client'] = 'Le nom ne peut pas être vide.';
        }

        if (array_key_exists('prenom_client', $data) && empty(trim($data['prenom_client']))) {
            $errors['prenom_client'] = 'Le prénom ne peut pas être vide.';
        }

        if (array_key_exists('email_client', $data)) {
            if (empty(trim($data['email_client']))) {
                $errors['email_client'] = 'L\'email ne peut pas être vide.';
            } elseif (!filter_var($data['email_client'], FILTER_VALIDATE_EMAIL)) {
                $errors['email_client'] = 'L\'email est invalide.';
            }
        }

        if (array_key_exists('gsm_client', $data)) {
            if (empty(trim($data['gsm_client']))) {
                $errors['gsm_client'] = 'Le GSM ne peut pas être vide.';
            } elseif (!preg_match('/^(\+?\d{10,15})$/', preg_replace('/\s/', '', $data['gsm_client']))) {
                $errors['gsm_client'] = 'Le numéro de téléphone est invalide.';
            }
        }

        // --- Prestation ---
        if (array_key_exists('adresse_prestation', $data) && empty(trim($data['adresse_prestation']))) {
            $errors['adresse_prestation'] = 'L\'adresse ne peut pas être vide.';
        }

        if (array_key_exists('ville_prestation', $data) && empty(trim($data['ville_prestation']))) {
            $errors['ville_prestation'] = 'La ville ne peut pas être vide.';
        }

        if (array_key_exists('code_postal_prestation', $data) && empty(trim($data['code_postal_prestation']))) {
            $errors['code_postal_prestation'] = 'Le code postal ne peut pas être vide.';
        }

        if (array_key_exists('date_prestation', $data)) {
            if (empty(trim($data['date_prestation']))) {
                $errors['date_prestation'] = 'La date ne peut pas être vide.';
            } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date_prestation'])) {
                $errors['date_prestation'] = 'Format date invalide (AAAA-MM-JJ).';
            } elseif (strtotime($data['date_prestation']) < strtotime(date('Y-m-d'))) {
                $errors['date_prestation'] = 'La date ne peut pas être dans le passé.';
            }
        }

        if (array_key_exists('heure_prestation', $data)) {
            if (empty(trim($data['heure_prestation']))) {
                $errors['heure_prestation'] = 'L\'heure ne peut pas être vide.';
            } elseif (!preg_match('/^\d{2}:\d{2}$/', $data['heure_prestation'])) {
                $errors['heure_prestation'] = 'Format heure invalide (HH:MM).';
            }
        }

        // --- Quantité / Prix ---
        if (array_key_exists('nb_personnes', $data)) {
            if (!is_numeric($data['nb_personnes']) || (int)$data['nb_personnes'] < 1) {
                $errors['nb_personnes'] = 'Le nombre de personnes doit être au moins 1.';
            }
        }

        if (array_key_exists('menu_id', $data)) {
            if (!is_numeric($data['menu_id'])) {
                $errors['menu_id'] = 'Le menu doit être un identifiant valide.';
            }
        }

        if (array_key_exists('prix_livraison', $data)) {
            if (!is_numeric($data['prix_livraison']) || $data['prix_livraison'] < 0) {
                $errors['prix_livraison'] = 'Le prix de livraison doit être un nombre positif.';
            }
        }

        // --- Autres ---
        if (array_key_exists('location_materiel', $data)) {
            if (!in_array($data['location_materiel'], [0, 1, '0', '1', true, false], true)) {
                $errors['location_materiel'] = 'La location de matériel doit être 0 ou 1.';
            }
        }

        if (array_key_exists('statut_id', $data)) {
            if (!is_numeric($data['statut_id'])) {
                $errors['statut_id'] = 'Le statut doit être un identifiant valide.';
            }
        }

        return $errors;
    }

    /**
    * Valider les données de création d'un avis
    */
    public function validateAvis(?array $data): array
    {
        $errors = [];

        if (empty($data)) {
            return ['Données JSON invalides ou manquantes'];
        }

        if (empty($data['user_id'])) {
            $errors[] = 'user_id est requis';
        }

        if (empty($data['id_commande'])) {
            $errors[] = 'id_commande est requis';
        }

        if (!isset($data['note'])) {
            $errors[] = 'note est requise';
        } elseif ((float) $data['note'] < 1 || (float) $data['note'] > 5) {
            $errors[] = 'La note doit être entre 1 et 5';
        }

        if (empty($data['commentaire'])) {
            $errors[] = 'commentaire est requis';
        }

        return $errors;
    }


    /**
     * Valider la modération d'un avis
     */
    public function validateModerationAvis(array $data): array
    {
        $errors = [];

        if (empty($data['statut'])) {
            $errors['statut'] = 'Le statut est requis.';
        } elseif (!in_array($data['statut'], ['approuve', 'refuse'])) {
            $errors['statut'] = 'Le statut doit être "approuve" ou "refuse".';
        }

        return $errors;
    }

    public function validateUpdateEmploye(array $data): array
    {
        $errors = [];

        if (empty($data['nom']) || strlen($data['nom']) < 2) {
            $errors[] = 'Le nom doit contenir au moins 2 caractères.';
        }
        if (empty($data['prenom']) || strlen($data['prenom']) < 2) {
            $errors[] = 'Le prénom doit contenir au moins 2 caractères.';
        }
        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Email invalide.';
        }
        if (!empty($data['gsm']) && !preg_match('/^[0-9]{10}$/', $data['gsm'])) {
            $errors[] = 'Le GSM doit contenir 10 chiffres.';
        }
        if (empty($data['role']) || !in_array($data['role'], ['admin', 'employe'])) {
            $errors[] = 'Rôle invalide.';
        }

        return $errors;
    }



}
