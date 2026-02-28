import Route from "./Route.js";

// définition de toutes les routes nécessaires à cette application
export const allRoutes = [
    new Route("/", "Accueil", "/pages/home.html"),
    new Route("/menu", "Menu", "/pages/menus/menu.html","/js/menus/menu.js"),
    new Route("/detail", "Détail Menu", "/pages/menus/detail.html","/js/menus/detail.js"),
    new Route("/signup", "Création compte", "/pages/auth/signup.html","/js/auth/signup.js"),
    new Route("/signin", "Connexion", "/pages/auth/signin.html", "/js/auth/signin.js"),
    new Route("/commande", "Commande", "/pages/commandes/commande.html","/js/commandes/commande.js"),
    new Route("/utilisateur", "Mon compte", "/pages/comptes/utilisateur.html","/js/comptes/utilisateur.js"),

];

// Affichage du titre de l'application : Route.titre - websitename

export const websitename = "Vite & Gourmand";

