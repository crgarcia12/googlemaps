// Airport data is imported from airports-data2.js
// Show specific airports with origin and destinations

// Configuration for airports and routes
const originAirport = 'SACO'; // Origin airport ICAO code
const destinationAirports = [
'SAAR',
'SAOC',
'SANL',
'SANE',
'SARP',
'SAOS',
'SAOU',
'SAMR',
'SAZN',
'SARL'
]; // Destination airport ICAO codes

// Flight duration data (in minutes) - you can customize these
const flightDurations = {
    'SAAR': 45,   // Assumed flight times from SACO
    'SAOC': 30,
    'SANL': 90,
    'SANE': 60,
    'SARP': 75,
    'SAOS': 40,
    'SAOU': 85,
    'SAMR': 70,
    'SAZN': 55,
    'SARL': 65
};

// Convert minutes to hours:minutes format
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
}
function getSpecificAirports() {
    if (typeof airports !== 'undefined' && airports.length > 0) {
        const airportsData = airports[0];
        const allCodes = [originAirport, ...destinationAirports];
        
        const selectedAirports = allCodes
            .map(icao => airportsData[icao])
            .filter(airport => airport && airport.lat && airport.lon && airport.name);
        
        console.log(`Found ${selectedAirports.length} out of ${allCodes.length} specified airports`);
        return selectedAirports;
    }
    return [];
}

let map;
let markers = [];
let infoWindow;
let flightPaths = []; // Store flight path polylines

// Initialize the Google Map
function initMap() {
    // Get specific airports
    const selectedAirports = getSpecificAirports();
    
    // Create map with initial settings
    map = new google.maps.Map(document.getElementById('map'), {
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

    // Add markers for all airports
    addAirportMarkers(selectedAirports);

    // Draw flight paths from origin to destinations
    drawFlightPaths(selectedAirports);

    // Fit map to show all airports
    fitMapToAirports(selectedAirports);

    // Populate airport list in sidebar
    populateAirportList(selectedAirports);
}

// Fit the map view to show all airports
function fitMapToAirports(airportsList) {
    if (airportsList.length === 0) {
        // Fallback to default view if no airports
        map.setCenter({ lat: -15.0, lng: -60.0 });
        map.setZoom(4);
        return;
    }
    
    if (airportsList.length === 1) {
        // If only one airport, center on it with reasonable zoom
        const airport = airportsList[0];
        map.setCenter({ lat: airport.lat, lng: airport.lon });
        map.setZoom(8);
        return;
    }
    
    // Create bounds object to include all airports
    const bounds = new google.maps.LatLngBounds();
    
    // Add each airport to the bounds
    airportsList.forEach(airport => {
        bounds.extend(new google.maps.LatLng(airport.lat, airport.lon));
    });
    
    // Fit the map to the bounds with some padding
    map.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
    });
}

