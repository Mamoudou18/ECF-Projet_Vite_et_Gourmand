import { getStorage } from "../script.js";

// ===================== INIT =====================
export async function init() {
    initEventListeners();
    updateDasboardHeader();
}

function initEventListeners() {
    document.querySelectorAll(".sidebar-menu a").forEach(link => {
        link.addEventListener("click", function (e) {
            const href = this.getAttribute("href");

            // Si le lien pointe vers une autre page, laisser la navigation normale
            if (href && href.startsWith("/")) {
                return;
            }

            e.preventDefault();
            const sectionId = this.getAttribute("data-section");
            if (sectionId) {
                showSection(sectionId, this);
            }
        });
    });
}

// ===================== NAVIGATION =====================
function showSection(sectionId, clickedLink) {
    document.querySelectorAll(".section-content").forEach(s => s.classList.remove("active"));

    const target = document.getElementById(sectionId);
    if (!target) return;
    target.classList.add("active");

    document.querySelectorAll(".sidebar-menu a").forEach(l => l.classList.remove("active"));
    if (clickedLink) clickedLink.classList.add("active");

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

//===============MISE A JOUR HEADER ====================
function updateDasboardHeader(){
    const user = getStorage();
    if(!user) return;

    const avatar = document.getElementById("user-avatar");
    if(avatar){
        const initiales = `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
        avatar.textContent = initiales;
    }

    const nom = document.querySelector('.lead');
    if(nom) nom.textContent = `Bienvenue, ${user.prenom} ${user.nom}`;
}