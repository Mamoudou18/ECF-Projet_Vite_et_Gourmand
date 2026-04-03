import { showError, showSuccess } from "../utils/util.js";

const btnAjouterMenu = document.getElementById("btnAjouterMenu");
const btnSave = document.getElementById("btnSave");
const themeSelect = document.getElementById("themeSelect");

// ── Mode édition ? ──
const urlParams = new URLSearchParams(window.location.search);
const editIdFromUrl = urlParams.get("id");

if (editIdFromUrl) {
    chargerMenuParId(editIdFromUrl).then(() => {
        btnAjouterMenu.classList.add("d-none");
        btnSave.innerHTML = '<i class="bi bi-pencil-square"></i> Modifier';
        document.querySelectorAll(".btnAjouterPlat").forEach(btn => btn.classList.add("d-none"));
    });
}

btnAjouterMenu.addEventListener("click", () => ajouterMenu());
btnSave.addEventListener("click", enregistrer);

async function chargerMenuParId(id) {
    try {
        const res = await fetch(`http://localhost/api/menu/detail?id=${id}`);
        const data = await res.json();
        if (!data.success) return showError("Menu introuvable.");

        document.getElementById("menusContainer").innerHTML = "";

        const menu = data.menu;
        themeSelect.value = menu.themes || "classique";

        const entrees = menu.plats.filter(p => p.type_id === 1);
        const plats = menu.plats.filter(p => p.type_id === 2);
        const desserts = menu.plats.filter(p => p.type_id === 3);
        const nbTriplets = Math.max(entrees.length, plats.length, desserts.length);

        const menuDiv = ajouterMenu(menu.id);

        menuDiv.querySelector(".titreMenu").value = menu.titre || "";
        menuDiv.querySelector(".description").value = menu.description || "";
        menuDiv.querySelector(".condition").value = menu.conditions || "";
        menuDiv.querySelector(".stock").value = menu.stock || 0;
        menuDiv.querySelector(".prix").value = menu.prix_base || 0;
        menuDiv.querySelector(".nbPersonnes").value = menu.nb_personnes_min || 1;

        const regimesSelect = menuDiv.querySelector(".regimes");
        const regimesList = (menu.regimes || "").split(",").map(r => r.trim());
        Array.from(regimesSelect.options).forEach(opt => {
            opt.selected = regimesList.includes(opt.value);
        });

        const imgs = menu.images ? menu.images.split(",").map(x => x.trim()) : [];
        console.log("Images splittées:", imgs);

        // Image principale = index 0
        if (imgs[0]) {
            const preview = menuDiv.querySelector(".previewImgPrincipale");
            preview.src = `http://localhost${imgs[0]}`;
            preview.classList.remove("d-none");
        }

        for (let i = 0; i < nbTriplets; i++) {
            const platDiv = ajouterPlatDansMenu(menuDiv);

            const idxEntree  = 1 + (i * 3);
            const idxPlat    = 2 + (i * 3);
            const idxDessert = 3 + (i * 3);

            if (entrees[i]) {
                platDiv.querySelector(".entree-nom").value = entrees[i].nom || "";
                platDiv.querySelector(".entree-desc").value = entrees[i].description || "";
                remplirAllergenes(platDiv.querySelector(".section-entree"), entrees[i].allergenes);

                if (imgs[idxEntree]) {
                    const preview = platDiv.querySelector(".section-entree .previewImgPlat");
                    if (preview) {
                        preview.src = `http://localhost${imgs[idxEntree]}`;
                        preview.classList.remove("d-none");
                    }
                }
            }

            if (plats[i]) {
                platDiv.querySelector(".plat-nom").value = plats[i].nom || "";
                platDiv.querySelector(".plat-desc").value = plats[i].description || "";
                remplirAllergenes(platDiv.querySelector(".section-plat"), plats[i].allergenes);

                if (imgs[idxPlat]) {
                    const preview = platDiv.querySelector(".section-plat .previewImgPlat");
                    if (preview) {
                        preview.src = `http://localhost${imgs[idxPlat]}`;
                        preview.classList.remove("d-none");
                    }
                }
            }

            if (desserts[i]) {
                platDiv.querySelector(".dessert-nom").value = desserts[i].nom || "";
                platDiv.querySelector(".dessert-desc").value = desserts[i].description || "";
                remplirAllergenes(platDiv.querySelector(".section-dessert"), desserts[i].allergenes);

                if (imgs[idxDessert]) {
                    const preview = platDiv.querySelector(".section-dessert .previewImgPlat");
                    if (preview) {
                        preview.src = `http://localhost${imgs[idxDessert]}`;
                        preview.classList.remove("d-none");
                    }
                }
            }
        }

        menuDiv.querySelectorAll(".btnAjouterPlat").forEach(btn => btn.classList.add("d-none"));


        // Bouton Modifier en pleine largeur
        const btnSave = document.getElementById("btnSave");
        btnSave.classList.remove("w-50");
        btnSave.classList.add("w-100");

        showSuccess(`Menu "${menu.titre}" chargé pour modification.`);
    } catch (e) {
        console.error(e);
        showError("Erreur lors du chargement du menu.");
    }
}


