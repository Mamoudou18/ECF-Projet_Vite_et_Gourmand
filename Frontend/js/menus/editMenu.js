const btnAjouterMenu = document.getElementById("btnAjouterMenu");
const btnSave = document.getElementById("btnSave");
const themeSelect = document.getElementById("themeSelect");

btnAjouterMenu.addEventListener("click", ajouterMenu);
btnSave.addEventListener("click", enregistrer);

// ───────────────────────────────────────────
// AJOUTER UN MENU
// ───────────────────────────────────────────
function ajouterMenu() {
    const menuDiv = document.createElement("div");
    menuDiv.className = "menu card mb-4 shadow-sm";
    menuDiv.innerHTML = `
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="bi bi-journal-richtext"></i> Menu</h5>
            <button type="button" class="btn btn-sm btn-light btnSupprimerMenu">
                <i class="bi bi-trash-fill"></i> Supprimer le menu
            </button>
        </div>
        <div class="card-body">

            <div class="mb-3">
                <label class="form-label"><i class="bi bi-fonts"></i> Titre</label>
                <input type="text" class="titreMenu form-control" placeholder="Titre du menu">
            </div>

            <div class="mb-3">
                <label class="form-label"><i class="bi bi-text-left"></i> Description</label>
                <textarea class="description form-control" rows="2" placeholder="Description du menu"></textarea>
            </div>

            <div class="mb-3">
                <label class="form-label"><i class="bi bi-info-circle-fill"></i> Conditions</label>
                <textarea class="condition form-control" rows="2" placeholder="Conditions du menu"></textarea>
            </div>

            <div class="row mb-3">
                <div class="col-12 col-lg-4 mb-3">
                    <label class="form-label"><i class="bi bi-box-seam-fill"></i> Stock</label>
                    <input type="number" class="stock form-control" min="0" placeholder="0">
                </div>
                <div class="col-12 col-lg-4 mb-3">
                    <label class="form-label"><i class="bi bi-currency-euro"></i> Prix de base</label>
                    <input type="number" step="0.01" class="prix form-control" placeholder="0.00 €">
                </div>
                <div class="col-12 col-lg-4 mb-3">
                    <label class="form-label"><i class="bi bi-people-fill"></i> Nb personnes minimum</label>
                    <input type="number" class="nbPersonnes form-control" min="1" placeholder="1">
                </div>
            </div>

            <!-- Conteneur des plats -->
            <div class="plats"></div>

            <div class="mb-3">
                <label class="form-label"><i class="bi bi-images"></i> Images du menu</label>
                <div class="row g-3">

                    <div class="col-12 col-lg-6">
                        <label class="form-label">Image principale</label>
                        <input type="file" class="form-control imgPrincipale" accept="image/*">
                        <img class="previewImgPrincipale mt-2 img-fluid rounded d-none" alt="Aperçu image principale">
                    </div>

                    <div class="col-12 col-lg-6">
                        <label class="form-label">Image entrée</label>
                        <input type="file" class="form-control imgEntree" accept="image/*">
                        <img class="previewImgEntree mt-2 img-fluid rounded d-none" alt="Aperçu image entrée">
                    </div>

                    <div class="col-12 col-lg-6">
                        <label class="form-label">Image plat</label>
                        <input type="file" class="form-control imgPlat" accept="image/*">
                        <img class="previewImgPlat mt-2 img-fluid rounded d-none" alt="Aperçu image plat">
                    </div>

                    <div class="col-12 col-lg-6">
                        <label class="form-label">Image dessert</label>
                        <input type="file" class="form-control imgDessert" accept="image/*">
                        <img class="previewImgDessert mt-2 img-fluid rounded d-none" alt="Aperçu image dessert">
                    </div>

                </div>
            </div>

            <button type="button" class="btn btn-register w-100 btnAjouterPlat mt-2">
                <i class="bi bi-plus-circle-fill"></i> Ajouter un plat
            </button>

        </div>
    `;

    // Écouteurs
    menuDiv.querySelector('.btnSupprimerMenu').addEventListener('click', () => menuDiv.remove());
    menuDiv.querySelector('.btnAjouterPlat').addEventListener('click', () => ajouterPlat(menuDiv));

    // Activer les prévisualisations d'images
    activerPrevisualisations(menuDiv);
    document.getElementById("menusContainer").appendChild(menuDiv);

    // Ajouter automatiquement un premier plat
    ajouterPlat(menuDiv);
}

