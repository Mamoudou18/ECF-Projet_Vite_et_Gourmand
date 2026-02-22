import Route from "./Route.js";
import { allRoutes, websitename } from "./allRoutes.js";

const route404 = new Route("404","Page introuvable","/pages/404.html");

const getRouteByUrl = (url) => {
    return allRoutes.find(r => r.url === url) || route404;
};

const LoadContentPage = async () => {

    const path = window.location.pathname;
    const actualRoute = getRouteByUrl(path);

    // Module de néttoyage
    if(window.currentModule?.cleanup){
        window.currentModule.cleanup();
    }

    // Charger HTML
    const html = await fetch(actualRoute.pathHtml).then(res => res.text());
    document.getElementById("main-page").innerHTML = html;

    document.title = actualRoute.title + " - " + websitename;

    // Charger JS proprement (module dynamique)
    if (actualRoute.pathJS) {
        const module = await import(actualRoute.pathJS);

        window.currentModule = module;

        if (module.init) {
            setTimeout(() => {
                module.init();
            }, 0); // Appel de la fonction d'initialisation
        }
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