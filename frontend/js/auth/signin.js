import { getStorage, setStorage} from "../script.js";
import { showToast } from "../utils/util.js";
import { API_BASE } from "../config.js";

// ============================================
// INITIALISATION
// ============================================
export async function init() {
    
    // Vérifier si déjà connecté
    const currentUser = getStorage();

    if (currentUser && currentUser.role) {
        
        const role = currentUser.role;
        if (role === 'admin') {
            window.location.href = '/espace-administrateur';
        } else if (role === 'employe') {
            window.location.href = '/espace-employe';
        } else {
            window.location.href = '/menu';
        }
        return;
    }
    
    // Initialiser les éléments
    initElements();
}

export function cleanup() {}

// Initialisation des inputs
function initElements() {
    // Inputs
    const inputPassword = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const loginForm = document.getElementById('loginForm');
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");

    // Toggle password
    togglePassword.addEventListener("click", () => {
        const type = inputPassword.type === 'password' ? 'text' : 'password';
        inputPassword.type = type;
        togglePassword.innerHTML = type === 'password' 
            ? '<i class="bi bi-eye-fill"></i>' 
            : '<i class="bi bi-eye-slash-fill"></i>';
    });

    // Connexion
    loginForm.addEventListener("submit", handleLogin);

    // Mot de passe oublié
    forgotPasswordForm.addEventListener("submit", handleForgotPassword);
}

// ============================================
// GESTION CONNEXION
// ============================================
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');

    // Validation
    if (!email || !password) {
        showToast('Veuillez remplir tous les champs', 'danger');
        return;
    }

    // Désactiver bouton
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Connexion...';


    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    
    let raw = JSON.stringify({
        email,
        password
    });

    const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    };

    fetch(`${API_BASE}/auth/login`, requestOptions)
    .then((response) => {
        if(response.ok){
            return response.json()
        }else{
            console.error('Erreur de connexion :', error);
            showToast('Erreur lors de la connexion. Veuillez réessayer.', 'danger');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Se connecter';
        }
     })
    .then((result) => {
        if (result) {
            // Stocker les infos user dans le storage
            const userData = {
                id: result.user.id,
                nom: result.user.nom,
                prenom: result.user.prenom,
                email: result.user.email,
                telephone: result.user.gsm.replace(/(\d{2})(?=\d)/g, '$1 ').trim(),
                adresse: result.user.adresse,
                code_postal: result.user.code_postal,
                ville: result.user.ville,
                api_token: result.user.api_token,
                role: result.user.role
            };
            setStorage(userData);

            // Message succès
            showToast('Connexion réussie ! Redirection...', 'success');

            // Redirection selon paramètres ou page d'accueil
            setTimeout(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect');

                // Si un redirect est explicitement demandé dans l'URL, on l'utilise en priorité
                if (redirect) {
                    window.location.href = redirect;
                } else {
                    // Sinon, redirection selon le rôle
                    const role = userData.role;
                    if (role === 'admin') {
                        window.location.href = '/espace-administrateur';
                    } else if (role === 'employe') {
                        window.location.href = '/espace-employe';
                    } else {
                        window.location.href = '/menu';
                    }
                }
            }, 1500);
        } else {
            console.error('Problème de récupération du result');
            showToast('Erreur lors de la connexion', 'danger');
        }
    })
    .catch((error) => {
            console.error('Erreur de connexion :', error);
            showToast('Email ou mot de passe incorrect', 'warning');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Se connecter';
});
}

// ============================================
// MOT DE PASSE OUBLIÉ
// ============================================
async function handleForgotPassword(event) {
    event.preventDefault();

    const email = document.getElementById('forgotEmail').value.trim();
    const submitBtn = event.target.querySelector('button[type="submit"]');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showToast('Veuillez entrer une adresse email valide', 'warning');
        return;
    }

    try {
        submitBtn.disabled = true;

        const response = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            showToast(data.message || 'Email envoyé.', 'success');
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById("forgotPassword"));
                if (modal) modal.hide();
                document.getElementById('forgotPasswordForm').reset();
            }, 2000);
        } else {
            showToast(data.message || 'Erreur lors de l\'envoi.', 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast('Une erreur est survenue.', 'danger');
    } finally {
        submitBtn.disabled = false;
    }
}
