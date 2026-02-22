// ============================================
// GESTION DU DÉTAIL D'UN MENU
// ============================================

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
    // Nettoyer le listener du bouton
    const btnCommander = document.getElementById('btn-commander');
    if (btnCommander && commanderHandler) {
        btnCommander.removeEventListener('click', commanderHandler);
    }
    
    // Nettoyer le carousel
    if (carouselInstance) {
        carouselInstance.dispose();
        carouselInstance = null;
    }
    
    // Réinitialiser les variables
    commanderHandler = null;
    currentMenu = null;
}

// ============================================
// UTILITAIRES
// ============================================

// Sécurité XSS : échapper le HTML
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Récupération de l'ID du menu depuis l'URL
function getMenuIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
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

    // Loader
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Chargement...</span>
            </div>
            <p class="mt-3 text-muted">Chargement du menu...</p>
        </div>
    `;

    try {
        const response = await fetch('data/menus.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        currentMenu = data.menus.find(m => m.id === menuId);

        if (!currentMenu) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-x-circle"></i> Ce menu est introuvable
                </div>
            `;
            return;
        }

        if (!currentMenu.entrees || !currentMenu.plats || !currentMenu.desserts) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i> Ce menu est incomplet
                </div>
            `;
            return;
        }

        displayMenuDetail(currentMenu);

    } catch (error) {
        console.error('Erreur chargement menu:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Erreur lors du chargement du menu
            </div>
        `;
    }finally{
        
    }
}

// ============================================
// AFFICHAGE DU MENU
// ============================================

