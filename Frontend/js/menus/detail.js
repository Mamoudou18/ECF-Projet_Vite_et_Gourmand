// ============================================
// GESTION DU DÉTAIL D'UN MENU
// ============================================

import { getStorage } from "../script.js";
import { showError } from "../utils/util.js";

let currentMenu = null;
let commanderHandler = null;
let carouselInstance = null;

// ============================================
// INIT & CLEANUP
// ============================================

export function init() {
    loadMenuDetail();
}

export function cleanup() {
    const btnCommander = document.getElementById('btn-commander');
    if (btnCommander && commanderHandler) {
        btnCommander.removeEventListener('click', commanderHandler);
    }
    if (carouselInstance) {
        carouselInstance.dispose();
        carouselInstance = null;
    }
    commanderHandler = null;
    currentMenu = null;
}

// ============================================
// UTILITAIRES
// ============================================

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getMenuIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
}

// Mapper type_id vers catégorie
function getTypeLabel(typeId) {
    switch (typeId) {
        case 1: return 'Entrée';
        case 2: return 'Plat';
        case 3: return 'Dessert';
        default: return 'Autre';
    }
}

// ============================================
// CHARGEMENT DU MENU
// ============================================

async function loadMenuDetail() {
    const menuId = getMenuIdFromURL();
    const container = document.getElementById('menu-detail-container-gauche');

    if (!container) {
        console.error('Conteneur menu-detail-container-gauche introuvable');
        return;
    }

    if (!menuId) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-x-circle"></i> Menu introuvable
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Chargement...</span>
            </div>
            <p class="mt-3 text-muted">Chargement du menu...</p>
        </div>
    `;

    try {
        const response = await fetch(`http://localhost/api/menu/detail?id=${menuId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.menu) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-x-circle"></i> Ce menu est introuvable
                </div>
            `;
            return;
        }

        currentMenu = data.menu;

        // Séparer les plats par type_id
        currentMenu.entrees  = currentMenu.plats.filter(p => p.type_id === 1);
        currentMenu.platsPrincipaux = currentMenu.plats.filter(p => p.type_id === 2);
        currentMenu.desserts = currentMenu.plats.filter(p => p.type_id === 3);

        // Parser les images du menu
        currentMenu.imagesList = currentMenu.images
            ? currentMenu.images.split(',').map(img => img.trim()).filter(img => img)
            : [];

        // Parser les conditions
        currentMenu.conditionsList = currentMenu.conditions
            ? currentMenu.conditions.split(',').map(c => c.trim().replace(/^"|"$/g, '').trim()).filter(c => c)
            : [];

        displayMenuDetail(currentMenu);

    } catch (error) {
        console.error('Erreur chargement menu:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Erreur lors du chargement du menu
            </div>
        `;
    }
}

// ============================================
// AFFICHAGE DU MENU
// ============================================

