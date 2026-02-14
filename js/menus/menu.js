    // ========== DONNÉES DES MENUS ==========
    const menus = [
        {
            id: 1,
            title: "Menu Festif de Noël",
            theme: "noel",
            description: "Un menu traditionnel pour célébrer Noël en famille avec foie gras, dinde et bûche glacée.",
            price: 350,
            minPersons: 6,
            regime: "classique",
            stock: 15,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Menu+Noel"
        },
        {
            id: 2,
            title: "Brunch de Pâques",
            theme: "paques",
            description: "Un brunch gourmand avec agneau rôti, légumes de printemps et desserts aux chocolats.",
            price: 280,
            minPersons: 4,
            regime: "classique",
            stock: 8,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Menu+Paques"
        },
        {
            id: 3,
            title: "Menu Végétarien Raffiné",
            theme: "classique",
            description: "Un menu 100% végétarien avec légumes bio, quinoa, tartare d'algues et dessert vegan.",
            price: 200,
            minPersons: 4,
            regime: "vegetarien",
            stock: 12,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Menu+Vegetarien"
        },
        {
            id: 4,
            title: "Buffet Cocktail Entreprise",
            theme: "evenement",
            description: "Parfait pour vos événements professionnels avec verrines, canapés et petits fours salés.",
            price: 450,
            minPersons: 15,
            regime: "classique",
            stock: 20,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Buffet+Pro"
        },
        {
            id: 5,
            title: "Menu Gastronomique",
            theme: "classique",
            description: "Expérience culinaire d'exception avec homard, tournedos Rossini et soufflé au Grand Marnier.",
            price: 480,
            minPersons: 4,
            regime: "classique",
            stock: 5,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Gastronomique"
        },
        {
            id: 6,
            title: "Menu Vegan Découverte",
            theme: "classique",
            description: "Cuisine végétale créative et savoureuse, sans produits d'origine animale.",
            price: 220,
            minPersons: 4,
            regime: "vegan",
            stock: 10,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Menu+Vegan"
        },
        {
            id: 7,
            title: "Réveillon du Nouvel An",
            theme: "evenement",
            description: "Menu prestige avec champagne, caviar, homard et dessert flambé pour célébrer l'année.",
            price: 500,
            minPersons: 6,
            regime: "classique",
            stock: 3,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Nouvel+An"
        },
        {
            id: 8,
            title: "Menu Terroir du Sud-Ouest",
            theme: "classique",
            description: "Spécialités régionales : confit de canard, cassoulet, fromages et cannelés.",
            price: 320,
            minPersons: 8,
            regime: "classique",
            stock: 18,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Terroir"
        },
        {
            id: 9,
            title: "Brunch du Dimanche",
            theme: "classique",
            description: "Formule brunch complète avec viennoiseries, œufs, charcuterie et jus frais.",
            price: 180,
            minPersons: 4,
            regime: "classique",
            stock: 25,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Brunch"
        },
        {
            id: 10,
            title: "Menu Poissons & Fruits de mer",
            theme: "classique",
            description: "Plateau de fruits de mer, bar en croûte de sel et tarte citron meringuée.",
            price: 380,
            minPersons: 6,
            regime: "classique",
            stock: 7,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Fruits+Mer"
        },
        {
            id: 11,
            title: "Menu Sans Gluten",
            theme: "classique",
            description: "Menu complet adapté aux intolérances au gluten sans compromis sur le goût.",
            price: 240,
            minPersons: 4,
            regime: "sans-gluten",
            stock: 14,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Sans+Gluten"
        },
        {
            id: 12,
            title: "Barbecue Estival",
            theme: "evenement",
            description: "Grillade de viandes marinées, brochettes, salades composées et desserts glacés.",
            price: 300,
            minPersons: 10,
            regime: "classique",
            stock: 22,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Barbecue"
        },
        {
            id: 13,
            title: "Menu Enfant Anniversaire",
            theme: "evenement",
            description: "Menu ludique pour enfants avec nuggets maison, frites, jus et gâteau personnalisé.",
            price: 150,
            minPersons: 8,
            regime: "classique",
            stock: 30,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Anniversaire"
        },
        {
            id: 14,
            title: "Menu Dégustation 7 Services",
            theme: "evenement",
            description: "Parcours gastronomique en 7 services avec accords mets et vins.",
            price: 420,
            minPersons: 4,
            regime: "classique",
            stock: 6,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Degustation"
        },
        {
            id: 15,
            title: "Pique-nique Champêtre",
            theme: "classique",
            description: "Panier repas avec terrines, salades, fromages, pain frais et desserts.",
            price: 160,
            minPersons: 4,
            regime: "classique",
            stock: 20,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Pique-nique"
        },
        {
            id: 16,
            title: "Menu Saint-Valentin",
            theme: "evenement",
            description: "Dîner romantique pour deux avec champagne, homard et dessert au chocolat.",
            price: 200,
            minPersons: 4,
            regime: "classique",
            stock: 4,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Saint-Valentin"
        },
        {
            id: 17,
            title: "Plateau Apéritif Dinatoire",
            theme: "evenement",
            description: "Assortiment de 40 pièces salées variées pour vos soirées apéritives.",
            price: 280,
            minPersons: 10,
            regime: "classique",
            stock: 16,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Aperitif"
        },
        {
            id: 18,
            title: "Menu Asiatique Fusion",
            theme: "classique",
            description: "Cuisine fusion franco-asiatique avec sushis, wok de légumes et dessert yuzu.",
            price: 260,
            minPersons: 6,
            regime: "classique",
            stock: 11,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Asiatique"
        },
        {
            id: 19,
            title: "Brunch Végétarien Bio",
            theme: "classique",
            description: "Brunch 100% bio et végétarien avec produits locaux et de saison.",
            price: 190,
            minPersons: 4,
            regime: "vegetarien",
            stock: 13,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Brunch+Bio"
        },
        {
            id: 20,
            title: "Menu Indien Épicé",
            theme: "classique",
            description: "Voyage culinaire avec curry, tandoori, naans et desserts aux épices douces.",
            price: 230,
            minPersons: 6,
            regime: "classique",
            stock: 9,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Menu+Indien"
        },
        {
            id: 21,
            title: "Soirée Raclette Montagnarde",
            theme: "classique",
            description: "Charcuterie, fromages à raclette, pommes de terre et accompagnements.",
            price: 210,
            minPersons: 8,
            regime: "classique",
            stock: 17,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Raclette"
        },
        {
            id: 22,
            title: "Menu Halloween Terrifiant",
            theme: "evenement",
            description: "Menu thématique avec présentation effrayante et saveurs surprenantes.",
            price: 240,
            minPersons: 6,
            regime: "classique",
            stock: 8,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Halloween"
        },
        {
            id: 23,
            title: "Formule Déjeuner Express",
            theme: "classique",
            description: "Menu rapide et équilibré pour déjeuner d'affaires : entrée, plat, dessert.",
            price: 140,
            minPersons: 4,
            regime: "classique",
            stock: 28,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Dejeuner+Express"
        },
        {
            id: 24,
            title: "Menu Fête des Mères",
            theme: "evenement",
            description: "Menu délicat et raffiné pour célébrer les mamans avec champagne et douceurs.",
            price: 270,
            minPersons: 4,
            regime: "classique",
            stock: 12,
            image: "https://placehold.co/400x250/34495e/d4af37?text=Fete+Meres"
        }
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
        container.innerHTML = '';
        if (filteredMenus.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="no-results">
                        <i class="bi bi-search"></i>
                        <h4>Aucun menu trouvé</h4>
                        <p>Essayez de modifier vos filtres de recherche</p>
                        <button class="btn btn-primary mt-3" onclick="resetFilters()">
                            Réinitialiser les filtres
                        </button>
                    </div>
                </div>
            `;
            document.getElementById("pagination").innerHTML = '';
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
        console.log("On est ici : function applyFilters")
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