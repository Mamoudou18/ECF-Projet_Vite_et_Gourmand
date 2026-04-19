import { getStorage } from "../script.js";
import {showToast } from "../utils/util.js";

//Variables globales
const API_BASE = 'http://localhost/api';
let selectedMenu = null;
let minPersons = 0;
let pricePerPerson = 0;
let deliveryCost = 0;
let delaiJours = 7; 
let map, directionsService, directionsRenderer;
let autocompleteInstance = null;

let joursFermes = [];

//Initialisation
export async function init() {
    await loadMenuCommande();
    await loadHoraires();
    autoFillUserInfo();
    await initGoogleMaps();

    setupDateField();

    initEventListeners(); //fonction pour initialiser les écouteurs d'évènements

    await checkModification(); // On vérifie si c'est une modification
}

//initialiser les écouteurs d'évènements
function initEventListeners() {
    addListener('villeLivraison', 'input', calculerFraisManuel);
    addListener('copyPostalAddress', 'click', copieAdressePostale);
    addListener('btnIncrement', 'click', incrementPersons);
    addListener('btnDecrement', 'click', decrementPersons);
    addListener('locationMateriel', 'change', calculatePrice);
    addListener('commandeForm', 'submit', formCommandeMenu);
    addListener('btnAnnuler', 'click', annulerFormulaire);
    addListener('matinRadio', 'change', toggleHeureService);
    addListener('soirRadio', 'change', toggleHeureService);
}

const listeners = [];
function addListener(id, event, handler) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener(event, handler);
        listeners.push({ el, event, handler });
    }
}
    
//Cleanup
export function cleanup() {
    listeners.forEach(({ el, event, handler }) => {
        el.removeEventListener(event, handler);
    });

    listeners.length = 0;
    // Réinitialiser les variables globales
    selectedMenu = null;
    minPersons = 0;
    pricePerPerson = 0;
    deliveryCost = 0;
    
    // Nettoyer Google Maps
    if (directionsRenderer) {
        directionsRenderer.setMap(null);
    }
    map = null;
    directionsRenderer = null;
    directionsService = null;


     // Nettoyer l'autocomplete Google
    if (autocompleteInstance) {
        google.maps.event.clearInstanceListeners(autocompleteInstance);
        autocompleteInstance = null;
    }
}

// intégration de google maps et calcul de frais de livraison
async function initGoogleMaps() {
  try {
    const { Map } = await google.maps.importLibrary("maps");
    const { Autocomplete } = await google.maps.importLibrary("places");

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();

    map = new Map(document.getElementById("googleMap"), {
      zoom: 12,
      center: { lat: 44.8378, lng: -0.5792 },
    });
    directionsRenderer.setMap(map);

    const input = document.getElementById("adresseLivraison");
    autocompleteInstance = new Autocomplete(input, {
        fields: ["geometry", "address_components", "formatted_address"],
    });

    autocompleteInstance.addListener("place_changed", () => {
      const place = autocompleteInstance.getPlace();
      if (!place.geometry) return;

    // EXTRACTION CODE POSTAL ET VILLE
      let codePostal = '';
      let ville = '';

      place.address_components.forEach(component => {
        const types = component.types;

        if (types.includes('postal_code')) {
          codePostal = component.long_name;
        }
        if (types.includes('locality')) {
          ville = component.long_name;
        }
      });

    // remplissage auto des champs: ville et code postal
      document.getElementById('codePostalLivraison').value = codePostal;
      document.getElementById('villeLivraison').value = ville;

      // calcul itinéraire pour les frais de livraison hors bordeaux
      const adresseDepart = "1 Place de la République, 33000 Bordeaux, France";
      calculerItineraire(adresseDepart, place.geometry.location);
    });

    } catch (error) {
    console.error("Erreur Google Maps :", error);
    document.getElementById("googleMap").innerHTML = 
    `<div class="alert alert-warning">Google Maps indisponible. Saisie manuelle activée.</div>`
    // activer le calcul manuel de frais
    calculerFraisManuel();
  }
}

