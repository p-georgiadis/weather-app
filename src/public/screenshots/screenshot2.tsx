import React from 'react';

export default function WeatherAppScreenshotDark() {
  return (
    <div className="w-full h-full flex justify-center items-center bg-gray-900">
      <div className="max-w-4xl w-full mx-auto p-4 bg-gray-800 rounded-lg shadow-lg text-gray-100">
        <div className="py-4 text-center">
          <h1 className="text-3xl font-bold text-blue-400">Weather Forecast</h1>
        </div>
        
        <div className="flex justify-between items-center px-6 py-3 mb-4">
          <div className="flex items-center">
            <span className="mr-2 text-gray-300">Dark Mode</span>
            <div className="w-12 h-6 bg-blue-500 rounded-full p-1 flex justify-end items-center">
              <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2 text-gray-300">°C / °F</span>
            <div className="w-12 h-6 bg-gray-600 rounded-full p-1 flex items-center">
              <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
            </div>
          </div>
        </div>
        
        <div className="relative mb-6">
          <input 
            type="text" 
            className="w-full py-3 px-4 rounded-l-lg border border-gray-600 bg-gray-700 text-white focus:outline-none" 
            placeholder="Enter city name..." 
            value="New York"
          />
          <button className="absolute right-0 top-0 h-full px-4 bg-blue-600 text-white rounded-r-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="flex space-x-3 mb-6">
          <button className="py-2 px-4 bg-blue-600 text-white rounded-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            My Location
          </button>
          
          <button className="py-2 px-4 bg-green-600 text-white rounded-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            Save Location
          </button>
        </div>
        
        <div className="bg-gray-700 rounded-lg shadow-md p-5 mb-6 relative overflow-hidden">
          {/* Rain animation in background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            {Array(10).fill(0).map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-20 bg-blue-400 rounded-b"
                style={{
                  left: `${10 + i * 8}%`,
                  top: `-${i * 5}px`,
                  animation: `fall 1.${i}s linear infinite`,
                  animationDelay: `0.${i}s`
                }}
              ></div>
            ))}
          </div>
          
          <div className="text-center mb-4 relative z-10">
            <h2 className="text-2xl font-bold">New York, US</h2>
            <p className="text-gray-400">Thursday, May 16</p>
          </div>
          
          <div className="flex justify-center items-center mb-6 relative z-10">
            <div className="flex items-center">
              <h2 className="text-5xl font-bold text-blue-400">12°C</h2>
              <div className="text-4xl text-blue-400 ml-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
            <div className="ml-6 text-xl">
              <p>Rain</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 relative z-10">
            <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="block text-sm text-gray-400">Wind Speed</span>
              <p className="font-bold">12 km/h</p>
            </div>
            
            <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span className="block text-sm text-gray-400">Humidity</span>
              <p className="font-bold">75%</p>
            </div>
            
            <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="block text-sm text-gray-400">Feels Like</span>
              <p className="font-bold">9°C</p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-bold text-blue-400 text-center mb-4">Hourly Forecast</h3>
          <div className="overflow-x-auto pb-2">
            <div className="flex space-x-4 w-max">
              {[
                { time: 'Now', temp: '12°', icon: 'cloud-rain' },
                { time: '11:00', temp: '12°', icon: 'cloud-rain' },
                { time: '12:00', temp: '13°', icon: 'cloud-rain' },
                { time: '13:00', temp: '13°', icon: 'cloud' },
                { time: '14:00', temp: '14°', icon: 'cloud' },
                { time: '15:00', temp: '15°', icon: 'cloud-sun' },
                { time: '16:00', temp: '15°', icon: 'cloud-sun' },
                { time: '17:00', temp: '14°', icon: 'cloud' }
              ].map((item, i) => (
                <div key={i} className="w-24 bg-gray-700 p-3 rounded-lg shadow text-center">
                  <p className="font-bold text-sm">{item.time}</p>
                  <div className="my-2 text-blue-400">
                    <i className={`fas fa-${item.icon} text-xl`}></i>
                  </div>
                  <p className="font-bold">{item.temp}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto pb-2 mb-6">
          <div className="flex space-x-4 w-max">
            {[
              { day: 'Thu', date: 'May 16', temp: '12°/7°', icon: 'cloud-rain', desc: 'Rain' },
              { day: 'Fri', date: 'May 17', temp: '14°/9°', icon: 'cloud', desc: 'Cloudy' },
              { day: 'Sat', date: 'May 18', temp: '16°/10°', icon: 'cloud-sun', desc: 'Partly Cloudy' },
              { day: 'Sun', date: 'May 19', temp: '18°/12°', icon: 'sun', desc: 'Sunny' },
              { day: 'Mon', date: 'May 20', temp: '17°/11°', icon: 'cloud-sun', desc: 'Partly Cloudy' }
            ].map((item, i) => (
              <div key={i} className="w-32 bg-gray-700 p-4 rounded-lg shadow-md text-center">
                <p className="font-bold">{item.day}</p>
                <p className="text-sm text-gray-400">{item.date}</p>
                <div className="my-3 text-blue-400">
                  <i className={`fas fa-${item.icon} text-2xl`}></i>
                </div>
                <p className="font-bold mb-1">{item.temp}</p>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg shadow-md p-5 mb-6">
          <h2 className="text-xl font-bold text-center text-blue-400 mb-4">Air Quality</h2>
          
          <div className="text-center mb-4">
            <span className="block text-sm text-gray-400">Air Quality Index:</span>
            <span className="text-3xl font-bold text-yellow-400">3</span>
            <span className="ml-2 font-semibold text-yellow-400">Moderate</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Carbon Monoxide (CO)', value: '0.84 μg/m³' },
              { name: 'Nitrogen Dioxide (NO₂)', value: '14.92 μg/m³' },
              { name: 'Ozone (O₃)', value: '68.3 μg/m³' },
              { name: 'Fine Particles (PM2.5)', value: '12.84 μg/m³' },
              { name: 'Coarse Particles (PM10)', value: '24.62 μg/m³' },
              { name: 'Sulfur Dioxide (SO₂)', value: '5.25 μg/m³' }
            ].map((item, i) => (
              <div key={i} className="bg-gray-800 p-3 rounded-lg text-center">
                <span className="block text-xs text-gray-400">{item.name}</span>
                <p className="font-bold text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        
        <style jsx>{`
          @keyframes fall {
            0% { transform: translateY(-100px); }
            100% { transform: translateY(400px); }
          }
        `}</style>
      </div>
    </div>
  );
}
