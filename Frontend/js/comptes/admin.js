import { getStorage } from "../script.js";
import {
    showPassword,
    checkPasswordStrength,
    checkPasswordMatch,
    updateRequirement,
    showToast,
    formatDate
} from "../utils/util.js";

// ===================== VARIABLES GLOBALES ========
const API_BASE = 'http://localhost/api';
let allEmployes = [];
let modalCreateEmploye, modalEditEmploye, modalToggleUser;
let chartCommandesParMenu, chartCAParMenu;
let chartDashStatut = null;
let statsInterval = null; 

// ===================== INIT =====================
export async function init() {
    initEventListeners();
    updateDashboardHeader();

    // Initialiser les modals
    modalCreateEmploye = new bootstrap.Modal(document.getElementById('createEmployeModal'));
    modalEditEmploye   = new bootstrap.Modal(document.getElementById('editEmployeModal'));
    modalToggleUser    = new bootstrap.Modal(document.getElementById('toggleUserModal'));

    initEmployeEvents();
    initStatsEvents();
    chargerEmployes();
    chargerDashboard();
}

function initEventListeners() {
    document.querySelectorAll(".sidebar-menu a").forEach(link => {
        link.addEventListener("click", function (e) {
            const href = this.getAttribute("href");
            if (href && href.startsWith("/")) return;

            e.preventDefault();
            const sectionId = this.getAttribute("data-section");
            if (sectionId) showSection(sectionId, this);
        });
    });
}

