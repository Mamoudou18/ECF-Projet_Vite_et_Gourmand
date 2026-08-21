import { API_BASE } from "../config.js";

// ========== VARIABLES GLOBALES ==========
let menus = [];
let currentPage = 1;
let totalPages = 1;
const itemsPerPage = 3;

// ========== INITIALISATION ==========
async function init() {
    await loadMenus(1);
    displayMenus();
}

init();

// ========== CONSTRUCTION DES FILTRES ACTUELS ==========
function getCurrentFilters() {
    const filters = {};

    const minPriceInputEl = document.getElementById("minPriceInput");
    const maxPriceInputEl = document.getElementById("maxPriceInput");
    const minPersonsFilterEl = document.getElementById("minPersonsFilter");
    const sortSelectEl = document.getElementById("sortSelect");

    const minPriceInput = minPriceInputEl ? minPriceInputEl.value : "";
    const maxPriceInput = maxPriceInputEl ? maxPriceInputEl.value : "";
    const minPersonsFilter = minPersonsFilterEl ? minPersonsFilterEl.value : "";
    const sortValue = sortSelectEl ? sortSelectEl.value : "";

    if (minPriceInput && Number(minPriceInput) > 0) {
        filters.minPrice = minPriceInput;
    }
    if (maxPriceInput && Number(maxPriceInput) < 1000) {
        filters.maxPrice = maxPriceInput;
    }
    if (minPersonsFilter) filters.minPersons = minPersonsFilter;

    const selectedThemes = Array.from(document.querySelectorAll('.theme-filter:checked')).map(cb => cb.value);
    if (selectedThemes.length > 0) filters.themes = selectedThemes;

    const selectedRegimes = Array.from(document.querySelectorAll('.regime-filter:checked')).map(cb => cb.value);
    if (selectedRegimes.length > 0) filters.regimes = selectedRegimes;

    if (sortValue && sortValue !== 'default') filters.sort = sortValue;

    return filters;
}

// ========== CHARGEMENT DES MENUS ==========
async function loadMenus(page = 1) {
    try {
        const filters = getCurrentFilters();
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('perPage', itemsPerPage);

        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
        if (filters.minPersons) params.append('minPersons', filters.minPersons);
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.themes) filters.themes.forEach(t => params.append('themes[]', t));
        if (filters.regimes) filters.regimes.forEach(r => params.append('regimes[]', r));

        const response = await fetch(`${API_BASE}/menu/list?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const json = await response.json();
        const data = json.data ?? json;

        menus = data.menus;
        currentPage = data.page;
        totalPages = data.totalPages;

        updateResultsCount(data.total);

    } catch (error) {
        console.error('Erreur de chargement des menus:', error);
        document.getElementById("menusGrid").innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Erreur lors du chargement des menus. Veillez réessayer.
                </div>
            </div>
        `;
    }
}

// ========== SYNCHRONISATION SLIDER / INPUT MAX PRICE ==========
const maxPriceSlider = document.getElementById("maxPrice");
const maxPriceInputEl = document.getElementById("maxPriceInput");
const maxPriceDisplay = document.getElementById("maxPriceDisplay");

// Quand on bouge le slider → on remplit l'input
maxPriceSlider.addEventListener('input', function() {
    maxPriceDisplay.textContent = this.value + ' €';
    maxPriceInputEl.value = this.value;
});

// Quand on tape dans l'input → on remet le slider à jour (cohérence visuelle)
maxPriceInputEl.addEventListener('input', function() {
    if (this.value) {
        maxPriceSlider.value = this.value;
        maxPriceDisplay.textContent = this.value + ' €';
    }
});

