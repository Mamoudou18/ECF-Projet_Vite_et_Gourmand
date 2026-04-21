import { 
    validateEmail,
    showToast 
} from "../utils/util.js";
import { API_BASE } from "../config.js";

// ****************************************
// ENVOI DEMANDE DE CONTACT
//****************************************** */

// Récupération des inputs du formulaire
const inputContactForm = document.getElementById("contactForm");
const inputEmail = document.getElementById("email");
const inputTitre = document.getElementById("titre");
const inputDescription = document.getElementById("description");
const inputRgpd = document.getElementById("rgpd");


//valider la saisie du mail
inputEmail.addEventListener("input",() => validateEmail(inputEmail));

// Gestion de l'inscription
inputContactForm.addEventListener("submit", contact);
async function contact(event) {
    event.preventDefault();

    const email = inputEmail.value.trim();
    const titre = inputTitre.value;
    const description = inputDescription.value;
    const rgpd = inputRgpd.checked;

    if (!rgpd) {
        showToast('Vous devez accepter la politique de confidentialité et les CGV', 'danger');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Le mail saisi n\'est pas au bon format', 'danger');
        return;
    }

    const contactBtn = document.getElementById('contactBtn');
    contactBtn.disabled = true;
    contactBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Soumission de la demande...';

    try {
        const response = await fetch(`${API_BASE}/contact/demande-create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, titre, description })
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || 'Échec de l\'envoi', 'danger');
            return;
        }

        showToast(data.message || 'Demande envoyée avec succès', 'success');
        inputContactForm.reset();

    } catch (e) {
        console.error(e);
        showToast('Erreur réseau ou serveur', 'danger');
    } finally {
        contactBtn.disabled = false;
        contactBtn.innerHTML = 'Envoyer ma demande';
    }
}

