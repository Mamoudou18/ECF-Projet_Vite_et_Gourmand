import { getStorage } from "../script.js";
import { showToast, formatDate, renderStars } from "../utils/util.js";

// ===================== VARIABLES =====================
let orders = [];
let modificationOrderId = null;
let modificationMenuId = null;
let allEmployeeMenus = [];
let filteredEmployeeMenus = []; 
let empMenusCurrentPage = 1;
const EMP_MENUS_PER_PAGE = 9;

// ===================== INIT =====================
export async function init() {
    await loadOrders();
    initEventListeners();
    initModalListeners();
    updateDasboardHeader();
    loadAdminDashboard();

}

// ===== INITIALISATION =====
async function initEmployeeMenus() {
    await loadAllEmployeeMenus();
    applyFilters();
}

// ===================== EVENT LISTENERS =====================
function initEventListeners() {
    // Navigation
    document.querySelectorAll(".sidebar-menu a").forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const sectionId = this.getAttribute("data-section") || this.id;
            showSection(sectionId, this);
        });
    });

    // Filtres
    const filterStatus = document.getElementById("filterStatus");
    if (filterStatus) filterStatus.addEventListener("change", filterOrders);

    const searchOrder = document.getElementById("searchOrder");
    if (searchOrder) searchOrder.addEventListener("input", filterOrders);

    const resetBtn = document.getElementById("resetFilterBtn");
    if (resetBtn) resetBtn.addEventListener("click", function (e) {
        e.preventDefault();
        resetFilters();
    });
}

function initModalListeners() {
    const confirmStatusBtn = document.getElementById('confirmStatusBtn');
    if (confirmStatusBtn) confirmStatusBtn.addEventListener('click', handleConfirmStatus);

    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', handleConfirmCancel);

    const btnModif = document.getElementById('btnConfirmModification');
    if (btnModif) btnModif.addEventListener('click', handleConfirmModification);
}

