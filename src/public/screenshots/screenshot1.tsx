import React from 'react';

export default function WeatherAppScreenshot() {
  return (
    <div className="w-full h-full flex justify-center items-center bg-gray-100">
      <div className="max-w-4xl w-full mx-auto p-4 bg-white rounded-lg shadow-lg">
        <div className="py-4 text-center">
          <h1 className="text-3xl font-bold text-blue-500">Weather Forecast</h1>
        </div>
        
        <div className="flex justify-between items-center px-6 py-3 mb-4">
          <div className="flex items-center">
            <span className="mr-2">Dark Mode</span>
            <div className="w-12 h-6 bg-gray-300 rounded-full p-1 flex items-center">
              <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2">°C / °F</span>
            <div className="w-12 h-6 bg-blue-500 rounded-full p-1 flex justify-end items-center">
              <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
            </div>
          </div>
        </div>
        
        <div className="relative mb-6">
          <input 
            type="text" 
            className="w-full py-3 px-4 rounded-l-lg border border-gray-300 focus:outline-none" 
            placeholder="Enter city name..." 
            value="Stockholm"
          />
          <button className="absolute right-0 top-0 h-full px-4 bg-blue-500 text-white rounded-r-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="flex space-x-3 mb-6">
          <button className="py-2 px-4 bg-blue-500 text-white rounded-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            My Location
          </button>
          
          <button className="py-2 px-4 bg-green-500 text-white rounded-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            Save Location
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-5 mb-6">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">Stockholm, SE</h2>
            <p className="text-gray-500">Thursday, May 16</p>
          </div>
          
          <div className="flex justify-center items-center mb-6">
            <div className="flex items-center">
              <h2 className="text-5xl font-bold text-blue-500">18°C</h2>
              <div className="text-4xl text-yellow-500 ml-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-6 text-xl">
              <p>Sunny</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="block text-sm text-gray-500">Wind Speed</span>
              <p className="font-bold">8 km/h</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span className="block text-sm text-gray-500">Humidity</span>
              <p className="font-bold">42%</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="block text-sm text-gray-500">Feels Like</span>
              <p className="font-bold">20°C</p>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto pb-2 mb-6">
          <div className="flex space-x-4 w-max">
            {[
              { day: 'Thu', date: 'May 16', temp: '18°/10°', icon: 'sun', desc: 'Sunny' },
              { day: 'Fri', date: 'May 17', temp: '17°/9°', icon: 'cloud-sun', desc: 'Partly Cloudy' },
              { day: 'Sat', date: 'May 18', temp: '16°/8°', icon: 'cloud', desc: 'Mostly Cloudy' },
              { day: 'Sun', date: 'May 19', temp: '15°/7°', icon: 'cloud-rain', desc: 'Showers' },
              { day: 'Mon', date: 'May 20', temp: '14°/7°', icon: 'cloud-rain', desc: 'Showers' }
            ].map((item, i) => (
              <div key={i} className="w-32 bg-white p-4 rounded-lg shadow-md text-center">
                <p className="font-bold">{item.day}</p>
                <p className="text-sm text-gray-500">{item.date}</p>
                <div className={`my-3 text-${item.icon === 'sun' ? 'yellow' : 'blue'}-500`}>
                  <i className={`fas fa-${item.icon} text-2xl`}></i>
                </div>
                <p className="font-bold mb-1">{item.temp}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-5 mb-6">
          <h2 className="text-xl font-bold text-center text-blue-500 mb-4">Air Quality</h2>
          
          <div className="text-center mb-4">
            <span className="block text-sm text-gray-500">Air Quality Index:</span>
            <span className="text-3xl font-bold text-green-500">2</span>
            <span className="ml-2 font-semibold text-green-500">Good</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Carbon Monoxide (CO)', value: '0.12 μg/m³' },
              { name: 'Nitrogen Dioxide (NO₂)', value: '4.26 μg/m³' },
              { name: 'Ozone (O₃)', value: '38.9 μg/m³' },
              { name: 'Fine Particles (PM2.5)', value: '2.84 μg/m³' },
              { name: 'Coarse Particles (PM10)', value: '4.62 μg/m³' },
              { name: 'Sulfur Dioxide (SO₂)', value: '1.35 μg/m³' }
            ].map((item, i) => (
              <div key={i} className="bg-blue-50 p-3 rounded-lg text-center">
                <span className="block text-xs text-gray-500">{item.name}</span>
                <p className="font-bold text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