function remplirAllergenes(section, allergenesStr) {
    if (!allergenesStr) return;
    const liste = section.querySelector(".allergenes-liste");
    allergenesStr.split(",").map(a => a.trim()).filter(Boolean).forEach(a => {
        const badge = document.createElement("span");
        badge.className = "badge bg-warning text-dark me-1 mb-1";
        badge.dataset.valeur = a;
        badge.innerHTML = `${a} <i class="bi bi-x-circle ms-1 btnSupprimerAllergene" style="cursor:pointer"></i>`;
        badge.querySelector(".btnSupprimerAllergene").addEventListener("click", () => badge.remove());
        liste.appendChild(badge);
    });
}

function ajouterMenu(editId = null) {
    const menuDiv = document.createElement("div");
    menuDiv.className = "menu card mb-4 shadow-sm";
    if (editId) menuDiv.dataset.editId = editId;

    menuDiv.innerHTML = `
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0 btnToggleMenu" style="cursor:pointer">
                <i class="bi bi-journal-richtext"></i> Menu ${editId ? '(Modification #' + editId + ')' : ''}
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
            <div class="mb-3">
                <label class="form-label"><i class="bi bi-images"></i> Image principale du menu</label>
                <input type="file" class="form-control imgPrincipale" accept="image/*">
                <img class="previewImgPrincipale mt-2 img-fluid rounded d-none" alt="Aperçu image principale">
            </div>
            <div class="plats"></div>
            <button type="button" class="btn btn-register w-100 btnAjouterPlat mt-2">
                <i class="bi bi-plus-circle-fill"></i> Ajouter un plat
            </button>
        </div>
    `;

    document.getElementById("menusContainer").appendChild(menuDiv);

    menuDiv.querySelector(".btnSupprimerMenu").addEventListener("click", () => menuDiv.remove());
    menuDiv.querySelector(".btnToggleMenu").addEventListener("click", () => {
        const corps = menuDiv.querySelector(".corpsMenu");
        const icon = menuDiv.querySelector(".iconToggleMenu");
        corps.classList.toggle("d-none");
        icon.classList.toggle("bi-chevron-up");
        icon.classList.toggle("bi-chevron-down");
    });
    menuDiv.querySelector(".btnAjouterPlat").addEventListener("click", () => ajouterPlatDansMenu(menuDiv));
    menuDiv.querySelector(".imgPrincipale").addEventListener("change", (e) => {
        const file = e.target.files[0];
        const preview = menuDiv.querySelector(".previewImgPrincipale");
        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.classList.remove("d-none");
        }
    });

    return menuDiv;
}

