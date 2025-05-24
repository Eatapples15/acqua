// 1. Inizializza la mappa Leaflet
var map = L.map('mapid').setView([40.6, 15.9], 9); // Centra sulla Basilicata, zoom 9

// 2. Definisci i diversi layer di base
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

var reliefLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// Aggiungi il layer di OpenStreetMap come predefinito
osmLayer.addTo(map);

// Gruppo di layer per i puntatori, così possono essere attivati/disattivati
var markersLayer = L.layerGroup().addTo(map);

// Variabile globale per memorizzare tutti i dati originali
let allWaterData = [];

// Funzione per popolare la tabella HTML
// Ora accetta un array di dati filtrati
function populateTable(dataToDisplay) {
    var tableBody = document.getElementById('data-table').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Pulisce la tabella prima di ripopolarla

    dataToDisplay.forEach(feature => {
        var newRow = tableBody.insertRow();

        // ID
        var cellId = newRow.insertCell();
        cellId.textContent = feature.water_id;

        // Area (mq)
        var cellAreaSqm = newRow.insertCell();
        cellAreaSqm.textContent = parseFloat(feature.area_sqm).toFixed(2);

        // Area (Ha)
        var cellAreaHa = newRow.insertCell();
        cellAreaHa.textContent = parseFloat(feature.area_ha).toFixed(2);

        // Latitudine Centro
        var cellLat = newRow.insertCell();
        cellLat.textContent = parseFloat(feature.centroid_lat).toFixed(6); // 6 cifre decimali per la precisione

        // Longitudine Centro
        var cellLng = newRow.insertCell();
        cellLng.textContent = parseFloat(feature.centroid_lon).toFixed(6);

        // NUOVA CELLA PER IL COMUNE
        var cellComune = newRow.insertCell();
        cellComune.textContent = feature.Comune || 'Non disponibile'; // Mostra il comune o 'Non disponibile' se vuoto
    });
}

// Funzione per applicare i filtri e aggiornare la tabella e i marcatori
function applyFilters() {
    const comuneFilter = document.getElementById('comuneFilter').value.toLowerCase().trim();
    const areaMinFilter = parseFloat(document.getElementById('areaMinFilter').value);
    const areaMaxFilter = parseFloat(document.getElementById('areaMaxFilter').value);

    let filteredData = allWaterData.filter(feature => {
        const featureComune = (feature.Comune || '').toLowerCase();
        const featureAreaHa = parseFloat(feature.area_ha);

        // Filtro per Comune
        const matchesComune = comuneFilter === '' || featureComune.includes(comuneFilter);

        // Filtro per Area (Ha)
        const matchesAreaMin = isNaN(areaMinFilter) || featureAreaHa >= areaMinFilter;
        const matchesAreaMax = isNaN(areaMaxFilter) || featureAreaHa <= areaMaxFilter;

        return matchesComune && matchesAreaMin && matchesAreaMax;
    });

    // Aggiorna la tabella
    populateTable(filteredData);

    // Aggiorna i marcatori sulla mappa
    markersLayer.clearLayers(); // Rimuove tutti i marcatori esistenti
    filteredData.forEach(feature => {
        const lat = parseFloat(feature.centroid_lat);
        const lon = parseFloat(feature.centroid_lon);

        if (!isNaN(lat) && !isNaN(lon)) {
            var marker = L.marker([lat, lon]);
            var popupContent = `<b>ID:</b> ${feature.water_id}<br>` +
                               `<b>Comune:</b> ${feature.Comune || 'Non disponibile'}<br>` +
                               `<b>Area:</b> ${parseFloat(feature.area_sqm).toFixed(2)} mq (${parseFloat(feature.area_ha).toFixed(2)} Ha)`;
            marker.bindPopup(popupContent);
            markersLayer.addLayer(marker);
        }
    });
}

// Event Listeners per i bottoni dei filtri
document.getElementById('applyFilters').addEventListener('click', applyFilters);
document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('comuneFilter').value = '';
    document.getElementById('areaMinFilter').value = '';
    document.getElementById('areaMaxFilter').value = '';
    applyFilters(); // Applica i filtri con i campi vuoti per mostrare tutti i dati
});


// 3. Carica il file CSV e aggiungilo alla mappa
fetch('Basilicata_Water_Sources_2023_Summer_Comuni1.csv')
    .then(response => response.text())
    .then(csvText => {
        const rows = csvText.trim().split('\n');
        const headers = rows[0].split(',');

        const data = rows.slice(1).map(row => {
            const values = row.split(',');
            const obj = {};
            headers.forEach((header, i) => {
                obj[header.trim()] = values[i].trim();
            });
            return obj;
        });

        // Memorizza i dati originali in una variabile globale
        allWaterData = data;

        // Inizialmente, popola la tabella e i marcatori con tutti i dati
        populateTable(allWaterData);

        allWaterData.forEach(feature => {
            const lat = parseFloat(feature.centroid_lat);
            const lon = parseFloat(feature.centroid_lon);

            if (!isNaN(lat) && !isNaN(lon)) {
                var marker = L.marker([lat, lon]);
                var popupContent = `<b>ID:</b> ${feature.water_id}<br>` +
                                   `<b>Comune:</b> ${feature.Comune || 'Non disponibile'}<br>` +
                                   `<b>Area:</b> ${parseFloat(feature.area_sqm).toFixed(2)} mq (${parseFloat(feature.area_ha).toFixed(2)} Ha)`;
                marker.bindPopup(popupContent);
                markersLayer.addLayer(marker); // Aggiungi il marker al gruppo di layer
            }
        });
    })
    .catch(error => {
        console.error('Errore nel caricamento del CSV:', error);
        alert('Impossibile caricare i dati degli specchi d\'acqua. Controlla il nome del file CSV.');
    });

// 4. Aggiungi il controllo dei layer alla mappa
var baseMaps = {
    "OpenStreetMap (Base)": osmLayer,
    "Satellite (Esri)": satelliteLayer,
    "Rilievo (OpenTopoMap)": reliefLayer
};

var overlayMaps = {
    "Puntatori Specchi d'Acqua": markersLayer
};

L.control.layers(baseMaps, overlayMaps).addTo(map);