function displayMenuDetail(menu) {

    // ---- HEADER ----
    const headerHTML = `
        <div class="menu-header position-relative">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-lg-8">
                        <h1 class="display-4 fw-bold mb-3">${escapeHTML(menu.titre)}</h1>
                        <p class="lead mb-4">${escapeHTML(menu.description)}</p>
                        <div class="d-flex gap-2 flex-wrap">
                            <span class="badge badge-custom">
                                <i class="bi bi-calendar-event"></i> ${escapeHTML(menu.themes)}
                            </span>
                            <span class="badge badge-custom">
                                <i class="bi bi-people"></i> ${menu.nb_personnes_min} personnes min.
                            </span>
                            <span class="badge badge-custom">
                                <i class="bi bi-egg"></i> ${escapeHTML(menu.regimes)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // ---- CAROUSEL (images du menu) ----
    const imageHTML = menu.imagesList.length > 0 ? `
        <div id="menuCarousel" class="carousel slide" data-bs-ride="true">
            <div class="carousel-indicators">
                ${menu.imagesList.map((img, index) => `
                    <button type="button" 
                        data-bs-target="#menuCarousel" 
                        data-bs-slide-to="${index}" 
                        ${index === 0 ? 'class="active" aria-current="true"' : ''}
                        aria-label="Slide ${index + 1}"></button>
                `).join('')}
            </div>
            <div class="carousel-inner">
                ${menu.imagesList.map((img, index) => `
                    <div class="carousel-item ${index === 0 ? 'active' : ''}">
                        <img src="http://localhost${escapeHTML(img)}" 
                            class="d-block w-100" 
                            style="height: 500px; object-fit: cover;"
                            alt="${escapeHTML(menu.titre)} - Image ${index + 1}">
                    </div>
                `).join('')}
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#menuCarousel" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Précédent</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#menuCarousel" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Suivant</span>
            </button>
        </div>
    ` : "";

    // ---- DESCRIPTION ----
    const descriptionLongHTML = `
        <div class="card-descriptionLong shadow-sm mb-4">
            <div class="card-body">
                <h4 class="m-3 pt-3"><i class="bi bi-card-text"></i> Description</h4>
                <p class="text-muted p-3">${escapeHTML(menu.description)}</p>
            </div>
        </div>
    `;

    // ---- ALLERGÈNES HELPER ----
    function renderAllergenes(allergenes) {
        if (allergenes && allergenes.trim()) {
            return `
                <div class="alert alert-warning py-2 mb-0">
                    <small>
                        <i class="bi bi-exclamation-triangle-fill"></i>
                        <strong>Allergènes:</strong> ${escapeHTML(allergenes)}
                    </small>
                </div>
            `;
        }
        return `
            <div class="alert alert-success py-2 mb-0">
                <small>
                    <i class="bi bi-check-circle-fill"></i>
                    Aucun allergène majeur
                </small>
            </div>
        `;
    }

    // ---- SECTION PLATS HELPER ----
    function renderPlatSection(icon, label, plats) {
        if (!plats || plats.length === 0) return '';
        return `
            <h5 class="text-primary mb-3 text-start">
                <i class="bi bi-${icon}"></i>
                ${label}${plats.length > 1 ? 's' : ''}
            </h5>
            <div class="row g-3 mb-4 text-start">
                ${plats.map(plat => `
                    <div class="col-md-6">
                        <div class="plat-card p-3 h-100">
                            <h6 class="fw-bold">${escapeHTML(plat.nom)}</h6>
                            <p class="small text-muted mb-2">${escapeHTML(plat.description)}</p>
                            ${renderAllergenes(plat.allergenes)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ---- COMPOSITION ----
    const compoHTML = `
        <div class="card card-composition shadow-sm mb-4">
            <div class="card-header">
                <h4><i class="bi bi-list-ul"></i> Composition du menu</h4>
            </div>
            <div class="card-body">
                ${renderPlatSection('1-circle', 'Entrée', menu.entrees)}
                ${renderPlatSection('2-circle', 'Plat', menu.platsPrincipaux)}
                ${renderPlatSection('3-circle', 'Dessert', menu.desserts)}
            </div>
        </div>  
    `;

    // ---- BOUTON COMMANDER ----
    let btnCommanderHTML;
    if (menu.stock <= 0) {
        btnCommanderHTML = `
            <button class="btn btn-secondary w-100 mb-3" disabled>
                <i class="bi bi-x-circle"></i> Menu indisponible
            </button>
        `;
    } else {
        btnCommanderHTML = `
            <button class="btn btn-commander w-100 mb-3" 
                    id="btn-commander"
                    aria-label="Commander le menu ${escapeHTML(menu.titre)}">
                <i class="bi bi-cart-plus" aria-hidden="true"></i> 
                Commander ce menu
            </button>
        `;
    }

    // ---- COLONNE DROITE : PRIX ----
    const prixBase = parseFloat(menu.prix_base) || 0;
    const prixTotal = prixBase * menu.nb_personnes_min;

    const prixHTML = `
        <div class="price-box mb-3">
            <div class="text-center mb-3">
                <div class="display-4 fw-bold" style="color: var(--primary);">${prixTotal.toFixed(2)}€</div>
                <div class="text-muted">Pour ${menu.nb_personnes_min} personnes</div>
                <div class="small mt-2">(${prixBase.toFixed(2)}€ / personne)</div>
            </div>

            <div class="alert alert-warning mb-3">
                <small>
                    <i class="bi bi-gift"></i> 
                    <strong>Réduction de 10%</strong> à partir de ${menu.nb_personnes_min + 5} personnes
                </small>
            </div>

            ${btnCommanderHTML}

            <!-- Message d'erreur (masqué par défaut) -->
            <div id="errorMessage" class="alert alert-danger" style="display: none;">
                 <i class="bi bi-exclamation-triangle-fill"></i>
                <span id="errorText"></span>
            </div>

            <!-- Message de succès (masqué par défaut) -->
            <div id="successMessage" class="alert alert-success" style="display: none;">
                <i class="bi bi-check-circle-fill"></i>
                <span id="successText"></span>
            </div>

            <a href="/menu" class="btn btn-secondary w-100">
                <i class="bi bi-arrow-left"></i> Retour aux menus
            </a>

            <div class="mt-3 pt-3" style="border-top: 1px solid rgba(255,255,255,0.2);">
                <h6 class="mb-2"><i class="bi bi-info-circle"></i> Informations</h6>
                <div class="small">
                    <div class="${menu.stock <= 5 ? 'text-danger fw-bold' : ''}">
                        <i class="bi bi-box-seam"></i> 
                        ${menu.stock > 0 ? `Stock limité : ${menu.stock} restants` : 'Stock épuisé'}
                    </div>
                </div>
            </div>
        </div>
    `;

    // ---- CONDITIONS ----
    const conditionsMenuHTML = menu.conditionsList.length > 0 ? `
        <div class="conditions-box">
            <h5 class="mb-3">
                <i class="bi bi-exclamation-circle-fill"></i> 
                <strong>Conditions importantes</strong>
            </h5>
            <ul class="mb-0">
                ${menu.conditionsList.map(condition => `
                    <li class="mb-2"><strong>${escapeHTML(condition)}</strong></li>
                `).join('')}
            </ul>
        </div>
    ` : '';

    // ---- INJECTION DANS LA PAGE ----
    document.getElementById("menu-detail-header").innerHTML = headerHTML;
    document.getElementById("carousel-img").innerHTML = imageHTML;
    document.getElementById("description-longue").innerHTML = descriptionLongHTML;
    document.getElementById("menu-detail-container-gauche").innerHTML = compoHTML;
    document.getElementById("menu-detail-container-droite").innerHTML = `
        ${prixHTML}
        ${conditionsMenuHTML}
    `;

    // Initialiser le carousel
    const carouselEl = document.getElementById('menuCarousel');
    if (carouselEl) {
        const oldInstance = bootstrap.Carousel.getInstance(carouselEl);
        if (oldInstance) oldInstance.dispose();
        carouselInstance = new bootstrap.Carousel(carouselEl);
    }

    if (menu.stock > 0) {
        attachCommanderListener(menu);
    }
}

// ============================================
// GESTION DU BOUTON COMMANDER
// ============================================

function attachCommanderListener(menu) {
    const btnCommander = document.getElementById("btn-commander");
    if (!btnCommander) return;

    if (commanderHandler) {
        btnCommander.removeEventListener("click", commanderHandler);
    }

    commanderHandler = function () {
        const currentUser = getStorage();

        if (!currentUser) {
            showError('Vous devez être connecté pour commander ce menu');
            setTimeout(() =>{
                window.location.href = `/signin?redirect=/commande?menu=${menu.id}`;
            }, 2000);
            return;
        }

        if (menu.stock <= 0) {
            showError('Désolé, ce menu n\'est plus disponible')
            return;
        }

        console.log('Utilisateur connecté:', currentUser.prenom);
        window.history.pushState({}, "", `/commande?menu=${menu.id}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    btnCommander.addEventListener("click", commanderHandler);
}
