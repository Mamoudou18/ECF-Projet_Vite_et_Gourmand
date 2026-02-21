// intégration de google maps et calcul de frais de livraison
let map, directionsService, directionsRenderer;

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

      const adresseDepart = "1 Place de la République, 33000 Bordeaux, France";
      calculerItineraire(adresseDepart, place.geometry.location);
    });
  } catch (error) {
    console.error("Erreur Google Maps :", error);
  }
}

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

        const frais = villeDestination.includes("bordeaux") ? 0 : (5 + 0.59 * distanceKm).toFixed(2);
        //document.getElementById("distance").textContent = distanceKm.toFixed(2);
        document.getElementById("recapDelivery").textContent = frais;
      } else {
        console.error("Erreur Directions API :", status);
      }
    }
  );
}
initGoogleMaps();