// ===================== NAVIGATION =====================
function showSection(sectionId, clickedLink) {
    document.querySelectorAll(".section-content").forEach(s => s.classList.remove("active"));

    const target = document.getElementById(sectionId);
    if (!target) return;
    target.classList.add("active");

    document.querySelectorAll(".sidebar-menu a").forEach(l => l.classList.remove("active"));
    if (clickedLink) clickedLink.classList.add("active");

    if (sectionId === 'avis-section') loadAvis();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================== CHARGEMENT COMMANDES =====================
async function loadOrders() {
    try {
        const response = await fetch('http://localhost/api/commande/affiche');
        const data = await response.json();
        if (data.success) {
            orders = data.commandes;
        }
    } catch (error) {
        console.error('Erreur chargement commandes:', error);
    }
    renderOrders();
}

async function refreshCommandes() {
    await loadOrders();
    loadAdminDashboard();
    resetFilters();
}

//===============MISE A JOUR HEADER ====================
function updateDasboardHeader(){
    const user = getStorage();
    if(!user) return;

    const avatar = document.getElementById("user-avatar");
    if(avatar){
        const initiales = `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
        avatar.textContent = initiales;
    }

    const nom = document.querySelector('.lead');
    if(nom) nom.textContent = `Bienvenue, ${user.prenom} ${user.nom}`;
}

// ===================== RENDU TABLEAU =====================
function renderOrders() {
    const tbody = document.getElementById('commandesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    orders.forEach(cmd => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-status', cmd.statut);
        tr.innerHTML = `
            <td>${cmd.numero_commande}</td>
            <td>${cmd.prenom_client} ${cmd.nom_client}</td>
            <td>${cmd.email_client}<br>${cmd.gsm_client}</td>
            <td>${cmd.menu_titre}</td>
            <td>${cmd.nb_personnes}</td>
            <td>${formatDate(cmd.date_prestation)}<br>${cmd.ville_prestation}</td>
            <td>${parseFloat(cmd.prix_total).toFixed(2)} €</td>
            <td>${getStatusBadge(cmd.statut)}</td>
            <td>${getActionButtons(cmd)}</td>
        `;
        tbody.appendChild(tr);
    });

    // Mettre à jour le message "aucune commande"
    const noResults = document.getElementById('noOrdersFound');
    if (noResults) noResults.style.display = orders.length === 0 ? 'block' : 'none';
}

// ===================== FILTRES =====================
function filterOrders() {
    const status = document.getElementById('filterStatus').value;
    const search = document.getElementById('searchOrder').value.toLowerCase();
    const rows = document.querySelectorAll('.order-table tbody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const rowStatus = row.getAttribute('data-status');
        const rowText = row.textContent.toLowerCase();
        const match = (status === '' || rowStatus === status) && (search === '' || rowText.includes(search));

        row.style.display = match ? '' : 'none';
        if (match) visibleCount++;
    });

    document.getElementById('noOrdersFound').style.display = visibleCount === 0 ? 'block' : 'none';
}

function resetFilters() {
    const status = document.getElementById('filterStatus');
    const search = document.getElementById('searchOrder');
    if (status) status.value = '';
    if (search) search.value = '';

    document.querySelectorAll('.order-table tbody tr').forEach(row => row.style.display = '');

    const noResults = document.getElementById('noOrdersFound');
    if (noResults) noResults.style.display = 'none';
}

// ===================== STATUTS =====================

const STATUS_CONFIG = {
    en_attente:              { label: 'En attente',           icon: 'bi-hourglass-split',   color: '#f39c12' },
    accepte:                 { label: 'Acceptée',             icon: 'bi-check-circle-fill',  color: '#27ae60' },
    en_preparation:          { label: 'En préparation',       icon: 'bi-box-seam',           color: '#2980b9' },
    en_cours_livraison:      { label: 'En livraison',         icon: 'bi-truck',              color: '#e67e22' },
    livre:                   { label: 'Livrée',               icon: 'bi-house-check-fill',   color: '#2ecc71' },
    attente_retour_materiel: { label: 'Attente matériel',     icon: 'bi-arrow-return-left',  color: '#6c5ce7' },
    terminee:                { label: 'Terminée',             icon: 'bi-check-all',          color: '#155724' },
    annulee:                 { label: 'Annulée',              icon: 'bi-x-circle-fill',      color: '#e74c3c' }
};

const STATUS_TRANSITIONS = {
    en_attente: ['accepte'],
    accepte: ['en_preparation'],
    en_preparation: ['en_cours_livraison'],
    en_cours_livraison: ['livre'],
    livre: ['attente_retour_materiel', 'terminee'],
    attente_retour_materiel: ['terminee'],
    terminee: [],
    annulee: []
};

function getStatusBadge(status) {
    const cfg = STATUS_CONFIG[status] || { label: status, icon: 'bi-question-circle', color: '#6c757d' };
    return `<span class="badge" style="background-color:${cfg.color}; color:#fff;">
                <i class="bi ${cfg.icon}"></i> ${cfg.label}
            </span>`;
}

// ===================== HELPERS =====================
function getOrderById(id) {
    return orders.find(c => c.id == id);
}

// ===================== BOUTONS ACTION =====================
function getActionButtons(order) {
    let buttons = `
        <button class="btn btn-sm btn-outline-info btn-details" data-id="${order.id}" title="Détails">
            <i class="bi bi-eye"></i>
        </button>
    `;

    if (!['terminee', 'annulee'].includes(order.statut)) {
        buttons += `
            <button class="btn btn-sm btn-outline-success btn-status" data-id="${order.id}" title="Changer statut">
                <i class="bi bi-arrow-repeat"></i>
            </button>
        `;
    }

    if (!['terminee', 'annulee', 'livre', 'attente_retour_materiel'].includes(order.statut)) {
        buttons += `
            <button class="btn btn-sm btn-outline-danger btn-cancel" data-id="${order.id}" title="Annuler">
                <i class="bi bi-x-octagon"></i>
            </button>
        `;
    }

    if (order.statut === 'annulee') {
        buttons += `
            <button class="btn btn-sm btn-outline-secondary btn-cancel-reason" data-id="${order.id}" title="Voir motif">
                <i class="bi bi-info-circle"></i>
            </button>
        `;
    }

    return buttons;
}

// Délégation d'événements pour les boutons du tableau
document.addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    if (btn.classList.contains('btn-details')) openDetailsModal(id);
    else if (btn.classList.contains('btn-status')) openStatusModal(id, btn.dataset.status);
    else if (btn.classList.contains('btn-cancel')) openCancelModal(id);
    else if (btn.classList.contains('btn-cancel-reason')) openCancelReasonModal(id);
    else if (btn.dataset.contact) contactClient(id);
});


// ===================== MODAL DÉTAILS =====================
function openDetailsModal(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    const body = document.getElementById('detailsModalBody');
    body.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6 class="fw-bold mb-3"><i class="bi bi-person"></i> Client</h6>
                <p><strong>Nom :</strong> ${order.prenom_client} ${order.nom_client}</p>
                <p><strong>Email :</strong> ${order.email_client}</p>
                <p><strong>Téléphone :</strong> ${order.gsm_client || 'Non renseigné'}</p>
            </div>
            <div class="col-md-6">
                <h6 class="fw-bold mb-3"><i class="bi bi-box-seam"></i> Commande</h6>
                <p><strong>N° :</strong> ${order.numero_commande}</p>
                <p><strong>Statut :</strong> ${getStatusBadge(order.statut)}</p>
                <p><strong>Date commande :</strong> ${formatDate(order.created_at)}</p>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-md-6">
                <h6 class="fw-bold mb-3"><i class="bi bi-calendar-event"></i> Événement</h6>
                <p><strong>Menu :</strong> ${order.menu_titre}</p>
                <p><strong>Personnes :</strong> ${order.nb_personnes}</p>
                <p><strong>Date :</strong> ${formatDate(order.date_prestation)}</p>
                <p><strong>Lieu :</strong> ${order.adresse_prestation || order.ville_prestation}</p>
            </div>
            <div class="col-md-6">
                <h6 class="fw-bold mb-3"><i class="bi bi-cash-stack"></i> Facturation</h6>
                <p><strong>Total :</strong> <span class="fs-5 fw-bold text-success">${parseFloat(order.prix_total).toFixed(2)} €</span></p>
            </div>
        </div>
        ${order.commentaire ? `<hr><div><h6 class="fw-bold mb-2"><i class="bi bi-chat-dots"></i> Commentaire</h6><p class="fst-italic">"${order.commentaire}"</p></div>` : ''}
        ${order.statut === 'annulee' && order.motif_annulation ? `
        <hr>
        <div class="alert alert-danger">
            <h6 class="fw-bold"><i class="bi bi-x-octagon"></i> Annulation</h6>
            <p><strong>Contact :</strong> ${order.mode_contact === 'telephone' ? 'Téléphone' : 'Email'}</p>
            <p><strong>Motif :</strong> ${order.motif_annulation}</p>
        </div>` : ''}
        ${order.statut === 'en_attente' ? `
        <hr>
        <div class="d-flex justify-content-end">
            <button class="btn btn-warning" onclick="openModificationModal(${order.id}, ${order.menu_id})">
                <i class="bi bi-pencil-square"></i> Modifier la commande
            </button>
        </div>` : ''}

    `;

    new bootstrap.Modal(document.getElementById('detailsModal')).show();
}

// ===================== MODAL CHANGER STATUT =====================
function openStatusModal(orderId, preselectStatus = null) {
    const order = getOrderById(orderId);
    if (!order) return;

    document.getElementById('statusOrderId').value = order.id;
    document.getElementById('statusOrderRef').textContent = order.numero_commande;
    document.getElementById('statusCurrentBadge').innerHTML = getStatusBadge(order.statut);

    const select = document.getElementById('newStatusSelect');
    const transitions = STATUS_TRANSITIONS[order.statut] || [];
    select.innerHTML = '';

    if (transitions.length === 0) {
        select.innerHTML = '<option value="">Aucune transition disponible</option>';
        document.getElementById('confirmStatusBtn').disabled = true;
    } else {
        transitions.forEach(s => {
            select.innerHTML += `<option value="${s}">${STATUS_CONFIG[s].label}</option>`;
        });
        document.getElementById('confirmStatusBtn').disabled = false;
                
        if (preselectStatus && transitions.includes(preselectStatus)) {
            select.value = preselectStatus;
        }
    }

    new bootstrap.Modal(document.getElementById('statusModal')).show();
}

async function handleConfirmStatus() {

    const user = getStorage();
    const btn = document.getElementById('confirmStatusBtn');
    const orderId = document.getElementById('statusOrderId').value;
    const newStatus = document.getElementById('newStatusSelect').value;
    if (!newStatus) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Traitement...';

    try {
        const response = await fetch(`http://localhost/api/commande/change-statut?id=${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modifie_par: user.id, statut: newStatus })
        });
        const data = await response.json();

        if (data.success) {
            showToast('Statut mis à jour avec succès', 'success');
            bootstrap.Modal.getInstance(document.getElementById('statusModal')).hide();
            await refreshCommandes();
        } else {
            showToast(data.message || 'Erreur lors de la mise à jour', 'danger');
        }
    } catch (error) {
        showToast('Erreur réseau', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-lg"></i> Confirmer';
    }
}

// ===================== MODAL ANNULATION =====================
function openCancelModal(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    document.getElementById('cancelOrderId').value = order.id;
    document.getElementById('confirmCancelBtn').setAttribute('data-order-id', order.id);
    document.getElementById('cancelOrderRef').textContent = order.numero_commande;
    document.getElementById('cancelContactMode').value = '';
    document.getElementById('cancelReason').value = '';
    document.getElementById('cancelContactMode').classList.remove('is-invalid');
    document.getElementById('cancelReason').classList.remove('is-invalid');

    new bootstrap.Modal(document.getElementById('cancelModal')).show();
}

async function handleConfirmCancel() {

    const user = getStorage();
    const btn = document.getElementById('confirmCancelBtn');
    const orderId = btn.getAttribute('data-order-id');
    const reason = document.getElementById('cancelReason');
    const contactMode = document.getElementById('cancelContactMode');

    if (!reason.value.trim()) {
        showToast('Veuillez saisir un motif d\'annulation', 'warning');
        return;
    }

    if (contactMode && !contactMode.value) {
        showToast('Veuillez choisir un mode de contact', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Annulation...';

    try {
        const response = await fetch(`http://localhost/api/commande/annule-commande?id=${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                motif_annulation: reason.value.trim(),
                mode_contact: contactMode ? contactMode.value : null,
                modifie_par: user.id
            })
        });
        const data = await response.json();

        if (data.success) {
            showToast('Commande annulée avec succès', 'success');
            bootstrap.Modal.getInstance(document.getElementById('cancelModal')).hide();
            await refreshCommandes();
        } else {
            showToast(data.message || 'Erreur lors de l\'annulation', 'danger');
        }
    } catch (error) {
        showToast('Erreur réseau', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-x-lg"></i> Confirmer l\'annulation';
    }
}

