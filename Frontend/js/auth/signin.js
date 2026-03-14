import { getStorage, setStorage} from "../script.js";
// ============================================
// INITIALISATION
// ============================================
export async function init() {
    console.log('Initialisation page connexion');
    
    // Vérifier si déjà connecté
    const currentUser = getStorage();
    if (currentUser) {
        console.log('Déjà connecté, redirection...');
        window.location.href = '/';
        return;
    }
    
    // Initialiser les éléments
    initElements();
    
    // Vérifier paramètre redirect
    checkRedirectParam();
}

export function cleanup() {
    console.log('Nettoyage page connexion');
}

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
        showError('Veuillez remplir tous les champs');
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
    redirect: "follow"
    };

    fetch("http://localhost/api/auth/login", requestOptions)
    .then((response) => {
        if(response.ok){
            return response.json()
        }else{
            console.error('Erreur de connexion :', error);
            showError('Erreur lors de la connexion. Veuillez réessayer.');
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
                telephone: result.user.gsm,
                adresse: result.user.adresse,
                code_postal: result.user.code_postal,
                ville: result.user.ville,
                api_token: result.user.token,
                role: result.user.role
            };
            setStorage(userData);

            // Message succès
            showSuccess('Connexion réussie ! Redirection...');
            
            // Redirection selon paramètre ou page d'accueil
            setTimeout(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect') || '/';
                window.location.href = redirect;
            }, 1500);
        } else {
            console.error('Problème de récupération du result:', error);
        }
    })
    .catch((error) => {
            console.error('Erreur de connexion :', error);
            showError('Email ou mot de passe incorrect');
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

    if (!email) {
        alert('Veuillez entrer votre adresse email');
        return;
    }

    try {
        // Vérifier si l'email existe
        const response = await fetch(USERS_FILE);
        const users = await response.json();
        const userExists = users.some(u => u.email === email);

        if (userExists) {
            alert(`Un email de réinitialisation a été envoyé à ${email}`);
        } else {
            alert('Cette adresse email n\'est pas enregistrée');
        }

        // Fermer modal
        const modal = bootstrap.Modal.getInstance(document.getElementById("forgotPassword"));
        modal.hide();

        // Reset formulaire
        document.getElementById('forgotPasswordForm').reset();

    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'envoi. Veuillez réessayer.');
    }
}

// ============================================
// MESSAGES
// ============================================
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const successMessage = document.getElementById('successMessage');

    successMessage.style.display = 'none';
    errorText.textContent = message;
    errorMessage.style.display = 'block';

    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const successText = document.getElementById('successText');

    errorMessage.style.display = 'none';
    successText.textContent = message;
    successMessage.style.display = 'block';
}

// ============================================
// VÉRIFIER REDIRECT
// ============================================
function checkRedirectParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    if (redirect) {
        showError('Vous devez être connecté pour accéder à cette page');
    }
}