function displayMenuDetail(menu) {
    // On récupère toutes les images
    const galerieImages = [
        ...menu.entrees.map(e => ({ url: e.image, type: 'Entrée', nom: e.nom })),
        ...menu.plats.map(p => ({ url: p.image, type: 'Plat', nom: p.nom })),
        ...menu.desserts.map(d => ({ url: d.image, type: 'Dessert', nom: d.nom }))
    ];

    // Header (avec échappement XSS)
    const headerHTML = `
        <div class="menu-header position-relative">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-lg-8">
                        <h1 class="display-4 fw-bold mb-3">${escapeHTML(menu.titre)}</h1>
                        <p class="lead mb-4">${escapeHTML(menu.description)}</p>
                        <div class="d-flex gap-2 flex-wrap">
                            <span class="badge badge-custom">
                                <i class="bi bi-calendar-event"></i> ${escapeHTML(menu.theme)}
                            </span>
                            <span class="badge badge-custom">
                                <i class="bi bi-people"></i> ${menu.nb_personnes_min} personnes min.
                            </span>
                            <span class="badge badge-custom">
                                <i class="bi bi-egg"></i> ${escapeHTML(menu.regime)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Galerie (carousel)
    const imageHTML = galerieImages.length > 0 ? `
        <div id="menuCarousel" class="carousel slide" data-bs-ride="true">
            <div class="carousel-indicators">
                ${galerieImages.map((img, index) => `
                    <button type="button" 
                        data-bs-target="#menuCarousel" 
                        data-bs-slide-to="${index}" 
                        ${index === 0 ? 'class="active" aria-current="true"' : ''}
                        aria-label="Slide ${index + 1}"></button>
                `).join('')}
            </div>
            <div class="carousel-inner">
                ${galerieImages.map((img, index) => `
                    <div class="carousel-item ${index === 0 ? 'active' : ''}">
                        <img src="${escapeHTML(img.url)}" 
                            class="d-block w-100" 
                            style="height: 500px; object-fit: cover;"
                            alt="${escapeHTML(img.type)} - ${escapeHTML(img.nom)}">
                        <div class="carousel-caption d-none d-md-block bg-dark bg-opacity-75 rounded">
                            <h5>${escapeHTML(img.type)}: ${escapeHTML(img.nom)}</h5>
                        </div>
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

    // Description longue
    const descriptionLongHTML = `
        <div class="card-descriptionLong shadow-sm mb-4">
            <div class="card-body">
                <h4 class="m-3 pt-3"><i class="bi bi-card-text"></i> Description</h4>
                <p class="text-muted p-3">${escapeHTML(menu.description_longue)}</p>
            </div>
        </div>
    `;

    // Fonction helper pour les allergènes
    function renderAllergenes(allergenes) {
        if (allergenes && allergenes.length > 0) {
            return `
                <div class="alert alert-warning py-2 mb-0">
                    <small>
                        <i class="bi bi-exclamation-triangle-fill"></i>
                        <strong>Allergènes:</strong> ${allergenes.map(escapeHTML).join(', ')}
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

    // Composition du menu
    const compoHTML = `
        <div class="card card-composition shadow-sm mb-4">
            <div class="card-header">
                <h4><i class="bi bi-list-ul"></i> Composition du menu</h4>
            </div>
            <div class="card-body">
                <!-- Entrées -->
                <h5 class="text-primary mb-3 text-start">
                    <i class="bi bi-1-circle"></i>
                    Entrée${menu.entrees.length > 1 ? 's' : ''}
                </h5>
                <div class="row g-3 mb-4 text-start">
                    ${menu.entrees.map(entree => `
                        <div class="col-md-6">
                            <div class="plat-card p-3 h-100">
                                <h6 class="fw-bold">${escapeHTML(entree.nom)}</h6>
                                <p class="small text-muted mb-2">${escapeHTML(entree.description)}</p>
                                ${renderAllergenes(entree.allergenes)}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Plats -->
                <h5 class="text-primary mb-3 text-start">
                    <i class="bi bi-2-circle"></i> 
                    Plat${menu.plats.length > 1 ? 's' : ''}
                </h5>
                <div class="row g-3 mb-4 text-start">
                    ${menu.plats.map(plat => `
                        <div class="col-md-6">
                            <div class="plat-card p-3 h-100">
                                <h6 class="fw-bold">${escapeHTML(plat.nom)}</h6>
                                <p class="small text-muted mb-2">${escapeHTML(plat.description)}</p>
                                ${renderAllergenes(plat.allergenes)}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Desserts -->
                <h5 class="text-primary mb-3 text-start">
                    <i class="bi bi-3-circle"></i>
                    Dessert${menu.desserts.length > 1 ? 's' : ''}
                </h5>
                <div class="row g-3 text-start">
                    ${menu.desserts.map(dessert => `
                        <div class="col-md-6">
                            <div class="plat-card p-3 h-100">
                                <h6 class="fw-bold">${escapeHTML(dessert.nom)}</h6>
                                <p class="small text-muted mb-2">${escapeHTML(dessert.description)}</p>
                                ${renderAllergenes(dessert.allergenes)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>  
    `;

    // Bouton commander (avec gestion stock)
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

    // Colonne droite: prix / commande / informations
    const prixHTML = `
        <div class="price-box mb-3">
            <div class="text-center mb-3">
                <div class="display-4 fw-bold" style="color: var(--primary);">${menu.prix}€</div>
                <div class="text-muted">Pour ${menu.nb_personnes_min} personnes</div>
                <div class="small mt-2">(${(menu.prix/menu.nb_personnes_min).toFixed(2)}€ / personne)</div>
            </div>

            <div class="alert alert-warning mb-3">
                <small>
                    <i class="bi bi-gift"></i> 
                    <strong>Réduction de 10%</strong> à partir de ${menu.nb_personnes_min+5} personnes
                </small>
            </div>

            ${btnCommanderHTML}

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

    // Conditions du menu
    const conditionsMenuHTML = menu.conditions && menu.conditions.length > 0 ? `
        <div class="conditions-box">
            <h5 class="mb-3">
                <i class="bi bi-exclamation-circle-fill"></i> 
                <strong>Conditions importantes</strong>
            </h5>
            <ul class="mb-0">
                ${menu.conditions.map(condition => `
                    <li class="mb-2"><strong>${escapeHTML(condition)}</strong></li>
                `).join('')}
            </ul>
        </div>
    ` : '';

    // Injection dans la page
    document.getElementById("menu-detail-header").innerHTML = headerHTML;
    document.getElementById("menu-detail-container-gauche").innerHTML = `
        ${imageHTML}
        ${descriptionLongHTML}
        ${compoHTML}
    `;
    document.getElementById("menu-detail-container-droite").innerHTML = `
        ${prixHTML}
        ${conditionsMenuHTML}
    `;

    // Initialiser le carousel
    const carouselEl = document.getElementById('menuCarousel');
    if (carouselEl) {
        // Nettoyer l'ancienne instance si existante
        const oldInstance = bootstrap.Carousel.getInstance(carouselEl);
        if (oldInstance) {
            oldInstance.dispose();
        }
        
        // Créer la nouvelle instance
        carouselInstance = new bootstrap.Carousel(carouselEl);
    }

    // Attacher le listener du bouton (seulement si stock > 0)
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

    // Nettoyer l'ancien listener si existant
    if (commanderHandler) {
        btnCommander.removeEventListener("click", commanderHandler);
    }

    // Créer le nouveau handler
    commanderHandler = function() {
        // Vérifier connexion
        let currentUser = null;
        try {
            currentUser = JSON.parse(localStorage.getItem('currentUser'));
        } catch (e) {
            console.error('Erreur parsing currentUser:', e);
        }

        if (!currentUser) {
            alert('Vous devez être connecté pour commander ce menu');
            window.location.href = `/signin?redirect=/commande?menu=${menu.id}`;
            return;
        }

        // Vérifier stock (double vérification)
        if (menu.stock <= 0) {
            alert('Désolé, ce menu n\'est plus disponible');
            return;
        }

        console.log('Utilisateur connecté:', currentUser.prenom);
        window.history.pushState({}, "", `/commande?menu=${menu.id}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    // Attacher le listener
    btnCommander.addEventListener("click", commanderHandler);
}
