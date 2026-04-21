import { API_BASE, URL_IMG } from "../config.js";

// ========== VARIABLES GLOBALES ==========
let menus = []
let filteredMenus = [];
let currentPage = 1;
const itemsPerPage = 6;

// ========== INITIALISATION ==========
async function init() {
    await loadMenus();
    displayMenus();
    updateResultsCount();
}

init();

//chargement des menus depuis le json
async function loadMenus() {
    try {
        const response = await fetch(`${API_BASE}/menu/list`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();
        menus = data.menus;
        filteredMenus = [...menus];
        
    } catch (error) {
        console.error('Erreur de chargment des menus:', error);
        document.getElementById("menusGrid").innerHTML=`
            <div class="col-12">
                <div class="alert alert-danger">
                    Erreur lors du chargement des menus. Veillez réessayer.
                </div>
            </div>
        `;   
    }
}

// Update slider display
document.getElementById("maxPrice").addEventListener('input', function() {
    document.getElementById("maxPriceDisplay").textContent = this.value + ' €';
});

// ========== AFFICHAGE DES MENUS ==========
function displayMenus() {
    const container = document.getElementById("menusGrid");
    //mise à jour du compteur
    updateResultsCount();

    container.innerHTML = '';
    if (filteredMenus.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="no-results">
                    <i class="bi bi-search"></i>
                    <h4>Aucun menu trouvé</h4>
                    <p>Essayez de modifier vos filtres de recherche</p>
                    <button id="resetFiltersBtn" class="btn btn-primary mt-3">
                        Réinitialiser les filtres
                    </button>
                </div>
            </div>
        `;
        document.getElementById("pagination-container").style.display="none";
        document.getElementById("resetFiltersBtn").addEventListener("click", function(e){
            if(e.target.id ==="resetFiltersBtn"){
                e.preventDefault();
                resetFilters();
            }
        });

        return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedMenus = filteredMenus.slice(start, end);

    paginatedMenus.forEach(menu => {
        const stockClass = menu.stock < 10 ? 'low' : '';
        const stockIcon = menu.stock < 10 ? 'exclamation-triangle' : 'check-circle';

        // Extraire la première image
        const images = menu.images ? menu.images.split(',').map(img => img.trim()) : [];
        const imagePrincipale = images.length > 0 ? `${URL_IMG}${images[0]}` : 'assets/img/default-menu.jpg';

        container.innerHTML += `
            <div class="col-xl-4 col-lg-6 col-md-6">
                <div class="menu-card">
                    <div class="menu-image">
                        <img src="${imagePrincipale}" alt="${menu.titre}">
                        <div class="menu-badge">${menu.themes.charAt(0).toUpperCase() + menu.themes.slice(1)}</div>
                        <div class="menu-stock ${stockClass}">
                            <i class="bi bi-${stockIcon}"></i>
                            ${menu.stock} dispo.
                        </div>
                    </div>
                    <div class="menu-body">
                        <h3 class="menu-title">${menu.titre}</h3>
                        <span class="menu-theme">${menu.regimes.charAt(0).toUpperCase() + menu.regimes.slice(1)}</span>
                        <p class="menu-description">${menu.description}</p>
                        <div class="menu-details">
                            <div class="menu-detail-item">
                                <i class="bi bi-people-fill"></i>
                                <span>Min. ${menu.nb_personnes_min} pers.</span>
                            </div>
                        </div>
                        <div class="menu-footer">
                            <div class="menu-price">
                                <span class="menu-price-label">À partir de</span>
                                <span class="menu-price-value">${menu.prix_base} €</span>
                            </div>
                            <a href="/detail?id=${menu.id}" class="btn btn-detail">
                                Voir détail <i class="bi bi-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    document.getElementById("pagination-container").style.display = "block";
    updatePagination();
}

// -----------------------
// Pagination
// -----------------------
function updatePagination() {
    const totalPages = Math.max(1,Math.ceil(filteredMenus.length / itemsPerPage));
    document.getElementById("page-info").textContent =
        `Page ${currentPage} sur ${totalPages}`;

    document.getElementById("prev-page").disabled = currentPage === 1;
    document.getElementById("next-page").disabled = currentPage === totalPages;
}

document.getElementById("prev-page").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        displayMenus();
        updatePagination();
    }
});