// =============== MISE A JOUR HEADER ====================
function updateDashboardHeader() {
    const user = getStorage();
    if (!user) return;

    const avatar = document.getElementById("user-avatar");
    if (avatar) {
        const initiales = `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
        avatar.textContent = initiales;
    }

    const nom = document.querySelector('.lead');
    if (nom) nom.textContent = `Bienvenue, ${user.prenom} ${user.nom}`;
}

// ===================== NAVIGATION =====================
function showSection(sectionId, clickedLink) {
    document.querySelectorAll(".section-content").forEach(s => s.classList.remove("active"));

    const target = document.getElementById(sectionId);
    if (!target) return;
    target.classList.add("active");

    document.querySelectorAll(".sidebar-menu a").forEach(l => l.classList.remove("active"));
    if (clickedLink) clickedLink.classList.add("active");

    if (sectionId === 'dashboard-section') chargerDashboard();

    // Toujours arrêter l'ancien timer quand on change de section
    if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
    }

    // Section statistiques : sync immédiate + auto-refresh toutes les 30s
    if (sectionId === 'statistiques-section' || sectionId === 'dashboard-section') {
        syncEtChargerStats();

        statsInterval = setInterval(() => {
            console.log('Auto-sync stats...');
            syncEtChargerStats();
        }, 30000); // 30 secondes
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================================================
// GESTION DES EMPLOYÉS — ADMIN
// ===================================================

// ===== EVENTS =====
function initEmployeEvents() {
    showPassword('togglePassword', 'password');
    showPassword('togglePasswordConfirm', 'passwordConfirm');

    const pwdInput = document.getElementById('password');
    const confirmInput = document.getElementById('passwordConfirm');

    pwdInput?.addEventListener('input', () => {
        checkPasswordStrength(pwdInput);
        checkPasswordMatch(pwdInput, confirmInput);
    });

    confirmInput?.addEventListener('input', () => {
        checkPasswordMatch(pwdInput, confirmInput);
    });

    document.getElementById('btnOpenCreateEmploye')?.addEventListener('click', () => {
        document.getElementById('formCreateEmploye')?.reset();
        resetCreateEmpRequirements();
        modalCreateEmploye.show();
    });

    document.getElementById('searchEmploye')?.addEventListener('input', filtrerEmployes);
    document.getElementById('formCreateEmploye')?.addEventListener('submit', creerEmploye);
    document.getElementById('formEditEmploye')?.addEventListener('submit', modifierEmploye);

    // Toggle user
    document.getElementById('btnConfirmToggleUser')?.addEventListener('click', confirmerToggleUser);

    // Formater GSM
    document.getElementById('createEmpGsm')?.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.slice(0, 10);
        let formatted = value.replace(/(\d{2})(?=\d)/g, '$1 ');
        e.target.value = formatted.trim();
    });

    document.getElementById('editEmpGsm')?.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.slice(0, 10);
        let formatted = value.replace(/(\d{2})(?=\d)/g, '$1 ');
        e.target.value = formatted.trim();
    });

}

// ===== CHARGER =====
async function chargerEmployes() {
    try {
        const user = getStorage();
        if (!user) return;

        const res = await fetch(`${API_BASE}/admin/affiche-users`, {
            headers: {
                'Authorization': `Bearer ${user.api_token}`
            }
        });
        const data = await res.json();
        allEmployes = data.users || [];
        afficherEmployes(allEmployes);
    } catch (err) {
        showToast('Erreur chargement employés', 'danger');
    }
}

// ===== AFFICHER =====
function afficherEmployes(liste) {
    const tbody = document.getElementById('employeTableBody');
    if (!tbody) return;

    if (!liste || liste.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Aucun employé trouvé</td></tr>`;
        return;
    }

    tbody.innerHTML = liste.map(emp => {
        const isActif = emp.is_actif == 1;
        const canEdit = ['employe', 'admin'].includes(emp.role);

        const badgeStatut = isActif
            ? `<span class="badge bg-success">Actif</span>`
            : `<span class="badge bg-danger">Inactif</span>`;

        const btnToggle = isActif
            ? `<button class="btn btn-outline-danger btn-xs" onclick="ouvrirToggleUserModal(${emp.id}, true)" title="Désactiver cet utilisateur"><i class="bi bi-person-x"></i></button>`
            : `<button class="btn btn-outline-success btn-xs" onclick="ouvrirToggleUserModal(${emp.id}, false)" title="Réactiver cet utilisateur"><i class="bi bi-person-check"></i></button>`;

        const btnEdit = (canEdit && isActif)
            ? `<button class="btn btn-outline-primary btn-xs" onclick="openEditEmploye(${emp.id})" title="Modifier cet utilisateur"><i class="bi bi-pencil"></i></button>`
            : '';

        return `
        <tr class="${!isActif ? 'table-secondary' : ''}">
            <td>${emp.prenom} ${emp.nom}</td>
            <td>${emp.email}</td>
            <td>${emp.gsm || '-'}</td>
            <td>${emp.role || 'employe'}</td>
            <td>${badgeStatut}</td>
            <td>${formatDate(emp.created_at)}</td>
            <td>
                ${btnEdit}
                ${btnToggle}
            </td>
        </tr>`;
    }).join('');
}



// ===== FILTRER =====
function filtrerEmployes() {
    const search = document.getElementById('searchEmploye').value.toLowerCase();
    const filtered = allEmployes.filter(emp =>
        `${emp.prenom} ${emp.nom} ${emp.email}`.toLowerCase().includes(search)
    );
    afficherEmployes(filtered);
}

