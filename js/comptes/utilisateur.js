// Initialisation 
export async function init() {
    console.log('Initialisation page mon compte');
    initEventListeners();
}

// initiliser les écouteurs d'évèenement

function initEventListeners(){
    // Navigation entre les sections
    const menuLinks = document.querySelectorAll(".sidebar-menu a");

    menuLinks.forEach(link => {
        link.addEventListener("click",function(e){
            e.preventDefault();
            const sectionId = this.getAttribute("data-section")|| this.id;

            console.log('Navigation vers la section:', sectionId);

            showSection(sectionId,this);
        });
    });

    // Bouton voir les commandes
    const btnVoirCommandes = document.getElementById("btn-voir-commandes");
    if(btnVoirCommandes){
        btnVoirCommandes.addEventListener("click", function(e){
            e.preventDefault();
            const commandesLink = document.querySelector('.sidebar-menu a[data-section="commandes-section"]');
            showSection("commandes-section",commandesLink)
        })
    }

    // Filtres commandes

    const inpuFilterStatus = document.getElementById("filterStatus");
    if(inpuFilterStatus){
        inpuFilterStatus.addEventListener("change",filterOrders);
    }

    const inputSearchOrder = document.getElementById("searchOrder");
    if(inputSearchOrder){
        inputSearchOrder.addEventListener("input",filterOrders);
    }

    const inputResetFilterBtn = document.getElementById("resetFilterBtn");
    if(inputResetFilterBtn){
        inputResetFilterBtn.addEventListener("click",function(e){
            e.preventDefault();
            resetFilters()
        });
    }

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

// Filtre commandes
function filterOrders() {
    const status = document.getElementById('filterStatus').value;
    const search = document.getElementById('searchOrder').value.toLowerCase();
    const orders = document.querySelectorAll('.order-card');
    let visibleCount = 0;

    console.log(search);
        
    orders.forEach(order => {
        const orderStatus = order.getAttribute('data-status');
        const orderText = order.textContent.toLowerCase();
            
        const statusMatch = status === '' || orderStatus === status;
        const searchMatch = search === '' || orderText.includes(search);
            
        if (statusMatch && searchMatch) {
            order.style.display = 'block';
            visibleCount++;
        } else {
            order.style.display = 'none';
        }
    });
        
    document.getElementById('noOrdersFound').style.display = visibleCount === 0 ? 'block' : 'none';
}

// Initialiser tous les filtres

function resetFilters(){
    const status = document.getElementById('filterStatus');
    const search = document.getElementById('searchOrder');
    const orders = document.querySelectorAll('.order-card');
    const noResultsMsg = document.getElementById('noOrdersFound');

    if(status) status.value = '';
    if(search) search.value = '';

    orders.forEach(order => {
        order.style.display ='block';
    });

    if(noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
}