document.getElementById("next-page").addEventListener("click", () => {
    const totalPages = Math.ceil(filteredMenus.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayMenus();
        updatePagination();
    }
});
// ========== FILTRES ==========
const submitButtons = [...document.querySelectorAll("button[type='submit']")];
const applyBtn = submitButtons.find(b => b.textContent.includes("Appliquer"));
const resetBtn = submitButtons.find(b => b.textContent.includes("Réinitialiser"));

applyBtn?.addEventListener("click", e => {
    e.preventDefault(); applyFilters();
});

resetBtn?.addEventListener("click", e => {
    e.preventDefault(); resetFilters();
});

function applyFilters() {

    filteredMenus = [...menus];

    // Prix
    const maxPrice = parseFloat(document.getElementById("maxPrice").value);
    const minPriceInput = parseFloat(document.getElementById("minPriceInput").value) || 0;
    const maxPriceInput = parseFloat(document.getElementById("maxPriceInput").value) || 999999;

    filteredMenus = filteredMenus.filter(m => 
        m.prix_base <= maxPrice && 
        m.prix_base >= minPriceInput && 
        m.prix_base <= maxPriceInput
    );

    // Thèmes
    const selectedThemes = Array.from(document.querySelectorAll('.theme-filter:checked')).map(cb => cb.value);
    if (selectedThemes.length > 0) {
        filteredMenus = filteredMenus.filter(m => selectedThemes.includes(m.themes));
    }

    // Régimes
    const selectedRegimes = Array.from(document.querySelectorAll('.regime-filter:checked')).map(cb => cb.value);
    if (selectedRegimes.length > 0) {
        filteredMenus = filteredMenus.filter(m => selectedRegimes.includes(m.regimes));
    }

    // Nombre de personnes
    const minPersonsFilter = document.getElementById('minPersonsFilter').value;
    if (minPersonsFilter) {
        filteredMenus = filteredMenus.filter(m => m.nb_personnes_min >= parseInt(minPersonsFilter));
    }

    currentPage = 1;
    displayMenus();
}

function resetFilters() {
    // Réinitialiser tous les champs
    document.getElementById("maxPrice").value = 1000;
    document.getElementById("maxPriceDisplay").textContent = '500 €';
    document.getElementById("minPriceInput").value = 0;
    document.getElementById("maxPriceInput").value = 1000;
    document.getElementById("minPersonsFilter").value = '';
    
    document.querySelectorAll('.theme-filter').forEach(cb => cb.checked = false);
    document.querySelectorAll('.regime-filter').forEach(cb => cb.checked = false);
    document.getElementById("sortSelect").value = 'default';

    filteredMenus = [...menus];
    currentPage = 1;
    
    displayMenus();
    updateResultsCount();
}

// ========== TRI ========== 
const sortSelect = document.getElementById("sortSelect");
sortSelect.addEventListener("change", function sortMenus(){

    //mise à jour du compteur 

    const sortValue = document.getElementById("sortSelect").value;
    switch(sortValue) {
        case 'price-asc':
            filteredMenus.sort((a, b) => a.prix_base - b.prix_base);
            break;
        case 'price-desc':
            filteredMenus.sort((a, b) => b.prix_base - a.prix_base);
            break;
        case 'persons-asc':
            filteredMenus.sort((a, b) => a.nb_personnes_min - b.nb_personnes_min);
            break;
        case 'persons-desc':
            filteredMenus.sort((a, b) => b.nb_personnes_min - a.nb_personnes_min);
            break;
        default:
            // Retour à l'ordre original
            filteredMenus = [...menus].filter(m => filteredMenus.some(fm => fm.id === m.id));
    }

    currentPage = 1;
    displayMenus();
});

// ========== COMPTEUR RÉSULTATS ==========
function updateResultsCount() {
    document.getElementById("resultsCount").textContent = filteredMenus.length;
}