// ===== CRÉER =====
async function creerEmploye(e) {
    e.preventDefault();

    const pwd = document.getElementById('password').value;
    const confirm = document.getElementById('passwordConfirm').value;
    const nom = document.getElementById('createEmpNom').value.trim();
    const prenom = document.getElementById('createEmpPrenom').value.trim();
    const email = document.getElementById('createEmpEmail').value.trim();
    const telephone = document.getElementById('createEmpGsm').value.trim();
    const adresse = document.getElementById('createEmpAdresse').value.trim();
    const code_postal = document.getElementById('createEmpCodePostal').value.trim();
    const ville = document.getElementById('createEmpVille').value.trim();
    const role = document.getElementById('createEmpRole').value;

    if (!checkPasswordStrength(document.getElementById('password'))) {
        showToast('Le mot de passe ne respecte pas les critères', 'danger');
        return;
    }

    if (pwd !== confirm) {
        showToast('Les mots de passe ne correspondent pas', 'danger');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Le mail saisi n\'est pas au bon format', 'danger');
        return;
    }

    if (!/^[0-9]{10}$/.test(telephone.replace(/\s/g, ''))) {
        showToast('Le numéro de téléphone doit contenir 10 chiffres', 'danger');
        return;
    }

    const btnCreateEmploye = document.getElementById('btnCreateEmploye');
    btnCreateEmploye.disabled = true;
    btnCreateEmploye.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Création du compte...';

    const data = {
        nom, prenom, email,
        gsm: telephone.replace(/\s/g, ''),
        adresse, code_postal, ville,
        password: pwd,
        confirm_password: confirm,
        role
    };

    try {
        const user = getStorage();
        if (!user) return;
        const res = await fetch(`${API_BASE}/admin/create-employe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.api_token}`
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw await res.json();

        showToast('Employé créé avec succès', 'success');
        modalCreateEmploye.hide();
        document.getElementById('formCreateEmploye').reset();
        resetCreateEmpRequirements();
        chargerEmployes();
    } catch (err) {
        showToast(err.message || 'Erreur lors de la création', 'danger');
    } finally {
        btnCreateEmploye.disabled = false;
        btnCreateEmploye.innerHTML = 'Créer l\'employé';
    }
}

// ===== ÉDITER =====
function openEditEmploye(id) {
    const emp = allEmployes.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('editEmpId').value = emp.id;
    document.getElementById('editEmpNom').value = emp.nom;
    document.getElementById('editEmpPrenom').value = emp.prenom;
    document.getElementById('editEmpEmail').value = emp.email;
    document.getElementById('editEmpGsm').value = emp.gsm || '';
    document.getElementById('editEmpAdresse').value = emp.adresse || '';
    document.getElementById('editEmpCodePostal').value = emp.code_postal || '';
    document.getElementById('editEmpVille').value = emp.ville || '';
    document.getElementById('editEmpRole').value = emp.role || 'employe';

    modalEditEmploye.show();
}

async function modifierEmploye(e) {
    e.preventDefault();

    const id = document.getElementById('editEmpId').value;
    const nom = document.getElementById('editEmpNom').value.trim();
    const prenom = document.getElementById('editEmpPrenom').value.trim();
    const email = document.getElementById('editEmpEmail').value.trim();
    const gsm = document.getElementById('editEmpGsm').value.trim();
    const adresse = document.getElementById('editEmpAdresse').value.trim();
    const code_postal = document.getElementById('editEmpCodePostal').value.trim();
    const ville = document.getElementById('editEmpVille').value.trim();
    const role = document.getElementById('editEmpRole').value;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Le mail saisi n\'est pas au bon format', 'danger');
        return;
    }

    if (!/^[0-9]{10}$/.test(gsm.replace(/\s/g, ''))) {
        showToast('Le numéro de téléphone doit contenir 10 chiffres', 'danger');
        return;
    }

    const data = {
        nom, prenom, email,
        gsm: gsm.replace(/\s/g, ''),
        adresse, code_postal, ville, role
    };

    try {
        const user = getStorage();
        if (!user) return;
        const res = await fetch(`${API_BASE}/admin/update-employe?id=${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.api_token}`
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw await res.json();

        showToast('Employé modifié avec succès', 'success');
        modalEditEmploye.hide();
        chargerEmployes();
    } catch (err) {
        showToast(err.message || 'Erreur lors de la modification', 'danger');
    }
}


