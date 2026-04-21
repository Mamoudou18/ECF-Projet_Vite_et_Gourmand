import { showToast } from './utils/util.js';
import { API_BASE } from './config.js';


export const localStorageKey = "currentUser";
const DUREE_SESSION = 2 * 60 * 60 * 1000; // 2 heures en ms

// initialisation des fonctions
export function init(){
    checkSessionExpiration();
    showAndHideElementsforRoles();
    updateHeader();
    loadFooterHoraires();
    startSessionWatcher();
}
init();

// Récup du bouton signout
const signoutBtn = document.getElementById("btn-signout");
if (signoutBtn) {
  signoutBtn.addEventListener("click", signout);
}

// Fonction pour stocker dans le localStorage
export function setStorage(userData){
    // Ajoute automatiquement la date d'expiration
    userData.expiresAt = Date.now() + DUREE_SESSION;
    localStorage.setItem(localStorageKey, JSON.stringify(userData));
}

// Fonction pour récuperer les données dans le localStorage
export function getStorage(){
    return JSON.parse(localStorage.getItem(localStorageKey));
}

// Fonction pour récupérer le token si besoin
export function getToken(){
    const user = getStorage();
    return user ? user.api_token : null;
}

// Récuperer l'utilisateur
export function getUser(){
    return getStorage();
}

// Fonction pour récupérer le rôle si besoin
export function getRole(){
    const user = getStorage();
    return user ? user.role : null;
}

// Fonction pour vider le contenu du localStorage
export function removeStorage(){
    localStorage.removeItem(localStorageKey);
}

// vérifie si la session est encore valide
export function isSessionValid(){
    const user = getStorage();
    if (!user || !user.expiresAt) return false;
    return Date.now() < user.expiresAt;
}

// prolonge la session (appelable après une action utilisateur)
export function refreshSession(){
    const user = getStorage();
    if (user) {
        user.expiresAt = Date.now() + DUREE_SESSION;
        localStorage.setItem(localStorageKey, JSON.stringify(user));
    }
}

// vérifie l'expiration et déconnecte si besoin
function checkSessionExpiration(){
    const user = getStorage();
    if (user && !isSessionValid()) {
        removeStorage();
        if (!window.location.pathname.includes('/signin')) {
            showToast('Votre session a expiré. Veuillez vous reconnecter.', 'warning');
            setTimeout(() => {
                window.location.href = '/signin';
            }, 2000);
        }
    }
}


// surveille la session toutes les 60 secondes
function startSessionWatcher(){
    setInterval(checkSessionExpiration, 60 * 1000);
}

// Gestion de la déconnexion
function signout(){
    removeStorage();
    window.location.href = '/signin';
}

// inclut la vérification d'expiration
export function isConnected(){
    const token = getToken();
    const user = getStorage();
    return !!(token && user && isSessionValid());
}

// Affichage de certains éléments selon le rôle
export function showAndHideElementsforRoles(){
    const ROLES = {
        ADMIN: "admin",
        EMPLOYE: "employe",
        UTILISATEUR: "utilisateur"
    }
    const userConnected = isConnected();
    const role = getRole();

    document.querySelectorAll('[data-show]').forEach(element => {
        switch(element.dataset.show){
            case 'disconnected':
                if(userConnected) element.classList.add("d-none");
                break;
            case 'connected':
                if(!userConnected) element.classList.add("d-none");
                break;
            case 'ADMIN':
                if(!userConnected || role !== ROLES.ADMIN) element.classList.add("d-none");
                break;
            case 'EMPLOYE':
                if(!userConnected || role !== ROLES.EMPLOYE) element.classList.add("d-none");
                break;
            case 'UTILISATEUR':
                if(!userConnected || role !== ROLES.UTILISATEUR) element.classList.add("d-none");
                break;
        }
    });
}

// Afficher le nom de l'utilisateur connecté dans le header
function updateHeader(){
    const dropdown   = document.querySelector('.nav-item.dropdown');
    if (!dropdown) return;
    const userLabel  = dropdown.querySelector('.nav-link.dropdown-toggle');

    const userConnected  = isConnected();

    if(userConnected){
       const user = getStorage();
        dropdown.style.display = 'block';
        userLabel.innerHTML = `<span class="bi bi-person-circle"></span> ${user.prenom}`;
    }else{
        dropdown.style.display   = 'none';
    }
}

// charger les horaires d'ouverture dans le footer
async function loadFooterHoraires() {
    const container = document.getElementById('footerHoraires');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE}/horaires/horaire-list`);
        const data = await response.json();

        if (!data.success || !data.horaires.length) return;

        const groups = [];
        let currentGroup = null;

        data.horaires.forEach(h => {
            const key = h.is_ferme == 1 ? 'ferme' : `${h.heure_ouverture}-${h.heure_fermeture}`;

            if (currentGroup && currentGroup.key === key) {
                currentGroup.jours.push(h.jour);
            } else {
                currentGroup = { key, jours: [h.jour], horaire: h };
                groups.push(currentGroup);
            }
        });

        container.innerHTML = groups.map(g => {
            const joursLabel = g.jours.length === 1
                ? g.jours[0]
                : `${g.jours[0]} - ${g.jours[g.jours.length - 1]}`;

            if (g.horaire.is_ferme == 1) {
                return `<p class="mb-1"><strong>${joursLabel}</strong> : <span class="text-danger">Fermé</span></p>`;
            }

            const ouv = g.horaire.heure_ouverture.substring(0, 5).replace(':', 'h');
            const ferm = g.horaire.heure_fermeture.substring(0, 5).replace(':', 'h');
            return `<p class="mb-1"><strong>${joursLabel}</strong> : ${ouv} - ${ferm}</p>`;
        }).join('');

    } catch (error) {
        console.error('Erreur chargement horaires footer:', error);
    }
}

// Gestion de la page active
document.querySelectorAll('.nav-link').forEach(link => {
    if (link.href === window.location.href) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
    } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
    }
});
