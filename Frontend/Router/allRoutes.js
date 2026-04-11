import Route from "./Route.js";

// définition de toutes les routes nécessaires à cette application
export const allRoutes = [
    new Route("/", "Accueil", "./pages/home.html","/js/home/home.js"),
    new Route("/edit-menu", "Création des menus", "./pages/menus/editMenu.html","/js/menus/editMenu.js"),
    new Route("/menu", "Menu", "./pages/menus/menu.html","/js/menus/menu.js"),
    new Route("/detail", "Détail Menu", "./pages/menus/detail.html","/js/menus/detail.js"),
    new Route("/signup", "Création compte", "./pages/auth/signup.html","/js/auth/signup.js"),
    new Route("/reset-password", "Réinitialisation mot de passe", "./pages/auth/resetPassword.html","/js/auth/resetPassword.js"),
    new Route("/signin", "Connexion", "./pages/auth/signin.html", "/js/auth/signin.js"),
    new Route("/commande", "Commande", "./pages/commandes/commande.html","/js/commandes/commande.js"),
    new Route("/utilisateur", "Mon compte", "./pages/comptes/utilisateur.html","/js/comptes/utilisateur.js"),
    new Route("/espace-employe", "Espace employe", "./pages/comptes/employe.html","/js/comptes/employe.js"),
    new Route("/espace-administrateur", "Espace administrateur", "./pages/comptes/admin.html","/js/comptes/admin.js"),
    new Route("/contact", "Contact", "./pages/contact.html","/js/contact/contact.js"),
    new Route("/avis", "Avis de nos clients", "./pages/avis/avis.html", "/js/avis/avis.js"),

];

// Affichage du titre de l'application : Route.titre - websitename

export const websitename = "Vite & Gourmand";

