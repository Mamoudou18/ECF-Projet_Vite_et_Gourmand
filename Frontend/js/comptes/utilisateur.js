import { getStorage, setStorage } from "../script.js";


// Initialisation 
export async function init() {
    console.log('Initialisation page mon compte');

    updateDasboardHeader();
    autoFillProfilInfoUser();
    initEventListeners();
    
}

// initiliser les écouteurs d'évèenement

function initEventListeners(){
    // Navigation entre les sections
    const menuLinks = document.querySelectorAll(".sidebar-menu a");

    menuLinks.forEach(link => {
        link.addEventListener("click",function(e){
            e.preventDefault();
            const sectionId = this.getAttribute("data-section")|| this.id;

            console.log('Navigation vers la section:', sectionId);

            showSection(sectionId,this);
        });
    });

    // Bouton voir les commandes
    const btnVoirCommandes = document.getElementById("btn-voir-commandes");
    if(btnVoirCommandes){
        btnVoirCommandes.addEventListener("click", function(e){
            e.preventDefault();
            const commandesLink = document.querySelector('.sidebar-menu a[data-section="commandes-section"]');
            showSection("commandes-section",commandesLink)
        })
    }

    // Filtres commandes

    const inpuFilterStatus = document.getElementById("filterStatus");
    if(inpuFilterStatus){
        inpuFilterStatus.addEventListener("change",filterOrders);
    }

    const inputSearchOrder = document.getElementById("searchOrder");
    if(inputSearchOrder){
        inputSearchOrder.addEventListener("input",filterOrders);
    }

    const inputResetFilterBtn = document.getElementById("resetFilterBtn");
    if(inputResetFilterBtn){
        inputResetFilterBtn.addEventListener("click",function(e){
            e.preventDefault();
            resetFilters()
        });
    }

    const profilForm = document.getElementById("profilForm");
    if(profilForm){
        profilForm.addEventListener("submit",formModifyProfilUser);
    }

}

// Naviguer entre les sections
function showSection(sectionId,clickedLink){
    //Masquer les sections
    document.querySelectorAll(".section-content").forEach(section => {
        section.classList.remove("active");
    });

// Afficher la section demandée
const targetSection = document.getElementById(sectionId);
if(!targetSection){
    console.error('Section introuvable:',sectionId);
    return;
}
targetSection.classList.add("active");
console.log('Section affichée:',sectionId);


// Mettre à jour le menu latéral
document.querySelectorAll(".sidebar-menu a").forEach(link => {
    link.classList.remove("active");
});
if(clickedLink){
    clickedLink.classList.add("active");
}
        
// Scroll vers le haut
window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Filtre commandes
function filterOrders() {
    const status = document.getElementById('filterStatus').value;
    const search = document.getElementById('searchOrder').value.toLowerCase();
    const orders = document.querySelectorAll('.order-card');
    let visibleCount = 0;

    console.log(search);
        
    orders.forEach(order => {
        const orderStatus = order.getAttribute('data-status');
        const orderText = order.textContent.toLowerCase();
            
        const statusMatch = status === '' || orderStatus === status;
        const searchMatch = search === '' || orderText.includes(search);
            
        if (statusMatch && searchMatch) {
            order.style.display = 'block';
            visibleCount++;
        } else {
            order.style.display = 'none';
        }
    });
        
    document.getElementById('noOrdersFound').style.display = visibleCount === 0 ? 'block' : 'none';
}

// Initialiser tous les filtres

function resetFilters(){
    const status = document.getElementById('filterStatus');
    const search = document.getElementById('searchOrder');
    const orders = document.querySelectorAll('.order-card');
    const noResultsMsg = document.getElementById('noOrdersFound');

    if(status) status.value = '';
    if(search) search.value = '';

    orders.forEach(order => {
        order.style.display ='block';
    });

    if(noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
}

// Récupération des initiales, prenom, nom email et tel pour header de l'user
function updateDasboardHeader(){

    // On récupère les infos user depuis le storage
    const user = getStorage();
    if(!user) return;

    // Avatar initiales

    const avatar = document.getElementById("user-avatar");
    if(avatar){
        const initiales = `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
        avatar.textContent = initiales;
    }

    // Nom
    const nom = document.querySelector('.user-details h3');
    if(nom) nom.textContent = `Bienvenue, ${user.prenom} ${user.nom}`;

    // Email
    const email = document.querySelector('.user-details p:nth-child(2)');
    if(email) email.innerHTML = `<i class="bi bi-envelope"></i> ${user.email}`;

    // Téléphone
    const tel = document.querySelector('.user-details p:nth-child(3)');
    if(tel) tel.innerHTML = `<i class="bi bi-telephone"></i> ${user.telephone}`;
}


// Pre-remplir les infos user dans la section Mon Profil: 

function autoFillProfilInfoUser() {
    const user = getStorage();
    if(!user) return;

    // Remplir les champs
    document.getElementById('nom').value = user.nom || '';
    document.getElementById('prenom').value = user.prenom || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('telephone').value = user.telephone || '';
    document.getElementById('adresse').value = user.adresse || '';
    document.getElementById('codePostal').value = user.code_postal || '';
    document.getElementById('ville').value = user.ville || '';
}

//validation du formulaire
function validateFormModifyProfil(){
    const errors = [];
    
    // Téléphone (format FR)
    const tel = document.getElementById('telephone').value;
    if (!/^0[1-9][0-9]{8}$/.test(tel.replace(/\s/g, ''))) {
        errors.push('Téléphone invalide (format: 06 12 34 56 78)');
    }

    if (!document.getElementById('adresse').value.trim()) {
        errors.push('Veuillez renseigner l\'adresse de livraison');
    }

    if (!document.getElementById('codePostal').value.trim()) {
        errors.push('Veuillez renseigner le code postal');
    }
    if (!document.getElementById('ville').value.trim()) {
        errors.push('Veuillez renseigner la ville');
    }

    if (!document.getElementById('nom').value.trim()) {
        errors.push('Veuillez renseigner le nom');
    }

    if (!document.getElementById('prenom').value.trim()) {
        errors.push('Veuillez renseigner le prenom');
    }

    if(errors.length > 0){
        alert('Erreurs de validation :\n\n' + errors.join('\n'));
        return false;
    }
    return true;  
}

// Soumission du formulaire
function formModifyProfilUser(e){
    e.preventDefault();

    if(!validateFormModifyProfil()) return;

    const user = getStorage();
    if(!user) return;

    const updateUser = {
        ...user, // conserver les champs non modifiés
        nom: document.getElementById('nom').value,
        prenom: document.getElementById('prenom').value,
        telephone: document.getElementById('telephone').value.replace(/(\d{2})(?=\d)/g, '$1 ').trim(),
        adresse: document.getElementById('adresse').value,
        code_postal: document.getElementById('codePostal').value,
        ville: document.getElementById('ville').value

    };
    // Extraire les variables APRES avoir défini updateUser
    const { nom, prenom, telephone, adresse, code_postal, ville } = updateUser;

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        nom,
        prenom,
        gsm:telephone,
        adresse,
        ville,
        code_postal,
    });


    const requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: raw,
    };

    fetch(`http://localhost/api/auth/user?id=${user.id}`, requestOptions)
        .then((response) => {
            if(response.ok){
               return response.json()
            }else{
                alert('Erreur lors de la mise du profil.')
            }
        })
            
        .then((result) => {
            if(result){
                setStorage("user", updateUser);
                alert("Profil mis à jour avec succès !");
            }
        })
        .catch((error) => {
            console.error("Erreur réseau :", error);
            alert("Erreur réseau, veuillez réessayer.");
        })

}