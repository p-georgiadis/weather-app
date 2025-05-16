document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Original
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

    // NEW: Additional DOM Elements for new features
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const unitToggle = document.getElementById('unit-toggle');
    const geolocateBtn = document.getElementById('geolocate-btn');
    const saveLocationBtn = document.getElementById('save-location-btn');
    const savedLocationsContainer = document.getElementById('saved-locations');
    const hourlyForecastContainer = document.getElementById('hourly-forecast-container');

    // NEW: Store the last queried location and forecast data for unit conversion
    let lastQueriedLocation = '';
    let lastForecastData = [];
    let lastHourlyData = [];

    // NEW: Temperature unit setting (true = Celsius, false = Fahrenheit)
    let useCelsius = localStorage.getItem('useCelsius') !== 'false'; // Default to Celsius

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

    // NEW: Dark Mode Toggle
    function initDarkMode() {
        // Check if dark mode is saved in localStorage
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        // Check if user prefers dark mode
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Set initial dark mode state
        if (savedDarkMode || prefersDarkMode) {
            document.body.classList.add('dark-mode');
            if (darkModeToggle) {
                darkModeToggle.checked = true;
            }
        }

        // Set up listener for dark mode toggle
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', toggleDarkMode);
        }
    }

    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    }

    // NEW: Temperature Unit Toggle
    function initTemperatureUnit() {
        if (unitToggle) {
            unitToggle.checked = !useCelsius;
            unitToggle.addEventListener('change', toggleTemperatureUnit);
        }

        // Update unit displays
        document.querySelectorAll('.unit-display').forEach(el => {
            el.textContent = useCelsius ? '°C' : '°F';
        });
    }

    function toggleTemperatureUnit() {
        useCelsius = !useCelsius;
        localStorage.setItem('useCelsius', useCelsius);

        // Update unit displays
        document.querySelectorAll('.unit-display').forEach(el => {
            el.textContent = useCelsius ? '°C' : '°F';
        });

        // Re-render weather with new unit if we have data
        if (lastQueriedLocation) {
            updateTemperatureDisplays();
        }
    }

    function updateTemperatureDisplays() {
        // Update current temperature display
        const currentTempValue = parseFloat(temperature.textContent);
        if (!isNaN(currentTempValue)) {
            const unitSymbol = temperature.textContent.slice(-1);
            let tempValue = currentTempValue;

            if ((unitSymbol === 'C' && !useCelsius) || (unitSymbol === 'F' && useCelsius)) {
                // Need to convert
                tempValue = convertTemperature(currentTempValue, unitSymbol);
            }

            temperature.textContent = `${tempValue}°${useCelsius ? 'C' : 'F'}`;
        }

        // Update feels like temperature
        const feelsLikeValue = parseFloat(feelsLike.textContent);
        if (!isNaN(feelsLikeValue)) {
            const unitSymbol = feelsLike.textContent.slice(-1);
            let tempValue = feelsLikeValue;

            if ((unitSymbol === 'C' && !useCelsius) || (unitSymbol === 'F' && useCelsius)) {
                tempValue = convertTemperature(feelsLikeValue, unitSymbol);
            }

            feelsLike.textContent = `${tempValue}°${useCelsius ? 'C' : 'F'}`;
        }

        // Update forecast if we have data
        if (lastForecastData.length > 0) {
            updateForecastUI(lastForecastData);
        }

        // Update hourly forecast if we have data
        if (lastHourlyData.length > 0) {
            renderHourlyForecast(lastHourlyData);
        }
    }

    function convertTemperature(temp, fromUnit) {
        if (fromUnit === 'C' && !useCelsius) {
            // Convert C to F
            return Math.round((temp * 9/5) + 32);
        } else if (fromUnit === 'F' && useCelsius) {
            // Convert F to C
            return Math.round((temp - 32) * 5/9);
        }
        return temp;
    }

    // NEW: Geolocation Feature
    function initGeolocation() {
        if (geolocateBtn) {
            geolocateBtn.addEventListener('click', getLocationWeather);
        }
    }

    function getLocationWeather() {
        if (navigator.geolocation) {
            // Show loading state
            weatherInfo.classList.add('hidden');
            errorMessage.classList.add('hidden');
            loadingElement.classList.remove('hidden');

            navigator.geolocation.getCurrentPosition(
                position => {
                    getCurrentWeatherByCoords(position.coords.latitude, position.coords.longitude);
                },
                error => {
                    console.error("Geolocation error:", error);
                    // Handle geolocation errors
                    weatherInfo.classList.add('hidden');
                    loadingElement.classList.add('hidden');
                    errorMessage.classList.remove('hidden');
                    errorMessage.querySelector('p').textContent = "Couldn't get your location. Please search for a city instead.";

                    // Fall back to default city
                    getWeather('Stockholm');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            console.error("Geolocation is not supported by this browser.");
            // Fall back to default city
            getWeather('Stockholm');
        }
    }

    async function getCurrentWeatherByCoords(lat, lon) {
        try {
            // Get weather by coordinates
            const response = await fetch(`/api/weather/coordinates?lat=${lat}&lon=${lon}`);

            if (!response.ok) {
                throw new Error('Error fetching weather data');
            }

            const data = await response.json();

            // Update UI with weather data
            updateWeatherUI(data);

        } catch (error) {
            // Show error message
            loadingElement.classList.add('hidden');
            errorMessage.classList.remove('hidden');
            errorMessage.querySelector('p').textContent = "Error fetching weather data. Please try again.";
            console.error('Error fetching weather data:', error);
        }
    }

    // NEW: Saved Locations Feature
    function initSavedLocations() {
        if (saveLocationBtn) {
            saveLocationBtn.addEventListener('click', () => {
                if (lastQueriedLocation) {
                    saveLocation(lastQueriedLocation);
                }
            });
        }

        // Initialize saved locations display
        updateSavedLocationsList();
    }

    function saveLocation(cityName) {
        let savedLocations = JSON.parse(localStorage.getItem('savedLocations') || '[]');

        // Only add if not already in the list
        if (!savedLocations.includes(cityName)) {
            savedLocations.push(cityName);
            localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
            updateSavedLocationsList();

            // Show toast notification
            showToast(`${cityName} added to saved locations!`);
        } else {
            showToast(`${cityName} is already in your saved locations.`);
        }
    }

    function removeLocation(cityName) {
        let savedLocations = JSON.parse(localStorage.getItem('savedLocations') || '[]');
        const updatedLocations = savedLocations.filter(city => city !== cityName);
        localStorage.setItem('savedLocations', JSON.stringify(updatedLocations));
        updateSavedLocationsList();

        // Show toast notification
        showToast(`${cityName} removed from saved locations.`);
    }

    function updateSavedLocationsList() {
        if (!savedLocationsContainer) return;

        savedLocationsContainer.innerHTML = '';

        const savedLocations = JSON.parse(localStorage.getItem('savedLocations') || '[]');

        if (savedLocations.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-locations-message';
            emptyMessage.textContent = 'No saved locations yet.';
            savedLocationsContainer.appendChild(emptyMessage);
            return;
        }

        savedLocations.forEach(city => {
            const locationElement = document.createElement('div');
            locationElement.className = 'saved-location';
            locationElement.innerHTML = `
                <span>${city}</span>
                <div class="location-actions">
                    <button class="location-btn" onclick="getWeather('${city}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="remove-btn" onclick="removeLocation('${city}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            savedLocationsContainer.appendChild(locationElement);
        });

        // Make the functions accessible globally for the onclick handlers
        window.getWeather = getWeather;
        window.removeLocation = removeLocation;
    }

    // NEW: Toast Notification
    function showToast(message, duration = 3000) {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        // Add to container
        toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    }

    // Initialize with default city
    getWeather('Stockholm');

    // Event Listeners - Original
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
        // Save the queried location
        lastQueriedLocation = city;

        // Show loading state
        weatherInfo.classList.add('hidden');
        errorMessage.classList.add('hidden');
        loadingElement.classList.remove('hidden');
        forecastContainer.innerHTML = '';

        if (hourlyForecastContainer) {
            hourlyForecastContainer.innerHTML = '';
        }

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

        // Save queried location
        lastQueriedLocation = data.location;

        // Update elements
        location.textContent = data.location + (data.country ? `, ${data.country}` : '');
        setCurrentDate();

        // Convert temperature if needed
        let tempValue = data.temperature;
        if (!useCelsius) {
            tempValue = Math.round((data.temperature * 9/5) + 32);
        }
        temperature.textContent = `${tempValue}°${useCelsius ? 'C' : 'F'}`;

        // Set weather condition and icon
        conditions.textContent = data.description ?
            data.description.charAt(0).toUpperCase() + data.description.slice(1) :
            data.conditions;

        const iconClass = getWeatherIconClass(data.conditions);
        weatherIcon.className = `fas ${iconClass}`;

        // Set additional info
        windSpeed.textContent = `${data.wind_speed} km/h`;
        humidity.textContent = `${data.humidity}%`;

        // Convert feels like temperature if needed
        let feelsLikeValue = data.feels_like;
        if (!useCelsius) {
            feelsLikeValue = Math.round((data.feels_like * 9/5) + 32);
        }
        feelsLike.textContent = `${feelsLikeValue}°${useCelsius ? 'C' : 'F'}`;

        // Update weather background effect
        updateWeatherEffect(data.conditions);

        // Now get the forecast
        getForecast(data.location);
        // Get air quality data
        getAirPollutionData(data.location);
        // NEW: Get hourly forecast
        getHourlyForecast(data.location);
    }

    // NEW: Update weather background effect based on conditions
    function updateWeatherEffect(condition) {
        // Remove any existing weather effects
        const existingEffect = document.querySelector('.weather-effect');
        if (existingEffect) {
            existingEffect.remove();
        }

        // Create the appropriate weather effect based on conditions
        const weatherEffectDiv = document.createElement('div');
        weatherEffectDiv.className = 'weather-effect';

        switch(condition) {
            case 'Rain':
            case 'Drizzle':
                weatherEffectDiv.className += ' rain-effect';
                for (let i = 0; i < 20; i++) {
                    const raindrop = document.createElement('div');
                    raindrop.className = 'raindrop';
                    raindrop.style.left = `${Math.random() * 100}%`;
                    raindrop.style.animationDuration = `${0.5 + Math.random() * 1}s`;
                    raindrop.style.animationDelay = `${Math.random() * 2}s`;
                    weatherEffectDiv.appendChild(raindrop);
                }
                break;
            case 'Snow':
                weatherEffectDiv.className += ' snow-effect';
                for (let i = 0; i < 30; i++) {
                    const snowflake = document.createElement('div');
                    snowflake.className = 'snowflake';
                    snowflake.style.left = `${Math.random() * 100}%`;
                    snowflake.style.animationDuration = `${3 + Math.random() * 5}s`;
                    snowflake.style.animationDelay = `${Math.random() * 3}s`;
                    weatherEffectDiv.appendChild(snowflake);
                }
                break;
            case 'Clear':
                weatherEffectDiv.className += ' sun-effect';
                const sun = document.createElement('div');
                sun.className = 'sun';
                weatherEffectDiv.appendChild(sun);
                break;
            // Add more effects as needed
        }

        // Add the effect to the weather container
        const weatherContainer = document.querySelector('.weather-container');
        if (weatherContainer) {
            weatherContainer.appendChild(weatherEffectDiv);
        }
    }

    // Get forecast data
    async function getForecast(city) {
        try {
            const response = await fetch(`/api/forecast?city=${encodeURIComponent(city)}`);

            if (!response.ok) {
                throw new Error('Failed to fetch forecast data');
            }

            const data = await response.json();

            // Save forecast data for unit conversion
            lastForecastData = data.forecast;

            // Update UI with forecast data
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

            // Convert temperatures if needed
            let tempMax = day.temp_max;
            let tempMin = day.temp_min;

            if (!useCelsius) {
                tempMax = Math.round((day.temp_max * 9/5) + 32);
                tempMin = Math.round((day.temp_min * 9/5) + 32);
            }

            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <p class="day">${dayName}</p>
                <p class="date">${dateStr}</p>
                <div class="forecast-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <p class="forecast-temp">${tempMax}°${useCelsius ? 'C' : 'F'} / ${tempMin}°${useCelsius ? 'C' : 'F'}</p>
                <p class="forecast-condition">${day.description || day.conditions}</p>
                ${day.pop !== undefined ? `<p class="forecast-pop"><i class="fas fa-tint"></i> ${Math.round(day.pop)}%</p>` : ''}
            `;

            forecastContainer.appendChild(forecastItem);
        });
    }

    // NEW: Get hourly forecast data and update UI
    async function getHourlyForecast(city) {
        if (!hourlyForecastContainer) return;

        try {
            // Try to use the advanced hourly API
            const response = await fetch(`/api/hourly?city=${encodeURIComponent(city)}`);

            if (response.ok) {
                const data = await response.json();

                // Save hourly data for unit conversion
                lastHourlyData = data.list.slice(0, 24); // Show next 24 hours

                // Render hourly forecast
                renderHourlyForecast(lastHourlyData);
            } else {
                console.log('Hourly API not available or returned an error. Using standard forecast.');
                hourlyForecastContainer.innerHTML = '<p class="hourly-error">Hourly forecast not available</p>';
            }
        } catch (error) {
            console.error('Error fetching hourly forecast:', error);
            hourlyForecastContainer.innerHTML = '<p class="hourly-error">Hourly forecast not available</p>';
        }
    }

    // NEW: Render hourly forecast UI
    function renderHourlyForecast(hourlyData) {
        if (!hourlyForecastContainer) return;

        hourlyForecastContainer.innerHTML = '';

        // Create hourly forecast header
        const hourlyHeader = document.createElement('h3');
        hourlyHeader.className = 'hourly-header';
        hourlyHeader.textContent = 'Hourly Forecast';
        hourlyForecastContainer.appendChild(hourlyHeader);

        // Create hourly items container
        const hourlyItemsContainer = document.createElement('div');
        hourlyItemsContainer.className = 'hourly-items-container';

        // Add hourly items
        hourlyData.forEach((hour, index) => {
            if (index % 3 === 0) { // Show every 3 hours to save space
                const time = new Date(hour.dt * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                // Convert temperature if needed
                let temp = Math.round(hour.main.temp);
                if (!useCelsius) {
                    temp = Math.round((temp * 9/5) + 32);
                }

                const iconClass = getWeatherIconClass(hour.weather[0].main);

                const hourlyItem = document.createElement('div');
                hourlyItem.className = 'hourly-item';
                hourlyItem.innerHTML = `
                    <p class="hourly-time">${time}</p>
                    <div class="hourly-icon"><i class="fas ${iconClass}"></i></div>
                    <p class="hourly-temp">${temp}°${useCelsius ? 'C' : 'F'}</p>
                    <p class="hourly-condition">${hour.weather[0].description}</p>
                `;
                hourlyItemsContainer.appendChild(hourlyItem);
            }
        });

        hourlyForecastContainer.appendChild(hourlyItemsContainer);
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

    // NEW: Register service worker for PWA functionality
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker registered successfully:', registration.scope);
                    })
                    .catch(error => {
                        console.error('ServiceWorker registration failed:', error);
                    });
            });
        }
    }

    // Initialize all new features
    initDarkMode();
    initTemperatureUnit();
    initGeolocation();
    initSavedLocations();
    registerServiceWorker();
});

