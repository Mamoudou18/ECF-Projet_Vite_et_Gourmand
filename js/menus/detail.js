// ============================================
// GESTION DU DÉTAIL D'UN MENU
// ============================================

let currentMenu = null;
loadMenuDetail();


// 1. Récupération de l'id du menu cliqué
function getMenuIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
}


// 2. Charger les détail du menu
async function loadMenuDetail() {
    const menuId = getMenuIdFromURL();
    
    if (!menuId) {
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-danger">Ce menu est introuvable</div></div>';
        return;
    }

    try {
        const response = await fetch('data/menus.json'); //méthode fetch pour récupérer les données
        const data = await response.json();
        currentMenu = data.menus.find(m => m.id === menuId);

        if (!currentMenu) {
            document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-danger">Ce menu est introuvable</div></div>';
            return;
        }

        displayMenuDetail(currentMenu);
    } catch (error) {
        console.error('Erreur:', error);
        document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-danger">Erreur lors du chargement</div></div>';
    }
}

// 3. Afficher les détail du menu
function displayMenuDetail(menu) {

    // On récupère toutes les images des entrées, plats et desserts
    const galerieImages = [
        ...menu.entrees.map(e => ({ url: e.image, type: 'Entrée', nom: e.nom })),
        ...menu.plats.map(p => ({ url: p.image, type: 'Plat', nom: p.nom })),
        ...menu.desserts.map(d => ({ url: d.image, type: 'Dessert', nom: d.nom }))
    ];

    // Header menu détaillé
    const headerHTML = `
        <div class="menu-header position-relative">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-lg-8">
                        <h1 class="display-4 fw-bold mb-3">${menu.titre}</h1>
                        <p class="lead mb-4">${menu.description}</p>
                        <div class="d-flex gap-2 flex-wrap">

                            <span class="badge badge-custom">
                                <i class="bi bi-calendar-event"></i> ${menu.theme}
                            </span>

                            <span class="badge badge-custom">
                                <i class="bi bi-people"></i> ${menu.nb_personnes_min} personnes min.
                            </span>

                            <span class="badge badge-custom">
                                <i class="bi bi-egg"></i> ${menu.regime}
                            </span>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Galerie photo (carousel)
    const imageHTML = galerieImages.length > 0? `
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
                        <img src="${img.url}" 
                            class="d-block w-100" 
                            style="height: 500px; object-fit: cover;"
                            alt="${img.type} - ${img.nom}">
                        <div class="carousel-caption d-none d-md-block bg-dark bg-opacity-75 rounded">
                            <h5>${img.type}: ${img.nom}</h5>
                        </div>
                    </div>
                `).join('')}

            </div>
            <!-- Contrôles -->
            <button class="carousel-control-prev" type="button" data-bs-target="#menuCarousel" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Précédent</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#menuCarousel" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Suivant</span>
            </button>
        </div>
    
    `: "";

    // Description longue
    const descriptionLongHTML = `
        <div class="card-descriptionLong shadow-sm mb-4">
            <div class="card-body">
                <h4 class="m-3 pt-3"><i class="bi bi-card-text"></i> Description</h4>
                <p class="text-muted p-3">${menu.description_longue}</p>
            </div>
        </div>
    `;

    //composition du menu
    const compoHTML = `
        <div class="card card-composition shadow-sm mb-4">
            <div class="card-header">
                <h4><i class="bi bi-list-ul"></i> Composition du menu</h4>
            </div>
            <div class="card-body">

                <!-- Entrées -->
                <h5 class="text-primary mb-3 text-start"><i class="bi bi-1-circle"></i>
                    Entrée${menu.entrees.length > 1 ? 's' : ''}
                </h5>
                <div class="row g-3 mb-4 text-start">
                    ${menu.entrees.map(entree => `
                        <div class="col-md-6">
                            <div class="plat-card p-3 h-100">
                                <h6 class="fw-bold"> ${entree.nom}</h6>
                                <p class="small text-muted mb-2"> ${entree.description}</p>
                                <div>
                                    ${entree.allergenes && entree.allergenes.length > 0 ? `
                                        <div class="alert alert-warning py-2 mb-0">
                                            <small>
                                                <i class="bi bi-exclamation-triangle-fill"></i>
                                                <strong>Allergènes:</strong> ${entree.allergenes.join(', ')}
                                            </small>
                                        </div>
                                    ` : `
                                        <div class="alert alert-success py-2 mb-0">
                                            <small>
                                                <i class="bi bi-check-circle-fill"></i>
                                                Aucun allergène majeur
                                            </small>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Plats -->
                <h5 class="text-primary mb-3 text-start"><i class="bi bi-2-circle"></i> 
                    Plat${menu.plats.length > 1 ? 's' : ''}
                </h5>
                <div class="row g-3 mb-4 text-start">
                    ${menu.plats.map(plat => `
                        <div class="col-md-6">
                            <div class="plat-card p-3 h-100">
                                <h6 class="fw-bold"> ${plat.nom}</h6>
                                <p class="small text-muted mb-2">${plat.description}</p>
                                <div>
                                    ${plat.allergenes && plat.allergenes.length > 0 ? `
                                        <div class="alert alert-warning py-2 mb-0">
                                            <small>
                                                <i class="bi bi-exclamation-triangle-fill"></i>
                                                <strong>Allergènes:</strong> ${plat.allergenes.join(', ')}
                                            </small>
                                        </div>
                                        ` : `
                                        <div class="alert alert-success py-2 mb-0">
                                            <small>
                                                <i class="bi bi-check-circle-fill"></i>
                                                Aucun allergène majeur
                                            </small>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Desserts -->
                <h5 class="text-primary mb-3 text-start"><i class="bi bi-3-circle"></i>
                    Dessert${menu.desserts.length > 1 ? 's' : ''}
                 </h5>
                <div class="row g-3 text-start">
                    ${menu.desserts.map(dessert => `
                        <div class="col-md-6">
                            <div class="plat-card p-3 h-100">
                                <h6 class="fw-bold">${dessert.nom}</h6>
                                <p class="small text-muted mb-2">${dessert.description}</p>
                                <div>
                                    ${dessert.allergenes && dessert.allergenes.length > 0 ? `
                                         <div class="alert alert-warning py-2 mb-0">
                                            <small>
                                                <i class="bi bi-exclamation-triangle-fill"></i>
                                                <strong>Allergènes:</strong> ${dessert.allergenes.join(', ')}
                                            </small>
                                            </div>
                                        ` : `
                                        <div class="alert alert-success py-2 mb-0">
                                            <small>
                                                <i class="bi bi-check-circle-fill"></i>
                                                Aucun allergène majeur
                                            </small>
                                        </div>                                       
                                    `}
                                </div>
                            </div>
                        </div>                        
                    `).join('')}
                </div>

            </div>
        </div>  
    `;


    //colone droite: prix / commande /informations
    const prixHTML = `
        <div class="price-box mb-3">
            <div class="text-center mb-3">
                <div class="display-4 fw-bold" style="color: var(--primary);">${menu.prix}€</div>
                <div class="text-muted">Pour ${menu.nb_personnes_min} personnes</div>
                <div class="small mt-2">(${menu.prix/menu.nb_personnes_min} / personne)</div>
            </div>

            <div class="alert alert-warning mb-3">
                <small>
                    <i class="bi bi-gift"></i> 
                    <strong>Réduction de 10%</strong> à partir de ${menu.nb_personnes_min+5} personnes 
                    (soit ${menu.nb_personnes_min} + 5 personnes supplémentaires)
                </small>
            </div>

            <button class="btn btn-commander w-100 mb-3" id="btn-commander">
                <i class="bi bi-cart-plus"></i> Commander ce menu
            </button>

            <a href="/menu" class="btn btn-secondary w-100">
                <i class="bi bi-arrow-left"></i> Retour aux menus
            </a>

            <div class="mt-3 pt-3" style="border-top: 1px solid rgba(255,255,255,0.2);">
                <h6 class="mb-2"><i class="bi bi-info-circle"></i> Informations</h6>
                <div class="small">
                    <div>
                        <i class="bi bi-box-seam"></i> Stock limité : ${menu.stock} restants
                    </div>
                </div>
            </div>
                
        </div>
    `;


    //Conditions du menu
    const conditionsMenuHTML = menu.conditions && menu.conditions.length > 0 ? `
        <div class="conditions-box">
            <h5 class="mb-3">
                <i class="bi bi-exclamation-circle-fill"></i> 
                <strong>Conditions importantes</strong>
            </h5>
            <ul class="mb-0">
                ${menu.conditions.map(condition => `<li class="mb-2"><strong>${condition}</strong></li>`).join('')}
            </ul>
        </div>
        `:'';

    //injectiondans dans la page
    document.getElementById("menu-detail-header").innerHTML = `
        ${headerHTML}
    `;
    document.getElementById("menu-detail-container-gauche").innerHTML = `
        ${imageHTML}
        ${descriptionLongHTML}
        ${compoHTML}
    `;

    document.getElementById("menu-detail-container-droite").innerHTML = `
        ${prixHTML}
        ${conditionsMenuHTML}
    `;

    // Récupération du bouton commander

    const btnCommander = document.getElementById("btn-commander");

    if (btnCommander && menu) {
        btnCommander.addEventListener("click", () => {
            window.history.pushState({},"", `/commande?menu=${menu.id}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
        });
    }
    //const btnCommander = document.getElementById("btn-commander");

    //if (btnCommander) {
    //btnCommander.addEventListener("click", () => orderMenu(menu.id));
    //}

}

// ============================================
// 4. FONCTION POUR ALLER À UN SLIDE SPÉCIFIQUE
// ============================================
function goToSlide(index) {
    const carousel = new bootstrap.Carousel(document.getElementById('menuCarousel'));
    carousel.to(index);
}

// ============================================
// 5. FONCTION DE COMMANDE
// ============================================

//function orderMenu(menuId) {
    // Vérification si l'utilisateur est connecté
    //const isLoggedIn = sessionStorage.getItem('user') || localStorage.getItem('user');
    
    //if (!isLoggedIn) {
        //alert('Veuillez vous connecter pour commander ce menu.');
        //window.location.href = `/signin?redirect=/commande?menu=${menuId}`;
    //} else {
        //window.location.href = `/commande?menu=${menuId}`;
    //}
//}

