import { renderStars } from "../utils/util.js";

// ===================== VARIABLES GLOBALES ========
const API_BASE = 'http://localhost/api';

async function init() {

    await chargerAvis();
}

init();

async function chargerAvis() {
    fetch(`${API_BASE}/avis/approuves`)
        .then(r => r.json())
        .then(data => {
            const container = document.getElementById('avis');

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

            const avisAffiches = data.avis;
            
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