// Add markers for specific airports with origin and destination styling
function addAirportMarkers(airportsList) {
    airportsList.forEach((airport, index) => {
        const isOrigin = airport.icao === originAirport;
        const isDestination = destinationAirports.includes(airport.icao);
        
        // Determine marker color based on airport type
        let markerColor = '#3498db'; // Default blue
        
        if (isOrigin) {
            markerColor = '#e74c3c'; // Red for origin
        } else if (isDestination) {
            markerColor = '#27ae60'; // Green for destinations
        }
        
        const marker = new google.maps.Marker({
            position: { lat: airport.lat, lng: airport.lon },
            map: map,
            title: `${airport.name} (${airport.icao})`,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="12" fill="${markerColor}" stroke="#2c3e50" stroke-width="2"/>
                        <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">✈</text>
                    </svg>
                `),
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16)
            }
        });

        // Add click event to marker
        marker.addListener('click', () => {
            showAirportInfo(airport, marker, isOrigin, isDestination);
        });

        markers.push(marker);
    });
}

// Draw flight paths from origin to all destinations
function drawFlightPaths(airportsList) {
    const origin = airportsList.find(airport => airport.icao === originAirport);
    
    if (!origin) {
        console.warn('Origin airport not found');
        return;
    }
    
    destinationAirports.forEach(destCode => {
        const destination = airportsList.find(airport => airport.icao === destCode);
        
        if (destination) {
            const flightPath = new google.maps.Polyline({
                path: [
                    { lat: origin.lat, lng: origin.lon },
                    { lat: destination.lat, lng: destination.lon }
                ],
                geodesic: true,
                strokeColor: '#e74c3c',
                strokeOpacity: 0.8,
                strokeWeight: 3
            });
            
            flightPath.setMap(map);
            flightPaths.push(flightPath);
        }
    });
}

// Show airport information in info window
function showAirportInfo(airport, marker, isOrigin = false, isDestination = false) {
    let roleText = '';
    if (isOrigin) {
        roleText = '<div style="color: #e74c3c; font-weight: bold;">🛫 Origin Airport</div>';
    } else if (isDestination) {
        roleText = '<div style="color: #27ae60; font-weight: bold;">🛬 Destination Airport</div>';
    }
    
    const content = `
        <div class="info-window">
            <h4>${airport.name}</h4>
            <div class="icao">${airport.icao}</div>
            <div class="country">${airport.city}, ${airport.state}</div>
            ${roleText}
        </div>
    `;

    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}

// Populate the airport table with flight routes
function populateAirportList(airportsList) {
    const airportTableBody = document.getElementById('airport-list');
    const originAirportData = airportsList.find(airport => airport.icao === originAirport);
    
    if (!originAirportData) {
        console.error('Origin airport not found in data');
        return;
    }

    // Create rows for each destination
    destinationAirports.forEach((destCode, index) => {
        const destinationAirport = airportsList.find(airport => airport.icao === destCode);
        
        if (destinationAirport) {
            const duration = flightDurations[destCode] || 0;
            const formattedDuration = formatDuration(duration);
            
            const row = document.createElement('tr');
            row.className = 'airport-row';
            row.innerHTML = `
                <td class="origin-cell">
                    <span class="airport-icon">🛫</span>
                    ${originAirportData.icao}
                </td>
                <td class="destination-cell">
                    <span class="airport-icon">🛬</span>
                    ${destinationAirport.icao}
                </td>
                <td class="airport-name">
                    ${destinationAirport.name}
                    <div class="airport-location">${destinationAirport.city}, ${destinationAirport.state}</div>
                </td>
                <td class="duration-cell">
                    ${formattedDuration}
                </td>
            `;

            // Add click event to row
            row.addEventListener('click', () => {
                // Find the marker index for this destination
                const markerIndex = airportsList.findIndex(airport => airport.icao === destCode);
                if (markerIndex !== -1) {
                    // Center map on selected airport
                    map.setCenter({ lat: destinationAirport.lat, lng: destinationAirport.lon });
                    map.setZoom(10);
                    
                    // Show info window for this airport
                    showAirportInfo(destinationAirport, markers[markerIndex], false, true);
                    
                    // Highlight the selected row
                    document.querySelectorAll('.airport-row').forEach(r => {
                        r.classList.remove('selected');
                    });
                    row.classList.add('selected');
                }
            });

            // Add hover events to highlight airport and routes on map
            row.addEventListener('mouseenter', () => {
                const markerIndex = airportsList.findIndex(airport => airport.icao === destCode);
                if (markerIndex !== -1) {
                    highlightAirportAndRoutes(destinationAirport, markerIndex, true);
                    row.classList.add('hover');
                }
            });

            row.addEventListener('mouseleave', () => {
                const markerIndex = airportsList.findIndex(airport => airport.icao === destCode);
                if (markerIndex !== -1) {
                    highlightAirportAndRoutes(destinationAirport, markerIndex, false);
                    row.classList.remove('hover');
                }
            });

            airportTableBody.appendChild(row);
        }
    });
}

// Highlight airport marker and associated routes on hover
function highlightAirportAndRoutes(airport, markerIndex, highlight) {
    const marker = markers[markerIndex];
    const isOrigin = airport.icao === originAirport;
    const isDestination = destinationAirports.includes(airport.icao);
    
    if (highlight) {
        // Scale up the marker
        marker.setIcon({
            url: marker.getIcon().url,
            scaledSize: new google.maps.Size(48, 48), // Larger size
            anchor: new google.maps.Point(24, 24)
        });
        
        // Highlight associated flight paths
        if (isOrigin) {
            // If hovering over origin, highlight all outbound routes
            flightPaths.forEach(path => {
                path.setOptions({
                    strokeWeight: 5,
                    strokeOpacity: 1.0,
                    strokeColor: '#c0392b' // Darker red
                });
            });
        } else if (isDestination) {
            // If hovering over destination, highlight the route from origin to this destination
            const originAirportData = getSpecificAirports().find(a => a.icao === originAirport);
            if (originAirportData) {
                flightPaths.forEach(path => {
                    const pathCoordinates = path.getPath().getArray();
                    // Check if this path connects to the hovered destination
                    if (pathCoordinates.length === 2) {
                        const destLat = pathCoordinates[1].lat();
                        const destLng = pathCoordinates[1].lng();
                        if (Math.abs(destLat - airport.lat) < 0.01 && Math.abs(destLng - airport.lon) < 0.01) {
                            path.setOptions({
                                strokeWeight: 5,
                                strokeOpacity: 1.0,
                                strokeColor: '#c0392b' // Darker red
                            });
                        }
                    }
                });
            }
        }
    } else {
        // Reset marker to normal size
        const isOriginMarker = airport.icao === originAirport;
        const isDestinationMarker = destinationAirports.includes(airport.icao);
        
        let markerColor = '#3498db'; // Default blue
        if (isOriginMarker) {
            markerColor = '#e74c3c'; // Red for origin
        } else if (isDestinationMarker) {
            markerColor = '#27ae60'; // Green for destinations
        }
        
        marker.setIcon({
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" fill="${markerColor}" stroke="#2c3e50" stroke-width="2"/>
                    <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">✈</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
        });
        
        // Reset all flight paths to normal
        flightPaths.forEach(path => {
            path.setOptions({
                strokeWeight: 3,
                strokeOpacity: 0.8,
                strokeColor: '#e74c3c' // Original red
            });
        });
    }
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
