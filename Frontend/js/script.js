export const localStorageKey = "currentUser";
export const userRole = "role";

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

// Fonction pour vide le contenu du localStorage
 function removeStorage(){
    localStorage.removeItem(localStorageKey);
 }

// Gestion de la déconnexion : supprime la clé du localStorage et recharge la page
function signout(){
    removeStorage();
    window.location.reload();
}

