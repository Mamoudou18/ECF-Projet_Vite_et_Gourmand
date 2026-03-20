// Récupération des inputs du formulaire
const inputPassword = document.getElementById("newPassword");
const inputPasswordConfirm = document.getElementById("passwordConfirm");
const inputResetPasswordForm = document.getElementById("resetPasswordForm");

// Afficher et masquer le mot de passe
function showPassword(toggleId, inputId) {
    const toggle = document.getElementById(toggleId);
    const input = document.getElementById(inputId);
    const eyeOpen = toggle.innerHTML;
    const eyeClosed = `<i class="bi bi-eye-slash-fill"></i>`;

    toggle.addEventListener("click", () => {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        toggle.innerHTML = type === 'password' ? eyeOpen : eyeClosed;
    });
}
showPassword("togglePassword", "newPassword");
showPassword("togglePasswordConfirm", "passwordConfirm");

// Vérifier la force du mot de passe
inputPassword.addEventListener("input", checkPasswordStrength);

function checkPasswordStrength() {
    const password = inputPassword.value;
    const strengthBar = document.getElementById('strengthBar');

    const hasLength = password.length >= 10;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    updateRequirement('req-length', hasLength);
    updateRequirement('req-uppercase', hasUppercase);
    updateRequirement('req-lowercase', hasLowercase);
    updateRequirement('req-number', hasNumber);
    updateRequirement('req-special', hasSpecial);

    const score = [hasLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

    strengthBar.className = 'password-strength-bar';
    if (score <= 2) {
        strengthBar.classList.add('strength-weak');
    } else if (score <= 4) {
        strengthBar.classList.add('strength-medium');
    } else {
        strengthBar.classList.add('strength-strong');
    }

    return score === 5;
}

function updateRequirement(id, isValid) {
    const element = document.getElementById(id);
    const icon = element.querySelector('i');

    if (isValid) {
        element.classList.add('valid');
        element.classList.remove('invalid');
        icon.className = 'bi bi-check-circle-fill';
    } else {
        element.classList.add('invalid');
        element.classList.remove('valid');
        icon.className = 'bi bi-x-circle-fill';
    }
}

// Vérifier la correspondance des mots de passe
inputPassword.addEventListener("input", checkPasswordMatch);
inputPasswordConfirm.addEventListener("input", checkPasswordMatch);

function checkPasswordMatch() {
    const password = inputPassword.value;
    const passwordConfirm = inputPasswordConfirm.value;
    const message = document.getElementById("passwordMatchMessage");
    if (passwordConfirm.length > 0) {
        if (password !== passwordConfirm) {
            message.style.display = 'block';
            return false;
        } else {
            message.style.display = 'none';
            return true;
        }
    }
    return false;
}

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
    if (!checkPasswordStrength()) {
        showError('Le mot de passe ne respecte pas tous les critères de sécurité');
        return;
    }

    if (new_password !== confirm_password) {
        showError('Les mots de passe ne correspondent pas');
        return;
    }

    // Désactiver le bouton
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    resetPasswordBtn.disabled = true;
    resetPasswordBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Réinitialisation...';

    try {
        const response = await fetch('http://localhost/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, new_password, confirm_password })
        });

        const data = await response.json();
        const msg = document.getElementById('message');
        msg.textContent = data.message;
        msg.classList.remove('hidden');

        if (data.success) {
            setTimeout(() => window.location.href = '/signin', 2000);
        } else {
            showError(data.message || 'Une erreur est survenue.');
            resetPasswordBtn.disabled = false;
            resetPasswordBtn.innerHTML = 'Réinitialiser';
        }

    } catch (error) {
        showError('Erreur réseau, veuillez réessayer.');
        resetPasswordBtn.disabled = false;
        resetPasswordBtn.innerHTML = 'Réinitialiser';
    }
}

// Afficher erreur
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    errorText.textContent = message;
    errorMessage.style.display = 'block';

    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}