// Server info functionality
const serverInfoToggle = document.getElementById('server-info-toggle');
const serverInfoPanel = document.getElementById('server-info-panel');
const serverHostname = document.getElementById('server-hostname');
const serverPod = document.getElementById('server-pod');
const serverNode = document.getElementById('server-node');
const serverNamespace = document.getElementById('server-namespace');
const serverTime = document.getElementById('server-time');

if (serverInfoToggle) {
    serverInfoToggle.addEventListener('click', () => {
        serverInfoPanel.classList.toggle('hidden');
        fetchServerInfo();
    });
}

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
    if (serverInfoPanel && !serverInfoPanel.classList.contains('hidden')) {
        fetchServerInfo();
    }
}, 10000);

// Make some functions globally accessible for onclick handlers
window.getWeather = function(city) {
    // Find if there's a search button and trigger its click handler
    const searchEvent = new CustomEvent('weatherSearch', { detail: { city } });
    document.dispatchEvent(searchEvent);
};

// Handle the custom event
document.addEventListener('weatherSearch', (e) => {
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');

    if (cityInput && searchBtn && e.detail && e.detail.city) {
        cityInput.value = e.detail.city;
        searchBtn.click();
    }
});

window.removeLocation = function(city) {
    const removeEvent = new CustomEvent('removeLocation', { detail: { city } });
    document.dispatchEvent(removeEvent);
};

