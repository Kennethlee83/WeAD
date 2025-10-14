/**
 * WeAD Analytics Dashboard
 * Real-time campaign performance visualization and reporting
 */

class AnalyticsDashboard {
    constructor(containerId, campaignId = null) {
        this.container = document.getElementById(containerId);
        this.campaignId = campaignId;
        this.charts = {};
        this.data = {};
        this.intervals = {};
        this.isRealTime = true;

        this.init();
    }

    async init() {
        this.createDashboardStructure();
        await this.loadAnalyticsData();

        if (this.isRealTime) {
            this.startRealTimeUpdates();
        }

        this.setupEventListeners();
    }

    createDashboardStructure() {
        this.container.innerHTML = `
            <div class="analytics-dashboard">
                <!-- Dashboard Header -->
                <div class="analytics-header">
                    <div class="analytics-controls">
                        <h2 class="analytics-title">
                            <i class="fas fa-chart-line"></i>
                            Campaign Analytics
                        </h2>
                        <div class="analytics-filters">
                            <select id="timeRange" class="analytics-select">
                                <option value="1h">Last Hour</option>
                                <option value="24h" selected>Last 24 Hours</option>
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                                <option value="all">All Time</option>
                            </select>
                            <button id="refreshBtn" class="btn btn-secondary">
                                <i class="fas fa-sync-alt"></i> Refresh
                            </button>
                            <button id="exportBtn" class="btn btn-secondary">
                                <i class="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Key Metrics Cards -->
                <div class="analytics-metrics">
                    <div class="metric-card" id="viewsCard">
                        <div class="metric-icon">
                            <i class="fas fa-eye"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="totalViews">0</div>
                            <div class="metric-label">Total Views</div>
                            <div class="metric-change" id="viewsChange">
                                <span class="change-value">+0%</span> vs yesterday
                            </div>
                        </div>
                    </div>

                    <div class="metric-card" id="engagementCard">
                        <div class="metric-icon">
                            <i class="fas fa-heart"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="engagementRate">0%</div>
                            <div class="metric-label">Engagement Rate</div>
                            <div class="metric-change" id="engagementChange">
                                <span class="change-value">+0%</span> vs yesterday
                            </div>
                        </div>
                    </div>

                    <div class="metric-card" id="earningsCard">
                        <div class="metric-icon">
                            <i class="fas fa-coins"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="totalEarnings">0 WEAD</div>
                            <div class="metric-label">Total Earnings</div>
                            <div class="metric-change" id="earningsChange">
                                <span class="change-value">+0%</span> vs yesterday
                            </div>
                        </div>
                    </div>

                    <div class="metric-card" id="reachCard">
                        <div class="metric-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="uniqueReach">0</div>
                            <div class="metric-label">Unique Reach</div>
                            <div class="metric-change" id="reachChange">
                                <span class="change-value">+0%</span> vs yesterday
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts Grid -->
                <div class="analytics-charts">
                    <!-- Views Over Time Chart -->
                    <div class="chart-container glass">
                        <div class="chart-header">
                            <h3>Views Over Time</h3>
                            <div class="chart-controls">
                                <button class="chart-toggle active" data-chart="line">Line</button>
                                <button class="chart-toggle" data-chart="bar">Bar</button>
                                <button class="chart-toggle" data-chart="area">Area</button>
                            </div>
                        </div>
                        <canvas id="viewsChart" height="300"></canvas>
                    </div>

                    <!-- Geographic Performance -->
                    <div class="chart-container glass">
                        <div class="chart-header">
                            <h3>Geographic Performance</h3>
                            <div class="chart-controls">
                                <button class="chart-toggle active" data-type="map">Map</button>
                                <button class="chart-toggle" data-type="regions">Regions</button>
                            </div>
                        </div>
                        <div id="geographicChart" style="height: 300px;">
                            <canvas id="regionsChart" height="300"></canvas>
                        </div>
                    </div>

                    <!-- Device Type Performance -->
                    <div class="chart-container glass">
                        <div class="chart-header">
                            <h3>Device Type Performance</h3>
                        </div>
                        <canvas id="deviceChart" height="300"></canvas>
                    </div>

                    <!-- Time of Day Performance -->
                    <div class="chart-container glass">
                        <div class="chart-header">
                            <h3>Performance by Time of Day</h3>
                        </div>
                        <canvas id="timeChart" height="300"></canvas>
                    </div>
                </div>

                <!-- Detailed Tables -->
                <div class="analytics-tables">
                    <!-- Top Performing Locations -->
                    <div class="table-container glass">
                        <div class="table-header">
                            <h3>Top Performing Locations</h3>
                        </div>
                        <div class="table-responsive">
                            <table id="locationsTable">
                                <thead>
                                    <tr>
                                        <th>Location</th>
                                        <th>Views</th>
                                        <th>Engagement</th>
                                        <th>Earnings</th>
                                        <th>Device Type</th>
                                    </tr>
                                </thead>
                                <tbody id="locationsTableBody">
                                    <tr>
                                        <td colspan="5" class="loading">Loading data...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="table-container glass">
                        <div class="table-header">
                            <h3>Recent Activity</h3>
                        </div>
                        <div class="table-responsive">
                            <table id="activityTable">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Event</th>
                                        <th>Location</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody id="activityTableBody">
                                    <tr>
                                        <td colspan="4" class="loading">Loading activity...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Export Modal (Hidden by default) -->
                <div id="exportModal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Export Analytics Data</h3>
                            <button class="modal-close" onclick="this.closest('.modal').style.display='none'">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="export-options">
                                <label>
                                    <input type="checkbox" checked> Include Charts
                                </label>
                                <label>
                                    <input type="checkbox" checked> Include Tables
                                </label>
                                <label>
                                    <input type="checkbox" checked> Include Raw Data
                                </label>
                            </div>
                            <div class="export-formats">
                                <button class="btn btn-primary" onclick="exportAsPDF()">
                                    <i class="fas fa-file-pdf"></i> Export as PDF
                                </button>
                                <button class="btn btn-secondary" onclick="exportAsCSV()">
                                    <i class="fas fa-file-csv"></i> Export as CSV
                                </button>
                                <button class="btn btn-secondary" onclick="exportAsJSON()">
                                    <i class="fas fa-file-code"></i> Export as JSON
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.addDashboardStyles();
    }

    addDashboardStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .analytics-dashboard {
                padding: 2rem;
                max-width: 1400px;
                margin: 0 auto;
            }

            .analytics-header {
                margin-bottom: 2rem;
            }

            .analytics-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
            }

            .analytics-title {
                color: var(--quantum-primary);
                margin: 0;
                font-size: 2rem;
            }

            .analytics-filters {
                display: flex;
                gap: 1rem;
                align-items: center;
            }

            .analytics-select {
                padding: 0.5rem 1rem;
                border: 2px solid var(--glass-border);
                border-radius: 10px;
                background: var(--glass-bg);
                color: var(--text-primary);
                font-size: 0.9rem;
            }

            .analytics-metrics {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 1.5rem;
                margin-bottom: 3rem;
            }

            .metric-card {
                background: var(--glass-bg);
                backdrop-filter: blur(20px);
                border: 1px solid var(--glass-border);
                border-radius: 15px;
                padding: 2rem;
                display: flex;
                align-items: center;
                gap: 1.5rem;
                transition: var(--transition-quantum);
                position: relative;
                overflow: hidden;
            }

            .metric-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background: var(--gradient-primary);
            }

            .metric-card:hover {
                transform: translateY(-5px);
                box-shadow: var(--shadow-quantum);
            }

            .metric-icon {
                width: 60px;
                height: 60px;
                border-radius: 15px;
                background: var(--gradient-primary);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.5rem;
            }

            .metric-content {
                flex: 1;
            }

            .metric-value {
                font-size: 2.5rem;
                font-weight: 800;
                color: var(--text-primary);
                margin-bottom: 0.5rem;
            }

            .metric-label {
                color: var(--text-secondary);
                font-size: 1rem;
                margin-bottom: 0.5rem;
            }

            .metric-change {
                font-size: 0.9rem;
                color: var(--text-muted);
            }

            .change-value.positive {
                color: #22c55e;
            }

            .change-value.negative {
                color: #ef4444;
            }

            .analytics-charts {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
                gap: 2rem;
                margin-bottom: 3rem;
            }

            .chart-container {
                padding: 2rem;
                position: relative;
            }

            .chart-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }

            .chart-header h3 {
                color: var(--quantum-primary);
                margin: 0;
                font-size: 1.3rem;
            }

            .chart-controls {
                display: flex;
                gap: 0.5rem;
            }

            .chart-toggle {
                padding: 0.3rem 0.8rem;
                border: 1px solid var(--glass-border);
                background: var(--glass-bg);
                color: var(--text-secondary);
                border-radius: 20px;
                cursor: pointer;
                font-size: 0.8rem;
                transition: var(--transition-smooth);
            }

            .chart-toggle.active {
                background: var(--gradient-primary);
                color: white;
                border-color: var(--quantum-primary);
            }

            .analytics-tables {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
                gap: 2rem;
            }

            .table-container {
                padding: 2rem;
            }

            .table-header h3 {
                color: var(--quantum-primary);
                margin: 0 0 1.5rem 0;
                font-size: 1.3rem;
            }

            .table-responsive {
                overflow-x: auto;
            }

            table {
                width: 100%;
                border-collapse: collapse;
            }

            th, td {
                padding: 1rem;
                text-align: left;
                border-bottom: 1px solid var(--glass-border);
            }

            th {
                color: var(--text-primary);
                font-weight: 600;
                background: rgba(255, 69, 0, 0.05);
            }

            td {
                color: var(--text-secondary);
            }

            .loading {
                text-align: center;
                color: var(--text-muted);
                font-style: italic;
            }

            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .modal-content {
                background: var(--bg-secondary);
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }

            .modal-header {
                padding: 2rem;
                border-bottom: 1px solid var(--glass-border);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .modal-body {
                padding: 2rem;
            }

            .export-options {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin-bottom: 2rem;
            }

            .export-options label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
            }

            .export-formats {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }

            .modal-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 50%;
                transition: var(--transition-smooth);
            }

            .modal-close:hover {
                background: var(--glass-bg);
                color: var(--text-primary);
            }

            @media (max-width: 768px) {
                .analytics-metrics {
                    grid-template-columns: 1fr;
                }

                .analytics-charts {
                    grid-template-columns: 1fr;
                }

                .analytics-tables {
                    grid-template-columns: 1fr;
                }

                .analytics-controls {
                    flex-direction: column;
                    gap: 1rem;
                    align-items: stretch;
                }

                .metric-card {
                    padding: 1.5rem;
                }

                .metric-value {
                    font-size: 2rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    async loadAnalyticsData() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                console.warn('No auth token available');
                return;
            }

            let url = '/api/analytics';
            if (this.campaignId) {
                url += `/${this.campaignId}`;
            }

            const timeRange = document.getElementById('timeRange')?.value || '24h';
            url += `?time_range=${timeRange}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.data = await response.json();
                this.updateDashboard();
            } else {
                console.error('Failed to load analytics data');
                this.showMockData();
            }
        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.showMockData();
        }
    }

    updateDashboard() {
        this.updateMetrics();
        this.updateCharts();
        this.updateTables();
    }

    updateMetrics() {
        const { total_views = 0, engagement_rate = 0, total_earnings = 0, unique_reach = 0 } = this.data;

        // Update metric values
        document.getElementById('totalViews').textContent = total_views.toLocaleString();
        document.getElementById('engagementRate').textContent = `${engagement_rate.toFixed(1)}%`;
        document.getElementById('totalEarnings').textContent = `${total_earnings.toFixed(2)} WEAD`;
        document.getElementById('uniqueReach').textContent = unique_reach.toLocaleString();

        // Update change indicators (mock data for demo)
        this.updateChangeIndicators();
    }

    updateChangeIndicators() {
        const changes = ['viewsChange', 'engagementChange', 'earningsChange', 'reachChange'];
        const mockChanges = [12.5, 8.3, 15.7, 6.2];

        changes.forEach((changeId, index) => {
            const element = document.getElementById(changeId);
            const changeValue = mockChanges[index];
            const changeElement = element.querySelector('.change-value');

            changeElement.textContent = `${changeValue > 0 ? '+' : ''}${changeValue}%`;
            changeElement.className = `change-value ${changeValue > 0 ? 'positive' : 'negative'}`;
        });
    }

    updateCharts() {
        this.createViewsChart();
        this.createDeviceChart();
        this.createTimeChart();
        this.createRegionsChart();
    }

    createViewsChart() {
        const ctx = document.getElementById('viewsChart').getContext('2d');

        if (this.charts.viewsChart) {
            this.charts.viewsChart.destroy();
        }

        const hourlyData = this.data.hourly_views || [];
        const labels = hourlyData.map(d => d.hour) || this.generateMockHours();
        const data = hourlyData.map(d => d.views) || this.generateMockViews();

        this.charts.viewsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Views',
                    data: data,
                    borderColor: '#ff4500',
                    backgroundColor: 'rgba(255, 69, 0, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#cccccc'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#cccccc'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    createDeviceChart() {
        const ctx = document.getElementById('deviceChart').getContext('2d');

        if (this.charts.deviceChart) {
            this.charts.deviceChart.destroy();
        }

        const deviceData = this.data.device_performance || this.generateMockDeviceData();

        this.charts.deviceChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: deviceData.map(d => d.device_type),
                datasets: [{
                    data: deviceData.map(d => d.views),
                    backgroundColor: [
                        '#ff4500',
                        '#ff6b35',
                        '#dc143c',
                        '#ff8c00',
                        '#ffd700'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#cccccc'
                        }
                    }
                }
            }
        });
    }

    createTimeChart() {
        const ctx = document.getElementById('timeChart').getContext('2d');

        if (this.charts.timeChart) {
            this.charts.timeChart.destroy();
        }

        const timeData = this.data.time_performance || this.generateMockTimeData();

        this.charts.timeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: timeData.map(d => d.hour),
                datasets: [{
                    label: 'Views by Hour',
                    data: timeData.map(d => d.views),
                    backgroundColor: '#ff4500',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#cccccc'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#cccccc'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    createRegionsChart() {
        const ctx = document.getElementById('regionsChart').getContext('2d');

        if (this.charts.regionsChart) {
            this.charts.regionsChart.destroy();
        }

        const regionData = this.data.geographic_performance || this.generateMockRegionData();

        this.charts.regionsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: regionData.map(d => d.region),
                datasets: [{
                    label: 'Views by Region',
                    data: regionData.map(d => d.views),
                    backgroundColor: '#ff4500',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#cccccc'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#cccccc'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    updateTables() {
        this.updateLocationsTable();
        this.updateActivityTable();
    }

    updateLocationsTable() {
        const tbody = document.getElementById('locationsTableBody');
        const locations = this.data.top_locations || this.generateMockLocations();

        tbody.innerHTML = locations.map(location => `
            <tr>
                <td>${location.name}</td>
                <td>${location.views.toLocaleString()}</td>
                <td>${location.engagement.toFixed(1)}%</td>
                <td>${location.earnings.toFixed(2)} WEAD</td>
                <td><span class="device-type ${location.device_type}">${location.device_type}</span></td>
            </tr>
        `).join('');
    }

    updateActivityTable() {
        const tbody = document.getElementById('activityTableBody');
        const activities = this.data.recent_activity || this.generateMockActivity();

        tbody.innerHTML = activities.map(activity => `
            <tr>
                <td>${new Date(activity.timestamp).toLocaleTimeString()}</td>
                <td>${activity.event}</td>
                <td>${activity.location}</td>
                <td>${activity.details}</td>
            </tr>
        `).join('');
    }

    startRealTimeUpdates() {
        // Update every 30 seconds
        this.intervals.realtime = setInterval(() => {
            this.loadAnalyticsData();
        }, 30000);
    }

    stopRealTimeUpdates() {
        if (this.intervals.realtime) {
            clearInterval(this.intervals.realtime);
            this.intervals.realtime = null;
        }
    }

    setupEventListeners() {
        // Time range selector
        const timeRange = document.getElementById('timeRange');
        if (timeRange) {
            timeRange.addEventListener('change', () => {
                this.loadAnalyticsData();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAnalyticsData();
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                document.getElementById('exportModal').style.display = 'flex';
            });
        }

        // Chart type toggles
        document.querySelectorAll('.chart-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const chartType = e.target.dataset.chart;
                const chartContainer = e.target.closest('.chart-container');

                // Update active state
                chartContainer.querySelectorAll('.chart-toggle').forEach(t => {
                    t.classList.remove('active');
                });
                e.target.classList.add('active');

                // Update chart type
                if (chartType) {
                    this.updateChartType(chartContainer.id, chartType);
                }
            });
        });
    }

    updateChartType(containerId, chartType) {
        // This would update the chart type for the specific container
        console.log(`Updating chart type for ${containerId} to ${chartType}`);
    }

    showMockData() {
        this.data = {
            total_views: 15420,
            engagement_rate: 8.5,
            total_earnings: 1542.00,
            unique_reach: 8750,
            ...this.generateMockAnalyticsData()
        };
        this.updateDashboard();
    }

    generateMockAnalyticsData() {
        return {
            hourly_views: this.generateMockHours().map((hour, i) => ({
                hour: hour,
                views: Math.floor(Math.random() * 100) + 50
            })),
            device_performance: this.generateMockDeviceData(),
            time_performance: this.generateMockTimeData(),
            geographic_performance: this.generateMockRegionData(),
            top_locations: this.generateMockLocations(),
            recent_activity: this.generateMockActivity()
        };
    }

    generateMockHours() {
        return Array.from({length: 24}, (_, i) => `${i}:00`);
    }

    generateMockViews() {
        return Array.from({length: 24}, () => Math.floor(Math.random() * 200) + 100);
    }

    generateMockDeviceData() {
        return [
            { device_type: 'Building', views: 4520 },
            { device_type: 'Car', views: 3890 },
            { device_type: 'Wearable', views: 2150 },
            { device_type: 'Food Cart', views: 1860 },
            { device_type: 'Other', views: 3000 }
        ];
    }

    generateMockTimeData() {
        return Array.from({length: 24}, (_, i) => ({
            hour: `${i}:00`,
            views: Math.floor(Math.random() * 150) + 50
        }));
    }

    generateMockRegionData() {
        return [
            { region: 'Seoul', views: 3200 },
            { region: 'Tokyo', views: 2800 },
            { region: 'New York', views: 2450 },
            { region: 'London', views: 2100 },
            { region: 'Singapore', views: 1870 }
        ];
    }

    generateMockLocations() {
        return [
            { name: 'Seoul Station', views: 1250, engagement: 12.5, earnings: 125.00, device_type: 'building' },
            { name: 'Gangnam District', views: 980, engagement: 9.8, earnings: 98.00, device_type: 'car' },
            { name: 'Hongdae Area', views: 875, engagement: 11.2, earnings: 87.50, device_type: 'wearable' },
            { name: 'Times Square', views: 720, engagement: 8.9, earnings: 72.00, device_type: 'building' },
            { name: 'Shibuya Crossing', views: 650, engagement: 10.5, earnings: 65.00, device_type: 'car' }
        ];
    }

    generateMockActivity() {
        return [
            { timestamp: Date.now() - 300000, event: 'View', location: 'Seoul Station', details: '15s engagement' },
            { timestamp: Date.now() - 600000, event: 'View', location: 'Gangnam District', details: '22s engagement' },
            { timestamp: Date.now() - 900000, event: 'Payment', location: 'System', details: '50 WEAD distributed' },
            { timestamp: Date.now() - 1200000, event: 'View', location: 'Hongdae Area', details: '18s engagement' },
            { timestamp: Date.now() - 1500000, event: 'View', location: 'Times Square', details: '25s engagement' }
        ];
    }

    exportAsPDF() {
        // Implement PDF export functionality
        console.log('Exporting as PDF...');
        alert('PDF export functionality would be implemented here');
    }

    exportAsCSV() {
        // Implement CSV export functionality
        console.log('Exporting as CSV...');
        alert('CSV export functionality would be implemented here');
    }

    exportAsJSON() {
        // Implement JSON export functionality
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'analytics-data.json';
        link.click();
    }

    destroy() {
        this.stopRealTimeUpdates();

        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });

        // Clear container
        this.container.innerHTML = '';
    }
}

// Global functions for export buttons
function exportAsPDF() {
    if (window.analyticsDashboard) {
        window.analyticsDashboard.exportAsPDF();
    }
}

function exportAsCSV() {
    if (window.analyticsDashboard) {
        window.analyticsDashboard.exportAsCSV();
    }
}

function exportAsJSON() {
    if (window.analyticsDashboard) {
        window.analyticsDashboard.exportAsJSON();
    }
}

// Initialize analytics dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize analytics dashboard
    const analyticsContainer = document.getElementById('analytics-container');
    if (analyticsContainer) {
        window.analyticsDashboard = new AnalyticsDashboard('analytics-container');
    }
});