// ====== TOGGLE USER (ACTIVER/DÉSACTIVER) ========
function ouvrirToggleUserModal(id, isActif) {
    document.getElementById('toggleUserId').value = id;

    const header = document.getElementById('toggleUserHeader');
    const title = document.getElementById('toggleUserTitle');
    const message = document.getElementById('toggleUserMessage');
    const btn = document.getElementById('btnConfirmToggleUser');
    const action = document.getElementById('toggleUserAction');

    if (isActif) {
        action.value = 'desactiver';
        header.className = 'modal-header bg-danger';
        title.innerHTML = '<i class="bi bi-person-x"></i> Désactiver le compte';
        message.textContent = 'Voulez-vous vraiment désactiver cet utilisateur ?';
        btn.className = 'btn bg-danger text-white';
        btn.innerHTML = '<i class="bi bi-person-x-fill"></i> Désactiver';
    } else {
        action.value = 'activer';
        header.className = 'modal-header bg-success text-white';
        title.innerHTML = '<i class="bi bi-person-check"></i> Réactiver le compte';
        message.textContent = 'Voulez-vous vraiment réactiver cet utilisateur ?';
        btn.className = 'btn btn-success';
        btn.innerHTML = '<i class="bi bi-person-check-fill"></i> Réactiver';
    }

    modalToggleUser.show();
}

async function confirmerToggleUser() {
    const id = document.getElementById('toggleUserId').value;
    const action = document.getElementById('toggleUserAction').value;
    const user = getStorage();
    if (!user) return;

    try {
        const res = await fetch(`${API_BASE}/admin/toggle-user?id=${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${user.api_token}`
            }
        });

        if (!res.ok) throw await res.json();

        showToast(`Utilisateur ${action === 'activer' ? 'réactivé' : 'désactivé'} avec succès`, 'success');
        modalToggleUser.hide();
        chargerEmployes();
    } catch (err) {
        showToast(err.message || 'Erreur', 'danger');
    }
}

function resetCreateEmpRequirements() {
    ['req-length', 'req-uppercase', 'req-lowercase',
        'req-number', 'req-special'].forEach(id => {
        updateRequirement(id, false);
    });
    const bar = document.getElementById('strengthBar');
    if (bar) bar.className = 'password-strength-bar';
    const msg = document.getElementById('passwordMatchMessage');
    if (msg) msg.style.display = 'none';
}

// =====================================================
// STATISTIQUES (MongoDB via /api/stats)
// =====================================================

function initStatsEvents() {
    document.getElementById('btnSyncStats')?.addEventListener('click', syncEtChargerStats);
    document.getElementById('btnFiltrerCmdMenu')?.addEventListener('click', chargerCommandesParMenu);
    document.getElementById('btnFiltrerCA')?.addEventListener('click', chargerCA);

    // Charger la liste des menus pour le filtre CA
    chargerMenusPourFiltre();
}

// =====================================================
// SYNC MySQL → MongoDB
// =====================================================
async function syncEtChargerStats() {
    const user = getStorage();
    if (!user) return;

    const btn = document.getElementById('btnSyncStats');

    // Le bouton peut ne pas exister (appel automatique)
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Synchronisation...';
    }

    try {
        const res = await fetch(`${API_BASE}/stats/sync`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${user.api_token}` }
        });

        const data = await res.json();
        if (!res.ok) throw data;

        await Promise.all([
            chargerCommandesParMenu(),
            chargerCA(),
            chargerTopClients(),
            chargerMenusPourFiltre()
        ]);

        const lastSync = document.getElementById('lastSync');
        if (lastSync) lastSync.textContent = new Date().toLocaleString('fr-FR');

        await chargerDashboard();

    } catch (err) {
        showToast(err.message || 'Erreur synchronisation', 'danger');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Synchroniser les données';
        }
    }
}

// =====================================================
// COMMANDES PAR MENU (Bar horizontal) — filtrable par dates
// =====================================================
async function chargerCommandesParMenu() {
    const user = getStorage();
    if (!user) return;

    const dateDebut = document.getElementById('cmdMenuDateDebut')?.value || '';
    const dateFin   = document.getElementById('cmdMenuDateFin')?.value || '';

    let url = `${API_BASE}/stats/commandes-par-menu`;
    const params = new URLSearchParams();
    if (dateDebut) params.append('date_debut', dateDebut);
    if (dateFin)   params.append('date_fin', dateFin);
    if (params.toString()) url += `?${params}`;

    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${user.api_token}` }
        });

        const data = await res.json();
        if (!res.ok) throw data;

        renderChartCommandesParMenu(data.commandes_par_menu || []);

    } catch (err) {
        showToast(err.message || 'Erreur chargement commandes par menu', 'danger');
    }
}