// Handle the remove location event
document.addEventListener('removeLocation', (e) => {
    if (e.detail && e.detail.city) {
        let savedLocations = JSON.parse(localStorage.getItem('savedLocations') || '[]');
        const updatedLocations = savedLocations.filter(city => city !== e.detail.city);
        localStorage.setItem('savedLocations', JSON.stringify(updatedLocations));

        // Trigger update of the saved locations list
        const updateEvent = new CustomEvent('updateSavedLocations');
        document.dispatchEvent(updateEvent);

        // Show toast
        const toastEvent = new CustomEvent('showToast', {
            detail: { message: `${e.detail.city} removed from saved locations.` }
        });
        document.dispatchEvent(toastEvent);
    }
});

// Handle toast display event
document.addEventListener('showToast', (e) => {
    if (e.detail && e.detail.message) {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = e.detail.message;

        // Add to container
        toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
});

// Handle the update saved locations event
document.addEventListener('updateSavedLocations', () => {
    const savedLocationsContainer = document.getElementById('saved-locations');
    if (!savedLocationsContainer) return;

    savedLocationsContainer.innerHTML = '';

    const savedLocations = JSON.parse(localStorage.getItem('savedLocations') || '[]');

    if (savedLocations.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-locations-message';
        emptyMessage.textContent = 'No saved locations yet.';
        savedLocationsContainer.appendChild(emptyMessage);
        return;
    }

    savedLocations.forEach(city => {
        const locationElement = document.createElement('div');
        locationElement.className = 'saved-location';
        locationElement.innerHTML = `
            <span>${city}</span>
            <div class="location-actions">
                <button class="location-btn" onclick="getWeather('${city}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="remove-btn" onclick="removeLocation('${city}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        savedLocationsContainer.appendChild(locationElement);
    });
});

// Weather animations CSS - these will be added dynamically when needed
const weatherStyleSheet = document.createElement('style');
weatherStyleSheet.innerHTML = `
    @keyframes rain {
        0% { transform: translateY(-20px); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(20px); opacity: 0; }
    }
    
    @keyframes snow {
        0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(20px) rotate(360deg); opacity: 0; }
    }
    
    @keyframes shine {
        0% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(1); opacity: 0.8; }
    }
    
    .weather-effect {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        overflow: hidden;
        pointer-events: none;
    }
    
    .rain-effect .raindrop {
        position: absolute;
        width: 2px;
        height: 15px;
        background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.7));
        border-radius: 0 0 5px 5px;
        animation: rain 1s linear infinite;
    }
    
    .snow-effect .snowflake {
        position: absolute;
        width: 8px;
        height: 8px;
        background-color: white;
        border-radius: 50%;
        box-shadow: 0 0 5px rgba(255,255,255,0.8);
        animation: snow 3s linear infinite;
    }
    
    .sun-effect .sun {
        position: absolute;
        width: 80px;
        height: 80px;
        background: radial-gradient(circle, #ffde59, #ffbd59);
        border-radius: 50%;
        top: 30px;
        right: 30px;
        animation: shine 3s ease-in-out infinite;
        box-shadow: 0 0 20px rgba(255, 189, 89, 0.6);
    }
    
    .toast-container {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
    }
    
    .toast {
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        margin-bottom: 10px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s, transform 0.3s;
    }
    
    .toast.show {
        opacity: 1;
        transform: translateY(0);
    }
    
    /* Hourly forecast styles */
    .hourly-header {
        text-align: center;
        margin-bottom: 15px;
        color: var(--primary-color);
    }
    
    .hourly-items-container {
        display: flex;
        overflow-x: auto;
        gap: 15px;
        padding: 10px 0;
        margin-bottom: 10px;
        scrollbar-width: thin;
    }
    
    .hourly-item {
        min-width: 100px;
        background-color: var(--card-bg-color);
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        padding: 12px;
        text-align: center;
    }
    
    .hourly-time {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 5px;
    }
    
    .hourly-icon {
        font-size: 20px;
        color: var(--primary-color);
        margin: 5px 0;
    }
    
    .hourly-temp {
        font-size: 16px;
        font-weight: bold;
        margin: 5px 0;
    }
    
    .hourly-condition {
        font-size: 12px;
        color: #777;
    }
    
    .hourly-error {
        text-align: center;
        color: #777;
        font-style: italic;
    }
    
    /* Saved locations styles */
    .saved-location {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: var(--card-bg-color);
        padding: 10px 15px;
        margin-bottom: 8px;
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
    }
    
    .saved-location span {
        font-size: 14px;
    }
    
    .location-actions {
        display: flex;
        gap: 5px;
    }
    
    .location-btn, .remove-btn {
        background-color: transparent;
        border: none;
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: background-color 0.2s;
    }
    
    .location-btn {
        color: var(--primary-color);
    }
    
    .remove-btn {
        color: #e74c3c;
    }
    
    .location-btn:hover, .remove-btn:hover {
        background-color: rgba(0, 0, 0, 0.1);
    }
    
    .empty-locations-message {
        text-align: center;
        color: #777;
        font-style: italic;
        padding: 10px;
    }
    
    /* Dark mode styles */
    .dark-mode {
        --primary-color: #64b5f6;
        --secondary-color: #2196f3;
        --background-color: #1f2937;
        --card-bg-color: #374151;
        --text-color: #f3f4f6;
    }
    
    .dark-mode .weather-container,
    .dark-mode .forecast-item,
    .dark-mode .hourly-item,
    .dark-mode .air-quality-container,
    .dark-mode .saved-location,
    .dark-mode .server-info-panel {
        background-color: var(--card-bg-color);
        color: var(--text-color);
    }
    
    .dark-mode .pollutant-item {
        background-color: rgba(100, 181, 246, 0.1);
    }
    
    .dark-mode .info-item {
        background-color: rgba(100, 181, 246, 0.1);
    }
    
    .dark-mode footer {
        background-color: #1a242f;
        color: #a9b3c1;
    }
`;

document.head.appendChild(weatherStyleSheet);