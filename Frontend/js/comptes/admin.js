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
const API_BASE = 'http://localhost:3000';
let allEmployes = [];
let modalCreateEmploye, modalEditEmploye, modalDeleteEmploye;

// ===================== INIT =====================
export async function init() {
    initEventListeners();
    updateDasboardHeader();

    modalCreateEmploye  = new bootstrap.Modal(document.getElementById('createEmployeModal'));
    modalEditEmploye    = new bootstrap.Modal(document.getElementById('editEmployeModal'));
    modalDeleteEmploye  = new bootstrap.Modal(document.getElementById('deleteEmployeModal'));

    initEmployeEvents();
    chargerEmployes();
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

// =============== MISE A JOUR HEADER ====================
function updateDasboardHeader() {
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

// ===================================================
// GESTION DES EMPLOYÉS — ADMIN
// ===================================================

// ===== EVENTS =====
function initEmployeEvents() {
    // Toggle password — nouveaux id
    showPassword('togglePassword', 'password');
    showPassword('togglePasswordConfirm', 'passwordConfirm');


    // Strength + match
    const pwdInput = document.getElementById('password');
    const confirmInput = document.getElementById('passwordConfirm');

    pwdInput.addEventListener('input', () => {
        checkPasswordStrength(pwdInput);
        checkPasswordMatch(pwdInput, confirmInput);
    });

    confirmInput.addEventListener('input', () => {
        checkPasswordMatch(pwdInput, confirmInput);
    });

    document.getElementById('btnOpenCreateEmploye')?.addEventListener('click', () => {
        document.getElementById('formCreateEmploye')?.reset();
        resetCreateEmpRequirements();
        new bootstrap.Modal(document.getElementById('createEmployeModal')).show();
    });

    // Recherche
    document.getElementById('searchEmploye')?.addEventListener('input', filtrerEmployes);

    // Soumission formulaires
    document.getElementById('formCreateEmploye')?.addEventListener('submit', creerEmploye);
    document.getElementById('formEditEmploye')?.addEventListener('submit', modifierEmploye);
    document.getElementById('btnConfirmDeleteEmploye')?.addEventListener('click', supprimerEmploye);
}


// ===== CHARGER =====
async function chargerEmployes() {
    try {
        const res = await fetch(`${API_BASE}/employes`);
        allEmployes = await res.json();
        afficherEmployes(allEmployes);
    } catch (err) {
        showToast('Erreur chargement employés', 'danger');
    }
}

// ===== AFFICHER =====
function afficherEmployes(liste) {
    const tbody = document.getElementById('employeTableBody');
    if (!tbody) return;

    if (liste.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Aucun employé trouvé</td></tr>`;
        return;
    }

    tbody.innerHTML = liste.map(emp => `
        <tr>
            <td>${emp.prenom} ${emp.nom}</td>
            <td>${emp.email}</td>
            <td>${emp.telephone || '-'}</td>
            <td>${emp.role || 'employe'}</td>
            <td>${formatDate(emp.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="openEditEmploye('${emp._id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="openDeleteEmploye('${emp._id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
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

    if (!checkPasswordStrength(document.getElementById('password'))) {
        showToast('Le mot de passe ne respecte pas les critères', 'danger');
        return;
    }

    if (pwd !== confirm) {
        showToast('Les mots de passe ne correspondent pas', 'danger');
        return;
    }

    const data = {
        nom:        document.getElementById('createEmpNom').value.trim(),
        prenom:     document.getElementById('createEmpPrenom').value.trim(),
        email:      document.getElementById('createEmpEmail').value.trim(),
        telephone:  document.getElementById('createEmpGsm').value.trim(),
        adresse:    document.getElementById('createEmpAdresse').value.trim(),
        codePostal: document.getElementById('createEmpCodePostal').value.trim(),
        ville:      document.getElementById('createEmpVille').value.trim(),
        password:   pwd,
        role:       document.getElementById('createEmpRole').value
    };

    try {
        const res = await fetch(`${API_BASE}/employes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
    }
}


// ===== ÉDITER =====
function openEditEmploye(id) {
    const emp = allEmployes.find(e => e._id === id);
    if (!emp) return;

    document.getElementById('editEmpId').value = emp._id;
    document.getElementById('editEmpNom').value = emp.nom;
    document.getElementById('editEmpPrenom').value = emp.prenom;
    document.getElementById('editEmpEmail').value = emp.email;
    document.getElementById('editEmpTelephone').value = emp.telephone || '';
    document.getElementById('editEmpRole').value = emp.role || 'employe';

    modalEditEmploye.show();
}

async function modifierEmploye(e) {
    e.preventDefault();

    const id = document.getElementById('editEmpId').value;
    const data = {
        nom:       document.getElementById('editEmpNom').value.trim(),
        prenom:    document.getElementById('editEmpPrenom').value.trim(),
        email:     document.getElementById('editEmpEmail').value.trim(),
        telephone: document.getElementById('editEmpTelephone').value.trim(),
        role:      document.getElementById('editEmpRole').value
    };

    try {
        const res = await fetch(`${API_BASE}/employes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
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

// ===== SUPPRIMER =====
function openDeleteEmploye(id) {
    document.getElementById('deleteEmpId').value = id;
    modalDeleteEmploye.show();
}

async function supprimerEmploye() {
    const id = document.getElementById('deleteEmpId').value;

    try {
        const res = await fetch(`${API_BASE}/employes/${id}`, { method: 'DELETE' });
        if (!res.ok) throw await res.json();

        showToast('Employé supprimé', 'success');
        modalDeleteEmploye.hide();
        chargerEmployes();
    } catch (err) {
        showToast(err.message || 'Erreur lors de la suppression', 'danger');
    }
}

function resetCreateEmpRequirements() {
    ['req-length', 'req-uppercase', 'req-lowercase',
     'req-number', 'req-special'].forEach(id => {
        updateRequirement(id, false);
    });
    const bar = document.getElementById('strengthBar');
    if (bar) {
        bar.className = 'password-strength-bar';
    }
    const msg = document.getElementById('passwordMatchMessage');
    if (msg) msg.style.display = 'none';
}


// ===== EXPOSER AU HTML =====
window.openEditEmploye = openEditEmploye;
window.openDeleteEmploye = openDeleteEmploye;
