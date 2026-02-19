    //GESTION DE L'INSCRIPTION D'UN UTILISATEUR

    // Récupération des inputs du formulaire
    const inputPassword =  document.getElementById("password");
    const inputPasswordConfirm = document.getElementById("passwordConfirm");
    const inputRegisterForm = document.getElementById("registerForm");
    const inputNom = document.getElementById("nom");
    const inputPrenom = document.getElementById("prenom");
    const inputEmail = document.getElementById("email");
    const inputTelephone = document.getElementById("telephone");
    const inputAdresse = document.getElementById("adresse");
    const inputRgpd = document.getElementById("rgpd");

    //valider la saisie du mail
    inputEmail.addEventListener("input", validateEmail)
    function validateEmail(){
        const emailMessage = document.getElementById("emailMessage");
        const emailUser = inputEmail.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(emailRegex.test(emailUser)){
            emailMessage.style.display = 'none';
            return true;
        }
        else{
            emailMessage.style.display = 'block';
            return false;
        }
    }

    // Affichager et masques le mot de passe
    function showPassword(toggleId,inputId) {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);

        const eyeOpen = toggle.innerHTML;
        const eyeClosed = `<i class="bi bi-eye-slash-fill"></i>`;

        toggle.addEventListener("click",() => {
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;

            toggle.innerHTML = type === 'password'? eyeOpen : eyeClosed;
        });
    }
    // Activation sur les deux champs
    showPassword("togglePassword","password");
    showPassword("togglePasswordConfirm","passwordConfirm");

    // Vérifier la force du mot de passe
    inputPassword.addEventListener("input", checkPasswordStrength);

    function checkPasswordStrength() {
        const password = inputPassword.value;
        const strengthBar = document.getElementById('strengthBar');
        
        // Critères
        const hasLength = password.length >= 10;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        // Mettre à jour les indicateurs
        updateRequirement('req-length', hasLength);
        updateRequirement('req-uppercase', hasUppercase);
        updateRequirement('req-lowercase', hasLowercase);
        updateRequirement('req-number', hasNumber);
        updateRequirement('req-special', hasSpecial);

        // Calculer le score
        const score = [hasLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

        // Mettre à jour la barre
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

    // Mettre à jour un critère
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
    inputPassword.addEventListener("input",checkPasswordMatch);
    inputPasswordConfirm.addEventListener("input",checkPasswordMatch);
    function checkPasswordMatch() {
        const password = inputPassword.value;
        const passwordConfirm = inputPasswordConfirm.value
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

    // Gestion de l'inscription
    inputRegisterForm.addEventListener("submit",handleRegister)
    function handleRegister(event) {
        event.preventDefault();

        const password = inputPassword.value;
        const passwordConfirm = inputPasswordConfirm.value
        const nom = inputNom.value.trim();
        const prenom = inputPrenom.value.trim();
        const email = inputEmail.value.trim();
        const telephone = inputTelephone.value.trim();
        const adresse = inputAdresse.value.trim();
        const rgpd = inputRgpd.checked;

        // Vérifications
        if (!checkPasswordStrength()) {
            showError('Le mot de passe ne respecte pas tous les critères de sécurité');
            return;
        }

        if (password !== passwordConfirm) {
            showError('Les mots de passe ne correspondent pas');
            return;
        }

        if (!rgpd) {
            showError('Vous devez accepter la politique de confidentialité et les CGV');
            return;
        }
        //validation email
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
            showError('Le mail saisi n\'est pas au bon format');
            return;
        }

        // Validation du téléphone
        if (!/^[0-9]{10}$/.test(telephone)) {
            showError('Le numéro de téléphone doit contenir 10 chiffres');
            return;
        }

        // Désactiver le bouton
        const registerBtn = document.getElementById('registerBtn');
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Création du compte...';

        // Simulation de l'inscription (à remplacer par l'API)
        const userData = {
            nom,
            prenom,
            email,
            telephone,
            adresse,
            password,
            role: 'utilisateur',
            date_creation: new Date().toISOString()
        };

        setTimeout(() => {
            console.log('Données utilisateur:', userData);
            
            // Simulation succès
            alert(`Bienvenue ${prenom} ${nom} !\n\nVotre compte a été créé avec succès.\nUn email de confirmation vous a été envoyé à ${email}.\n\nVous allez être redirigé vers la page de connexion.`);
            
            // Redirection vers login
            window.location.href = 'login.html';
        }, 1500);
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

    // Formater le téléphone pendant la saisie
    document.getElementById('telephone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.slice(0, 10);
        let formatted = value.replace(/(\d{2})(?=\d)/g, '$1 ');
        e.target.value = formatted.trim();
    });
