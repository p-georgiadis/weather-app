const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const os = require('os');

// Load environment variables from .env file in development mode
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const port = process.env.PORT || 8080;

// Get API key from environment variable
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Get hostname and Kubernetes info
const hostname = os.hostname();
const podName = process.env.POD_NAME || 'local';
const nodeName = process.env.NODE_NAME || 'local';
const namespace = process.env.POD_NAMESPACE || 'local';

// Add server info to all responses
app.use((req, res, next) => {
  res.locals.serverInfo = {
    hostname,
    podName,
    nodeName,
    namespace,
    timestamp: new Date().toISOString()
  };
  next();
});

// Create an API endpoint to return server info
app.get('/api/server-info', (req, res) => {
  res.json(res.locals.serverInfo);
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS
app.use(cors());

// Helper function to convert city name to coordinates (geocoding)
async function getCoordinatesForCity(city) {
  try {
    const response = await axios.get(`${WEATHER_API_BASE_URL}/weather`, {
      params: {
        q: city,
        appid: WEATHER_API_KEY,
        units: 'metric'
      }
    });
    
    return {
      lat: response.data.coord.lat,
      lon: response.data.coord.lon,
      name: response.data.name,
      country: response.data.sys.country
    };
  } catch (error) {
    console.error('Error getting coordinates:', error.message);
    throw error;
  }
}

// Current weather API endpoint
app.get('/api/weather', async (req, res) => {
  const city = req.query.city || 'Stockholm';
  
  try {
    // First, get coordinates for the city
    const coordinates = await getCoordinatesForCity(city);
    
    // Then, get detailed weather data
    const response = await axios.get(`${WEATHER_API_BASE_URL}/weather`, {
      params: {
        lat: coordinates.lat,
        lon: coordinates.lon,
        appid: WEATHER_API_KEY,
        units: 'metric' // For Celsius
      }
    });
    
    const data = response.data;
    
    // Format the response
    const weatherData = {
      location: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      wind_speed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      conditions: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      pressure: data.main.pressure,
      visibility: data.visibility,
      coordinates: {
        lat: data.coord.lat,
        lon: data.coord.lon
      }
    };
    
    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    
    // Handle city not found error
    if (error.response && error.response.status === 404) {
      res.status(404).json({ error: 'City not found' });
      return;
    }
    
    // Handle other errors
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// API endpoint for forecast
app.get('/api/forecast', async (req, res) => {
  const city = req.query.city || 'Stockholm';
  
  try {
    // First, get coordinates for the city
    const coordinates = await getCoordinatesForCity(city);
    
    // Then, get 5-day forecast data
    const response = await axios.get(`${WEATHER_API_BASE_URL}/forecast`, {
      params: {
        lat: coordinates.lat,
        lon: coordinates.lon,
        appid: WEATHER_API_KEY,
        units: 'metric',
        cnt: 40 // 5 days with data every 3 hours (8 times per day)
      }
    });
    
    const data = response.data;
    
    // Process the forecast data
    // We'll get one forecast per day by using noon data for each day
    const dailyForecasts = [];
    const processedDates = new Set();
    
    data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0]; // Get just the date part
      const time = item.dt_txt.split(' ')[1]; // Get just the time part
      
      // Use 12:00 data as representative for the day
      // Or add first entry of each day if no noon data exists
      if ((time === '12:00:00' || !processedDates.has(date)) && !processedDates.has(date)) {
        processedDates.add(date);
        dailyForecasts.push({
          date: date,
          timestamp: item.dt,
          temp_min: Math.round(item.main.temp_min),
          temp_max: Math.round(item.main.temp_max),
          conditions: item.weather[0].main,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          humidity: item.main.humidity,
          wind_speed: Math.round(item.wind.speed * 3.6), // Convert m/s to km/h
          pop: item.pop * 100 // Probability of precipitation as percentage
        });
      }
    });
    
    // Limit to 5 days
    const forecast = dailyForecasts.slice(0, 5);
    
    res.json({
      location: data.city.name,
      country: data.city.country,
      forecast: forecast
    });
  } catch (error) {
    console.error('Error fetching forecast data:', error.message);
    
    // Handle city not found error
    if (error.response && error.response.status === 404) {
      res.status(404).json({ error: 'City not found' });
      return;
    }
    
    // Handle other errors
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
});

// Advanced forecast data using the Hourly API (4-day forecast with hourly data)
app.get('/api/hourly', async (req, res) => {
  const city = req.query.city || 'Stockholm';
  
  try {
    // First, get coordinates for the city
    const coordinates = await getCoordinatesForCity(city);
    
    // Then, get hourly forecast data
    const response = await axios.get('https://pro.openweathermap.org/data/2.5/forecast/hourly', {
      params: {
        lat: coordinates.lat,
        lon: coordinates.lon,
        appid: WEATHER_API_KEY,
        units: 'metric',
        cnt: 96 // Get all 96 hours (4 days)
      }
    });
    
    // Add city name to the response
    const data = {
      ...response.data,
      name: coordinates.name,
      country: coordinates.country
    };
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching hourly forecast data:', error.message);
    res.status(500).json({ error: 'Failed to fetch hourly forecast data' });
  }
});

// API endpoint for air pollution data
app.get('/api/air-pollution', async (req, res) => {
  const city = req.query.city || 'Stockholm';
  
  try {
    // First, get coordinates for the city
    const coordinates = await getCoordinatesForCity(city);
    
    // Then, get air pollution data
    const response = await axios.get('http://api.openweathermap.org/data/2.5/air_pollution', {
      params: {
        lat: coordinates.lat,
        lon: coordinates.lon,
        appid: WEATHER_API_KEY
      }
    });
    
    // Add city name to the response
    const data = {
      ...response.data,
      location: coordinates.name,
      country: coordinates.country
    };
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching air pollution data:', error.message);
    res.status(500).json({ error: 'Failed to fetch air pollution data' });
  }
});

// API endpoint for air pollution forecast
app.get('/api/air-pollution/forecast', async (req, res) => {
  const city = req.query.city || 'Stockholm';
  
  try {
    // First, get coordinates for the city
    const coordinates = await getCoordinatesForCity(city);
    
    // Then, get air pollution forecast data
    const response = await axios.get('http://api.openweathermap.org/data/2.5/air_pollution/forecast', {
      params: {
        lat: coordinates.lat,
        lon: coordinates.lon,
        appid: WEATHER_API_KEY
      }
    });
    
    // Add city name to the response
    const data = {
      ...response.data,
      location: coordinates.name,
      country: coordinates.country
    };
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching air pollution forecast data:', error.message);
    res.status(500).json({ error: 'Failed to fetch air pollution forecast data' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Readiness check endpoint
app.get('/ready', (req, res) => {
  res.status(200).send('Ready');
});

// Root route to serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Weather App running on port ${port}`);
  console.log(`Open your browser and visit: http://localhost:${port}`);
  console.log(`Using OpenWeatherMap API Key: ${WEATHER_API_KEY ? '****' : 'not set'}`);
});
