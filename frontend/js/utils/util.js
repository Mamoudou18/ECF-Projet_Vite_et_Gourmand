// Afficher et masquer le mot de passe
export function showPassword(toggleId, inputId) {
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

// Vérifier la force du mot de passe
export function checkPasswordStrength(inputPassword) {
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

export function updateRequirement(id, isValid) {
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

// Validation email
export function validateEmail(inputEmail){
    const emailMessage = document.getElementById("emailMessage");
    const emailUser = inputEmail.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(emailRegex.test(emailUser)){
        emailMessage.style.display = 'none';
        return true;
    } else {
        emailMessage.style.display = 'block';
        return false;
    }
}

// Correspondance email
export function checkPasswordMatch(inputPassword, inputPasswordConfirm) {
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

// Modal de confirmation
let modalInstance = null;
export function showConfirm({ title, message, icon, iconColor, btnText, btnClass, titleHeder }) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmActionModal');

        // Personnaliser le contenu
        document.getElementById('confirmTitle').textContent = title || 'Êtes-vous sûr ?';
        document.getElementById('confirmMessage').textContent = message || 'Cette action est irréversible.';
        document.getElementById('confirmIcon').innerHTML =
            `<i class="bi ${icon || 'bi-exclamation-triangle-fill'} ${iconColor || 'text-warning'}" style="font-size: 4rem;"></i>`;
        document.getElementById('confirmBtnText').textContent = btnText || 'Oui, confirmer';
        document.getElementById('numCommande').textContent = titleHeder;

        const btn = document.getElementById('confirmActionBtn');
        btn.className = `btn px-4 ${btnClass || 'btn-warning'}`;

        // Nettoyage des anciens listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        // Créer l'instance une seule fois
        if (!modalInstance) {
            modalInstance = new bootstrap.Modal(modal);
        }

        newBtn.addEventListener('click', () => {
            modalInstance.hide();
            resolve(true);
        });

        modal.addEventListener('hidden.bs.modal', function handler() {
            modal.removeEventListener('hidden.bs.modal', handler);
            resolve(false);
        });

        modalInstance.show();
    });
}

// ===================== TOAST =====================
export function createToastContainer() {
    const container = document.createElement('div');
    const isMobile = window.innerWidth <= 768;
    container.className = `toast-container position-fixed ${isMobile ? 'bottom-0 start-50 translate-middle-x' : 'top-0 end-0'} p-3`;
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}


export function showToast(message, type = 'success') {

    // Si c'est un tableau d'erreurs de validation
    if (type === 'validation' && Array.isArray(message)) {
        alert('Erreurs de validation :\n\n' + message.join('\n'));
        return;
    }

    const container = document.querySelector('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    container.appendChild(toast);
    new bootstrap.Toast(toast, { delay: 5000 }).show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

export function formatDate(dateStr, style = 'short') {
    if (!dateStr) return 'N/A';
    const options = style === 'long'
        ? { day: 'numeric', month: 'long', year: 'numeric' }
        : { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('fr-FR', options);
}


// Générer des étoiles
export function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            stars += '<i class="bi bi-star-fill text-warning"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="bi bi-star-half text-warning"></i>';
        } else {
            stars += '<i class="bi bi-star text-warning"></i>';
        }
    }
    return stars;
}