// ============================================
// AUTO-COMPLÉTION
// ============================================
function autoFillUserInfo() {
    const currentUser = getStorage();
    
    if (!currentUser) {
        window.location.href = '/signin';
        return;
    }

    // Remplir les champs
    document.getElementById('nom').value = currentUser.nom || '';
    document.getElementById('prenom').value = currentUser.prenom || '';
    document.getElementById('email').value = currentUser.email || '';
    document.getElementById('telephone').value = currentUser.telephone || '';
    
    // Adresse si elle existe
    if (currentUser.adresse) {
        document.getElementById('adressePostale').value = currentUser.adresse || '';
        document.getElementById('codePostalClient').value = currentUser.code_postal || '';
        document.getElementById('villeClient').value = currentUser.ville || '';
    }

    // Afficher le message "infos remplies"
    document.querySelector('.alert-auto-fill').style.display = 'flex';
}

// ============================================
// Copier l'adresse du client vers l'adresse de livraison
// ============================================
function copieAdressePostale(e){
    e.preventDefault();
    document.getElementById('adresseLivraison').value = document.getElementById('adressePostale').value;
    document.getElementById('codePostalLivraison').value = document.getElementById('codePostalClient').value;
    document.getElementById('villeLivraison').value = document.getElementById('villeClient').value;
    calculerFraisManuel();
}

//calcul manuel de frais
function calculerFraisManuel(){
    const ville = document.getElementById('villeLivraison').value.toLowerCase();
    const deliveryInfo = document.getElementById('deliveryInfo');
    const deliveryDetails = document.getElementById('deliveryDetails');
    const deliveryPrice = document.getElementById("deliveryPrice");

    if(!ville){
        deliveryCost = 0;
        deliveryInfo.style.display = 'none';
        calculatePrice();
        return;
    }
    
    deliveryInfo.style.display = 'block';

    if (ville.includes("bordeaux")) {
        deliveryCost = 0
        deliveryDetails.textContent = "Livraison gratuite dans Bordeaux";
        deliveryPrice.textContent = "0.00";
    } else {
        const distanceEstimee = 15;
        deliveryCost = 5 + (0.59*distanceEstimee);
        deliveryPrice.textContent = deliveryCost.toFixed(2);
        deliveryDetails.textContent =
        `Livraison hors Bordeaux: 5,00 € + ${distanceEstimee.toFixed(1)} km × 0,59€ = ${deliveryCost.toFixed(2)} €
        (distance estimée, Google Maps indisponible)`;
    }

    calculatePrice();
}

//calcul autmatique de frais
function calculerItineraire(origin, destination) {
  directionsService.route(
    {
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING,
    },
    (response, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(response);

        const distanceKm = response.routes[0].legs[0].distance.value / 1000;
        const villeDestination = response.routes[0].legs[0].end_address.toLowerCase();

        const deliveryInfo = document.getElementById('deliveryInfo');
        const deliveryDetails = document.getElementById('deliveryDetails');
        const deliveryPrice = document.getElementById("deliveryPrice");

        deliveryInfo.style.display = 'block';

        if (villeDestination.includes("bordeaux")) {
          deliveryCost = 0;
          deliveryDetails.textContent = "Livraison gratuite dans Bordeaux";
          deliveryPrice.textContent = "0.00";
        } else {
            deliveryCost = 5 + 0.59 * distanceKm;
            deliveryDetails.textContent =
            `Livraison hors Bordeaux: 5,00 € + ${distanceKm.toFixed(1)} km × 0,59€ = ${deliveryCost.toFixed(2)} €`;
            deliveryPrice.textContent = deliveryCost.toFixed(2);
        }

        calculatePrice();
      } else {
        console.error("Erreur Directions API :", status);
      }
    }
  );
}

// 1. Récupération de l'id du menu cliqué
function getMenuIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('menu'));
}

// Fonction toggle heure de service
function toggleHeureService() {
    const isMatin = document.getElementById('matinRadio').checked;
    const selectMatin = document.getElementById('selectHourMatin');
    const selectSoir = document.getElementById('selectHourSoir');

    selectMatin.style.display = isMatin ? 'block' : 'none';
    selectMatin.disabled = !isMatin;
    selectMatin.required = isMatin;

    selectSoir.style.display = isMatin ? 'none' : 'block';
    selectSoir.disabled = isMatin;
    selectSoir.required = !isMatin;

    // Reset la sélection du select masqué
    if (isMatin) {
        selectSoir.value = '';
    } else {
        selectMatin.value = '';
    }
}

