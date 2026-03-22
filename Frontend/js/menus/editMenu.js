import { showError, showSuccess } from "../utils/util.js";

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
            <h5 class="mb-0 btnToggleMenu" style="cursor:pointer">
                <i class="bi bi-journal-richtext"></i> Menu
                <i class="bi bi-chevron-up ms-2 iconToggleMenu"></i>
            </h5>
            <button type="button" class="btn btn-sm btn-light btnSupprimerMenu">
                <i class="bi bi-trash-fill"></i> Supprimer le menu
            </button>
        </div>
        <div class="card-body corpsMenu">

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

            <!-- RÉGIMES -->
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

            <!-- Conteneur des plats -->
            <div class="plats"></div>

            <div class="mb-3">
                <label class="form-label"><i class="bi bi-images"></i> Image principale du menu</label>
                <input type="file" class="form-control imgPrincipale" accept="image/*">
                <img class="previewImgPrincipale mt-2 img-fluid rounded d-none" alt="Aperçu image principale">
            </div>

            <button type="button" class="btn btn-register w-100 btnAjouterPlat mt-2">
                <i class="bi bi-plus-circle-fill"></i> Ajouter un plat
            </button>

        </div>
    `;

    // Toggle menu
    menuDiv.querySelector('.btnToggleMenu').addEventListener('click', () => {
        const corps = menuDiv.querySelector('.corpsMenu');
        const icon  = menuDiv.querySelector('.iconToggleMenu');
        const ouvert = !corps.classList.contains('d-none');
        corps.classList.toggle('d-none', ouvert);
        icon.classList.toggle('bi-chevron-up', !ouvert);
        icon.classList.toggle('bi-chevron-down', ouvert);
    });

    menuDiv.querySelector('.btnSupprimerMenu').addEventListener('click', () => menuDiv.remove());
    menuDiv.querySelector('.btnAjouterPlat').addEventListener('click', () => ajouterPlat(menuDiv));

    activerPrevisualisations(menuDiv);
    document.getElementById("menusContainer").appendChild(menuDiv);
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
            <span class="btnTogglePlat" style="cursor:pointer">
                <i class="bi bi-egg-fried"></i> Plat
                <i class="bi bi-chevron-up ms-2 iconTogglePlat"></i>
            </span>
            <button type="button" class="btn btn-sm btn-outline-danger btnSupprimerPlat">
                <i class="bi bi-x-lg"></i> Supprimer
            </button>
        </div>
        <div class="card-body corpsPlat">

            <!-- ENTRÉE -->
            <div class="card mb-3 border border-secondary section-entree">
                <div class="card-header"><i class="bi bi-arrow-right-circle"></i> Entrée</div>
                <div class="card-body">
                    <input type="text" class="entree-nom form-control mb-2" placeholder="Nom de l'entrée">
                    <textarea class="entree-desc form-control mb-2" rows="1" placeholder="Description"></textarea>
                    <div class="input-group mb-2">
                        <input type="text" class="allergeneInput form-control mb-2 rounded" placeholder="Allergène...">
                        <button type="button" class="btn btn-register rounded btnAjouterAllergene">
                            <i class="bi bi-plus-lg"></i>
                        </button>
                    </div>
                    <div class="allergenes-liste d-flex flex-wrap gap-2 mb-2"></div>
                    <label class="form-label"><i class="bi bi-image"></i> Image entrée</label>
                    <input type="file" class="form-control imgEntreePlat" accept="image/*">
                    <img class="previewImgEntreePlat mt-2 img-fluid rounded d-none" alt="Aperçu entrée">
                </div>
            </div>

            <!-- PLAT PRINCIPAL -->
            <div class="card mb-3 border border-secondary section-plat">
                <div class="card-header"><i class="bi bi-fire"></i> Plat principal</div>
                <div class="card-body">
                    <input type="text" class="plat-nom form-control mb-2" placeholder="Nom du plat">
                    <textarea class="plat-desc form-control mb-2" rows="1" placeholder="Description"></textarea>
                    <div class="input-group mb-2">
                        <input type="text" class="allergeneInput form-control mb-2 rounded" placeholder="Allergène...">
                        <button type="button" class="btn btn-register rounded btnAjouterAllergene">
                            <i class="bi bi-plus-lg"></i>
                        </button>
                    </div>
                    <div class="allergenes-liste d-flex flex-wrap gap-2 mb-2"></div>
                    <label class="form-label"><i class="bi bi-image"></i> Image plat</label>
                    <input type="file" class="form-control imgPlatPlat" accept="image/*">
                    <img class="previewImgPlatPlat mt-2 img-fluid rounded d-none" alt="Aperçu plat">
                </div>
            </div>

            <!-- DESSERT -->
            <div class="card mb-3 border border-secondary section-dessert">
                <div class="card-header"><i class="bi bi-cup-straw"></i> Dessert</div>
                <div class="card-body">
                    <input type="text" class="dessert-nom form-control mb-2" placeholder="Nom du dessert">
                    <textarea class="dessert-desc form-control mb-2" rows="1" placeholder="Description"></textarea>
                    <div class="input-group mb-2">
                        <input type="text" class="allergeneInput form-control mb-2 rounded" placeholder="Allergène...">
                        <button type="button" class="btn btn-register rounded btnAjouterAllergene">
                            <i class="bi bi-plus-lg"></i>
                        </button>
                    </div>
                    <div class="allergenes-liste d-flex flex-wrap gap-2 mb-2"></div>
                    <label class="form-label"><i class="bi bi-image"></i> Image dessert</label>
                    <input type="file" class="form-control imgDessertPlat" accept="image/*">
                    <img class="previewImgDessertPlat mt-2 img-fluid rounded d-none" alt="Aperçu dessert">
                </div>
            </div>

        </div>
    `;

    // Toggle plat
    platDiv.querySelector('.btnTogglePlat').addEventListener('click', () => {
        const corps = platDiv.querySelector('.corpsPlat');
        const icon  = platDiv.querySelector('.iconTogglePlat');
        const ouvert = !corps.classList.contains('d-none');
        corps.classList.toggle('d-none', ouvert);
        icon.classList.toggle('bi-chevron-up', !ouvert);
        icon.classList.toggle('bi-chevron-down', ouvert);
    });

    // Supprimer le plat
    platDiv.querySelector('.btnSupprimerPlat').addEventListener('click', () => platDiv.remove());

    // Allergènes pour chaque sous-section
    platDiv.querySelectorAll('.card.border-secondary').forEach(section => {
        const input = section.querySelector('.allergeneInput');
        const btn   = section.querySelector('.btnAjouterAllergene');
        const liste = section.querySelector('.allergenes-liste');

        function ajouterAllergene() {
            const valeur = input.value.trim();
            if (!valeur) return;

            const badge = document.createElement('span');
            badge.className = 'badge bg-warning text-dark d-flex align-items-center gap-1';
            badge.dataset.valeur = valeur;
            badge.innerHTML = `
                <i class="bi bi-exclamation-circle-fill"></i>
                ${valeur}
                <span class="btnRetirerAllergene" style="cursor:pointer">
                    <i class="bi bi-x-lg"></i>
                </span>
            `;
            badge.querySelector('.btnRetirerAllergene').addEventListener('click', () => badge.remove());
            liste.appendChild(badge);
            input.value = '';
            input.focus();
        }

        btn.addEventListener('click', ajouterAllergene);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); ajouterAllergene(); }
        });
    });

    // Prévisualisations images dans le plat
    activerPrevisualisationsPlat(platDiv);

    menuDiv.querySelector('.plats').appendChild(platDiv);
}