// ========== AFFICHAGE DES MENUS ==========
function displayMenus() {
    const container = document.getElementById("menusGrid");
    container.innerHTML = '';

    if (menus.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="no-results">
                    <i class="bi bi-search"></i>
                    <h3>Aucun menu trouvé</h3>
                    <p>Essayez de modifier vos filtres de recherche</p>
                    <button id="resetFiltersBtn" class="btn btn-primary mt-3">
                        Réinitialiser les filtres
                    </button>
                </div>
            </div>
        `;
        document.getElementById("pagination-container").style.display = "none";
        return;
    }

    menus.forEach(menu => {
        const stockClass = menu.stock < 10 ? 'low' : '';
        const stockIcon = menu.stock < 10 ? 'exclamation-triangle' : 'check-circle';

        const images = menu.images ? menu.images.split(',').map(img => img.trim()) : [];
        const svgPlaceholder = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22200%22%3E%3Crect%20fill%3D%22%236c757d%22%20width%3D%22400%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22white%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%20font-size%3D%2218%22%3EPas%20d%27image%20pour%20ce%20menu%3C%2Ftext%3E%3C%2Fsvg%3E";
        const imagePrincipale = images.length > 0 ? images[0] : svgPlaceholder;

        container.innerHTML += `
            <div class="col-xl-4 col-lg-6 col-md-6">
                <div class="menu-card">
                    <div class="menu-image h-80">
                        <img src="${imagePrincipale}" alt="${menu.titre}"
                            onerror="this.onerror=null; this.src='${svgPlaceholder}'">
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
                                Voir le détail <i class="bi bi-arrow-right"></i>
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

// ========== DÉLÉGATION D'ÉVÉNEMENT POUR LE BOUTON RESET (dans la grille) ==========
document.getElementById("menusGrid").addEventListener("click", (e) => {
    if (e.target.closest("#resetFiltersBtn")) {
        e.preventDefault();
        resetFilters();
    }
});

// -----------------------
// Pagination
// -----------------------
function updatePagination() {
    document.getElementById("page-info").textContent =
        `Page ${currentPage} sur ${totalPages}`;

    document.getElementById("prev-page").disabled = currentPage === 1;
    document.getElementById("next-page").disabled = currentPage === totalPages;
}

document.getElementById("prev-page").addEventListener("click", async () => {
    if (currentPage > 1) {
        await loadMenus(currentPage - 1);
        displayMenus();
    }
});

document.getElementById("next-page").addEventListener("click", async () => {
    if (currentPage < totalPages) {
        await loadMenus(currentPage + 1);
        displayMenus();
    }
});

// ========== FILTRES ==========
const submitButtons = [...document.querySelectorAll("button[type='submit']")];
const resetBtn = submitButtons.find(b => b.textContent.includes("Réinitialiser"));

resetBtn?.addEventListener("click", e => {
    e.preventDefault();
    resetFilters();
});

async function applyFilters() {
    const min = Number(document.getElementById("minPriceInput").value) || 0;
    const max = Number(document.getElementById("maxPriceInput").value) || 1000;

    if (min > max) {
        alert("Le prix minimum ne peut pas dépasser le prix maximum.");
        return;
    }

    await loadMenus(1); // toujours repartir de la page 1 quand on filtre
    displayMenus();
}

// ========== DEBOUNCE (pour éviter trop d'appels API sur les inputs texte/number) ==========
function debounce(fn, delay = 400) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

const debouncedApplyFilters = debounce(applyFilters, 400);

// ========== APPLICATION AUTOMATIQUE DES FILTRES ==========

// Prix min/max (input texte) → debounce car l'utilisateur tape
document.getElementById("minPriceInput").addEventListener("input", debouncedApplyFilters);
document.getElementById("maxPriceInput").addEventListener("input", debouncedApplyFilters);

// Slider prix max → debounce
document.getElementById("maxPrice").addEventListener("input", debouncedApplyFilters);

document.getElementById("minPersonsFilter").addEventListener("change", applyFilters);

document.querySelectorAll('.theme-filter').forEach(cb => {
    cb.addEventListener("change", applyFilters);
});
document.querySelectorAll('.regime-filter').forEach(cb => {
    cb.addEventListener("change", applyFilters);
});

async function resetFilters() {
    document.getElementById("maxPrice").value = 1000;
    document.getElementById("maxPriceDisplay").textContent = '1000 €';
    document.getElementById("minPriceInput").value = 0;
    document.getElementById("maxPriceInput").value = 1000;
    document.getElementById("minPersonsFilter").value = '';

    document.querySelectorAll('.theme-filter').forEach(cb => cb.checked = false);
    document.querySelectorAll('.regime-filter').forEach(cb => cb.checked = false);
    document.getElementById("sortSelect").value = 'default';

    await loadMenus(1);
    displayMenus();
}

// ========== TRI ==========
const sortSelect = document.getElementById("sortSelect");
sortSelect.addEventListener("change", async () => {
    await loadMenus(1); // le tri repart aussi de la page 1
    displayMenus();
});

// ========== COMPTEUR RÉSULTATS ==========
function updateResultsCount(total) {
    document.getElementById("resultsCount").textContent = total;
}