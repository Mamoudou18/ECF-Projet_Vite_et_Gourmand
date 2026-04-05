import { showPassword, checkPasswordStrength, validateEmail, checkPasswordMatch, showToast } from "../utils/util.js";

// ****************************************
// GESTION DE L'INSCRIPTION D'UN UTILISATEUR
//****************************************** */

// Récupération des inputs du formulaire
const inputPassword = document.getElementById("password");
const inputPasswordConfirm = document.getElementById("passwordConfirm");
const inputRegisterForm = document.getElementById("registerForm");
const inputNom = document.getElementById("nom");
const inputPrenom = document.getElementById("prenom");
const inputEmail = document.getElementById("email");
const inputGsm = document.getElementById("telephone");
const inputAdresse = document.getElementById("adressePostale");
const inputcodePostal = document.getElementById("codePostalClient");
const inputVille = document.getElementById("villeClient");
const inputRgpd = document.getElementById("rgpd");

// Afficher et masquer le mot de passe
showPassword("togglePassword", "password");
showPassword("togglePasswordConfirm", "passwordConfirm");

// Vérifier la force du mot de passe
inputPassword.addEventListener("input", () => checkPasswordStrength(inputPassword));

//valider la saisie du mail
inputEmail.addEventListener("input",() => validateEmail(inputEmail));

// Vérifier la correspondance des mots de passe
inputPassword.addEventListener("input", () => checkPasswordMatch(inputPassword, inputPasswordConfirm));
inputPasswordConfirm.addEventListener("input", () => checkPasswordMatch(inputPassword, inputPasswordConfirm));

// Gestion de l'inscription
inputRegisterForm.addEventListener("submit", handleRegister);
async function handleRegister(event) {
    event.preventDefault();

    const password = inputPassword.value;
    const passwordConfirm = inputPasswordConfirm.value;
    const nom = inputNom.value.trim();
    const prenom = inputPrenom.value.trim();
    const email = inputEmail.value.trim();
    const gsm = inputGsm.value.trim();
    const adresse = inputAdresse.value.trim();
    const codePostal = inputcodePostal.value.trim();
    const ville = inputVille.value.trim();
    const rgpd = inputRgpd.checked;

    // Vérifications
    if (!checkPasswordStrength(inputPassword)) {
        showToast('Le mot de passe ne respecte pas tous les critères de sécurité', 'danger');
        return;
    }

    if (password !== passwordConfirm) {
        showToast('Les mots de passe ne correspondent pas', 'danger');
        return;
    }

    if (!rgpd) {
        showToast('Vous devez accepter la politique de confidentialité et les CGV', 'danger');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Le mail saisi n\'est pas au bon format', 'danger');
        return;
    }

    if (!/^[0-9]{10}$/.test(gsm.replace(/\s/g, ''))) {
        showToast('Le numéro de téléphone doit contenir 10 chiffres', 'danger');
        return;
    }

    // Désactiver le bouton
    const registerBtn = document.getElementById('registerBtn');
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Création du compte...';

    const userData = {
        nom,
        prenom,
        email,
        gsm: gsm.replace(/\s/g, ''),
        adresse,
        code_postal:codePostal,
        ville,
        password,
        confirm_password :passwordConfirm
    };

    const response = await fetch('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });

    const texte = await response.text();
    console.log('Réponse brute :',texte);

    if (!response.ok) {

        let data;
        try{
            data = JSON.parse(texte);
        } catch(e){
            showToast('Erreur réseau ou serveur', 'danger');
            registerBtn.disabled = false;
            registerBtn.innerHTML = 'Créer mon compte';
            return;
        }
        showToast(data.error || 'Echec de l\'inscription', 'danger');
        registerBtn.disabled = false;
        registerBtn.innerHTML = 'Créer mon compte';
        return;
    }

    // si tout est ok, on parse
    const data = JSON.parse(texte);

    // Succès
    document.getElementById('confirmNom').textContent = `${prenom} ${nom}`;
    document.getElementById('confirmEmailInscription').textContent = email;
    const modal = new bootstrap.Modal(document.getElementById('inscriptionModal'));
    modal.show();

}

// Formater le téléphone pendant la saisie
document.getElementById('telephone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.slice(0, 10);
    let formatted = value.replace(/(\d{2})(?=\d)/g, '$1 ');
    e.target.value = formatted.trim();
});
