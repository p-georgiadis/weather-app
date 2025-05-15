document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const weatherInfo = document.getElementById('weather-info');
    const loadingElement = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const location = document.getElementById('location');
    const dateElement = document.getElementById('date');
    const temperature = document.getElementById('temperature');
    const weatherIcon = document.getElementById('weather-icon');
    const conditions = document.getElementById('conditions');
    const windSpeed = document.getElementById('wind-speed');
    const humidity = document.getElementById('humidity');
    const feelsLike = document.getElementById('feels-like');
    const forecastContainer = document.getElementById('forecast-container');
    const airQualityContainer = document.getElementById('air-quality-container');
    const aqiValue = document.getElementById('aqi-value');
    const aqiDescription = document.getElementById('aqi-description');
    const coValue = document.getElementById('co-value');
    const no2Value = document.getElementById('no2-value');
    const o3Value = document.getElementById('o3-value');
    const pm25Value = document.getElementById('pm25-value');
    const pm10Value = document.getElementById('pm10-value');
    const so2Value = document.getElementById('so2-value');

    // Weather icon mapping from OpenWeatherMap codes
    const getWeatherIconClass = (condition) => {
        const iconMap = {
            'Clear': 'fa-sun',
            'Clouds': 'fa-cloud',
            'Rain': 'fa-cloud-rain',
            'Drizzle': 'fa-cloud-rain',
            'Thunderstorm': 'fa-bolt',
            'Snow': 'fa-snowflake',
            'Mist': 'fa-smog',
            'Smoke': 'fa-smog',
            'Haze': 'fa-smog',
            'Dust': 'fa-smog',
            'Fog': 'fa-smog',
            'Sand': 'fa-smog',
            'Ash': 'fa-smog',
            'Squall': 'fa-wind',
            'Tornado': 'fa-wind'
        };
        
        return iconMap[condition] || 'fa-cloud';
    };

    // Initialize with default city
    getWeather('Stockholm');

    // Event Listeners
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            getWeather(city);
        }
    });

    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                getWeather(city);
            }
        }
    });

    // Set current date
    function setCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }

    // Format time from Unix timestamp
    function formatTime(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Get weather data from API
    async function getWeather(city) {
        // Show loading state
        weatherInfo.classList.add('hidden');
        errorMessage.classList.add('hidden');
        loadingElement.classList.remove('hidden');
        forecastContainer.innerHTML = '';

        try {
            // Get current weather
            const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
            
            if (!response.ok) {
                throw new Error('City not found');
            }
            
            const data = await response.json();
            
            // Update UI with weather data
            updateWeatherUI(data);
            
        } catch (error) {
            // Show error message
            loadingElement.classList.add('hidden');
            errorMessage.classList.remove('hidden');
            console.error('Error fetching weather data:', error);
        }
    }

    // Update UI with weather data
    function updateWeatherUI(data) {
        // Hide loading, show weather info
        loadingElement.classList.add('hidden');
        weatherInfo.classList.remove('hidden');
        
        // Update elements
        location.textContent = data.location + (data.country ? `, ${data.country}` : '');
        setCurrentDate();
        temperature.textContent = `${data.temperature}°C`;
        
        // Set weather condition and icon
        conditions.textContent = data.description ? 
            data.description.charAt(0).toUpperCase() + data.description.slice(1) : 
            data.conditions;
        
        const iconClass = getWeatherIconClass(data.conditions);
        weatherIcon.className = `fas ${iconClass}`;
        
        // Set additional info
        windSpeed.textContent = `${data.wind_speed} km/h`;
        humidity.textContent = `${data.humidity}%`;
        feelsLike.textContent = `${data.feels_like}°C`;

        // Now get the forecast
        getForecast(data.location);

        // Get air quality data
        getAirPollutionData(data.location);
    }

    // Get forecast data
    async function getForecast(city) {
        try {
            const response = await fetch(`/api/forecast?city=${encodeURIComponent(city)}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch forecast data');
            }
            
            const data = await response.json();
            updateForecastUI(data.forecast);
            
        } catch (error) {
            console.error('Error fetching forecast:', error);
        }
    }

    // Update UI with forecast data
    function updateForecastUI(forecastData) {
        forecastContainer.innerHTML = '';
        
        // Create forecast items
        forecastData.forEach(day => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const iconClass = getWeatherIconClass(day.conditions);
            
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <p class="day">${dayName}</p>
                <p class="date">${dateStr}</p>
                <div class="forecast-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <p class="forecast-temp">${day.temp_max}°C / ${day.temp_min}°C</p>
                <p class="forecast-condition">${day.description || day.conditions}</p>
                ${day.pop !== undefined ? `<p class="forecast-pop"><i class="fas fa-tint"></i> ${Math.round(day.pop)}%</p>` : ''}
            `;
            
            forecastContainer.appendChild(forecastItem);
        });
    }

    // Try to get hourly data if available
    async function getHourlyData(city) {
        try {
            const response = await fetch(`/api/hourly?city=${encodeURIComponent(city)}`);
            
            if (response.ok) {
                // Hourly API is available
                console.log('Hourly API is available on your plan');
                return await response.json();
            }
            return null;
        } catch (error) {
            console.log('Using standard API endpoints');
            return null;
        }
    }

    // Get air pollution data and update UI
    async function getAirPollutionData(city) {
        try {
            const response = await fetch(`/api/air-pollution?city=${encodeURIComponent(city)}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch air pollution data');
            }
            
            const data = await response.json();
            
            // Show the air quality container
            airQualityContainer.classList.remove('hidden');
            
            // Update the AQI and description
            const airData = data.list[0];
            const aqi = airData.main.aqi;
            aqiValue.textContent = aqi;
            
            // Map AQI to description
            const aqiDescriptions = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
            aqiDescription.textContent = aqiDescriptions[aqi];
            
            // Add color based on AQI
            const aqiColors = ['', '#90EE90', '#FFFF00', '#FFA500', '#FF0000', '#800080'];
            aqiValue.style.color = aqiColors[aqi];
            aqiDescription.style.color = aqiColors[aqi];
            
            // Update pollutant values
            coValue.textContent = `${airData.components.co.toFixed(2)} μg/m³`;
            no2Value.textContent = `${airData.components.no2.toFixed(2)} μg/m³`;
            o3Value.textContent = `${airData.components.o3.toFixed(2)} μg/m³`;
            pm25Value.textContent = `${airData.components.pm2_5.toFixed(2)} μg/m³`;
            pm10Value.textContent = `${airData.components.pm10.toFixed(2)} μg/m³`;
            so2Value.textContent = `${airData.components.so2.toFixed(2)} μg/m³`;
            
        } catch (error) {
            console.error('Error fetching air pollution data:', error);
            // Hide the air quality container if there's an error
            airQualityContainer.classList.add('hidden');
        }
    }

    // Initialize with air quality data for default city
    getWeather('Stockholm');
});
// Server info functionality
const serverInfoToggle = document.getElementById('server-info-toggle');
const serverInfoPanel = document.getElementById('server-info-panel');
const serverHostname = document.getElementById('server-hostname');
const serverPod = document.getElementById('server-pod');
const serverNode = document.getElementById('server-node');
const serverNamespace = document.getElementById('server-namespace');
const serverTime = document.getElementById('server-time');

serverInfoToggle.addEventListener('click', () => {
    serverInfoPanel.classList.toggle('hidden');
    fetchServerInfo();
});

async function fetchServerInfo() {
    try {
        const response = await fetch('/api/server-info');
        if (response.ok) {
            const data = await response.json();

            serverHostname.textContent = data.hostname;
            serverPod.textContent = data.podName;
            serverNode.textContent = data.nodeName;
            serverNamespace.textContent = data.namespace;
            serverTime.textContent = new Date(data.timestamp).toLocaleString();
        }
    } catch (error) {
        console.error('Error fetching server info:', error);
        serverHostname.textContent = 'Error fetching data';
    }
}

// Fetch server info every 10 seconds when panel is visible
setInterval(() => {
    if (!serverInfoPanel.classList.contains('hidden')) {
        fetchServerInfo();
    }
}, 10000);