function ajouterPlatDansMenu(menuDiv) {
    const platDiv = document.createElement("div");
    platDiv.className = "plat card mb-3 border-secondary";
    platDiv.innerHTML = `
        <div class="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
            <h6 class="mb-0 btnTogglePlat" style="cursor:pointer">
                <i class="bi bi-egg-fried"></i> Plat
                <i class="bi bi-chevron-up ms-2 iconTogglePlat"></i>
            </h6>
            <button type="button" class="btn btn-sm btn-light btnSupprimerPlat">
                <i class="bi bi-trash-fill"></i>
            </button>
        </div>
        <div class="card-body corpsPlat">
            ${sectionPlat("entree", "Entrée", "bi-cup-hot-fill")}
            ${sectionPlat("plat", "Plat principal", "bi-fire")}
            ${sectionPlat("dessert", "Dessert", "bi-cake2-fill")}
        </div>
    `;

    menuDiv.querySelector(".plats").appendChild(platDiv);

    platDiv.querySelector(".btnSupprimerPlat").addEventListener("click", () => platDiv.remove());
    platDiv.querySelector(".btnTogglePlat").addEventListener("click", () => {
        const corps = platDiv.querySelector(".corpsPlat");
        const icon = platDiv.querySelector(".iconTogglePlat");
        corps.classList.toggle("d-none");
        icon.classList.toggle("bi-chevron-up");
        icon.classList.toggle("bi-chevron-down");
    });

    platDiv.querySelectorAll(".btnAjouterAllergene").forEach(btn => {
        btn.addEventListener("click", () => {
            const section = btn.closest(".section-allergenes");
            const input = section.querySelector(".inputAllergene");
            const val = input.value.trim();
            if (!val) return;
            const liste = section.querySelector(".allergenes-liste");
            const badge = document.createElement("span");
            badge.className = "badge bg-warning text-dark me-1 mb-1";
            badge.dataset.valeur = val;
            badge.innerHTML = `${val} <i class="bi bi-x-circle ms-1 btnSupprimerAllergene" style="cursor:pointer"></i>`;
            badge.querySelector(".btnSupprimerAllergene").addEventListener("click", () => badge.remove());
            liste.appendChild(badge);
            input.value = "";
        });
    });

    platDiv.querySelectorAll("input[type='file']").forEach(inp => {
        inp.addEventListener("change", (e) => {
            const file = e.target.files[0];
            const preview = inp.nextElementSibling;
            if (file && preview) {
                preview.src = URL.createObjectURL(file);
                preview.classList.remove("d-none");
            }
        });
    });

    return platDiv;
}

function sectionPlat(type, label, icon) {
    const imgClass = type === "entree" ? "imgEntreePlat" : type === "plat" ? "imgPlatPlat" : "imgDessertPlat";
    return `
        <div class="section-${type} mb-4">
            <h6><i class="bi ${icon}"></i> ${label}</h6>
            <input type="text" class="${type}-nom form-control mb-2" placeholder="Nom ${label.toLowerCase()}">
            <textarea class="${type}-desc form-control mb-2" rows="1" placeholder="Description ${label.toLowerCase()}"></textarea>
            <div class="section-allergenes mb-2">
                <div class="input-group mb-1">
                    <input type="text" class="inputAllergene form-control" placeholder="Allergène">
                    <button type="button" class="btn btn-outline-warning btnAjouterAllergene">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                </div>
                <div class="allergenes-liste"></div>
            </div>
            <input type="file" class="form-control ${imgClass}" accept="image/*">
            <img class="previewImgPlat preview mt-2 img-fluid rounded d-none" alt="Aperçu">
        </div>
    `;
}

