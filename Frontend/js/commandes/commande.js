import { getStorage } from "../script.js";
import { showError, showSuccess } from "../utils/util.js";

//Variables globales
let selectedMenu = null;
let minPersons = 0;
let pricePerPerson = 0;
let deliveryCost = 0;
let map, directionsService, directionsRenderer;

//Initialisation
export async function init() {
    console.log('Initialisation commande');
    await loadMenuCommande();
    autoFillUserInfo();
    await initGoogleMaps();

    initEventListeners(); //fonction pour initialiser les écouteurs d'évènements

    await checkModification(); // On vérifie si c'est une modification
}

//initialiser les écouteurs d'évènements
function initEventListeners() {
    const villeLivraison = document.getElementById('villeLivraison');
    if(villeLivraison){
        villeLivraison.addEventListener("input",calculerFraisManuel);
    }

    const copyPostalAddress = document.getElementById("copyPostalAddress");
    if(copyPostalAddress){
        copyPostalAddress.addEventListener("click", copieAdressePostale);
    }

    const btnIncrement = document.getElementById("btnIncrement");
    if(btnIncrement){
        btnIncrement.addEventListener("click",incrementPersons);
    }

    const btnDecrement = document.getElementById("btnDecrement");
    if(btnDecrement){
        btnDecrement.addEventListener("click",decrementPersons);
    }

    const inputLocationMateriel = document.getElementById("locationMateriel");
    if(inputLocationMateriel){
        inputLocationMateriel.addEventListener("change",calculatePrice);
    }

    const commandeForm = document.getElementById('commandeForm');
    if(commandeForm){
        commandeForm.addEventListener('submit', formCommandeMenu);
    }
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
    console.log('Nettoyage commande');
    
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
    const autocomplete = new Autocomplete(input, {
      fields: ["geometry", "address_components", "formatted_address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
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

      console.log('Extraction:', { codePostal, ville });

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


async function loadMenuCommande() {
    const menuId = getMenuIdFromURL();

    if(!menuId || isNaN(menuId)){
        showError("Menu introuvable. Redirection...");
        window.location.href = '/menu';
        return;
    }
    //loader
    const loader= document.getElementById('loadingSpinner');
    loader.style.display = 'block';

    try {
        const response = await fetch(`http://localhost/api/menu/detail?id=${menuId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        selectedMenu = data.menu;

        if(!selectedMenu){
            showError('Menu introuvable. Redirection...');
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

    displayMenuRecap();

    } catch (error) {
        console.error('Erreur chargement menus:', error);
        showError('Erreur lors du chargement des données');
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
    const delaiJours = minPersons >= 20 ? 14 : 7;
    const conditions = selectedMenu.conditionsList || [
        `Commander ce menu au minimum ${delaiJours} jours avant la prestation`,
        'Conservation : à consommer dans les 48h après livraison',
        'Réchauffage : instructions détaillées fournies avec la commande',
        'Matériel : vaisselle et couverts à prévoir (ou location possible +50€)',
        'Stock disponible : ' + (selectedMenu.stock || 'limité')
    ];
    conditions.forEach(condition => {
        const li = document.createElement('li');
        li.textContent = condition;
        conditionsUl.appendChild(li);
    });
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
        const response = await fetch(`http://localhost/api/commande/detail-commande?id=${modifierId}`);
        const data = await response.json();

        if (!data.success || !data.commande) {
            showError("Commande introuvable.");
            return;
        }

        const cmd = data.commande;

        // Vérifier le statut
        if (cmd.statut !== 'en_attente') {
            showError("Cette commande ne peut plus être modifiée (statut : " + cmd.statut + ").");
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
        document.getElementById('heurePrestation').value = cmd.heure_prestation || '';
        document.getElementById('commentaire').value = cmd.commentaire || '';

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
        showError("Impossible de charger la commande à modifier.");
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

        if (parseInt(document.getElementById('personCount').textContent) > selectedMenu.stock) {
            errors.push('Stock insuffisant pour ce nombre de personnes');
        }

        if (!document.getElementById('adresseLivraison').value.trim()) {
            errors.push('Veuillez renseigner l\'adresse de livraison');
        }

        if(errors.length > 0){
            showError('Erreurs de validation :\n\n' + errors.join('\n'));
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
        showError('Veuillez accepter les conditions générales de vente');
        return;
    }

    const datePrestation = new Date(document.getElementById('datePrestation').value);
    const dateMin = new Date(document.getElementById('datePrestation').min);

    if (datePrestation < dateMin) {
        const delaiJours = minPersons >= 20 ? 14 : 7;
        showError(`La date de prestation doit être au minimum ${delaiJours} jours après aujourd'hui`);
        return;
    }

    const currentUser = getStorage();
    if (!currentUser) return;

    const nbPersonnes = parseInt(document.getElementById('personCount').textContent);
    const locationMateriel = document.getElementById("locationMateriel").checked;
    const menuPrice = pricePerPerson * nbPersonnes;
    const materielCost = locationMateriel ? 50 : 0;
    const discount = nbPersonnes >= minPersons + 5 ? menuPrice * 0.10 : 0;
    const prixTotal = menuPrice + materielCost + deliveryCost - discount;

    //Définir un nouveau numéro de commande > année + mois + jour + heure + minute + seconde: CMD-250419183020
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = String(now.getFullYear()).slice(2) + pad(now.getMonth()+1) + pad(now.getDate()) + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
    const numeroCommande = 'CMD-' + timestamp;

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
        heure_prestation: document.getElementById('heurePrestation').value.substring(0, 5),
        nb_personnes: nbPersonnes,
        prix_menu: menuPrice.toFixed(2),
        prix_livraison: deliveryCost.toFixed(2),
        prix_total: prixTotal.toFixed(2),
        commentaire: document.getElementById('commentaire').value.trim() || null,
        location_materiel: locationMateriel ? 1 : 0,
        mode_contact: document.querySelector('input[name="modeContact"]:checked')?.value || null,
    };

    const modifierId = document.getElementById('commandeForm').dataset.modifierId;

    if (!modifierId) {
        commande.numero_commande = numeroCommande;
    }
    // Si modification, re-vérifier le statut
    if (modifierId) {
        const checkResp = await fetch(`http://localhost/api/commande/detail-commande?id=${modifierId}`);
        const checkData = await checkResp.json();

        if (!checkData.success || checkData.commande.statut !== 'en_attente') {
            showError("Cette commande ne peut plus être modifiée.");
            return;
        }
    }

    const url = modifierId
        ? `http://localhost/api/commande/update-commande?id=${modifierId}`
        : "http://localhost/api/commande/create-commande";

    const method = modifierId ? "PUT" : "POST";

    fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commande),
    })
    .then((response) => response.json())
    .then((result) => {
        if (result.success) {
            if (modifierId) {
                showSuccess('Commande modifiée avec succès !');
                setTimeout(() => {
                    const role = currentUser.role;
                    if (role === 'administrateur') {
                        window.location.href = '/administrateur';
                    } else if (role === 'employe') {
                        window.location.href = '/employe';
                    } else {
                        window.location.href = '/utilisateur';
                    }
                }, 2000);
            }else {
                document.getElementById('orderNumber').textContent = numeroCommande;
                document.getElementById('confirmEmail').textContent = commande.email_client;
                const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
                modal.show();
            }
        } else {
            showError(result.message || 'Une erreur est survenue');
        }
    })
    .catch((error) => {
        console.error('Erreur :', error);
        showError('Une erreur réseau est survenue. Veuillez réessayer');
    });

}
