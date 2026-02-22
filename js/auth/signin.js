    //inputs
    const inputPassword = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const inputEmail = document.getElementById('email')
    const loginBtn = document.getElementById('loginBtn');
    const loginForm = document.getElementById('loginForm');
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");

    // Affichager et masques le mot de passe
    togglePassword.addEventListener("click",showPassword);
    const eyeOpen = togglePassword.innerHTML;
    const eyeClosed = `<i class="bi bi-eye-slash-fill"></i>`;

    function showPassword() {
        const type = inputPassword.type === 'password' ? 'text' : 'password';
        inputPassword.type = type;

        if(type === 'password'){
            togglePassword.innerHTML = eyeOpen;
        }
        else{
            togglePassword.innerHTML = eyeClosed;
        }
    }


    // Gestion et simulation de la connexion
    loginForm.addEventListener("submit",checkConnexion);

    function checkConnexion(event) {
        event.preventDefault();
            
        const email = inputEmail.value;
        const password = inputPassword.value;

        // Validation basique
        if (!email || !password) {
            showError('Veuillez remplir tous les champs');
            return;
        }

        // Désactiver le bouton pendant le traitement
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Connexion...';

        // Simulation de la connexion (à remplacer par la vraie API)
        setTimeout(() => {
            // Exemple de validation
            if (email === 'admin@vite-gourmand.fr' && password === 'Aligator123$') {
                showSuccess('Connexion réussie ! Redirection...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else if (email === 'employe@vite-gourmand.fr' && password === 'Aligator123$') {
                showSuccess('Connexion réussie ! Redirection...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else if (email.includes('@') && password.length >= 6) {
                showSuccess('Connexion réussie ! Redirection...');
                setTimeout(() => {
                    window.location.href = `/commande?menu=${menuId}`;
                }, 1500);
            } else {
                showError('Email ou mot de passe incorrect');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Se connecter';
            }
        }, 1000);
    }

    // Gestion mot de passe oublié
    forgotPasswordForm.addEventListener("submit",initForgotPassword)
    function initForgotPassword(event) {
        event.preventDefault();
        
        const email = document.getElementById('forgotEmail').value;
        
        if (!email) {
            alert('Veuillez entrer votre adresse email');
            return;
        }

        // Simulation envoi email (à remplacer par la vraie API)
        alert(`Un email de réinitialisation a été envoyé à ${email}`);
        
        // Fermer le modal
        const modalElement = document.getElementById("forgotPassword")
        const modal = new bootstrap.Modal(modalElement);
        modal.hide();
        
        // Réinitialiser le formulaire
        document.getElementById('forgotPasswordForm').reset();
    }


    // Afficher erreur
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

    // Afficher succès
    function showSuccess(message) {
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        const successText = document.getElementById('successText');
            
        errorMessage.style.display = 'none';
        successText.textContent = message;
        successMessage.style.display = 'block';
    }

    // Vérifier si redirection après connexion
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    if (redirect) {
        showError('Vous devez être connecté pour accéder à cette page');
    }