// ===================== MODAL MOTIF ANNULATION =====================
function openCancelReasonModal(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    document.getElementById('cancelReasonBody').innerHTML = `
        <div class="mb-3"><strong>Commande :</strong> ${order.numero_commande}</div>
        <div class="mb-3">
            <strong>Contact :</strong>
            <span class="badge bg-${order.mode_contact === 'telephone' ? 'success' : 'primary'}">
                <i class="bi bi-${order.mode_contact === 'telephone' ? 'telephone' : 'envelope'}"></i>
                ${order.mode_contact === 'telephone' ? 'Téléphone' : 'Email'}
            </span>
        </div>
        <div class="mb-3">
            <strong>Motif :</strong>
            <p class="mt-1 p-3 bg-light rounded">${order.motif_annulation}</p>
        </div>
    `;

    new bootstrap.Modal(document.getElementById('cancelReasonModal')).show();
}

window.openModificationModal = function(orderId, menuId) {
    modificationOrderId = orderId;
    modificationMenuId = menuId;
    
    // Fermer le modal détails
    bootstrap.Modal.getInstance(document.getElementById('detailsModal'))?.hide();
    
    // Reset
    document.getElementById('modifMotif').value = '';
    document.getElementById('modifContactEmail').checked = true;
    
    // Ouvrir le modal modification
    setTimeout(() => {
        new bootstrap.Modal(document.getElementById('modificationModal')).show();
    }, 300);
};


