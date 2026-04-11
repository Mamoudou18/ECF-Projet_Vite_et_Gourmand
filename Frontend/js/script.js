const API_BASE = 'http://localhost/api';
export const localStorageKey = "currentUser";

//initialisation des fonctions
export function init(){
    showAndHideElementsforRoles();
    updateHeader();
    loadFooterHoraires();
}
 init();

// Récup du bouton signout
const signoutBtn = document.getElementById("btn-signout");
if (signoutBtn) {
  signoutBtn.addEventListener("click", signout);
}

// Fonction pour stocker dans le localStorage
export function setStorage(userData){
    localStorage.setItem(localStorageKey, JSON.stringify(userData));
}

//Fonction pour récuperer les données dans le localStorage
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
console.log("role:", getRole());


// Fonction pour récupérer le rôle si besoin
export function getRole(){
    const user = getStorage();
    return user ? user.role : null;
}

// Fonction pour vide le contenu du localStorage
 export function removeStorage(){
    localStorage.removeItem(localStorageKey);
 }

// Gestion de la déconnexion : supprime la clé du localStorage et recharge la page
function signout(){
    removeStorage();
    window.location.href = '/signin';
}

// Vérifier si connecté
export function isConnected(){
    const token = getToken();
    const user = getStorage();
    return !!(token && user);
}

//Affichage de certains éléments selon le rôle
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

//charger les horaires d'ouverture dans le footer
async function loadFooterHoraires() {
    const container = document.getElementById('footerHoraires');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE}/horaires/horaire-list`);
        const data = await response.json();

        if (!data.success || !data.horaires.length) return;

        // Grouper les jours par horaire identique
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

        // Générer l'affichage
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
        // Retire active si on change de page
        link.classList.remove('active');
        link.removeAttribute('aria-current');
    }
});

