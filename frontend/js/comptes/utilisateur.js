import { getStorage, setStorage } from "../script.js";
import { 
    showPassword, 
    checkPasswordStrength, 
    checkPasswordMatch, 
    showConfirm,
    renderStars,
    showToast 
} from "../utils/util.js";
import { API_BASE } from "../config.js";

//variables globales
let cachedCommandes = null;

async function getCommandes(userId) {
    if (cachedCommandes) return cachedCommandes;
    const response = await fetch(`${API_BASE}/commande/user-commande?id=${userId}`);
    if (!response.ok) return [];
    const data = await response.json();
    cachedCommandes = Array.isArray(data.commandes) ? data.commandes : [];
    return cachedCommandes;
}

function invalidateCommandesCache() {
    cachedCommandes = null;
}

// Initialisation 
export async function init() {

    updateDasboardHeader();
    autoFillProfilInfoUser();
    initEventListeners();
    loadDashboard();
    loadCommandes();
    loadAvis();

    // Redirection via hash
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        const link = document.querySelector(`.sidebar-menu a[data-section="${hash}"]`);
        if (link) {
            showSection(hash, link);
        }
    }
}

// initiliser les écouteurs d'évèenement

function initEventListeners(){
    // Navigation entre les sections
    const menuLinks = document.querySelectorAll(".sidebar-menu a");

    menuLinks.forEach(link => {
        link.addEventListener("click",function(e){
            e.preventDefault();
            const sectionId = this.getAttribute("data-section")|| this.id;

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
        showToast('errors', 'validation');
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
        ...user,
        nom: document.getElementById('nom').value,
        prenom: document.getElementById('prenom').value,
        telephone: document.getElementById('telephone').value.replace(/(\d{2})(?=\d)/g, '$1 ').trim(),
        adresse: document.getElementById('adresse').value,
        code_postal: document.getElementById('codePostal').value,
        ville: document.getElementById('ville').value

    };
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

    fetch(`${API_BASE}/auth/user?id=${user.id}`, requestOptions)
        .then((response) => {
            if(response.ok){
               return response.json()
            }else{
                showToast('Erreur lors de la mise du profil.', 'danger');
            }
        })

        .then((result) => {
            if(result){
                setStorage(updateUser);
                showToast('Profil mis à jour avec succès !', 'success');
            }
        })
        .catch((error) => {
            console.error("Erreur réseau :", error);
            showToast('Erreur réseau, veuillez réessayer.', 'danger');
        })

}

// *******************************************************
//Initialisation mot de passe depuis un compte utilisateur:
// *********************************************************

// Récupération des inputs du formulaire
const inoutOldPassword = document.getElementById("oldPassword");
const inputPassword = document.getElementById("newPassword");
const inputPasswordConfirm = document.getElementById("passwordConfirm");
const inputInitPasswordForm = document.getElementById("initPasswordForm");

// Afficher et masquer le mot de passe
showPassword("toggleOldPassword", "oldPassword");
showPassword("togglePassword", "newPassword");
showPassword("togglePasswordConfirm", "passwordConfirm");

// Vérifier la force du mot de passe
inputPassword.addEventListener("input", () => checkPasswordStrength(inputPassword));

// Vérifier la correspondance des mots de passe
inputPassword.addEventListener("input", () => checkPasswordMatch(inputPassword, inputPasswordConfirm));
inputPasswordConfirm.addEventListener("input", () => checkPasswordMatch(inputPassword, inputPasswordConfirm));

// Gestion de la réinitialisation
inputInitPasswordForm.addEventListener("submit", handleInitPassword);

async function handleInitPassword(event) {
    event.preventDefault();

    const user = getStorage();
    if(!user) return;

    const old_password = inoutOldPassword.value;
    const new_password = inputPassword.value;
    const confirm_password = inputPasswordConfirm.value;

    // Vérifications
    if (!checkPasswordStrength(inputPassword)) {
        showToast('Le mot de passe ne respecte pas tous les critères de sécurité', 'warning');
        return;
    }

    if (new_password !== confirm_password) {
        showToast('Les mots de passe ne correspondent pas', 'warning');
        return;
    }

    // Désactiver le bouton
    const initPasswordBtn = document.getElementById('initPasswordBtn');
    initPasswordBtn.disabled = true;
    initPasswordBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Réinitialisation...';

    try {
        const response = await fetch(`${API_BASE}/auth/password?id=${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ old_password, new_password, confirm_password })
        });

        const data = await response.json();

        const msg = document.getElementById('message');
        msg.textContent = data.message;
        msg.classList.remove('hidden');

        if (data.success) {
            showToast('Mot de passe mis à jour avec succès !', 'success');
            setTimeout(() => window.location.reload(), 2000);
            initPasswordBtn.disabled = false;
            initPasswordBtn.innerHTML = 'Réinitialiser';
        } else {
                console.log('Échec:', data.message);
                showToast(data.message || 'Une erreur est survenue.', 'danger');
                initPasswordBtn.disabled = false;
                initPasswordBtn.innerHTML = 'Réinitialiser';
        }

    } catch (error) {
        console.log(error);
        showToast('Erreur réseau, veuillez réessayer.', 'danger');
        initPasswordBtn.disabled = false;
        initPasswordBtn.innerHTML = 'Réinitialiser';
    }
}

// Configuration des statuts
function getStatusConfig(status) {
    const configs = {
        en_attente:              { label: 'En attente',              class: 'status-attente',     icon: 'bi-clock' },
        accepte:                 { label: 'Acceptée',                class: 'status-accepte',     icon: 'bi-check-circle' },
        en_preparation:          { label: 'En préparation',          class: 'status-preparation', icon: 'bi-box-seam' },
        en_cours_livraison:      { label: 'En cours de livraison',   class: 'status-livraison',   icon: 'bi-truck' },
        livre:                   { label: 'Livrée',                  class: 'status-livre',       icon: 'bi-check2-circle' },
        attente_retour_materiel: { label: 'Attente retour matériel', class: 'status-retour',      icon: 'bi-arrow-return-left' },
        terminee:                { label: 'Terminée',                class: 'status-termine',     icon: 'bi-check-all' },
        annulee:                 { label: 'Annulée',                 class: 'status-annule',      icon: 'bi-x-circle' },
    };
    return configs[status] || { label: status, class: 'status-attente', icon: 'bi-question-circle' };
}

// ==================== TABLEAU DE BORD ====================

async function loadDashboard() {
    const user = getStorage();
    if (!user) return;

    try {
        const liste = await getCommandes(user.id);

        const total = liste.length;
        const enCours = liste.filter(c => ['en_attente', 'accepte', 'en_preparation', 'en_cours_livraison', 'livre', 'attente_retour_materiel'].includes(c.statut)).length;
        const terminees = liste.filter(c => c.statut === 'terminee').length;
        const annulees = liste.filter(c => c.statut === 'annulee').length;

        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <i class="bi bi-cart-check-fill"></i>
                    <h3>${total}</h3>
                    <p>Commandes totales</p>
                </div>
                <div class="stat-card">
                    <i class="bi bi-hourglass-split"></i>
                    <h3>${enCours}</h3>
                    <p>En cours</p>
                </div>
                <div class="stat-card">
                    <i class="bi bi-check-circle-fill"></i>
                    <h3>${terminees}</h3>
                    <p>Terminées</p>
                </div>
                <div class="stat-card">
                    <i class="bi bi-x-circle"></i>
                    <h3>${annulees}</h3>
                    <p>Annulées</p>
                </div>
            `;
        }

        const recentList = document.getElementById('recentOrdersList');
        if (recentList) {
            const recentes = liste.slice(0, 3);
            if (recentes.length === 0) {
                recentList.innerHTML = '<p class="text-muted text-center">Aucune commande pour le moment.</p>';
            } else {
                recentList.innerHTML = recentes.map(c => renderOrderCard(c)).join('');
            }
        }

    } catch (error) {
        console.error('Erreur chargement dashboard:', error);
    }
}


// ==================== MES COMMANDES ====================
async function loadCommandes() {
    const user = getStorage();
    if (!user) return;

    try {
        const liste = await getCommandes(user.id);

        const container = document.getElementById('ordersList');
        const noOrders = document.getElementById('noOrdersFound');
        if (!container) return;

        if (liste.length === 0) {
            container.innerHTML = '';
            if (noOrders) noOrders.style.display = 'block';
        } else {
            container.innerHTML = liste.map(c => renderOrderCard(c)).join('');
            if (noOrders) noOrders.style.display = 'none';
        }

    } catch (error) {
        console.error('Erreur chargement commandes:', error);
    }
}

// Rendu d'une carte commande
function renderOrderCard(commande) {
    const config = getStatusConfig(commande.statut);
    
    const dateCommande = new Date(commande.created_at).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const heureCommande = new Date(commande.created_at).toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit'
    });

    const datePrestation = new Date(commande.date_prestation).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const heurePrestation = commande.heure_prestation ? commande.heure_prestation.substring(0, 5) : '';

    const montant = commande.prix_total ? `${parseFloat(commande.prix_total).toFixed(2)} €` : 'N/A';

    // Boutons d'action selon le statut
    let actions = '';

    if (commande.statut === 'en_attente') {
        actions += `<button class="btn btn-sm btn-outline-warning" onclick="modifierCommande(${commande.id})">
            <i class="bi bi-pencil"></i> Modifier
        </button>`;

        actions += `<button class="btn btn-sm btn-outline-danger btn-annuler"
        data-id ="${commande.id}"
        data-numero="${commande.numero_commande}">
            <i class="bi bi-x-circle"></i> Annuler
        </button>`;
    }

    if (['accepte', 'en_preparation', 'en_cours_livraison', 'livre','attente_retour_materiel','terminee','annulee'].includes(commande.statut)) {

        actions += `<button class="btn btn-sm btn-outline-info btn-suivre" 
            data-id="${commande.id}" 
            data-numero="${commande.numero_commande}">
            <i class="bi bi-geo-alt"></i> Suivre ma commande
        </button>`;

    }

    if (commande.statut === 'terminee') {
        actions += `<button class="btn btn-sm btn-outline-success btn-recommander"
        data-id= "${commande.id}"
        data-numero="${commande.numero_commande}">
            <i class="bi bi-arrow-repeat"></i> Recommander
        </button>`;
    }

    // Voir détail toujours présent
    actions += `<button class="btn btn-sm btn-outline-primary" onclick="voirDetail(${commande.id})">
        <i class="bi bi-eye"></i> Voir détail
    </button>`;


    return `
        <div class="order-card" data-status="${commande.statut}">
            <div class="order-header">
                <div>
                    <div class="order-id">#${commande.numero_commande || commande.id}</div>
                    <small class="text-muted">Commandé le ${dateCommande} à ${heureCommande}</small>
                </div>
                <span class="order-status ${config.class}">
                    <i class="bi ${config.icon}"></i> ${config.label}
                </span>
            </div>
            <div class="order-details">
                <div class="order-detail-item">
                    <i class="bi bi-book"></i>
                    <span>${commande.menu_titre || 'Menu non spécifié'}</span>
                </div>
                <div class="order-detail-item">
                    <i class="bi bi-people"></i>
                    <span>${commande.nb_personnes} personnes</span>
                </div>
                <div class="order-detail-item">
                    <i class="bi bi-calendar-event"></i>
                    <span>Prestation: ${datePrestation} à ${heurePrestation}</span>
                </div>
                <div class="order-detail-item">
                    <i class="bi bi-geo-alt"></i>
                    <span>${commande.adresse_prestation || 'Adresse non renseignée'}</span>
                </div>
                <div class="order-detail-item">
                    <i class="bi bi-currency-euro"></i>
                    <strong>${montant}</strong>
                </div>
            </div>
            <div class="order-actions">
                ${actions}
            </div>
        </div>
    `;
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-annuler');
    if (!btn) return;
    annulerCommande(btn.dataset.id, btn.dataset.numero);
});

 async function annulerCommande (id, numero_commande) {
    const confirmed = await showConfirm({
        title: 'Annuler la commande ?',
        message: 'Votre commande sera définitivement annulée.',
        icon: 'bi-x-circle-fill',
        iconColor: 'text-primary',
        btnText: 'Oui, annuler',
        btnClass: 'bg-accent',
        titleHeder : '#'+numero_commande,
    });
    if (!confirmed) return;

    const user = getStorage();

    try {
        const response = await fetch(`${API_BASE}/commande/annule-commande?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                motif_annulation: "Commande annulée par le client depuis son espace",
                modifie_par: user.id,
                mode_contact: " Annulation du client"
            })
        });

        if (response.ok) {
            invalidateCommandesCache();
            showToast('Commande annulée avec succès.', 'success');
            loadDashboard();
            loadCommandes();
        } else {
            showToast('Erreur lors de l\'annulation.', 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast('Erreur réseau.', 'danger');
    }
};

window.modifierCommande = async function(id) {
    try {
        const response = await fetch(`${API_BASE}/commande/detail-commande?id=${id}`);

        const data = await response.json();

        if (data.success && data.commande) {
            const menuId = data.commande.menu_id;
            window.location.href = `/commande?menu=${menuId}&modifier=${id}`;
        } else {
            showToast("Commande introuvable.", 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast("Erreur réseau.", 'danger');
    }
};

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-suivre');
    if (!btn) return;
    suivreCommande(btn.dataset.id, btn.dataset.numero);
});

 function suivreCommande (id, numero_commande) {
    // Ouvrir la modale de suivi
    const modal = document.getElementById('suiviModal');
    if (modal) {
        document.getElementById('suiviCommandeId').textContent = `#${id}`;
        loadSuiviCommande(id, numero_commande);
        new bootstrap.Modal(modal).show();
    }
};

window.voirDetail = async function(id) {
    try {
        const response = await fetch(`${API_BASE}/commande/detail-commande?id=${id}`);
        const data = await response.json();

        if (data.success) {
            afficherDetailCommande(data.commande);
            new bootstrap.Modal(document.getElementById('detailCommandeModal')).show();
        } else {
            showToast('Impossible de charger le détail.', 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast('Erreur réseau.', 'danger');
    }
};

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-recommander');
    if (!btn) return;
    recommander(btn.dataset.id, btn.dataset.numero);
});

async function recommander (id, numero_commande) {

    const confirmed = await showConfirm({
        title: 'Recommander ?',
        message: 'Une nouvelle commande identique sera créée.',
        icon: 'bi-arrow-repeat',
        iconColor: 'text-primary',
        btnText: 'Oui, recommander',
        btnClass: 'bg-accent',
        titleHeder : '#'+numero_commande,
    });
    if (!confirmed) return;

    try {
        const detailRes = await fetch(`${API_BASE}/commande/detail-commande?id=${id}`);
        const detailData = await detailRes.json();

        if (!detailData.success) {
            showToast('Impossible de récupérer la commande.', 'danger');
            return;
        }

        const old = detailData.commande;

        const lisOld = {
            user_id: old.user_id,
            menu_id: old.menu_id,
            nom_client: old.nom_client,
            prenom_client: old.prenom_client,
            email_client: old.email_client,
            gsm_client: old.gsm_client,
            adresse_prestation: old.adresse_prestation,
            ville_prestation: old.ville_prestation,
            code_postal_prestation: old.code_postal_prestation,
            date_prestation: old.date_prestation,
            heure_prestation: old.heure_prestation ? old.heure_prestation.substring(0, 5) : null,
            nb_personnes: old.nb_personnes,
            prix_livraison: old.prix_livraison,
            prix_menu: old.prix_menu,
            prix_total: old.prix_total,
            location_materiel: old.location_materiel,
            commentaire: old.commentaire
        };

        const createRes = await fetch(`${API_BASE}/commande/create-commande`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lisOld)
        });

        const createData = await createRes.json();

        if (createData.success) {
            invalidateCommandesCache();
            showToast('Nouvelle commande créée avec succès !','success');
            loadDashboard();
            loadCommandes();
        } else {
            showToast(createData.message || 'Impossible de recommander.', 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast('Erreur réseau.', 'danger');
    }
};

// Charger le suivi d'une commande
async function loadSuiviCommande(id, numero_commande) {
    try {
        const response = await fetch(`${API_BASE}/commande/historique?id=${id}`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('suiviCommandeId').textContent = `#${numero_commande}`;
            afficherSuiviCommande(data.historique);
        } else {
            document.getElementById('suiviCommandeContent').innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-info-circle" style="font-size: 2rem;"></i>
                    <p class="mt-2">${data.message || 'Aucun suivi disponible.'}</p>
                </div>`;
        }
    } catch (error) {
        console.error(error);
        document.getElementById('suiviCommandeContent').innerHTML = `
            <div class="text-center text-danger py-4">
                <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                <p class="mt-2">Erreur de chargement.</p>
            </div>`;
    }
}

// Afficher le détail d'une commande dans la modale
function afficherDetailCommande(commande) {
    const container = document.getElementById('detailCommandeContent');
    if (!container) return;

    const config = getStatusConfig(commande.statut);
    const dateCommande = new Date(commande.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const datePrestation = new Date(commande.date_prestation).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
    const montantTotal = parseFloat(commande.prix_total).toFixed(2);
    const montantMenu = parseFloat(commande.prix_menu).toFixed(2);
    const montantLivraison = parseFloat(commande.prix_livraison).toFixed(2);

    container.innerHTML = `
        <!-- En-tête -->
        <div class="mb-3 d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-bold"><i class="bi bi-receipt me-2"></i>#${commande.numero_commande}</h5>
            <span class="order-status ${config.class}">
                <i class="bi ${config.icon}"></i> ${config.label}
            </span>
        </div>
        <hr>

        <!-- Prestation -->
        <h6 class="fw-bold text-muted mb-3"><i class="bi bi-calendar-event me-2"></i>Détails prestation</h6>
        <div class="row g-2 mb-3">
            <div class="col-md-4">
                <div class="bg-light rounded p-2">
                    <small class="text-muted">Date</small>
                    <p class="mb-0 fw-semibold">${datePrestation}</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="bg-light rounded p-2">
                    <small class="text-muted">Heure</small>
                    <p class="mb-0 fw-semibold">${commande.heure_prestation || '—'}</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="bg-light rounded p-2">
                    <small class="text-muted">Personnes</small>
                    <p class="mb-0 fw-semibold">${commande.nb_personnes}</p>
                </div>
            </div>
            <div class="col-12">
                <div class="bg-light rounded p-2">
                    <small class="text-muted">Adresse prestation</small>
                    <p class="mb-0 fw-semibold">${commande.adresse_prestation}, ${commande.code_postal_prestation} ${commande.ville_prestation}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="bg-light rounded p-2">
                    <small class="text-muted">Menu</small>
                    <p class="mb-0 fw-semibold">${commande.menu_titre || 'Non spécifié'}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="bg-light rounded p-2">
                    <small class="text-muted">Location matériel</small>
                    <p class="mb-0 fw-semibold">${commande.location_materiel ? '<i class="bi bi-check-circle text-success"></i> Oui' : '<i class="bi bi-x-circle text-danger"></i> Non'}</p>
                </div>
            </div>
        </div>

        <!-- Tarification -->
        <h6 class="fw-bold text-muted mb-3"><i class="bi bi-currency-euro me-2"></i>Tarification</h6>
        <div class="bg-light rounded p-3 mb-3">
            <div class="d-flex justify-content-between mb-1">
                <span>Prix menu</span>
                <span>${montantMenu} €</span>
            </div>
            ${commande.location_materiel ? `
            <div class="d-flex justify-content-between mb-1">
                <span>Location matériel</span>
                <span>50.00 €</span>
            </div>` : ''}
            <div class="d-flex justify-content-between mb-1">
                <span>Livraison</span>
                <span>${montantLivraison === '0.00' ? '<span class="text-success">Gratuite</span>' : montantLivraison + ' €'}</span>
            </div>
            <hr class="my-2">
            <div class="d-flex justify-content-between fw-bold">
                <span>Total</span>
                <span class="text-primary fs-5">${montantTotal} €</span>
            </div>
        </div>

        <!-- Commentaire -->
        ${commande.commentaire ? `
        <h6 class="fw-bold text-muted mb-2"><i class="bi bi-chat-text me-2"></i>Commentaire</h6>
        <div class="bg-light rounded p-2 mb-3">
            <p class="mb-0">${commande.commentaire}</p>
        </div>` : ''}

        <!-- Motif annulation -->
        ${commande.motif_annulation ? `
        <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i><strong>Motif d'annulation :</strong> ${commande.motif_annulation}
        </div>` : ''}

        <!-- Pied -->
        <div class="text-muted text-end small">
            <i class="bi bi-clock me-1"></i>Commandé le ${dateCommande}
        </div>
    `;
}

// Afficher les étapes de suivi
function afficherSuiviCommande(historique) {
    const container = document.getElementById('suiviCommandeContent');

    const icones = {
        'en_attente': { icon: 'bi-hourglass-split', color: '#f39c12' },
        'accepte': { icon: 'bi-check-circle-fill', color: '#27ae60' },
        'en_preparation': { icon: 'bi-box-seam', color: '#2980b9' },
        'en_cours_livraison': { icon: 'bi-truck', color: '#e67e22' },
        'livre': { icon: 'bi-house-check-fill', color: '#2ecc71' },
        'attente_retour_materiel': { icon: 'bi-arrow-return-left', color: '#6c5ce7' },
        'terminee': { icon: 'bi-check-all', color: '#155724' },
        'annulee': { icon: 'bi-x-circle-fill', color: '#e74c3c' }
    };

    let html = '<div>';

    historique.forEach((etape, index) => {
        const config = icones[etape.statut_libelle] || { icon: 'bi-circle', color: '#95a5a6' };
        const isLast = index === historique.length - 1;
        const date = new Date(etape.created_at).toLocaleString('fr-FR');

        html += `
            <div class="d-flex mb-4 ${isLast ? '' : ''}">
                <div class="me-3 text-center" style="min-width: 40px;">
                    <i class="bi ${config.icon}" style="font-size: 1.5rem; color: ${config.color};"></i>
                    ${!isLast ? `<div class="bg-accent" style="width: 2px; height: 30px; margin: 5px auto;"></div>` : ''}
                </div>
                <div>
                    <h6 class="mb-1 fw-bold" style="color: ${config.color};">
                        ${etape.statut_libelle.replace('_', ' ').toUpperCase()}
                    </h6>
                    <small class="text-muted"><i class="bi bi-clock"></i> ${date}</small>
                    ${etape.commentaire ? `<p class="mb-0 mt-1 text-muted small">${etape.commentaire}</p>` : ''}
                </div>
            </div>`;
    });

    html += '</div>';
    container.innerHTML = html;
}

// ==================== MES AVIS ====================
async function loadAvis() {
    const user = getStorage();
    if (!user) return;

    try {
        const responseAvis = await fetch(`${API_BASE}/avis/user?user_id=${user.id}`);
        if (!responseAvis.ok) return;
        const avis = await responseAvis.json();
        const listeAvis = Array.isArray(avis.avis) ? avis.avis : [];

        const listeCmd = await getCommandes(user.id);

        const commandesTerminees = listeCmd.filter(c => c.statut === 'terminee');
        const commandesAvecAvis = listeAvis.map(a => a.id_commande);
        const commandesSansAvis = commandesTerminees.filter(c => !commandesAvecAvis.includes(c.id));

        const avisPublies = listeAvis.filter(a => a.statut === 'approuve');
        const avisEnAttente = listeAvis.filter(a => a.statut === 'en_attente');

        const publishedContainer = document.getElementById('avisPubliesList');
        if (publishedContainer) {
            if (avisPublies.length === 0) {
                publishedContainer.innerHTML = '<p class="text-muted">Aucun avis publié.</p>';
            } else {
                publishedContainer.innerHTML = avisPublies.map(a => renderAvisCard(a, 'published')).join('');
            }
        }

        const awaitingContainer = document.getElementById('avisEnAttenteList');
        if (awaitingContainer) {
            if (avisEnAttente.length === 0) {
                awaitingContainer.innerHTML = '<p class="text-muted">Aucun avis en attente de modération.</p>';
            } else {
                awaitingContainer.innerHTML = avisEnAttente.map(a => renderAvisCard(a, 'pending')).join('');
            }
        }

        const evalContainer = document.getElementById('commandesAEvaluerList');
        const evalAlert = document.getElementById('commandesAEvaluerAlert');
        if (evalContainer) {
            if (commandesSansAvis.length === 0) {
                evalContainer.innerHTML = '<p class="text-muted">Aucune commande à évaluer pour le moment.</p>';
                if (evalAlert) evalAlert.innerHTML = '';
            } else {
                if (evalAlert) {
                    evalAlert.innerHTML = `
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle"></i> 
                            Vous avez ${commandesSansAvis.length} commande(s) à évaluer.
                        </div>
                    `;
                }
                evalContainer.innerHTML = commandesSansAvis.map(c => `
                    <div class="review-card mb-3 p-3 border rounded">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>Commande #${c.numero_commande}</strong>
                                <span class="text-muted ms-2">${new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <button class="btn btn-sm btn-warning" onclick="ouvrirFormulaireAvis(${c.id})">
                                <i class="bi bi-star"></i> Évaluer
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }

    } catch (error) {
        console.error('Erreur chargement avis:', error);
    }
}


function renderAvisCard(avis, statusClass) {
    const date = new Date(avis.date_avis || avis.created_at).toLocaleDateString('fr-FR');
    const statusLabel = statusClass === 'published' ? 'Publié' : 'En attente';
    const badgeClass = statusClass === 'published' ? 'bg-success' : 'bg-warning text-dark';

    return `
        <div class="review-card mb-3 p-3 border rounded">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <strong>Commande #${avis.numero_commande}</strong>
                <span class="badge ${badgeClass}">${statusLabel}</span>
            </div>
            <div class="mb-2">${renderStars(avis.note)}</div>
            <p class="mb-1">${avis.commentaire || ''}</p>
            <small class="text-muted">${date}</small>
        </div>
    `;
}

// ===== Formulaire d'avis (modale) =====
window.ouvrirFormulaireAvis = function(commandeId) {
    // Vérifier si la modale existe déjà
    let modal = document.getElementById('modalAvis');
    if (!modal) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="modalAvis" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Laisser un avis</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <input type="hidden" id="avisCommandeId">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Note</label>
                                <div id="avisStarsInput" class="fs-3">
                                    <div id="avisStarsInput" class="fs-3 d-flex gap-1">
                                        ${[1,2,3,4,5].map(i => `<i class="bi bi-star text-muted" data-note="${i}" style="cursor:pointer"></i>`).join('')}
                                    </div>
                                    <input type="hidden" id="avisNoteValue" value="0">
                            </div>
                            <div class="mb-3">
                                <label for="avisCommentaire" class="form-label fw-bold">Commentaire</label>
                                <textarea id="avisCommentaire" class="form-control" rows="4" placeholder="Partagez votre expérience..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                            <button type="button" class="btn bg-accent" onclick="envoyerAvis()">
                                <i class="bi bi-send"></i> Envoyer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);
        modal = document.getElementById('modalAvis');

        // Gestion des étoiles cliquables
        let currentNote = 0;
        document.querySelectorAll('#avisStarsInput i').forEach(star => {
            // Simple clic = note entière
            star.addEventListener('click', function() {
                const note = parseInt(this.dataset.note);
                // Si on clique sur la même étoile entière, passer en demi
                if (currentNote === note) {
                    currentNote = note - 0.5;
                } else {
                    currentNote = note;
                }
                document.getElementById('avisNoteValue').value = currentNote;
                updateStarsDisplay(currentNote);
            });
        });

        function updateStarsDisplay(note) {
            document.querySelectorAll('#avisStarsInput i').forEach((s, idx) => {
                const starNum = idx + 1;
                if (starNum <= Math.floor(note)) {
                    s.className = 'bi bi-star-fill text-warning fs-3';
                } else if (starNum === Math.ceil(note) && note % 1 !== 0) {
                    s.className = 'bi bi-star-half text-warning fs-3';
                } else {
                    s.className = 'bi bi-star text-muted fs-3';
                }
            });
        }
    }

    // Reset
    document.getElementById('avisCommandeId').value = commandeId;
    document.getElementById('avisNoteValue').value = 0;
    document.getElementById('avisCommentaire').value = '';
    document.querySelectorAll('#avisStarsInput i').forEach(s => s.className = 'bi bi-star text-muted');
    document.querySelector('#modalAvis .modal-title').textContent = `Avis — Commande #${commandeId}`;

    new bootstrap.Modal(modal).show();
}

window.envoyerAvis = async function() {
    const user = getStorage();
    if (!user) return;

    const id_commande = document.getElementById('avisCommandeId').value;
    const note = parseFloat(document.getElementById('avisNoteValue').value);
    const commentaire = document.getElementById('avisCommentaire').value.trim();

    if (!note || note < 1 || note > 5) {
        showToast('Veuillez sélectionner une note entre 1 et 5.', 'warning');
        return;
    }
    if (!commentaire) {
        showToast('Veuillez écrire un commentaire.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/avis/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                id_commande: parseInt(id_commande),
                note,
                commentaire
            })
        });

        const result = await response.json();

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalAvis')).hide();
            showToast('Merci pour votre avis ! Il sera visible après modération.', 'success');
            loadAvis();
        } else {
            showToast(result.message || 'Erreur lors de l\'envoi de l\'avis.', 'danger');
        }
    } catch (error) {
        console.error('Erreur envoi avis:', error);
        showToast('Erreur de connexion.','danger');
    }
}

