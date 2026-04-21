import { showPassword, checkPasswordStrength, checkPasswordMatch, showToast } from "../utils/util.js";
import { API_BASE } from "../config.js";

// Récupération des inputs du formulaire
const inputPassword = document.getElementById("newPassword");
const inputPasswordConfirm = document.getElementById("passwordConfirm");
const inputResetPasswordForm = document.getElementById("resetPasswordForm");

// Afficher et masquer le mot de passe
showPassword("togglePassword", "newPassword");
showPassword("togglePasswordConfirm", "passwordConfirm");

// Vérifier la force du mot de passe
inputPassword.addEventListener("input", () => checkPasswordStrength(inputPassword));


// Vérifier la correspondance des mots de passe
inputPassword.addEventListener("input", () => checkPasswordMatch(inputPassword, inputPasswordConfirm));
inputPasswordConfirm.addEventListener("input", () => checkPasswordMatch(inputPassword, inputPasswordConfirm));

// Récupération du token dans l'URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
    document.getElementById('message').textContent = 'Lien invalide.';
    document.getElementById('message').classList.remove('hidden');
    document.getElementById('resetPasswordForm').classList.add('hidden');
}

// Gestion de la réinitialisation
inputResetPasswordForm.addEventListener("submit", handleResetPassword);

async function handleResetPassword(event) {
    event.preventDefault();

    const new_password = inputPassword.value;
    const confirm_password = inputPasswordConfirm.value;

    // Vérifications
    if (!checkPasswordStrength(inputPassword)) {
        showToast('Le mot de passe ne respecte pas tous les critères de sécurité', 'warning');
        return;
    }

    if (new_password !== confirm_password) {
        showToast('Les mots de passe ne correspondent pas', 'warning');
        return;
    }

    // Désactiver le bouton
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    resetPasswordBtn.disabled = true;
    resetPasswordBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Réinitialisation...';

    try {
        const response = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, new_password, confirm_password })
        });

        const data = await response.json();
        const msg = document.getElementById('message');
        msg.textContent = data.message;
        msg.classList.remove('hidden');

        if (data.success) {
            showToast('Votre mot de passe à été mis à jour avec succès.', 'success');
            setTimeout(() => window.location.href = '/signin', 2000);
        } else {
            showToast(data.message || 'Une erreur est survenue.', 'danger');
            resetPasswordBtn.disabled = false;
            resetPasswordBtn.innerHTML = 'Réinitialiser';
        }

    } catch (error) {
        showToast('Erreur réseau, veuillez réessayer.', 'danger');
        resetPasswordBtn.disabled = false;
        resetPasswordBtn.innerHTML = 'Réinitialiser';
    }
}