// Fonction utilitaire pour récupérer l'heure sélectionnée
function getSelectedHeure() {
    const isMatin = document.getElementById('matinRadio').checked;
    return isMatin
        ? document.getElementById('selectHourMatin').value
        : document.getElementById('selectHourSoir').value;
}

// Charger les horaires
async function loadHoraires() {
    try {
        const response = await fetch(`${API_BASE}/horaires/horaire-list`);
        const data = await response.json();
        if (data.success) {
            // Mapper ordre vers getDay()
            joursFermes = data.horaires
                .filter(h => h.is_ferme === 1)
                .map(h => h.ordre % 7);
        }
    } catch (error) {
        console.error('Erreur chargement horaires:', error);
    }
}

// Fonction séparée, en dehors de loadMenuCommande
function setupDateField() {
    const dateInput = document.getElementById('datePrestation');
    if (!dateInput) return;

    const minDate = new Date();
    minDate.setDate(minDate.getDate() + delaiJours);
    dateInput.min = minDate.toISOString().split('T')[0];

    dateInput.addEventListener('input', function () {
        const selectedDate = new Date(this.value + 'T00:00:00');
        const dayOfWeek = selectedDate.getDay();

        if (joursFermes.includes(dayOfWeek)) {
            showToast('Ce jour est un jour de fermeture. Veuillez choisir un autre jour.', 'warning');
            this.value = '';
        }
    });
}


async function loadMenuCommande() {
    const menuId = getMenuIdFromURL();

    if(!menuId || isNaN(menuId)){
        showToast('Menu introuvable. Redirection...', 'danger');
        window.location.href = '/menu';
        return;
    }
    //loader
    const loader= document.getElementById('loadingSpinner');
    loader.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE}/menu/detail?id=${menuId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        selectedMenu = data.menu;

        if(!selectedMenu){
            showToast('Menu introuvable. Redirection...', 'danger');
            setTimeout(() => {
                window.location.href = '/menu';
            },2000);
            return;
        }
        
        // Séparer les plats par type_id
        selectedMenu.entrees  = selectedMenu.plats.filter(p => p.type_id === 1);
        selectedMenu.platsPrincipaux = selectedMenu.plats.filter(p => p.type_id === 2);
        selectedMenu.desserts = selectedMenu.plats.filter(p => p.type_id === 3);

        //recuper les allergènes
        selectedMenu.allergenes = [... new Set (selectedMenu.plats
            .map(plat => plat.allergenes)
            .filter(a => a != null)
            .flatMap(a => a.split(',')
            .map(s => s.trim()))
        )];

        // Parser les conditions
        selectedMenu.conditionsList = selectedMenu.conditions
            ? selectedMenu.conditions.split(',').map(c => c.trim().replace(/^"|"$/g, '').trim()).filter(c => c)
            : [];

        
        const delaiCondition = selectedMenu.conditionsList.find(c => c.toLowerCase().includes('délai'));
        if (delaiCondition) {
            const match = delaiCondition.match(/(\d+)/);
            if (match) delaiJours = parseInt(match[1]);
        }

        displayMenuRecap();

    } catch (error) {
        console.error('Erreur chargement menus:', error);
        showToast('Erreur lors du chargement des données', 'danger');
        setTimeout(() => {
            window.location.href = '/menu';
        },2000);
        
        return;
    }finally{
        loader.style.display = 'none';
    }
}

