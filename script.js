// Passo 2.3: Codice JavaScript per la Mappa Leaflet

// 1. Inizializza la mappa Leaflet
var map = L.map('mapid').setView([40.6, 15.9], 9); // Centra sulla Basilicata, zoom 9

// 2. Aggiungi un layer di base (Tiles) alla mappa (es. OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// 3. Funzione per stilizzare i poligoni d'acqua
function styleWaterPolygons(feature) {
    return {
        fillColor: '#0000FF', // Blu
        color: '#0000FF',     // Bordo blu
        weight: 1,            // Spessore del bordo
        opacity: 1,           // Opacità del bordo
        fillOpacity: 0.5      // Opacità del riempimento
    };
}

// 4. Funzione da eseguire per ogni feature (poligono) quando viene aggiunto alla mappa
function onEachFeature(feature, layer) {
    // Estrai le proprietà dal GeoJSON
    var props = feature.properties;

    // Crea il contenuto HTML per il popup
    var popupContent = '<b>ID:</b> ' + props.water_id + '<br>' +
                       '<b>Area:</b> ' + props.area_sqm.toFixed(2) + ' mq (' + props.area_ha.toFixed(2) + ' Ha)';

    // Aggiungi il popup al layer
    layer.bindPopup(popupContent);

    // 5. Aggiungi i dati alla tabella HTML
    var tableBody = document.getElementById('data-table').getElementsByTagName('tbody')[0];
    var newRow = tableBody.insertRow();

    // ID
    var cellId = newRow.insertCell();
    cellId.textContent = props.water_id;

    // Area (mq)
    var cellAreaSqm = newRow.insertCell();
    cellAreaSqm.textContent = props.area_sqm.toFixed(2);

    // Area (Ha)
    var cellAreaHa = newRow.insertCell();
    cellAreaHa.textContent = props.area_ha.toFixed(2);

    // Calcola il centroide per Latitudine e Longitudine
    // Nota: Leaflet ha un metodo getCenter() sui layer di poligono
    var center = layer.getBounds().getCenter();

    // Latitudine Centro
    var cellLat = newRow.insertCell();
    cellLat.textContent = center.lat.toFixed(6); // 6 cifre decimali per la precisione

    // Longitudine Centro
    var cellLng = newRow.insertCell();
    cellLng.textContent = center.lng.toFixed(6);
}

// 6. Carica il file GeoJSON e aggiungilo alla mappa
// Assicurati che il nome del file 'water_sources.geojson' sia corretto e si trovi nella stessa cartella dell'HTML.
fetch('water_sources.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJson(data, {
            style: styleWaterPolygons, // Applica lo stile
            onEachFeature: onEachFeature // Esegui la funzione per ogni feature
        }).addTo(map);
    })
    .catch(error => {
        console.error('Errore nel caricamento del GeoJSON:', error);
        alert('Impossibile caricare i dati degli specchi d\'acqua. Controlla il nome del file GeoJSON.');
    });