function renderChartCommandesParMenu(items) {
    const ctx = document.getElementById('chartCommandesParMenu');
    if (!ctx) return;
    if (chartCommandesParMenu) chartCommandesParMenu.destroy();

    if (!items.length) {
        chartCommandesParMenu = null;
        ctx.parentElement.innerHTML = `
            <canvas id="chartCommandesParMenu"></canvas>
            <p class="text-center text-muted mt-3">Aucune donnée pour cette période</p>`;
        return;
    }

    const labels = items.map(m => m.menu);
    const values = items.map(m => m.nb_commandes);
    const colors = [
        '#f59e0b', '#3b82f6', '#10b981', '#ef4444',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
    ];

    chartCommandesParMenu = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Commandes',
                data: values,
                backgroundColor: colors.slice(0, labels.length).map(c => c + 'B3'),
                borderColor: colors.slice(0, labels.length),
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.raw} commande${ctx.raw > 1 ? 's' : ''}`
                    }
                }
            },
            scales: {
                x: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

// =====================================================
// CHIFFRE D'AFFAIRES PAR MENU (Bar) — filtrable par menu + dates
// =====================================================
async function chargerCA() {
    const user = getStorage();
    if (!user) return;

    const menuId    = document.getElementById('caMenuSelect')?.value || '';
    const dateDebut = document.getElementById('caDateDebut')?.value || '';
    const dateFin   = document.getElementById('caDateFin')?.value || '';

    let url = `${API_BASE}/stats/chiffre-affaires`;
    const params = new URLSearchParams();
    if (menuId)    params.append('menu_id', menuId);
    if (dateDebut) params.append('date_debut', dateDebut);
    if (dateFin)   params.append('date_fin', dateFin);
    if (params.toString()) url += `?${params}`;

    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${user.api_token}` }
        });

        const data = await res.json();
        if (!res.ok) throw data;

        renderChartCA(data);

    } catch (err) {
        showToast(err.message || 'Erreur chargement CA', 'danger');
    }
}

