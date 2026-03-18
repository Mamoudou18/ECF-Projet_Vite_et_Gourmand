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
        $newdPassword = $data['new_password'] ?? '';
        $confirmPassword = $data['confirm_password'] ?? '';

        $errors = [];

        if (empty($oldPassword)) {
            $errors['old_password'] = 'L\'ancien mot de passe est requis.';
        }

        if (empty($newdPassword)) {
            $errors['new_password'] = 'Le nouveau mot de passe est requis.';
        } elseif (strlen($newdPassword) < 10) {
            $errors['new_password'] = 'Le mot de passe doit contenir au moins 8 caractères.';
        }  elseif (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/', $newdPassword)) {
            $errors['password'] = 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.';
        }

        if (empty($confirmPassword)) {
            $errors['confirm_password'] = 'La confirmation est requise.';
        } elseif ($newdPassword !== $confirmPassword) {
            $errors['confirm_password'] = 'Les mots de passe ne correspondent pas.';
        }

        return $errors;
    }

}
