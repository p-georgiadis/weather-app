const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/api/weather', (req, res) => {
  const mockWeather = {
    location: req.query.city || 'Stockholm',
    temperature: Math.floor(Math.random() * 30),
    conditions: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)]
  };
  
  res.json(mockWeather);
});

app.listen(port, () => {
  console.log(`Weather API running on port ${port}`);
});
