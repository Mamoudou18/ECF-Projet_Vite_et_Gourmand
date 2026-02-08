import { elements } from "chart.js";
import Route from "./Route.js";
import { allRoutes, websitename } from "./allRoutes.js";

//Route pour la page 404 (si une page est intouvable,  on est rédirigé sur celle ci)
const route404 = new Route("404","Page introuvable","/pages/404.html");

//Fonction pour récuperer la route correspondante à l'url dans le navigateur
const getRouteByUrl = (url) =>{
    let currentRoute = null;

    //parcourir toutes les routes pour trouver notre route
    allRoutes.forEach((elements) =>{
        if(elements.url==url){
            currentRoute = elements;
        }
    });
    //si on ne trouve aucune route alors on redirige sur la page 404
    if(currentRoute != null){
        return currentRoute;
    }else{
        return route404;
    }
}

// fonction pour charcher le contenu de la page dans le main de index.html
const LoadContentPage = async () => {
    const path = window.location.pathname;

    // On récupère l'url actuelle
    const actualRoute = getRouteByUrl(path);

    // On récupère le content html de la route
    const html = await fetch(actualRoute.pathHtml).then((data) => data.text());

    // Ajout de ce contenu dans l'id "main-page" de index.html
    document.getElementById("main-page").innerHTML = html;

    // Ajout du contenu JS 
    if(actualRoute.pathJS != ""){
        // On crée une balise script
        var scriptTag = document.createElement("script");
        scriptTag.setAttribute("type","text/javascript");
        scriptTag.setAttribute("src",actualRoute.pathJS);

        // On ajoute cette balise dans le body:
        document.querySelector("body").appendChild(scriptTag);
    }

    // On charge le titre de la page
    document.title = actualRoute.title + " - " + websitename;
};

// FONCTION DE GESTION DES EVENEMENTS DE ROUTAGE(clic sur les liens):
const routeEvent = (Event) => {
    Event = Event || window.Event;
    Event.preventDefault();

    // Mettre à jour l'url dans l'historique de navigation
    window.history.pushState({}, "", Event.target.href);

    // Charger le conten de la nouvelle page:
    LoadContentPage();
};

// Géer l'évènement de retour en arrière dans l'historique du navigateur : 
window.onpopstate = LoadContentPage;

// Assigner la fonction routeEvent à la propriété route de la fenêtre:
window.route = routeEvent;

// Charger le contenu de la page au chargement initial: 
LoadContentPage();

