// Airport data is imported from airports-data2.js
// The airports array is now defined in a separate file for better organization
// Filter airports to show only those from Argentina

// Convert the airports object to an array and filter for Argentina
let argentineAirports = [];

// Process airports data once it's loaded
function processAirportData() {
    if (typeof airports !== 'undefined' && airports.length > 0) {
        // airports is an array with one object containing all airport data
        const airportsData = airports[0];
        argentineAirports = Object.values(airportsData).filter(airport => 
            airport.country === 'AR' && 
            airport.lat && 
            airport.lon && 
            airport.name
        );
        console.log(`Found ${argentineAirports.length} airports in Argentina`);
    }
}

let map;
let markers = [];
let infoWindow;

// Initialize the Google Map
function initMap() {
    // Process airport data first
    processAirportData();
    
    // Create map centered on Argentina
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 5,
        center: { lat: -35.0, lng: -64.0 }, // Centered on Argentina
        mapTypeId: 'terrain',
        styles: [
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
            },
            {
                featureType: 'landscape',
                elementType: 'geometry',
                stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
            }
        ]
    });

    // Create info window
    infoWindow = new google.maps.InfoWindow();

    // Add markers for all Argentine airports
    addAirportMarkers();

    // Populate airport list in sidebar
    populateAirportList();
}

// Add markers for all Argentine airports
function addAirportMarkers() {
    argentineAirports.forEach((airport, index) => {
        const marker = new google.maps.Marker({
            position: { lat: airport.lat, lng: airport.lon }, // Note: using 'lon' from data
            map: map,
            title: `${airport.name} (${airport.icao})`,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="12" fill="#3498db" stroke="#2c3e50" stroke-width="2"/>
                        <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">✈</text>
                    </svg>
                `),
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16)
            }
        });

        // Add click event to marker
        marker.addListener('click', () => {
            showAirportInfo(airport, marker);
        });

        markers.push(marker);
    });
}

// Show airport information in info window
function showAirportInfo(airport, marker) {
    const content = `
        <div class="info-window">
            <h4>${airport.name}</h4>
            <div class="icao">${airport.icao}</div>
            <div class="country">${airport.city}, ${airport.state}</div>
        </div>
    `;

    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}

// Populate the airport list in the sidebar
function populateAirportList() {
    const airportList = document.getElementById('airport-list');
    
    argentineAirports.forEach((airport, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div class="airport-name">${airport.name}</div>
            <div class="airport-icao">${airport.icao}</div>
            <div class="airport-country">${airport.city}, ${airport.state}</div>
        `;

        // Add click event to list item
        listItem.addEventListener('click', () => {
            // Center map on selected airport
            map.setCenter({ lat: airport.lat, lng: airport.lon });
            map.setZoom(10);
            
            // Show info window for this airport
            showAirportInfo(airport, markers[index]);
            
            // Highlight the selected airport in the list
            document.querySelectorAll('.airport-list li').forEach(li => {
                li.style.backgroundColor = '#f8f9fa';
            });
            listItem.style.backgroundColor = '#e3f2fd';
        });

        airportList.appendChild(listItem);
    });
}

// Handle map loading errors
window.addEventListener('load', () => {
    // Check if Google Maps API failed to load
    setTimeout(() => {
        if (typeof google === 'undefined') {
            document.getElementById('map').innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; color: #e74c3c;">
                    <h3>Google Maps API Key Required</h3>
                    <p>Please replace YOUR_API_KEY in index.html with your actual Google Maps API key.</p>
                    <p style="margin-top: 10px; font-size: 0.9em;">
                        Get your API key at: 
                        <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank">
                            Google Maps Platform
                        </a>
                    </p>
                </div>
            `;
        }
    }, 3000);
});