// ============================================
// AFFICHAGE DU RÉCAPITULATIF MENU
// ============================================
function displayMenuRecap() {
    if (!selectedMenu) return;

    // Titre et description
    document.getElementById('menuTitreText').textContent = selectedMenu.titre;
    document.getElementById('menuDescription').textContent = selectedMenu.description;

    // Infos principales
    pricePerPerson = parseFloat(selectedMenu.prix_base) || 0 ;
    minPersons = selectedMenu.nb_personnes_min;

    document.getElementById('menuPrixDisplay').textContent = pricePerPerson.toFixed(2) + ' €';
    document.getElementById('menuMinPersDisplay').textContent = minPersons + ' pers.';
    document.getElementById('menuThemeDisplay').textContent = selectedMenu.themes || 'Classique';
    document.getElementById('menuRegimeDisplay').textContent = selectedMenu.regimes || 'Classique';

    renderMenuItems(selectedMenu.entrees, 'menuEntrees');
    renderMenuItems(selectedMenu.platsPrincipaux, 'menuPlats');
    renderMenuItems(selectedMenu.desserts, 'menuDesserts');

    // Allergènes
    const allergenesDiv = document.getElementById('menuAllergenes');
    allergenesDiv.innerHTML = '';
    if (selectedMenu.allergenes && selectedMenu.allergenes.length > 0) {
        selectedMenu.allergenes.forEach(allergene => {
            const badge = document.createElement('span');
            badge.className = 'allergene-badge';
            badge.textContent = allergene;
            allergenesDiv.appendChild(badge);
        });
    } else {
        allergenesDiv.innerHTML = '<span class="text-white">Aucun allergène déclaré</span>';
    }

    // Conditions (CONFORME ÉNONCÉ)
    const conditionsUl = document.getElementById('menuConditionsListe');
    conditionsUl.innerHTML = '';

    if (selectedMenu.conditionsList && selectedMenu.conditionsList.length > 0) {
        selectedMenu.conditionsList.forEach(condition => {
            const li = document.createElement('li');
            li.textContent = condition;
            conditionsUl.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'Aucune condition particulière';
        conditionsUl.appendChild(li);
    }

    // Mettre à jour les autres éléments
    document.getElementById('minPersonsInfo').textContent = minPersons;
    document.getElementById('personCount').textContent = minPersons;
    document.getElementById('delaiCommande').textContent = delaiJours + ' jours';

    // Définir la date minimale selon le délai
    const today = new Date();
    today.setDate(today.getDate() + delaiJours);
    document.getElementById('datePrestation').min = today.toISOString().split('T')[0];
    // Calculer le prix initial
    calculatePrice();
}

function renderMenuItems(items, containerId) {
    const ul = document.getElementById(containerId);
    ul.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        const icon = document.createElement('i');
        icon.className = 'bi bi-check-circle-fill';
        li.appendChild(icon);
        li.appendChild(document.createTextNode(' ' + item.nom));
        ul.appendChild(li);
    });
}

// ============================================
// GESTION NOMBRE DE PERSONNES
// ============================================
function incrementPersons() {
    let count = parseInt(document.getElementById('personCount').textContent);
    count++;
    document.getElementById('personCount').textContent = count;
    calculatePrice();
}

function decrementPersons() {
    let count = parseInt(document.getElementById('personCount').textContent);
    if (count > minPersons) {
        count--;
        document.getElementById('personCount').textContent = count;
        calculatePrice();
    }
}

// ============================================
// CALCUL DES PRIX
// ============================================
function calculatePrice() {
    if (!selectedMenu) return;
    const personCount = parseInt(document.getElementById('personCount').textContent);
    const locationMateriel = document.getElementById("locationMateriel").checked;

    // Prix menu de base
    let menuPrice = pricePerPerson * personCount;

    // Location matériel
    let materielCost = 0;
    if (locationMateriel) {
        materielCost = 50;
        document.getElementById('recapMaterielLine').style.display = 'flex';
    } else {
        document.getElementById('recapMaterielLine').style.display = 'none';
    }

    // Réduction 10% si >= minPersons + 5 personnes
    let discount = 0;
    if (personCount >= minPersons + 5) {
        discount = menuPrice * 0.10;
        document.getElementById('recapDiscountLine').style.display = 'flex';
        document.getElementById('recapDiscount').textContent = '-' + discount.toFixed(2) + ' €';
    } else {
        document.getElementById('recapDiscountLine').style.display = 'none';
    }

    // Total
    const prixTotal = menuPrice + materielCost + deliveryCost - discount;

    // Affichage
    document.getElementById('recapNbPersons').textContent = personCount;
    document.getElementById('recapPriceMenu').textContent = menuPrice.toFixed(2) + ' €';
    document.getElementById('recapDelivery').textContent = deliveryCost.toFixed(2) + ' €';
    document.getElementById('recapTotal').textContent = prixTotal.toFixed(2) + ' €';

    // Activer/désactiver bouton décrémentation
    document.getElementById('btnDecrement').disabled = (personCount <= minPersons);
}