function handleConfirmModification() {
    const motif = document.getElementById('modifMotif').value.trim();
    if (!motif) {
        showToast('Veuillez indiquer le motif de la modification', 'warning');
        return;
    }
    bootstrap.Modal.getInstance(document.getElementById('modificationModal'))?.hide();
    window.location.href = `/commande?menu=${modificationMenuId}&modifier=${modificationOrderId}`;
}

// ============================================
//  SECTION DASHBOARD 
// ============================================

function loadAdminDashboard() {
    loadAdminStats();
    loadUrgentOrders();
    loadRecentActivity();
    loadSidebarBadges();
}

//Stats rapides
function loadAdminStats() {
    const commandes = orders;
    const now = new Date();
    const moisActuel = now.getMonth();

    const nouvelles = commandes.filter(c => c.statut === 'en_attente').length;
    const enCours = commandes.filter(c =>
        ['accepte', 'en_preparation', 'en_cours_livraison', 'livre', 'attente_retour_materiel'].includes(c.statut)
    ).length;
    const terminees = commandes.filter(c => c.statut === 'terminee').length;
    const annulees = commandes.filter(c => c.statut === 'annulee').length;

    const termineesMois = commandes.filter(c => {
        if (c.statut !== 'terminee') return false;
        const d = new Date(c.created_at);
        return d.getMonth() === moisActuel && d.getFullYear() === now.getFullYear();
    }).length;

    const el = document.getElementById('admin-stats');
    if (!el) return;

    el.innerHTML = `
        <div class="stat-card" style="border-left: 4px solid #f3929c;">
            <div class="stat-number">${nouvelles}</div>
            <div class="stat-label">Nouvelles commandes (En attente)</div>
        </div>
        <div class="stat-card" style="border-left: 4px solid #fd7e14;">
            <div class="stat-number">${enCours}</div>
            <div class="stat-label">En cours</div>
        </div>
        <div class="stat-card" style="border-left: 4px solid #28a745;">
            <div class="stat-number">${terminees}</div>
            <div class="stat-label">Terminées</div>
        </div>
        <div class="stat-card" style="border-left: 4px solid #f60707;">
            <div class="stat-number">${annulees}</div>
            <div class="stat-label">Annulées</div>
        </div>
        <div class="stat-card" style="border-left: 4px solid #007bff;">
            <div class="stat-number">${termineesMois}</div>
            <div class="stat-label">Terminées ce mois</div>
        </div>

    `;
}

