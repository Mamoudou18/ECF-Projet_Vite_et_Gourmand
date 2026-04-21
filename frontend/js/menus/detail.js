// ============================================
// GESTION DU DÉTAIL D'UN MENU
// ============================================

import { getStorage } from "../script.js";
import { showToast } from "../utils/util.js";
import { API_BASE, URL_IMG } from "../config.js";

// ===================== VARIABLES GLOBALES ========
const REDUCT = 5;
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
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getMenuIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'), 10);
    return isNaN(id) ? null : id;
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
        const response = await fetch(`${API_BASE}/menu/detail?id=${menuId}`);

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
        const plats = currentMenu.plats || [];
        currentMenu.entrees  = plats.filter(p => p.type_id === 1);
        currentMenu.platsPrincipaux = plats.filter(p => p.type_id === 2);
        currentMenu.desserts = plats.filter(p => p.type_id === 3);

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
                        <img src="${URL_IMG}${escapeHTML(img)}" 
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

    // ---- SINGLE PLAT HELPER ----
    function renderSinglePlat(icon, label, plat, index, total) {
        const displayLabel = total > 1 ? `${label} ${index + 1}` : label;
        return `
            <div>
                <h6 class="text-primary mb-2">
                    <i class="bi bi-${icon}"></i> ${displayLabel}
                </h6>
                <div class="plat-card p-3">
                    <strong>${escapeHTML(plat.nom)}</strong>
                    <p class="small text-muted mb-2">${escapeHTML(plat.description)}</p>
                    ${renderAllergenes(plat.allergenes)}
                </div>
            </div>
        `;
    }


    // ---- COMPOSITION ----
   
    const maxLength = Math.max(
        menu.entrees?.length || 0,
        menu.platsPrincipaux?.length || 0,
        menu.desserts?.length || 0
    );

    let cards = '';

    for (let i = 0; i < maxLength; i++) {
        cards += `
            <div class="col">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body d-flex flex-column gap-3">
                        ${menu.entrees?.[i] ? renderSinglePlat('1-circle', 'Entrée', menu.entrees[i], i, maxLength) : ''}
                        ${menu.platsPrincipaux?.[i] ? renderSinglePlat('2-circle', 'Plat', menu.platsPrincipaux[i], i, maxLength) : ''}
                        ${menu.desserts?.[i] ? renderSinglePlat('3-circle', 'Dessert', menu.desserts[i], i, maxLength) : ''}
                    </div>
                </div>
            </div>
        `;
    }


    const compoHTML = maxLength === 0
        ? `<div class="alert alert-info"><i class="bi bi-info-circle"></i> Aucun plat dans ce menu</div>`
        : `
            <div class="card card-composition shadow-sm mb-4">
                <div class="card-header">
                    <h4><i class="bi bi-list-ul"></i> Composition du menu</h4>
                </div>
                <div class="card-body">
                    <div class="row row-cols-1 row-cols-md-${Math.min(maxLength, 3)} g-3 justify-content-center">
                        ${cards}
                    </div>
                </div>
            </div>
        `;


    // ---- BOUTON COMMANDER ----
    let btnCommanderHTML;
    if (menu.stock <= 0) {
        btnCommanderHTML = `
            <button class="btn btn-secondary w-100 mb-4" disabled>
                <i class="bi bi-x-circle"></i> Menu indisponible
            </button>
        `;
    } else {
        btnCommanderHTML = `
            <button class="btn btn-commander w-100 mb-4" 
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
        <div class="card card-composition shadow-sm mb-4">
            <div class="card-header">
                <h4><i class="bi bi-tag"></i> Tarif & Commande</h4>
            </div>
            <div class="card-body">
                <div class="price-box mb-4">
                    <div class="text-center mb-4">
                        <div class="display-4 fw-bold mb-3" style="color: var(--primary);">${prixTotal.toFixed(2)}€</div>
                        <div class="text-muted mb-2">Pour ${menu.nb_personnes_min} personnes</div>
                        <div class="small mt-2">(${prixBase.toFixed(2)}€ / personne)</div>
                    </div>

                    <div class="alert alert-success mb-4">
                        <small>
                            <i class="bi bi-gift"></i> 
                            <strong>Réduction de 10%</strong> à partir de ${menu.nb_personnes_min + REDUCT} personnes
                        </small>
                    </div>

                    ${btnCommanderHTML}

                    <a href="/menu" class="btn btn-secondary w-100 mt-4">
                        <i class="bi bi-arrow-left"></i> Retour aux menus
                    </a>

                    <div class="mt-4 pt-3" style="border-top: 1px solid rgba(255,255,255,0.2);">
                        <h6 class="mb-3"><i class="bi bi-info-circle"></i> Informations</h6>
                        <div class="small">
                            <div class="${menu.stock <= 5 ? 'text-danger fw-bold' : ''}">
                                <i class="bi bi-box-seam"></i> 
                                ${menu.stock > 0 ? `Stock limité : ${menu.stock} restants` : 'Stock épuisé'}
                            </div>
                        </div>
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
    document.getElementById("condition-menu").innerHTML = conditionsMenuHTML;
    document.getElementById("menu-detail-container-gauche").innerHTML = compoHTML;
    document.getElementById("menu-detail-container-droite").innerHTML = prixHTML;

    // Initialiser le carousel
    const carouselEl = document.getElementById('menuCarousel');
    if ( typeof bootstrap !== 'undefined' && carouselEl) {
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
            // Mettre à jour le lien de connexion avec la redirection
            const loginLink = document.querySelector('#connexionModal a[href="/signin"]');
            if(loginLink){
                loginLink.href = `/signin?redirect=/commande?menu=${menu.id}`;
            }
            
            const modal = new bootstrap.Modal(document.getElementById('connexionModal'));
            modal.show();
            return;
        }


        if (menu.stock <= 0) {
            showToast('Désolé, ce menu n\'est plus disponible', 'danger');
            return;
        }

        window.history.pushState({}, "", `/commande?menu=${menu.id}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    btnCommander.addEventListener("click", commanderHandler);
}