function enregistrer() {
    const menus = document.querySelectorAll("#menusContainer .menu");
    if (menus.length === 0) return showError("Ajoutez au moins un menu.");

    const themeIdMap = { noel: 1, paques: 2, classique: 3, evenement: 4 };
    const regimeIdMap = { classique: 1, vegetarien: 2, vegan: 3, "sans-gluten": 4, hallal: 5 };
    const promises = [];

    menus.forEach(menu => {
        const editId = menu.dataset.editId || null;
        const titre = menu.querySelector(".titreMenu").value.trim();
        const description = menu.querySelector(".description").value.trim();
        const conditions = menu.querySelector(".condition").value.trim();
        const stock = menu.querySelector(".stock").value;
        const prix_base = menu.querySelector(".prix").value;
        const nb_personnes_min = menu.querySelector(".nbPersonnes").value;
        const themeId = themeIdMap[themeSelect.value] ?? 3;
        const regimes = new Set();
        const plats = [];
        const images = {};

        const imgFile = menu.querySelector(".imgPrincipale")?.files[0];
        if (imgFile) images.principale = imgFile;

        menu.querySelectorAll(".regimes option:checked").forEach(opt => {
            regimes.add(regimeIdMap[opt.value] ?? 1);
        });

        menu.querySelectorAll(".plat").forEach((p, index) => {
            const allergenes = (section) => {
                const arr = [];
                section.querySelectorAll('.allergenes-liste .badge').forEach(b => arr.push(b.dataset.valeur));
                return arr;
            };

            const entreeSection = p.querySelector('.section-entree');
            const platSection = p.querySelector('.section-plat');
            const dessertSection = p.querySelector('.section-dessert');

            plats.push({
                entree: { nom: entreeSection.querySelector('.entree-nom').value.trim(), description: entreeSection.querySelector('.entree-desc').value.trim(), allergenes: allergenes(entreeSection) },
                plat: { nom: platSection.querySelector('.plat-nom').value.trim(), description: platSection.querySelector('.plat-desc').value.trim(), allergenes: allergenes(platSection) },
                dessert: { nom: dessertSection.querySelector('.dessert-nom').value.trim(), description: dessertSection.querySelector('.dessert-desc').value.trim(), allergenes: allergenes(dessertSection) },
            });

            const imgEntree = entreeSection.querySelector('.imgEntreePlat')?.files[0] || null;
            const imgPlat = platSection.querySelector('.imgPlatPlat')?.files[0] || null;
            const imgDessert = dessertSection.querySelector('.imgDessertPlat')?.files[0] || null;

            if (imgEntree) images[`img_entree_${index}`] = imgEntree;
            if (imgPlat) images[`img_plat_${index}`] = imgPlat;
            if (imgDessert) images[`img_dessert_${index}`] = imgDessert;
        });

        const fd = new FormData();
        fd.append('titre', titre);
        fd.append('description', description);
        fd.append('conditions', conditions);
        fd.append('stock', stock);
        fd.append('prix_base', prix_base);
        fd.append('nb_personnes_min', nb_personnes_min);
        fd.append('theme_id', themeId);
        fd.append('regime_ids', JSON.stringify(Array.from(regimes)));
        fd.append('plats', JSON.stringify(plats));

        if (images.principale) fd.append('img_principale', images.principale);
        Object.entries(images).forEach(([key, file]) => {
            if (key !== 'principale') fd.append(key, file);
        });

        const url = editId
            ? `http://localhost/api/menu/update?id=${editId}`
            : 'http://localhost/api/menu/create';

        const actionLabel = editId ? "modifié" : "créé";

        const method = 'POST';

        if (editId) fd.append('_method', 'PUT');

        promises.push(
            fetch(url, { method, body: fd })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        showSuccess(`✅ Menu "${titre}" ${actionLabel} avec succès !`);
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
        const failed = results.filter(r => !r?.success).length;
        if (failed === 0) {
            showSuccess(`✅ Tous les menus (${success}) ont été enregistrés avec succès !`);
            document.getElementById("menusContainer").innerHTML = "";
            themeSelect.value = themeSelect.options[0].value;
        } else {
            showError(`⚠️ ${success} menu(s) enregistré(s), ${failed} échec(s).`);
        }
    });
}
