// Initialisation 
export async function init() {
    console.log('Initialisation page mon compte');
    initEventListeners();
}

// initiliser les écouteurs d'évèenement

function initEventListeners(){
    const menuLinks = document.querySelectorAll(".sidebar-menu a");

    menuLinks.forEach(link => {
        link.addEventListener("click",function(e){
            e.preventDefault();
            const sectionId = this.getAttribute("data-section")|| this.id;

            console.log('Navigation vers la section:', sectionId);

            showSection(sectionId,this);
        });
    });
}

// Naviguer entre les sections
function showSection(sectionId,clickedLink){
    //Masquer les sections
    document.querySelectorAll(".section-content").forEach(section => {
        section.classList.remove("active");
    });

// Afficher la section demandée
const targetSection = document.getElementById(sectionId);
if(!targetSection){
    console.error('Section introuvable:',sectionId);
    return;
}
targetSection.classList.add("active");
console.log('Section affichée:',sectionId);


// Mettre à jour le menu latéral
document.querySelectorAll(".sidebar-menu a").forEach(link => {
    link.classList.remove("active");
});
if(clickedLink){
    clickedLink.classList.add("active");
}
        
// Scroll vers le haut
window.scrollTo({ top: 0, behavior: 'smooth' });
}