//Modifier une commande
async function checkModification() {
    const params = new URLSearchParams(window.location.search);
    const modifierId = params.get('modifier');

    if (!modifierId) return;

    try {
        const response = await fetch(`${API_BASE}/commande/detail-commande?id=${modifierId}`);
        const data = await response.json();

        if (!data.success || !data.commande) {
            showToast('Commande introuvable.', 'danger');
            return;
        }

        const cmd = data.commande;

        // Vérifier le statut
        if (cmd.statut !== 'en_attente') {
            showToast(`Cette commande ne peut plus être modifiée (statut : ${cmd.statut}).`, 'danger');
            setTimeout(() => {
                window.location.href = '/utilisateur';
            }, 2000);
            return;
        }

        // Pré-remplir les champs
        document.getElementById('adresseLivraison').value = cmd.adresse_prestation || '';
        document.getElementById('codePostalLivraison').value = cmd.code_postal_prestation || '';
        document.getElementById('villeLivraison').value = cmd.ville_prestation || '';
        document.getElementById('datePrestation').value = cmd.date_prestation || '';
        document.getElementById('commentaire').value = cmd.commentaire || '';
        if (cmd.heure_prestation) {
            const heure = cmd.heure_prestation.substring(0, 5);
            const heureInt = parseInt(heure.split(':')[0]);

            if (heureInt < 14) {
                document.getElementById('matinRadio').checked = true;
                document.getElementById('selectHourMatin').value = heure;
            } else {
                document.getElementById('soirRadio').checked = true;
                document.getElementById('selectHourSoir').value = heure;
            }
            toggleHeureService();
        }

        // Nombre de personnes
        document.getElementById('personCount').textContent = cmd.nb_personnes || minPersons;

        // Location matériel
        document.getElementById('locationMateriel').checked = cmd.location_materiel == 1;

        // Mode de contact
        if (cmd.mode_contact) {
            const radio = document.querySelector(`input[name="modeContact"][value="${cmd.mode_contact}"]`);
            if (radio) radio.checked = true;
        }

        // Recalculer les frais
        calculerFraisManuel();
        calculatePrice();

        //Modifier les titres dans le header
        document.querySelector('.commande-header h2').innerHTML = '<i class="bi bi-pencil-square"></i> Modifier ma commande';
        document.querySelector('.commande-header p').textContent = 'Modifiez les détails de votre commande';

        // Modifier le titre et le bouton pour indiquer une modification
        const titre = document.querySelector('.commande-title');
        if (titre) titre.textContent = 'Modifier ma commande';

        const btnSubmit = document.querySelector('#commandeForm button[type="submit"]');
        if (btnSubmit) btnSubmit.textContent = 'Modifier ma commande';

        // Stocker l'ID pour la soumission
        document.getElementById('commandeForm').dataset.modifierId = modifierId;

    } catch (error) {
        console.error('Erreur chargement commande:', error);
        showToast('Impossible de charger la commande à modifier.', 'danger');
    }
}

//validation du formulaire:
function validateForm() {
    const errors = [];

    // Email
    const email = document.getElementById('email').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Email invalide');
    }

    // Téléphone (format FR)
    const tel = document.getElementById('telephone').value;

    if (!/^0[1-9][0-9]{8}$/.test(tel.replace(/\s/g, ''))) {
        errors.push('Téléphone invalide (format: 06 12 34 56 78)');
    }

    if (!document.getElementById('adresseLivraison').value.trim()) {
        errors.push('Veuillez renseigner l\'adresse de livraison');
    }

    if(errors.length > 0){
        errors.forEach(err => showToast(err, 'danger'));
        return false;
    }
    return true;
}

