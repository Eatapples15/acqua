// Passo 2.3: Codice JavaScript per la Mappa Leaflet

// 1. Inizializza la mappa Leaflet
var map = L.map('mapid').setView([40.6, 15.9], 9); // Centra sulla Basilicata, zoom 9

// 2. Aggiungi un layer di base (Tiles) alla mappa (es. OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Funzione per popolare la tabella HTML
function populateTable(data) {
    var tableBody = document.getElementById('data-table').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Pulisce la tabella prima di ripopolarla

    data.forEach(feature => {
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
    });
}

// 3. Carica il file CSV e aggiungilo alla mappa
// Assicurati che il nome del file 'water_centroids.csv' sia corretto e si trovi nella stessa cartella.
fetch('water_centroids.csv')
    .then(response => response.text()) // Ottieni il testo del CSV
    .then(csvText => {
        // Parsa il CSV manualmente (funziona bene per CSV semplici, senza virgole nei campi)
        const rows = csvText.trim().split('\n'); // Divide per riga
        const headers = rows[0].split(','); // Prende la prima riga come intestazioni

        const data = rows.slice(1).map(row => { // Salta la prima riga e mappa le altre
            const values = row.split(','); // Divide i valori per virgola
            const obj = {};
            headers.forEach((header, i) => {
                obj[header.trim()] = values[i].trim(); // Trimma spazi bianchi
            });
            return obj;
        });

        // Ora 'data' è un array di oggetti JavaScript, uno per ogni riga del CSV

        // Aggiungi i marker alla mappa e i dati alla tabella
        data.forEach(feature => {
            const lat = parseFloat(feature.centroid_lat);
            const lon = parseFloat(feature.centroid_lon);

            // Verifica che le coordinate siano numeri validi
            if (!isNaN(lat) && !isNaN(lon)) {
                var marker = L.marker([lat, lon]).addTo(map);

                // Contenuto del popup
                var popupContent = '<b>ID:</b> ' + feature.water_id + '<br>' +
                                   '<b>Area:</b> ' + parseFloat(feature.area_sqm).toFixed(2) + ' mq (' + parseFloat(feature.area_ha).toFixed(2) + ' Ha)';

                marker.bindPopup(popupContent);
            }
        });

        // Popola la tabella HTML con i dati
        populateTable(data);
    })
    .catch(error => {
        console.error('Errore nel caricamento del CSV:', error);
        alert('Impossibile caricare i dati degli specchi d\'acqua. Controlla il nome del file CSV.');
    });
