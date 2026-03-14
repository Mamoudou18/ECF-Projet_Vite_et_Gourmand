export const localStorageKey = "currentUser";

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

// Fonction pour récupérer le rôle si besoin
export function getRole(){
    const user = getStorage();
    return user ? user.role : null;
}

// Fonction pour vide le contenu du localStorage
 function removeStorage(){
    localStorage.removeItem(localStorageKey);
 }

// Gestion de la déconnexion : supprime la clé du localStorage et recharge la page
function signout(){
    removeStorage();
    window.location.reload();
}

