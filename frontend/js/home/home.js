import { renderStars } from "../utils/util.js";
import { API_BASE, URL_IMG } from "../config.js";

// ===================== VARIABLES GLOBALES ========
let top3Menus = [];

async function init() {
    await loadTop3Menus();
    displayTop3Menus();
    chargerAvisAccueil();
}

//chargement des 3 menus les plus commandés
async function loadTop3Menus() {
    try {
        const response = await fetch(`${API_BASE}/stats/top-menus`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();

        // Extraire les objets menu depuis la structure {menu, nb_commandes}
        top3Menus = data.top_menus.map(item => ({
            ...item.menu,
            nb_commandes: item.nb_commandes
        }));

    } catch (error) {
        console.error('Erreur de chargement des menus:', error);
        document.getElementById("top3Menus").innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Erreur lors du chargement des menus. Veuillez réessayer.
                </div>
            </div>
        `;
    }
}

// ========== AFFICHAGE DES 3 MENUS LES PLUS COMMANDES ==========
function displayTop3Menus() {
    const container = document.getElementById("top3Menus");
    if (!container) return;
    container.innerHTML = '';

    const medals = ['🥇', '🥈', '🥉'];

    top3Menus.forEach((menu, index) => {
        const stockClass = menu.stock < 10 ? 'low' : '';
        const stockIcon = menu.stock < 10 ? 'exclamation-triangle' : 'check-circle';

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
                                <span class="menu-price-value">${parseFloat(menu.prix_base).toFixed(2)} €</span>
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
}

function chargerAvisAccueil() {
    fetch(`${API_BASE}/avis/approuves`)
        .then(r => r.json())
        .then(data => {
            const container = document.getElementById('avis-accueil');

            if (!data.avis || data.avis.length === 0) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="text-center py-5">
                            <i class="bi bi-chat-square-text display-1 text-muted"></i>
                            <p class="text-muted mt-3 fs-5">Aucun avis pour le moment.</p>
                        </div>
                    </div>
                `;
                return;
            }

            const avisAffiches = data.avis.slice(0, 3);
            
            // Adapter la classe selon le nombre d'avis
            if (avisAffiches.length === 1) {
                container.className = 'row justify-content-center g-4';
            } else if (avisAffiches.length === 2) {
                container.className = 'row row-cols-1 row-cols-lg-2 justify-content-center g-4';
            } else {
                container.className = 'row row-cols-1 row-cols-lg-3 g-4';
            }

            container.innerHTML = avisAffiches.map(a => {
                const stars = renderStars(a.note);
                const prenom = a.prenom_client || 'Anonyme';
                const initiale = a.nom_client ? a.nom_client.charAt(0).toUpperCase() + '.' : '';
                return `
                    <div class="col text-center">
                        <div class="avis">
                            <div class="stars-color">${stars}</div>
                            <p>"${a.commentaire}"</p>
                            <div class="autheur">— ${prenom} ${initiale}</div>
                        </div>
                    </div>
                `;
            }).join('');
        })
        .catch(() => {
            document.getElementById('avis-accueil').innerHTML = `
                <div class="col-12">
                    <p class="text-center text-danger">Impossible de charger les avis.</p>
                </div>
            `;
        });
}

init();