// ───────────────────────────────────────────
// AJOUTER UN PLAT
// ───────────────────────────────────────────
function ajouterPlat(menuDiv) {
    const platDiv = document.createElement("div");
    platDiv.className = "plat card mb-3 border border-primary";
    platDiv.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <span><i class="bi bi-egg-fried"></i> Plat</span>
            <button type="button" class="btn btn-sm btn-outline-danger btnSupprimerPlat">
                <i class="bi bi-x-lg"></i> Supprimer
            </button>
        </div>
        <div class="card-body">

            <div class="mb-3">
                <label class="form-label"><i class="bi bi-arrow-right-circle"></i> Entrée</label>
                <input type="text" class="entree form-control" placeholder="Entrée">
            </div>

            <div class="mb-3">
                <label class="form-label"><i class="bi bi-fire"></i> Plat</label>
                <input type="text" class="platNom form-control" placeholder="Plat principal">
            </div>

            <div class="mb-3">
                <label class="form-label"><i class="bi bi-cup-straw"></i> Dessert</label>
                <input type="text" class="dessert form-control" placeholder="Dessert">
            </div>

            <div class="mb-3">
                <label class="form-label"><i class="bi bi-heart-fill"></i> Régimes</label>
                <select multiple class="regimes form-select">
                    <option value="classique">Classique</option>
                    <option value="vegetarien">Végétarien</option>
                    <option value="vegan">Vegan</option>
                    <option value="sans-gluten">Sans gluten</option>
                    <option value="hallal">Hallal</option>
                </select>
                <small class="text-muted">Maintenez Ctrl pour sélectionner plusieurs régimes</small>
            </div>

            <!-- Allergènes -->
            <div class="mb-3">
                <label class="form-label"><i class="bi bi-exclamation-triangle-fill text-warning"></i> Allergènes</label>
                <div class="input-group mb-2">
                    <input type="text" class="allergeneInput form-control mb-2" placeholder="Ex: Gluten, Lait, Œufs...">
                    <button type="button" class="btn btn-register btnAjouterAllergene">
                        <i class="bi bi-plus-lg"></i> Ajouter
                    </button>
                </div>
                <!-- Les badges apparaissent ici -->
                <div class="allergenes-liste d-flex flex-wrap gap-2"></div>
            </div>

        </div>
    `;

    // Supprimer le plat
    platDiv.querySelector('.btnSupprimerPlat').addEventListener('click', () => platDiv.remove());

    // Ajouter un allergène
    const allergeneInput = platDiv.querySelector('.allergeneInput');
    const allergeneBtn = platDiv.querySelector('.btnAjouterAllergene');
    const allergenesList = platDiv.querySelector('.allergenes-liste');

    function ajouterAllergene() {
        const valeur = allergeneInput.value.trim();
        if (!valeur) return;

        // Créer le badge
        const badge = document.createElement('span');
        badge.className = 'badge bg-warning text-dark d-flex align-items-center gap-1';
        badge.innerHTML = `
            <i class="bi bi-exclamation-circle-fill"></i>
            ${valeur}
            <span class="btnRetirerAllergene" style="cursor:pointer">
                <i class="bi bi-x-lg"></i>
            </span>
        `;
        badge.dataset.valeur = valeur;

        // Supprimer le badge au clic
        badge.querySelector('.btnRetirerAllergene').addEventListener('click', () => badge.remove());

        allergenesList.appendChild(badge);
        allergeneInput.value = '';
        allergeneInput.focus();
    }

    // Ajouter via bouton
    allergeneBtn.addEventListener('click', ajouterAllergene);

    // ✅ Ajouter via touche Entrée
    allergeneInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            ajouterAllergene();
        }
    });

    menuDiv.querySelector('.plats').appendChild(platDiv);
}

//----------------------------------------------
// Prévisualisation images
//-----------------------------------------------
function activerPrevisualisations(menuDiv) {
    const images = [
        { input: '.imgPrincipale', preview: '.previewImgPrincipale' },
        { input: '.imgEntree',     preview: '.previewImgEntree'     },
        { input: '.imgPlat',       preview: '.previewImgPlat'       },
        { input: '.imgDessert',    preview: '.previewImgDessert'    },
    ];

    images.forEach(({ input, preview }) => {
        const inputEl = menuDiv.querySelector(input);
        const previewEl = menuDiv.querySelector(preview);

        inputEl.addEventListener('change', () => {
            const file = inputEl.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                previewEl.src = e.target.result;
                previewEl.classList.remove('d-none');
            };
            reader.readAsDataURL(file);
        });
    });
}


// ───────────────────────────────────────────
// ENREGISTRER
// ───────────────────────────────────────────
function enregistrer() {
    const theme = themeSelect.value;
    const themeIdMap = { noel: 1, paques: 2, classique: 3, evenement: 4 };
    const themeId = themeIdMap[theme];

    const menusToSave = [];

    document.querySelectorAll("#menusContainer .menu").forEach(menu => {
        const titre = menu.querySelector(".titreMenu")?.value.trim();
        const description = menu.querySelector(".description")?.value.trim();
        const condition = menu.querySelector(".condition")?.value.trim();
        const stock = parseInt(menu.querySelector(".stock")?.value) || 0;
        const prix = parseFloat(menu.querySelector(".prix")?.value) || 0;
        const nbPersonnes = parseInt(menu.querySelector(".nbPersonnes")?.value) || 1;
        const images = {
            principale : menu.querySelector(".imgPrincipale")?.files[0] || null,
            entree     : menu.querySelector(".imgEntree")?.files[0]     || null,
            plat       : menu.querySelector(".imgPlat")?.files[0]       || null,
            dessert    : menu.querySelector(".imgDessert")?.files[0]    || null,
        };

        const plats = [];
        const regimes = new Set();
        const regimeIdMap = { classique: 1, vegetarien: 2, vegan: 3, "sans-gluten": 4, hallal: 5 };

        menu.querySelectorAll(".plat").forEach(p => {
            const entree = p.querySelector(".entree")?.value.trim();
            const platNom = p.querySelector(".platNom")?.value.trim();
            const dessert = p.querySelector(".dessert")?.value.trim();
            const allergenes = [];
            p.querySelectorAll(".allergenes-liste .badge").forEach(badge => {
                allergenes.push(badge.dataset.valeur);
            });

            plats.push({ entree, plat: platNom, dessert, allergenes });

            p.querySelectorAll(".regimes option:checked").forEach(opt => {
                const value = opt.value;
                regimes.add(regimeIdMap[value] ?? 1);
            });
        });

        menusToSave.push({
            menu: { titre, description, condition, stock, prix, nbPersonnes },
            themeId,
            plats,
            regimeIds: Array.from(regimes),
            images
        });
    });

    console.log("Données prêtes pour insertion :", menusToSave);
    alert("Prêt à envoyer les données au serveur !");
}
