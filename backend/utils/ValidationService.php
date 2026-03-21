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




}