// ============================================
// SOUMISSION DU FORMULAIRE
// ===========================================
async function formCommandeMenu(e) {
    e.preventDefault();

    if (!validateForm()) return;

    if (!document.getElementById('acceptCGV').checked) {
        showToast('Veuillez accepter les conditions générales de vente', 'warning');
        return;
    }

    const datePrestation = new Date(document.getElementById('datePrestation').value);
    const dateMin = new Date(document.getElementById('datePrestation').min);

    if (datePrestation < dateMin) {

        showToast(`La date de prestation doit être au minimum ${delaiJours} jours après aujourd'hui`, 'warning');
        return;
    }

    const btnSubmit = document.querySelector('#commandeForm button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Envoi en cours...';

    const currentUser = getStorage();
    if (!currentUser) return;

    const nbPersonnes = parseInt(document.getElementById('personCount').textContent);
    const locationMateriel = document.getElementById("locationMateriel").checked;
    const menuPrice = pricePerPerson * nbPersonnes;
    const materielCost = locationMateriel ? 50 : 0;
    const discount = nbPersonnes >= minPersons + 5 ? menuPrice * 0.10 : 0;
    const prixTotal = menuPrice + materielCost + deliveryCost - discount;

    const commande = {
        user_id: currentUser.id,
        menu_id: selectedMenu.id,
        nom_client: document.getElementById('nom').value.trim(),
        prenom_client: document.getElementById('prenom').value.trim(),
        email_client: document.getElementById('email').value.trim(),
        gsm_client: document.getElementById('telephone').value.trim(),
        adresse_prestation: document.getElementById('adresseLivraison').value.trim(),
        ville_prestation: document.getElementById('villeLivraison').value.trim(),
        code_postal_prestation: document.getElementById('codePostalLivraison').value.trim(),
        date_prestation: document.getElementById('datePrestation').value,
        heure_prestation: getSelectedHeure(),
        nb_personnes: nbPersonnes,
        prix_menu: menuPrice.toFixed(2),
        prix_livraison: deliveryCost.toFixed(2),
        prix_total: prixTotal.toFixed(2),
        commentaire: document.getElementById('commentaire').value.trim() || null,
        location_materiel: locationMateriel ? 1 : 0,
        mode_contact: document.querySelector('input[name="modeContact"]:checked')?.value || null,
    };

    const modifierId = document.getElementById('commandeForm').dataset.modifierId;

    // Si modification, re-vérifier le statut
    if (modifierId) {
        const checkResp = await fetch(`${API_BASE}/commande/detail-commande?id=${modifierId}`);
        const checkData = await checkResp.json();

        if (!checkData.success || checkData.commande.statut !== 'en_attente') {
            showToast('Cette commande ne peut plus être modifiée.', 'warning');
            return;
        }
    }

    const url = modifierId
        ? `${API_BASE}/commande/update-commande?id=${modifierId}`
        : `${API_BASE}/commande/create-commande`;

    const method = modifierId ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(commande),
        });
        const result = await response.json();
        if(result.success){
            if (modifierId) {
                showToast('Commande modifiée avec succès !', 'success');
                setTimeout(() => {
                    const role = currentUser.role;
                    if (role === 'admin') {
                        window.location.href = '/espace-administrateur';
                    } else if (role === 'employe') {
                        window.location.href = '/espace-employe';
                    } else {
                        window.location.href = '/utilisateur';
                    }
                }, 2000);
            }else {
                document.getElementById('orderNumber').textContent = result.numero_commande;
                document.getElementById('confirmEmail').textContent = commande.email_client;
                const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
                modal.show();
            }
        }else {
            showToast(result.message || 'Une erreur est survenue', 'danger');
        }
    } catch (error) {
        console.error('Erreur :', error);
        showToast('Une erreur réseau est survenue.', 'danger'); 
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="bi bi-check-circle"></i> Confirmer ma commande';
    }

}

// Bouton annuler
function annulerFormulaire() {
    const modifierId = document.getElementById('commandeForm').dataset.modifierId;
    const message = modifierId
        ? 'Voulez-vous annuler la modification ?'
        : 'Voulez-vous quitter ? Les données saisies seront perdues.';

    document.getElementById('modalAnnulerMessage').textContent = message;

    const modal = new bootstrap.Modal(document.getElementById('modalAnnuler'));
    modal.show();

    document.getElementById('btnConfirmAnnuler').onclick = () => {
        modal.hide();
        if (modifierId) {
            const currentUser = getStorage();
            const redirects = {
                admin: '/espace-administrateur',
                employe: '/espace-employe',
            };
            window.location.href = redirects[currentUser?.role] || '/utilisateur';
        } else {
            window.location.href = '/menu';
        }
    };
}