// Commandes urgentes
function loadUrgentOrders() {
    const urgentes = orders.filter(c =>
        ['en_attente', 'en_preparation', 'attente_retour_materiel'].includes(c.statut)
    );

    const alertEl = document.getElementById('alert-urgent');
    if (alertEl) {
        if (urgentes.length > 0) {
            alertEl.classList.remove('d-none');
            document.getElementById('urgent-count').textContent = urgentes.length;
        } else {
            alertEl.classList.add('d-none');
        }
    }

    const tbody = document.getElementById('urgent-orders-body');
    if (!tbody) return;

    if (urgentes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-success">
            <i class="bi bi-check-circle"></i> Aucune commande urgente
        </td></tr>`;
        return;
    }

    tbody.innerHTML = urgentes.map(c => `
        <tr>
            <td><strong>#${c.numero_commande}</strong></td>
            <td>${c.prenom_client || ''} ${c.nom_client || ''}</td>
            <td>${c.menu_titre || 'N/A'}</td>
            <td>${formatDate(c.date_prestation)} - ${c.heure_prestation || ''}</td>
            <td>${getStatusBadge(c.statut)}</td>
            <td>${getUrgentActions(c)}</td>
        </tr>
    `).join('');
}

//Activité récente
function loadRecentActivity() {
    const recentes = [...orders]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    const timeline = document.getElementById('timeline-activity');
    if (!timeline) return;

    if (recentes.length === 0) {
        timeline.innerHTML = '<p class="text-muted">Aucune activité récente</p>';
        return;
    }

    timeline.innerHTML = recentes.map(c => `
        <div class="timeline-item">
            <strong>${formatTimeAgo(c.created_at)}</strong>
            <p class="mb-0">
                Commande #${c.numero_commande} - ${getActivityLabel(c.statut)}
                <br><small class="text-muted">${c.prenom_client || ''} ${c.nom_client || ''} · ${c.menu_titre || ''}</small>
            </p>
        </div>
    `).join('');
}

//Sidebar badges
function loadSidebarBadges() {
    const actives = orders.filter(c =>
        !['terminee', 'annulee'].includes(c.statut)
    ).length;
    const badge = document.getElementById('badge-commandes');
    if (badge) badge.textContent = actives;

    // Badge avis en attente
    fetch('http://localhost/api/avis/list')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const enAttente = data.avis.filter(a => a.statut === 'en_attente').length;
                const badgeAvis = document.getElementById('badge-avis');
                if (badgeAvis) badgeAvis.textContent = enAttente;
            }
        });
}

function getActivityLabel(statut) {
    const labels = {
        'en_attente': 'Nouvelle commande reçue',
        'accepte': 'Commande acceptée',
        'en_preparation': 'Passée en préparation',
        'attente_retour_materiel': 'En attente retour matériel',
        'en_cours_livraison': 'En cours de livraison',
        'livre': 'Commande livrée',
        'terminee': 'Commande terminée',
        'annulee': 'Commande annulée'
    };
    return labels[statut] || statut;
}

function getUrgentActions(commande) {
    switch (commande.statut) {
        case 'en_attente':
            return `<button class="btn btn-sm btn-success btn-action btn-status" data-id="${commande.id}" data-status="accepte">
                <i class="bi bi-check"></i> Accepter
            </button>`;
        case 'en_preparation':
            return `<button class="btn btn-sm btn-primary btn-action btn-status" data-id="${commande.id}" data-status="en_cours_livraison">
                <i class="bi bi-truck"></i> Livrer
            </button>`;
        case 'attente_retour_materiel':
            return `<button class="btn btn-sm btn-info btn-action" data-id="${commande.id}" data-contact="true">
                <i class="bi bi-telephone"></i> Contacter
            </button>`;
        default:
            return '';
    }
}


function formatTimeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffJ = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffH < 24) return `Il y a ${diffH}h`;
    if (diffJ < 7) return `Il y a ${diffJ} jour(s)`;
    return formatDate(dateStr);
}

// contacter le client
function contactClient(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;
    
    // Ouvrir le client mail ou afficher les infos
    showToast(`Contact : ${order.email_client} / ${order.gsm_client || 'Pas de téléphone'}`, 'info');
}

// ========== GESTION MENUS EMPLOYÉ ==========

// chargement
async function loadAllEmployeeMenus() {
    const container = document.getElementById("employeeMenusGrid");
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">Chargement...</p>
        </div>
    `;

    try {
        const response = await fetch('http://localhost/api/menu/list');
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        allEmployeeMenus = data.menus || [];
    } catch (error) {
        console.error('Erreur:', error);
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i> Erreur de chargement.
                    <button class="btn btn-sm btn-outline-danger ms-3" onclick="initEmployeeMenus()">Réessayer</button>
                </div>
            </div>
        `;
    }
}

// filtrage
function applyFilters() {
    const titre = document.getElementById('filterTitre')?.value.trim().toLowerCase() || '';
    const theme = document.getElementById('filterTheme')?.value || '';
    const regime = document.getElementById('filterRegime')?.value || '';
    const prixMax = parseFloat(document.getElementById('filterPrixMax')?.value);
    const personnes = parseInt(document.getElementById('filterPersonnes')?.value);
    const stock = document.getElementById('filterStock')?.value || '';
    const sort = document.getElementById('filterSort')?.value || 'id-desc';

    filteredEmployeeMenus = allEmployeeMenus.filter(menu => {
        if (titre && !menu.titre.toLowerCase().includes(titre)) return false;
        if (theme && menu.themes?.toLowerCase() !== theme.toLowerCase()) return false;
        if (regime && (!menu.regimes || !menu.regimes.toLowerCase().includes(regime.toLowerCase()))) return false;
        if (!isNaN(prixMax) && menu.prix_base > prixMax) return false;
        if (!isNaN(personnes) && menu.nb_personnes_min < personnes) return false;
        if (stock === '0' && menu.stock !== 0) return false;
        if (stock === 'low' && (menu.stock === 0 || menu.stock >= 10)) return false;
        if (stock === 'ok' && menu.stock < 10) return false;
        return true;
    });

    if (sort) {
        const [field, order] = sort.split('-');
        filteredEmployeeMenus.sort((a, b) => {
            let valA, valB;
            switch (field) {
                case 'prix': valA = a.prix_base; valB = b.prix_base; break;
                case 'titre': valA = a.titre.toLowerCase(); valB = b.titre.toLowerCase(); break;
                case 'stock': valA = a.stock; valB = b.stock; break;
                default: valA = a.id; valB = b.id; break;
            }
            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }

    empMenusCurrentPage = 1;
    renderCurrentPage();
}

// pagination / rendu
function renderCurrentPage() {
    const totalPages = Math.ceil(filteredEmployeeMenus.length / EMP_MENUS_PER_PAGE) || 1;
    const start = (empMenusCurrentPage - 1) * EMP_MENUS_PER_PAGE;
    const pageMenus = filteredEmployeeMenus.slice(start, start + EMP_MENUS_PER_PAGE);

    displayEmployeeMenus(pageMenus);
    updateEmployeeMenusCount(totalPages);
    renderEmployeeMenusPagination(totalPages);
}

// affichage cartes
function displayEmployeeMenus(menus) {
    const container = document.getElementById("employeeMenusGrid");
    container.innerHTML = '';

    if (menus.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                <h5 class="mt-3 text-muted">Aucun menu trouvé</h5>
                <p class="text-muted">Modifiez vos filtres ou créez un nouveau menu</p>
            </div>
        `;
        return;
    }

    menus.forEach(menu => {
        const images = menu.images ? menu.images.split(',').map(img => img.trim()) : [];
        const imagePrincipale = images.length > 0
            ? `http://localhost${images[0]}`
            : 'https://via.placeholder.com/400x200/6c757d/ffffff?text=Pas+d%27image';

        let stockBadge;
        if (menu.stock === 0) {
            stockBadge = '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Rupture</span>';
        } else if (menu.stock < 10) {
            stockBadge = `<span class="badge bg-warning text-dark"><i class="bi bi-exclamation-triangle"></i> Stock: ${menu.stock}</span>`;
        } else {
            stockBadge = `<span class="badge bg-success"><i class="bi bi-check"></i> En stock: ${menu.stock}</span>`;
        }

        const themeBadge = menu.themes
            ? `<span class="badge ${getThemeBadgeColor(menu.themes)} me-1">${capitalize(menu.themes)}</span>`
            : '';

        const regimesBadges = menu.regimes
            ? menu.regimes.split(',').map(r =>
                `<span class="badge bg-secondary mb-1 me-1">${r.trim()}</span>`
            ).join('')
            : '';

        container.innerHTML += `
            <div class="col-md-6 col-lg-4 mb-4" id="menu-card-${menu.id}">
                <div class="menu-card h-100">
                    <img src="${imagePrincipale}" alt="${menu.titre}" class="menu-image"
                         onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%3E%3Crect%20fill%3D%22%236c757d%22%20width%3D%22400%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22white%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%20font-size%3D%2218%22%3EPas%20d%27image%3C%2Ftext%3E%3C%2Fsvg%3E'">
                    <div class="menu-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h5 class="menu-title mb-1">${menu.titre}</h5>
                                <div class="mb-2">${themeBadge}${regimesBadges}</div>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-light" data-bs-toggle="dropdown">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li><a class="dropdown-item btn-edit-menu" href="#" data-id="${menu.id}">
                                        <i class="bi bi-pencil"></i> Modifier</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item text-danger btn-toggle-menu" href="#" data-id="${menu.id}">
                                        <i class="bi bi-trash"></i> Désactiver</a></li>
                                </ul>
                            </div>
                        </div>
                        <p class="text-muted small mb-2">
                            <i class="bi bi-people"></i> Min. ${menu.nb_personnes_min} pers.
                        </p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="menu-price mb-0">${parseFloat(menu.prix_base).toFixed(2)} € / pers.</div>
                            ${stockBadge}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

// pagination
function renderEmployeeMenusPagination(totalPages) {
    const container = document.getElementById("employeeMenusPagination");
    container.innerHTML = '';

    if (totalPages <= 1) return;

    let html = '<nav><ul class="pagination pagination-sm">';

    html += `<li class="page-item ${empMenusCurrentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${empMenusCurrentPage - 1}"><i class="bi bi-chevron-left"></i></a>
    </li>`;

    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === empMenusCurrentPage ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>`;
    }

    html += `<li class="page-item ${empMenusCurrentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${empMenusCurrentPage + 1}"><i class="bi bi-chevron-right"></i></a>
    </li>`;

    html += '</ul></nav>';
    container.innerHTML = html;

    container.querySelectorAll('.page-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(link.dataset.page);
            if (page >= 1 && page <= totalPages && page !== empMenusCurrentPage) {
                empMenusCurrentPage = page;
                renderCurrentPage();
                document.getElementById('employeeMenusGrid').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// compteur
function updateEmployeeMenusCount(totalPages) {
    document.getElementById("employeeMenusCount").innerHTML =
        `<i class="bi bi-card-text"></i> ${filteredEmployeeMenus.length} menu(s)`;

    document.getElementById("employeeMenusPageInfo").textContent =
        totalPages > 1 ? `Page ${empMenusCurrentPage} sur ${totalPages}` : '';
}

// désactiver un menu
async function toggleMenu(id) {
    if (!confirm('Désactiver ce menu ?')) return;
    try {
        const response = await fetch(`http://localhost/api/menu/toggle?id=${id}`, { method: 'PATCH' });
        const data = await response.json();
        if (data.success) {
            allEmployeeMenus = allEmployeeMenus.filter(m => m.id != id);
            applyFilters();
            showToast('Menu désactivé !', 'success');
        } else {
            showToast(data.message || 'Erreur', 'danger');
        }
    } catch (error) {
        showToast('Erreur réseau', 'danger');
    }
}

// utilitaires
function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function getThemeBadgeColor(theme) {
    const colors = {
        'noel': 'bg-danger',
        'paques': 'bg-warning text-dark',
        'classique': 'bg-secondary',
        'evenement': 'bg-primary'
    };
    return colors[theme?.toLowerCase()] || 'bg-secondary';
}

// délégation d'évènements
document.addEventListener('click', function (e) {
    const editBtn = e.target.closest('.btn-edit-menu');
    if (editBtn) {
        e.preventDefault();
        window.location.href = `/edit-menu?id=${editBtn.dataset.id}`;
    }

    const toggleBtn = e.target.closest('.btn-toggle-menu');
    if (toggleBtn) {
        e.preventDefault();
        toggleMenu(toggleBtn.dataset.id);
    }
});

// eventListener sur les filtres
document.getElementById('btnResetFilters')?.addEventListener('click', () => {
    document.getElementById('filterTitre').value = '';
    document.getElementById('filterTheme').value = '';
    document.getElementById('filterRegime').value = '';
    document.getElementById('filterPrixMax').value = '';
    document.getElementById('filterPersonnes').value = '';
    document.getElementById('filterStock').value = '';
    document.getElementById('filterSort').value = 'id-desc';
    applyFilters();
});

let searchTimeout;
document.getElementById('filterTitre')?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 300);
});

['filterTheme', 'filterRegime', 'filterPrixMax', 'filterPersonnes', 'filterStock', 'filterSort'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', applyFilters);
});

document.getElementById('menus')?.addEventListener('click', initEmployeeMenus);

document.getElementById('btnCreerMenu')?.addEventListener('click', () => {
    window.location.href = '/edit-menu';
});

// ==================== AVIS ====================

// chargement
async function loadAvis() {
    try {
        const r = await fetch('http://localhost/api/avis/list');
        const data = await r.json();
        if (!data.success) return;

        const pending = data.avis.filter(a => a.statut === 'en_attente');
        const approved = data.avis.filter(a => a.statut === 'approuve');
        const rejected = data.avis.filter(a => a.statut === 'refuse');

        const alertEl = document.getElementById('avis-alert');
        if (pending.length > 0) {
            alertEl.classList.remove('d-none');
            document.getElementById('avis-pending-count').textContent = pending.length;
        } else {
            alertEl.classList.add('d-none');
        }

        document.getElementById('avis-pending-container').innerHTML =
            pending.length ? pending.map(a => renderAvisCard(a, 'pending')).join('') : '<p class="text-muted">Aucun avis en attente.</p>';

        document.getElementById('avis-approved-container').innerHTML =
            approved.length ? approved.map(a => renderAvisCard(a, 'approved')).join('') : '<p class="text-muted">Aucun avis validé.</p>';

        document.getElementById('avis-rejected-container').innerHTML =
            rejected.length ? rejected.map(a => renderAvisCard(a, 'rejected')).join('') : '<p class="text-muted">Aucun avis refusé.</p>';
    } catch {
        document.getElementById('avis-pending-container').innerHTML = '<p class="text-danger">Erreur de chargement.</p>';
    }
}

// rendu
function renderAvisCard(avis, type) {
    const date = new Date(avis.created_at);
    const dateStr = date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    let badgeHtml = '';
    let borderClass = '';
    let actionsHtml = '';

    if (type === 'approved') {
        badgeHtml = '<span class="badge bg-success">Validé</span>';
        borderClass = 'border-success';
    } else if (type === 'rejected') {
        badgeHtml = '<span class="badge bg-danger">Refusé</span>';
        borderClass = 'border-danger';
    } else {
        actionsHtml = `
            <div class="d-flex gap-2 mt-3">
                <button class="btn btn-success btn-sm w-50" onclick="modererAvis('${avis.id}', 'approuve')">
                    <i class="bi bi-check-circle"></i> Valider
                </button>
                <button class="btn btn-danger btn-sm w-50" onclick="modererAvis('${avis.id}', 'refuse')">
                    <i class="bi bi-x-circle"></i> Refuser
                </button>
            </div>`;
    }

    return `
        <div class="card mb-3 ${borderClass}" id="avis-card-${avis.id}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h6 class="mb-1"><strong>${avis.prenom_client} ${avis.nom_client}</strong></h6>
                        <small class="text-muted">Commande #${avis.numero_commande}</small>
                    </div>
                    <div class="text-end">
                        ${badgeHtml}
                        <div class="text-warning mt-1">${renderStars(avis.note)}</div>
                    </div>
                </div>
                <p class="mb-3">${avis.commentaire}</p>
                <small class="text-muted">Posté le ${dateStr}</small>
                ${actionsHtml}
            </div>
        </div>`;
}

// Modération des avis
async function modererAvis(id, statut) {
    try {
        const r = await fetch(`http://localhost/api/avis/moderer?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut: statut })
        });
        const data = await r.json();
        if (data.success) {
            showToast(`Avis ${statut === 'approuve' ? 'validé' : 'refusé'} avec succès.`, 'success');
            await loadAvis();
            loadSidebarBadges();
        } else {
            showToast(data.message || 'Erreur lors de la modération.', 'danger');
        }
    } catch {
        showToast('Erreur de connexion.', 'danger');
    }
}
window.modererAvis = modererAvis;

