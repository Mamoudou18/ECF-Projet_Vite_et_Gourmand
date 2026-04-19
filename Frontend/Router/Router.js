import Route from "./Route.js";
import { allRoutes, websitename } from "./allRoutes.js";

// Loader
const loader = document.getElementById("loader");
const showLoader = () => loader?.classList.remove("hidden");
const hideLoader = () => loader?.classList.add("hidden");

const route404 = new Route("404", "Page introuvable", "./pages/404.html");

const getRouteByUrl = (url) => {
    return allRoutes.find(r => r.url === url) || route404;
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const LoadContentPage = async () => {
    const path = window.location.pathname;
    const actualRoute = getRouteByUrl(path);
    const main = document.getElementById("main-page");

    // Affiche le loader immédiatement
    const loaderTimeout= setTimeout(showLoader,200);

    // Lance le fetch en parallèle de l'animation
    const fetchPromise = fetch(actualRoute.pathHtml).then(res => res.text());

    // Animation de sortie
    main.classList.add("page-exit");

    // Nettoyage de l'ancien module
    if (window.currentModule?.cleanup) window.currentModule.cleanup();

    // Attend animation + fetch (le plus long des deux)
    const [html] = await Promise.all([fetchPromise, wait(500)]);

    // Injection du contenu (toujours invisible grâce à page-exit)
    main.innerHTML = html;
    document.title = actualRoute.title + " - " + websitename;
    window.scrollTo(0, 0);

    // Cache le loader juste avant l'animation d'entrée
    clearTimeout(loaderTimeout);
    hideLoader();

    // Bascule vers l'animation d'entrée
    main.classList.remove("page-exit");
    main.classList.add("page-enter");

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            main.classList.remove("page-enter");
        });
    });

    // Chargement du JS en arrière-plan
    if (actualRoute.pathJS) {
        import(actualRoute.pathJS).then(module => {
            window.currentModule = module;
            if (module.init) module.init();
        });
    }
};

const routeEvent = (event) => {
    event.preventDefault();
    window.history.pushState({}, "", event.target.href);
    LoadContentPage();
};

window.onpopstate = LoadContentPage;
window.route = routeEvent;

LoadContentPage();
