export const localStorageKey = "currentUser";

//initialisation des fonctions
export function init(){
    showAndHideElementsforRoles();
    updateHeader();
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
    window.location.reload();
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

