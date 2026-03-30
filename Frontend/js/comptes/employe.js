import { getStorage } from "../script.js";

// ===================== VARIABLES =====================
let orders = [];
let modificationOrderId = null;
let modificationMenuId = null;

// ===================== INIT =====================
export async function init() {
    await loadOrders();
    initEventListeners();
    initModalListeners();
    loadSidebarBadges();
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
}

// ===================== NAVIGATION =====================
function showSection(sectionId, clickedLink) {
    document.querySelectorAll(".section-content").forEach(s => s.classList.remove("active"));

    const target = document.getElementById(sectionId);
    if (!target) return;
    target.classList.add("active");

    document.querySelectorAll(".sidebar-menu a").forEach(l => l.classList.remove("active"));
    if (clickedLink) clickedLink.classList.add("active");

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Charger les compteurs du sidebar
function loadSidebarBadges() {
    // Compteur commandes
    fetch('http://localhost/api/commande/affiche')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('badge-commandes').textContent = data.total;
            }
        });
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
    resetFilters();
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

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
    else if (btn.classList.contains('btn-status')) openStatusModal(id);
    else if (btn.classList.contains('btn-cancel')) openCancelModal(id);
    else if (btn.classList.contains('btn-cancel-reason')) openCancelReasonModal(id);
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
function openStatusModal(orderId) {
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

    if (!reason.value.trim()) {
        showToast('Veuillez saisir un motif d\'annulation', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Annulation...';
    console.log(orderId);
    try {
        const response = await fetch(`http://localhost/api/commande/annule-commande?id=${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                motif_annulation: reason.value.trim(),
                modifie_par: user.id,
                commentaire: `Commande annulée, ${reason.value.trim()}`
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

// ===================== TOAST =====================
function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    container.appendChild(toast);
    new bootstrap.Toast(toast, { delay: 4000 }).show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
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

document.getElementById('btnConfirmModification')?.addEventListener('click', function() {
    const motif = document.getElementById('modifMotif').value.trim();

    if (!motif) {
        showToast('Veuillez indiquer le motif de la modification', 'warning');
        return;
    }

    bootstrap.Modal.getInstance(document.getElementById('modificationModal'))?.hide();
    window.location.href = `/commande?menu=${modificationMenuId}&modifier=${modificationOrderId}`;
});
