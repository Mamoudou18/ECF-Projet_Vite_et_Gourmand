import Route from "./Route.js";

// définition de toutes les routes nécessaires à cette application
export const allRoutes = [
    new Route("/", "Accueil", "/pages/home.html"),
    new Route("/menu", "Menu", "/pages/menus/menu.html","js/menus/menu.js"),
    new Route("/detail", "Détail Menu", "/pages/menus/detail.html","js/menus/detail.js"),

];

// Affichage du titre de l'application : Route.titre - websitename

export const websitename = "Vite & Gourmand";