function renderChartCA(data) {
    const ctx = document.getElementById('chartCAParMenu');
    if (!ctx) return;
    if (chartCAParMenu) chartCAParMenu.destroy();

    const details = data.details || [];

    // Mettre à jour les totaux
    document.getElementById('totalCA').textContent      = `${(data.total_ca ?? 0).toFixed(2)} €`;
    document.getElementById('totalCmdCA').textContent    = data.total_commandes ?? 0;

    const panierMoyen = data.total_commandes > 0
        ? (data.total_ca / data.total_commandes).toFixed(2)
        : '0.00';
    document.getElementById('panierMoyenCA').textContent = `${panierMoyen} €`;

    if (!details.length) {
        chartCAParMenu = null;
        return;
    }

    const labels = details.map(d => d.menu);
    const valuesCA = details.map(d => d.ca);
    const valuesCmd = details.map(d => d.nb_commandes);

    chartCAParMenu = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'CA (€)',
                    data: valuesCA,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 6,
                    yAxisID: 'yCA'
                },
                {
                    label: 'Commandes',
                    data: valuesCmd,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    borderRadius: 6,
                    yAxisID: 'yCmd'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            if (ctx.dataset.label === 'CA (€)') {
                                return `CA : ${ctx.raw.toFixed(2)} €`;
                            }
                            return `${ctx.raw} commande${ctx.raw > 1 ? 's' : ''}`;
                        }
                    }
                }
            },
            scales: {
                yCA: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: { display: true, text: 'CA (€)' }
                },
                yCmd: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                    title: { display: true, text: 'Commandes' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

// =====================================================
// TOP CLIENTS (Tableau)
// =====================================================
async function chargerTopClients() {
    const user = getStorage();
    if (!user) return;

    try {
        const res = await fetch(`${API_BASE}/stats/top-clients?limit=10`, {
            headers: { 'Authorization': `Bearer ${user.api_token}` }
        });

        const data = await res.json();
        if (!res.ok) throw data;

        renderTopClients(data.top_clients || []);

    } catch (err) {
        showToast(err.message || 'Erreur chargement top clients', 'danger');
    }
}

function renderTopClients(clients) {
    const tbody = document.getElementById('topClientsBody');
    if (!tbody) return;

    if (!clients.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-3">
                    <i class="bi bi-inbox me-2"></i>Aucune donnée disponible
                </td>
            </tr>`;
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];

    tbody.innerHTML = clients.map((c, i) => `
        <tr>
            <td class="text-center">
                ${i < 3
                    ? `<span class="fs-5">${medals[i]}</span>`
                    : `<span class="badge bg-light text-dark">${i + 1}</span>`
                }
            </td>
            <td><strong>${c.client}</strong></td>
            <td class="text-center">${c.nb_commandes}</td>
            <td class="text-end fw-semibold">${parseFloat(c.ca).toFixed(2)} €</td>
        </tr>
    `).join('');
}

// =====================================================
// MENUS POUR FILTRE (Select CA)
// =====================================================
async function chargerMenusPourFiltre() {
    const user = getStorage();
    if (!user) return;

    const select = document.getElementById('caMenuSelect');
    if (!select) return;

    try {
        const res = await fetch(`${API_BASE}/stats/menus`, {
            headers: { 'Authorization': `Bearer ${user.api_token}` }
        });

        const data = await res.json();
        if (!res.ok) throw data;

        const menus = data.menus || [];

        // Garder l'option "Tous les menus"
        select.innerHTML = '<option value="">Tous les menus</option>';
        menus.forEach(m => {
            select.innerHTML += `<option value="${m.menu_id}">${m.menu_titre}</option>`;
        });

    } catch (err) {
        console.error('Erreur chargement menus filtre:', err);
    }
}

async function chargerDashboard() {
    const user = getStorage();
    if (!user) return;

    if (!allEmployes.length) {
        await chargerEmployes();
    }
    // Employés actifs (déjà en mémoire)
    const actifs = allEmployes.filter(u => u.role === 'employe' && u.is_actif == 1);

    document.getElementById('countEmployes').textContent = actifs.length;

    // Stats dashboard
    try {
        const res = await fetch(`${API_BASE}/stats/dashboard`, {
            headers: { 'Authorization': `Bearer ${user.api_token}` }
        });
        if (!res.ok) return;
        const data = await res.json();

        document.getElementById('countCommandes').textContent = data.quick_stats.commandes_jour;
        document.getElementById('countAvis').textContent = data.quick_stats.avis_en_attente;
        document.getElementById('dashNoteMoyenne').textContent = data.quick_stats.note_moyenne
            ? data.quick_stats.note_moyenne + '/5'
            : 'N/A';

        const statuts = data.quick_stats.commandes_par_statut;
        const labels = Object.keys(statuts);
        const values = Object.values(statuts);
        const colors = ['#ffc107', '#0d6efd', '#198754', '#dc3545', '#6c757d', '#0dcaf0'];

        if (chartDashStatut) chartDashStatut.destroy();

        chartDashStatut = new Chart(document.getElementById('chartDashStatut'), {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    } catch (e) {
        console.error('Erreur dashboard:', e);
    }
}

// ===== EXPOSER AU HTML =====
window.openEditEmploye = openEditEmploye;
window.ouvrirToggleUserModal = ouvrirToggleUserModal;
