/**
 * WeAD Location Targeting System
 * Interactive map-based geographic targeting for campaigns
 */

class LocationTargetingSystem {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.map = null;
        this.markers = [];
        this.selectedLocations = new Set();
        this.options = {
            center: [37.7749, -122.4194], // San Francisco
            zoom: 10,
            ...options
        };

        this.init();
    }

    async init() {
        try {
            // Load Leaflet CSS and JS dynamically
            await this.loadLeaflet();

            // Initialize map
            this.createMap();

            // Load micro-advertiser locations
            await this.loadAdvertiserLocations();

            // Setup event listeners
            this.setupEventListeners();

        } catch (error) {
            console.error('Failed to initialize location targeting system:', error);
            this.showFallbackInterface();
        }
    }

    async loadLeaflet() {
        return new Promise((resolve, reject) => {
            // Check if Leaflet is already loaded
            if (window.L) {
                resolve();
                return;
            }

            // Load Leaflet CSS
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            cssLink.crossOrigin = '';
            document.head.appendChild(cssLink);

            // Load Leaflet JS
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';

            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    createMap() {
        // Create map container
        const mapContainer = document.createElement('div');
        mapContainer.id = 'wead-map';
        mapContainer.style.height = '500px';
        mapContainer.style.width = '100%';
        mapContainer.style.borderRadius = '15px';
        mapContainer.style.overflow = 'hidden';

        this.container.appendChild(mapContainer);

        // Initialize Leaflet map
        this.map = L.map('wead-map').setView(this.options.center, this.options.zoom);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(this.map);

        // Add custom styling
        this.addMapStyling();

        // Add controls
        this.addMapControls();
    }

    addMapStyling() {
        // Add custom CSS for map
        const style = document.createElement('style');
        style.textContent = `
            .leaflet-popup-content-wrapper {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 10px;
                border: 1px solid rgba(255, 69, 0, 0.2);
            }

            .leaflet-popup-tip {
                background: rgba(255, 69, 0, 0.2);
            }

            .wead-marker-selected {
                filter: hue-rotate(90deg) brightness(1.2);
            }

            .wead-heatmap-overlay {
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 1000;
            }
        `;
        document.head.appendChild(style);
    }

    addMapControls() {
        // Add custom controls
        const controls = document.createElement('div');
        controls.className = 'wead-heatmap-overlay';
        controls.innerHTML = `
            <div style="background: rgba(0,0,0,0.8); padding: 10px; border-radius: 10px; color: white;">
                <div style="margin-bottom: 10px;">
                    <strong>Location Targeting</strong>
                </div>
                <div style="margin-bottom: 5px;">
                    <input type="checkbox" id="heatmap-toggle" style="margin-right: 5px;">
                    <label for="heatmap-toggle">Show Heatmap</label>
                </div>
                <div style="margin-bottom: 5px;">
                    <input type="checkbox" id="cluster-toggle" checked style="margin-right: 5px;">
                    <label for="cluster-toggle">Cluster Markers</label>
                </div>
                <div style="font-size: 12px; color: #ccc;">
                    Selected: <span id="selected-count">0</span> locations
                </div>
            </div>
        `;

        this.container.appendChild(controls);

        // Add event listeners for controls
        document.getElementById('heatmap-toggle').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.showHeatmap();
            } else {
                this.hideHeatmap();
            }
        });

        document.getElementById('cluster-toggle').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.enableClustering();
            } else {
                this.disableClustering();
            }
        });
    }

    async loadAdvertiserLocations() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                console.warn('No auth token available');
                return;
            }

            // Get current targeting filters
            const country = document.getElementById('targetCountry')?.value || '';
            const deviceType = document.getElementById('timeSchedule')?.value || '';

            let url = '/api/micro-advertisers?status=online&limit=500';
            if (country && country !== 'global') {
                url += `&country=${encodeURIComponent(country)}`;
            }
            if (deviceType) {
                url += `&device_type=${encodeURIComponent(deviceType)}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const advertisers = await response.json();
                this.displayAdvertiserLocations(advertisers);
            } else {
                console.error('Failed to load advertiser locations');
                this.showMockLocations();
            }
        } catch (error) {
            console.error('Error loading advertiser locations:', error);
            this.showMockLocations();
        }
    }

    displayAdvertiserLocations(advertisers) {
        // Clear existing markers
        this.clearMarkers();

        // Create marker cluster group
        this.markerCluster = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true
        });

        advertisers.forEach(advertiser => {
            this.createAdvertiserMarker(advertiser);
        });

        // Add markers to map
        this.map.addLayer(this.markerCluster);

        // Fit map to show all markers
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    createAdvertiserMarker(advertiser) {
        const location = advertiser.location_geojson ?
            JSON.parse(advertiser.location_geojson) :
            { coordinates: [advertiser.longitude || 0, advertiser.latitude || 0] };

        const lat = location.coordinates[1] || 0;
        const lng = location.coordinates[0] || 0;

        if (lat === 0 && lng === 0) return; // Skip invalid locations

        // Create custom icon based on device type
        const icon = this.createCustomIcon(advertiser.device_type, advertiser.status);

        const marker = L.marker([lat, lng], { icon });

        // Create popup content
        const popupContent = this.createPopupContent(advertiser);
        marker.bindPopup(popupContent);

        // Add click handler
        marker.on('click', () => {
            this.toggleLocationSelection(advertiser.device_id, marker);
        });

        this.markers.push(marker);
        this.markerCluster.addLayer(marker);
    }

    createCustomIcon(deviceType, status) {
        let iconClass = 'fas fa-map-marker-alt';
        let color = '#ff4500';

        switch (deviceType) {
            case 'car':
                iconClass = 'fas fa-car';
                break;
            case 'building':
                iconClass = 'fas fa-building';
                break;
            case 'wearable':
                iconClass = 'fas fa-user';
                break;
            case 'foodcart':
                iconClass = 'fas fa-shopping-cart';
                break;
            default:
                iconClass = 'fas fa-mobile-alt';
        }

        if (status !== 'online') {
            color = '#666666';
        }

        // Create custom div icon
        return L.divIcon({
            html: `<div style="background: ${color}; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                <i class="${iconClass}"></i>
            </div>`,
            className: 'custom-div-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
    }

    createPopupContent(advertiser) {
        const earnings = parseFloat(advertiser.earnings || 0).toFixed(2);
        const views = advertiser.total_views || 0;
        const uptime = advertiser.uptime_percentage || 0;

        return `
            <div style="min-width: 200px;">
                <h4 style="margin: 0 0 10px 0; color: #ff4500;">${advertiser.location_name || 'Unknown Location'}</h4>
                <div style="margin-bottom: 5px;">
                    <strong>Device:</strong> ${advertiser.device_type || 'Unknown'}
                </div>
                <div style="margin-bottom: 5px;">
                    <strong>Status:</strong>
                    <span style="color: ${advertiser.status === 'online' ? '#22c55e' : '#ef4444'};">
                        ${advertiser.status || 'Unknown'}
                    </span>
                </div>
                <div style="margin-bottom: 5px;">
                    <strong>Earnings:</strong> ${earnings} WEAD
                </div>
                <div style="margin-bottom: 5px;">
                    <strong>Total Views:</strong> ${views.toLocaleString()}
                </div>
                <div style="margin-bottom: 10px;">
                    <strong>Uptime:</strong> ${uptime}%
                </div>
                <button onclick="selectLocation('${advertiser.device_id}')"
                        style="background: #ff4500; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                    Select Location
                </button>
            </div>
        `;
    }

    toggleLocationSelection(deviceId, marker) {
        if (this.selectedLocations.has(deviceId)) {
            this.selectedLocations.delete(deviceId);
            marker.setOpacity(1);
            marker._icon.classList.remove('wead-marker-selected');
        } else {
            this.selectedLocations.add(deviceId);
            marker.setOpacity(0.8);
            marker._icon.classList.add('wead-marker-selected');
        }

        this.updateSelectedCount();
        this.updateCampaignData();
    }

    updateSelectedCount() {
        const countElement = document.getElementById('selected-count');
        if (countElement) {
            countElement.textContent = this.selectedLocations.size;
        }
    }

    updateCampaignData() {
        // Update campaign data with selected locations
        if (window.campaignData) {
            window.campaignData.selectedLocations = Array.from(this.selectedLocations);
        }
    }

    showHeatmap() {
        // Create heatmap data
        const heatData = this.markers.map(marker => {
            const latlng = marker.getLatLng();
            return [latlng.lat, latlng.lng, 0.5]; // [lat, lng, intensity]
        });

        if (window.heat) {
            this.map.removeLayer(window.heat);
        }

        // Note: This would require the Leaflet.heat plugin
        // For now, we'll create a simple overlay
        this.createHeatmapOverlay(heatData);
    }

    createHeatmapOverlay(data) {
        // Simple heatmap visualization using canvas
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.opacity = '0.6';

        const mapContainer = this.map.getContainer();
        canvas.width = mapContainer.offsetWidth;
        canvas.height = mapContainer.offsetHeight;

        const ctx = canvas.getContext('2d');

        // Draw heatmap points
        data.forEach(point => {
            const pixel = this.map.latLngToContainerPoint([point[0], point[1]]);
            const gradient = ctx.createRadialGradient(pixel.x, pixel.y, 0, pixel.x, pixel.y, 30);

            gradient.addColorStop(0, 'rgba(255, 69, 0, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(pixel.x - 30, pixel.y - 30, 60, 60);
        });

        mapContainer.appendChild(canvas);
        this.heatmapCanvas = canvas;
    }

    hideHeatmap() {
        if (this.heatmapCanvas) {
            this.heatmapCanvas.remove();
            this.heatmapCanvas = null;
        }
    }

    enableClustering() {
        if (this.markerCluster && !this.map.hasLayer(this.markerCluster)) {
            this.map.addLayer(this.markerCluster);
        }
    }

    disableClustering() {
        if (this.markerCluster && this.map.hasLayer(this.markerCluster)) {
            this.map.removeLayer(this.markerCluster);
            // Add individual markers
            this.markers.forEach(marker => {
                this.map.addLayer(marker);
            });
        }
    }

    clearMarkers() {
        if (this.markerCluster) {
            this.map.removeLayer(this.markerCluster);
        }
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
        this.selectedLocations.clear();
        this.updateSelectedCount();
    }

    showMockLocations() {
        // Show some mock locations for demonstration
        const mockAdvertisers = [
            { device_id: 'MOCK-001', location_name: 'Seoul Station', device_type: 'building', status: 'online', latitude: 37.5559, longitude: 126.9723, earnings: 150.50, total_views: 1250 },
            { device_id: 'MOCK-002', location_name: 'Gangnam District', device_type: 'car', status: 'online', latitude: 37.5172, longitude: 127.0473, earnings: 89.30, total_views: 890 },
            { device_id: 'MOCK-003', location_name: 'Hongdae Area', device_type: 'wearable', status: 'offline', latitude: 37.5567, longitude: 126.9236, earnings: 234.75, total_views: 2100 },
            { device_id: 'MOCK-004', location_name: 'Times Square', device_type: 'building', status: 'online', latitude: 40.7580, longitude: -73.9855, earnings: 456.20, total_views: 3200 },
            { device_id: 'MOCK-005', location_name: 'Shibuya Crossing', device_type: 'car', status: 'online', latitude: 35.6595, longitude: 139.7006, earnings: 198.90, total_views: 1650 }
        ];

        this.displayAdvertiserLocations(mockAdvertisers);
    }

    showFallbackInterface() {
        // Fallback interface when map fails to load
        this.container.innerHTML = `
            <div style="padding: 20px; text-align: center; background: rgba(255, 255, 255, 0.05); border-radius: 15px;">
                <h3 style="color: var(--quantum-primary); margin-bottom: 15px;">
                    <i class="fas fa-map-marked-alt"></i> Location Targeting
                </h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">
                    Interactive map is loading... Please select your target regions below:
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="background: rgba(255, 69, 0, 0.1); padding: 15px; border-radius: 10px;">
                        <h4>Global Coverage</h4>
                        <p>Reach advertisers worldwide</p>
                        <input type="radio" name="targeting" value="global" checked>
                    </div>
                    <div style="background: rgba(255, 69, 0, 0.1); padding: 15px; border-radius: 10px;">
                        <h4>Regional Focus</h4>
                        <p>Target specific countries</p>
                        <input type="radio" name="targeting" value="regional">
                    </div>
                    <div style="background: rgba(255, 69, 0, 0.1); padding: 15px; border-radius: 10px;">
                        <h4>Local Targeting</h4>
                        <p>Precise city-level targeting</p>
                        <input type="radio" name="targeting" value="local">
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Listen for country changes
        const countrySelect = document.getElementById('targetCountry');
        if (countrySelect) {
            countrySelect.addEventListener('change', () => {
                this.loadAdvertiserLocations();
            });
        }

        // Listen for device type changes
        const deviceSelect = document.getElementById('timeSchedule');
        if (deviceSelect) {
            deviceSelect.addEventListener('change', () => {
                this.loadAdvertiserLocations();
            });
        }
    }

    getSelectedLocations() {
        return Array.from(this.selectedLocations);
    }

    getSelectedCount() {
        return this.selectedLocations.size;
    }

    // Public method to select a location programmatically
    selectLocation(deviceId) {
        const marker = this.markers.find(m => m.deviceId === deviceId);
        if (marker) {
            this.toggleLocationSelection(deviceId, marker);
        }
    }
}

// Global function for popup buttons
function selectLocation(deviceId) {
    if (window.locationTargetingSystem) {
        window.locationTargetingSystem.selectLocation(deviceId);
    }
}

// Initialize location targeting when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize location targeting system
    const locationContainer = document.getElementById('location-targeting-container');
    if (locationContainer) {
        window.locationTargetingSystem = new LocationTargetingSystem('location-targeting-container', {
            center: [37.7749, -122.4194],
            zoom: 3
        });
    }
});

