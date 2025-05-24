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
        // Ensure feature.area_ha is a valid number before comparison
        const featureAreaHa = parseFloat(feature.area_ha);

        // Filter by Comune
        const matchesComune = comuneFilter === '' || featureComune.includes(comuneFilter);

        // Filter by Area (Ha)
        // Check for valid numbers and apply comparison
        const matchesAreaMin = isNaN(areaMinFilter) || isNaN(featureAreaHa) || featureAreaHa >= areaMinFilter;
        const matchesAreaMax = isNaN(areaMaxFilter) || isNaN(featureAreaHa) || featureAreaHa <= areaMaxFilter;

        return matchesComune && matchesAreaMin && matchesAreaMax;
    });

    // Update the table
    populateTable(filteredData);

    // Update markers on the map
    markersLayer.clearLayers(); // Remove all existing markers
    filteredData.forEach(feature => {
        const lat = parseFloat(feature.centroid_lat);
        const lon = parseFloat(feature.centroid_lon);

        if (!isNaN(lat) && !isNaN(lon)) {
            var marker = L.marker([lat, lon]);
            var popupContent = `<b>ID:</b> ${feature.water_id}<br>` +
                               `<b>Comune:</b> ${feature.Comune || 'Non disponibile'}<br>` +
                               `<b>Area:</b> ${parseFloat(feature.area_sqm).toFixed(2)} mq (${parseFloat(feature.area_ha).toFixed(2)} Ha)`;
            marker.bindPopup(popupContent);
            markersLayer.addLayer(marker); // Add marker to the layer group
        }
    });
}

// Event Listeners for filter buttons
document.getElementById('applyFilters').addEventListener('click', applyFilters);
document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('comuneFilter').value = '';
    document.getElementById('areaMinFilter').value = '';
    document.getElementById('areaMaxFilter').value = '';
    applyFilters(); // Apply filters with empty fields to show all data
});


// 3. Load the CSV file
fetch('Basilicata_Water_Sources_2023_Summer_Comuni1.csv')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(csvText => {
        const rows = csvText.trim().split('\n');
        const headers = rows[0].split(',');

        const data = rows.slice(1).map(row => {
            const values = row.split(',');
            const obj = {};
            headers.forEach((header, i) => {
                obj[header.trim()] = values[i] ? values[i].trim() : ''; // Handle potential undefined values
            });
            // Ensure area_ha is always a number for filtering
            obj.area_ha = parseFloat(obj.area_ha);
            return obj;
        });

        // Store original data globally
        allWaterData = data;

        // Initially display all data
        applyFilters(); // Call applyFilters to populate table and markers with all initial data
    })
    .catch(error => {
        console.error('Errore nel caricamento del CSV:', error);
        alert('Impossibile caricare i dati degli specchi d\'acqua. Controlla il nome del file CSV e la console per maggiori dettagli.');
    });

// 4. Add layer control to the map
var baseMaps = {
    "OpenStreetMap (Base)": osmLayer,
    "Satellite (Esri)": satelliteLayer,
    "Rilievo (OpenTopoMap)": reliefLayer
};

var overlayMaps = {
    "Puntatori Specchi d'Acqua": markersLayer
};

L.control.layers(baseMaps, overlayMaps).addTo(map);
