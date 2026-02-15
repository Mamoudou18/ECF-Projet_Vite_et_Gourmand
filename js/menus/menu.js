    // ========== DONNÉES DES MENUS ==========
    const menus = [
    { id: 1,  title: "Féérie de Noël",            theme: "noel",                 description: "Un menu festif aux saveurs traditionnelles pour célébrer Noël avec élégance.",                      price: 29.90, minPersons: 10, regime: "classique",   stock: 20, image: "images/pexels-alexanderafan-28446157.jpg" },
    { id: 2,  title: "Hiver Gourmand",            theme: "noel",                 description: "Recettes chaleureuses et épicées, adaptées aux régimes halal.",                                     price: 32.50, minPersons: 10, regime: "hallal",       stock: 18, image: "images/pexels-boryslav-19870149.jpg" },
    { id: 3,  title: "Noël Végétal",              theme: "noel",                 description: "Une composition végétale raffinée pour un Noël léger.",                                             price: 27.90, minPersons: 8,  regime: "vegetarien",  stock: 25, image: "images/pexels-bemistermister-3490368.jpg" },
    { id: 4,  title: "Étoile Vegan",              theme: "noel",                 description: "Un Noël 100% végétal aux parfums doux‑épicés.",                                                     price: 28.50, minPersons: 8,  regime: "vegan",       stock: 22, image: "images/pexels-christopher-welsch-leveroni-2150186467-31987728.jpg" },
    { id: 5,  title: "Réveillon Prestige",        theme: "noel",                 description: "Un menu festif et raffiné pour un réveillon d’exception.",                                          price: 39.90, minPersons: 12, regime: "classique",   stock: 15, image: "images/pexels-collab-media-173741945-15059689.jpg" },
    { id: 6,  title: "Pâques Tradition",          theme: "paques",               description: "Un menu printanier aux saveurs emblématiques de Pâques.",                                           price: 28.90, minPersons: 10, regime: "classique",   stock: 20, image: "images/pexels-cottonbro-7243891.jpg" },
    { id: 7,  title: "Primeurs de Printemps",     theme: "paques",               description: "Un menu végétal mettant en avant les légumes de printemps.",                                        price: 26.50, minPersons: 8,  regime: "vegetarien",  stock: 22, image: "images/pexels-fox-58267-1320917.jpg" },
    { id: 8,  title: "Pâques Halal",              theme: "paques",               description: "Un menu savoureux respectant les exigences halal.",                                                 price: 27.90, minPersons: 10, regime: "hallal",       stock: 18, image: "images/pexels-alexanderafan-28446157.jpg" },
    { id: 9,  title: "Pâques Vegan",              theme: "paques",               description: "Un menu végétal frais et coloré pour Pâques.",                                                      price: 25.50, minPersons: 8,  regime: "vegan",       stock: 20, image: "images/pexels-boryslav-19870149.jpg" },
    { id: 10, title: "Printemps Chic",            theme: "paques",               description: "Un menu élégant mêlant poisson, agrumes et douceur fruitée.",                                       price: 30.90, minPersons: 10, regime: "classique",   stock: 18, image: "images/pexels-bemistermister-3490368.jpg" },

    { id: 11, title: "Brasserie Chic",            theme: "classique",            description: "Des recettes françaises revisitées dans un style raffiné.",                                         price: 27.50, minPersons: 8,  regime: "classique",   stock: 25, image: "images/pexels-christopher-welsch-leveroni-2150186467-31987728.jpg" },
    { id: 12, title: "Saveurs du Marché",         theme: "classique",            description: "Un menu authentique basé sur la fraîcheur du marché.",                                              price: 23.90, minPersons: 6,  regime: "classique",   stock: 32, image: "images/pexels-collab-media-173741945-15059689.jpg" },
    { id: 13, title: "Terre & Mer",               theme: "classique",            description: "Une alliance élégante entre la fraîcheur marine et une viande tendre.",                             price: 29.50, minPersons: 10, regime: "classique",   stock: 20, image: "images/pexels-cottonbro-7243891.jpg" },
    { id: 14, title: "Végétarien Gourmet",        theme: "classique",            description: "Un menu végétarien raffiné mettant en valeur le goût naturel des légumes.",                         price: 25.90, minPersons: 6,  regime: "vegetarien",  stock: 28, image: "images/pexels-fox-58267-1320917.jpg" },
    { id: 15, title: "Vegan Essentiel",           theme: "classique",            description: "Un menu 100% végétal, gourmand et équilibré.",                                                      price: 23.50, minPersons: 6,  regime: "vegan",       stock: 30, image: "images/pexels-alexanderafan-28446157.jpg" },
    { id: 16, title: "Halal Tradition",           theme: "classique",            description: "Des recettes savoureuses respectant scrupuleusement le régime halal.",                              price: 24.90, minPersons: 8,  regime: "hallal",       stock: 24, image: "images/pexels-boryslav-19870149.jpg" },
    { id: 17, title: "Sans-Gluten Délice",        theme: "classique",            description: "Un menu gourmand conçu pour éviter le gluten sans compromis sur le goût.",                          price: 26.90, minPersons: 6,  regime: "sans-gluten", stock: 26, image: "images/pexels-bemistermister-3490368.jpg" },
    { id: 18, title: "Sans-Porc Élégance",        theme: "classique",            description: "Un menu soigné et savoureux garanti sans aucune présence de porc.",                                 price: 25.50, minPersons: 8,  regime: "sans-gluten",   stock: 22, image: "images/pexels-christopher-welsch-leveroni-2150186467-31987728.jpg" },
    { id: 19, title: "Business Premium",          theme: "evenement",            description: "Un menu élégant et rapide à servir, conçu pour les événements d'entreprise.",                       price: 28.90, minPersons: 10, regime: "classique",   stock: 20, image: "images/pexels-collab-media-173741945-15059689.jpg" },
    { id: 20, title: "Business Vegan",            theme: "evenement",            description: "Un menu professionnel 100% végétal, équilibré et moderne.",                                         price: 24.90, minPersons: 10, regime: "vegan",       stock: 20, image: "images/pexels-cottonbro-7243891.jpg" },

    { id: 21, title: "Mariage Signature",         theme: "evenement",            description: "Un menu de mariage raffiné offrant une expérience culinaire mémorable.",                            price: 42.90, minPersons: 20, regime: "classique",   stock: 10, image: "images/pexels-fox-58267-1320917.jpg" },
    { id: 22, title: "Mariage Prestige Poisson",  theme: "evenement",            description: "Un menu marin noble pensé pour les grandes réceptions de mariage.",                                 price: 45.90, minPersons: 20, regime: "classique",   stock: 12, image: "images/pexels-alexanderafan-28446157.jpg" },
    { id: 23, title: "Mariage Vegan Élégance",    theme: "evenement",            description: "Un menu de mariage 100% végétal parfaitement équilibré.",                                           price: 39.50, minPersons: 20, regime: "vegan",       stock: 14, image: "images/pexels-boryslav-19870149.jpg" },
    { id: 24, title: "Baptême Douceur",           theme: "evenement",            description: "Un menu tendre et gourmand pour célébrer un baptême en douceur.",                                   price: 24.90, minPersons: 10, regime: "classique",   stock: 18, image: "images/pexels-bemistermister-3490368.jpg" },
    { id: 25, title: "Baptême Tradition",         theme: "evenement",            description: "Une cuisine familiale inspirée des repas traditionnels de célébration.",                            price: 23.50, minPersons: 10, regime: "classique",   stock: 20, image: "images/pexels-christopher-welsch-leveroni-2150186467-31987728.jpg" },
    { id: 26, title: "Cocktail Classique",        theme: "evenement",            description: "Un assortiment varié, élégant et pratique pour vos cocktails et réceptions.",                       price: 22.90, minPersons: 15, regime: "classique",   stock: 25, image: "images/pexels-collab-media-173741945-15059689.jpg" },
    { id: 27, title: "Cocktail Vegan",            theme: "evenement",            description: "Un assortiment entièrement vegan, frais, coloré et moderne pour vos réceptions.",                   price: 21.50, minPersons: 15, regime: "vegan",       stock: 26, image: "images/pexels-cottonbro-7243891.jpg" },
    { id: 28, title: "Événement Entreprise",      theme: "evenement",            description: "Un menu construit pour les événements d’entreprise : efficace, gourmand et rapide à servir.",       price: 27.50, minPersons: 10, regime: "classique",   stock: 24, image: "images/pexels-fox-58267-1320917.jpg" },
    { id: 29, title: "Banquet Tradition",         theme: "evenement",            description: "Un menu généreux idéal pour les grandes tablées et repas familiaux.",                               price: 25.90, minPersons: 12, regime: "classique",   stock: 18, image: "images/pexels-alexanderafan-28446157.jpg" },
    { id: 30, title: "Gala Prestige",             theme: "evenement",            description: "Un menu haut de gamme conçu pour les soirées prestigieuses et réceptions de gala.",                 price: 48.90, minPersons: 20, regime: "classique",   stock: 14, image: "images/pexels-boryslav-19870149.jpg" }
    ];

    // ========== VARIABLES GLOBALES ==========
    let filteredMenus = [...menus];
    let currentPage = 1;
    const itemsPerPage = 12;

    // ========== INITIALISATION ==========
        displayMenus();
        updateResultsCount();

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
            document.getElementById("pagination").innerHTML = '';
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

            container.innerHTML += `
                <div class="col-xl-4 col-lg-6 col-md-6">
                    <div class="menu-card">
                        <div class="menu-image">
                            <img src="${menu.image}" alt="${menu.title}">
                            <div class="menu-badge">${menu.theme.charAt(0).toUpperCase() + menu.theme.slice(1)}</div>
                            <div class="menu-stock ${stockClass}">
                                <i class="bi bi-${stockIcon}"></i>
                                ${menu.stock} dispo.
                            </div>
                        </div>
                        <div class="menu-body">
                            <h3 class="menu-title">${menu.title}</h3>
                            <span class="menu-theme">${menu.regime.charAt(0).toUpperCase() + menu.regime.slice(1)}</span>
                            <p class="menu-description">${menu.description}</p>
                            <div class="menu-details">
                                <div class="menu-detail-item">
                                    <i class="bi bi-people-fill"></i>
                                    <span>Min. ${menu.minPersons} pers.</span>
                                </div>
                            </div>
                            <div class="menu-footer">
                                <div class="menu-price">
                                    <span class="menu-price-label">À partir de</span>
                                    <span class="menu-price-value">${menu.price} €</span>
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
        updatePagination()
    }

    // -----------------------
    // Pagination
    // -----------------------
    function updatePagination() {
        const totalPages = Math.ceil(filteredMenus.length / itemsPerPage);
        console.log(currentPage);
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
            m.price <= maxPrice && 
            m.price >= minPriceInput && 
            m.price <= maxPriceInput
        );

        // Thèmes
        const selectedThemes = Array.from(document.querySelectorAll('.theme-filter:checked')).map(cb => cb.value);
        if (selectedThemes.length > 0) {
            filteredMenus = filteredMenus.filter(m => selectedThemes.includes(m.theme));
        }

        // Régimes
        const selectedRegimes = Array.from(document.querySelectorAll('.regime-filter:checked')).map(cb => cb.value);
        if (selectedRegimes.length > 0) {
            filteredMenus = filteredMenus.filter(m => selectedRegimes.includes(m.regime));
        }

        // Nombre de personnes
        const minPersonsFilter = document.getElementById('minPersonsFilter').value;
        if (minPersonsFilter) {
            filteredMenus = filteredMenus.filter(m => m.minPersons >= parseInt(minPersonsFilter));
        }

        currentPage = 1;
        displayMenus();
        updateResultsCount();
    }

    function resetFilters() {
        // Réinitialiser tous les champs
        document.getElementById("maxPrice").value = 500;
        document.getElementById("maxPriceDisplay").textContent = '500 €';
        document.getElementById("minPriceInput").value = 0;
        document.getElementById("maxPriceInput").value = 500;
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
        updateResultsCount();
        
        const sortValue = document.getElementById("sortSelect").value;
        switch(sortValue) {
            case 'price-asc':
                filteredMenus.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filteredMenus.sort((a, b) => b.price - a.price);
                break;
            case 'persons-asc':
                filteredMenus.sort((a, b) => a.minPersons - b.minPersons);
                break;
            case 'persons-desc':
                filteredMenus.sort((a, b) => b.minPersons - a.minPersons);
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