// ───────────────────────────────────────────
// PRÉVISUALISATIONS
// ───────────────────────────────────────────
function activerPrevisualisations(menuDiv) {
    const inputEl   = menuDiv.querySelector('.imgPrincipale');
    const previewEl = menuDiv.querySelector('.previewImgPrincipale');
    inputEl.addEventListener('change', () => {
        const file = inputEl.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            previewEl.src = e.target.result;
            previewEl.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    });
}

function activerPrevisualisationsPlat(platDiv) {
    const config = [
        { input: '.imgEntreePlat',  preview: '.previewImgEntreePlat'  },
        { input: '.imgPlatPlat',    preview: '.previewImgPlatPlat'    },
        { input: '.imgDessertPlat', preview: '.previewImgDessertPlat' },
    ];
    config.forEach(({ input, preview }) => {
        const inputEl   = platDiv.querySelector(input);
        const previewEl = platDiv.querySelector(preview);
        if (!inputEl || !previewEl) return;
        inputEl.addEventListener('change', () => {
            const file = inputEl.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
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

    const promises = [];

    document.querySelectorAll("#menusContainer .menu").forEach(menu => {
        const titre            = menu.querySelector(".titreMenu")?.value.trim();
        const description      = menu.querySelector(".description")?.value.trim();
        const conditions       = menu.querySelector(".condition")?.value.trim();
        const stock            = parseInt(menu.querySelector(".stock")?.value) || 0;
        const prix_base        = parseFloat(menu.querySelector(".prix")?.value) || 0;
        const nb_personnes_min = parseInt(menu.querySelector(".nbPersonnes")?.value) || 1;

        const images = {
            principale: menu.querySelector(".imgPrincipale")?.files[0] || null,
        };

        const plats = [];
        const regimes = new Set();
        const regimeIdMap = { classique: 1, vegetarien: 2, vegan: 3, "sans-gluten": 4, hallal: 5 };

        // ── Régimes au niveau du menu ──
        menu.querySelectorAll(".regimes option:checked").forEach(opt => {
            regimes.add(regimeIdMap[opt.value] ?? 1);
        });

        menu.querySelectorAll(".plat").forEach((p, index) => {
            const allergenes = (section) => {
                const arr = [];
                section.querySelectorAll('.allergenes-liste .badge').forEach(b => arr.push(b.dataset.valeur));
                return arr;
            };

            const entreeSection  = p.querySelector('.section-entree');
            const platSection    = p.querySelector('.section-plat');
            const dessertSection = p.querySelector('.section-dessert');

            plats.push({
                entree:  { nom: entreeSection.querySelector('.entree-nom').value.trim(),   description: entreeSection.querySelector('.entree-desc').value.trim(),   allergenes: allergenes(entreeSection)  },
                plat:    { nom: platSection.querySelector('.plat-nom').value.trim(),       description: platSection.querySelector('.plat-desc').value.trim(),       allergenes: allergenes(platSection)    },
                dessert: { nom: dessertSection.querySelector('.dessert-nom').value.trim(), description: dessertSection.querySelector('.dessert-desc').value.trim(), allergenes: allergenes(dessertSection) },
            });

            // Images par plat
            const imgEntree  = entreeSection.querySelector('.imgEntreePlat')?.files[0]   || null;
            const imgPlat    = platSection.querySelector('.imgPlatPlat')?.files[0]       || null;
            const imgDessert = dessertSection.querySelector('.imgDessertPlat')?.files[0] || null;

            if (imgEntree)  images[`img_entree_${index}`]  = imgEntree;
            if (imgPlat)    images[`img_plat_${index}`]    = imgPlat;
            if (imgDessert) images[`img_dessert_${index}`] = imgDessert;
        });

        // Construction du FormData
        const fd = new FormData();
        fd.append('titre',            titre);
        fd.append('description',      description);
        fd.append('conditions',       conditions);
        fd.append('stock',            stock);
        fd.append('prix_base',        prix_base);
        fd.append('nb_personnes_min', nb_personnes_min);
        fd.append('theme_id',         themeId);
        fd.append('regime_ids',       JSON.stringify(Array.from(regimes)));
        fd.append('plats',            JSON.stringify(plats));

        if (images.principale) fd.append('img_principale', images.principale);

        Object.entries(images).forEach(([key, file]) => {
            if (key !== 'principale') fd.append(key, file);
        });

        promises.push(
            fetch('http://localhost/api/menu/create', {
                method: 'POST',
                body: fd
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showSuccess(`✅ Menu "${titre}" créé avec succès !`);
                } else {
                    showError(`❌ Erreur pour le menu "${titre}" : ${data.message || 'Erreur inconnue'}`);
                }
                return data;
            })
            .catch(err => {
                console.error('Erreur :', err);
                showError(`❌ Erreur réseau pour le menu "${titre}" : ${err.message}`);
            })
        );
    });

    Promise.all(promises).then(results => {
        const success = results.filter(r => r?.success).length;
        const failed  = results.filter(r => !r?.success).length;
        if (failed === 0) {
            showSuccess(`✅ Tous les menus (${success}) ont été enregistrés avec succès !`);
            // ── RESET ──
            document.getElementById("menusContainer").innerHTML = "";
            themeSelect.value = themeSelect.options[0].value;
        } else {
            showError(`⚠️ ${success} menu(s) enregistré(s), ${failed} échec(s).`);
        }
    });
}
