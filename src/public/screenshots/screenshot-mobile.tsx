import React from 'react';

export default function WeatherAppMobile() {
  return (
    <div className="w-full h-full flex justify-center items-center bg-gray-100">
      <div className="max-w-md w-full mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-500 p-4 text-white">
            <h1 className="text-xl font-bold text-center">Weather Forecast</h1>
            
            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center">
                <span className="text-xs mr-1">Dark</span>
                <div className="w-8 h-4 bg-blue-400 rounded-full p-0.5 flex items-center">
                  <div className="w-3 h-3 bg-white rounded-full shadow-md"></div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="text-xs mr-1">°C/°F</span>
                <div className="w-8 h-4 bg-blue-400 rounded-full p-0.5 flex justify-end items-center">
                  <div className="w-3 h-3 bg-white rounded-full shadow-md"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <input 
                type="text" 
                className="w-full py-2 px-3 rounded-lg border border-gray-300 text-sm" 
                placeholder="Enter city name..." 
                value="London"
              />
              <button className="absolute right-0 top-0 h-full px-3 text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="flex space-x-2 mt-2">
              <button className="flex-1 py-1.5 bg-blue-500 text-white rounded text-xs flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                My Location
              </button>
              
              <button className="flex-1 py-1.5 bg-green-500 text-white rounded text-xs flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                Save Location
              </button>
            </div>
          </div>
          
          {/* Current Weather */}
          <div className="p-4 border-t border-gray-100">
            <div className="text-center">
              <h2 className="text-lg font-bold">London, UK</h2>
              <p className="text-xs text-gray-500">Thursday, May 16</p>
            </div>
            
            <div className="flex justify-center items-center my-4">
              <div className="text-5xl font-bold text-blue-500">14°C</div>
              <div className="ml-4 text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
            </div>
            
            <p className="text-center mb-4">Cloudy</p>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-50 p-2 rounded text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto text-blue-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="block text-xs text-gray-500">Wind</span>
                <p className="text-xs font-bold">10 km/h</p>
              </div>
              
              <div className="bg-blue-50 p-2 rounded text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto text-blue-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="block text-xs text-gray-500">Humidity</span>
                <p className="text-xs font-bold">68%</p>
              </div>
              
              <div className="bg-blue-50 p-2 rounded text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto text-blue-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="block text-xs text-gray-500">Feels Like</span>
                <p className="text-xs font-bold">12°C</p>
              </div>
            </div>
          </div>
          
          {/* Hourly Forecast */}
          <div className="p-3 border-t border-gray-100">
            <h3 className="text-sm font-bold text-blue-500 mb-2">Hourly Forecast</h3>
            <div className="overflow-x-auto">
              <div className="flex space-x-3 w-max">
                {[
                  { time: 'Now', temp: '14°', icon: 'cloud' },
                  { time: '13:00', temp: '15°', icon: 'cloud' },
                  { time: '14:00', temp: '15°', icon: 'cloud-sun' },
                  { time: '15:00', temp: '16°', icon: 'cloud-sun' },
                  { time: '16:00', temp: '16°', icon: 'cloud-sun' },
                  { time: '17:00', temp: '15°', icon: 'cloud' }
                ].map((item, i) => (
                  <div key={i} className="w-16 bg-blue-50 p-2 rounded text-center">
                    <p className="text-xs font-bold">{item.time}</p>
                    <div className="my-1 text-blue-500">
                      <i className={`fas fa-${item.icon} text-sm`}></i>
                    </div>
                    <p className="text-xs font-bold">{item.temp}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Daily Forecast */}
          <div className="p-3 border-t border-gray-100">
            <h3 className="text-sm font-bold text-blue-500 mb-2">5-Day Forecast</h3>
            <div className="space-y-2">
              {[
                { day: 'Today', temp: '14°/9°', icon: 'cloud', pop: 20 },
                { day: 'Friday', temp: '16°/10°', icon: 'cloud-sun', pop: 10 },
                { day: 'Saturday', temp: '18°/12°', icon: 'sun', pop: 0 },
                { day: 'Sunday', temp: '17°/11°', icon: 'cloud-sun', pop: 10 },
                { day: 'Monday', temp: '15°/10°', icon: 'cloud-rain', pop: 40 }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                  <div className="w-20 font-bold text-xs">{item.day}</div>
                  <div className="flex items-center text-blue-500">
                    <i className={`fas fa-${item.icon} text-sm`}></i>
                  </div>
                  <div className="text-xs font-bold">{item.temp}</div>
                  <div className="text-xs text-blue-500 flex items-center">
                    <i className="fas fa-tint text-xs mr-1"></i>
                    {item.pop}%
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Air Quality */}
          <div className="p-3 border-t border-gray-100">
            <h3 className="text-sm font-bold text-blue-500 mb-2">Air Quality</h3>
            <div className="bg-blue-50 p-3 rounded mb-2">
              <div className="text-center mb-2">
                <span className="text-xs text-gray-500">Air Quality Index:</span>
                <div>
                  <span className="text-xl font-bold text-yellow-500">3</span>
                  <span className="ml-1 text-xs font-semibold text-yellow-500">Moderate</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'CO', value: '0.84 μg/m³' },
                  { name: 'NO₂', value: '14.92 μg/m³' },
                  { name: 'PM2.5', value: '12.84 μg/m³' },
                  { name: 'PM10', value: '24.62 μg/m³' }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-1 rounded text-center">
                    <span className="block text-2xs text-gray-500">{item.name}</span>
                    <p className="text-2xs font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Saved Locations */}
          <div className="p-3 border-t border-gray-100">
            <h3 className="text-sm font-bold text-blue-500 mb-2">Saved Locations</h3>
            <div className="space-y-2">
              {[
                { name: 'London, UK', temp: '14°C', icon: 'cloud' },
                { name: 'New York, US', temp: '12°C', icon: 'cloud-rain' },
                { name: 'Tokyo, JP', temp: '22°C', icon: 'sun' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                  <div className="font-bold text-xs">{item.name}</div>
                  <div className="flex items-center">
                    <div className="text-xs mr-2">{item.temp}</div>
                    <div className="text-blue-500">
                      <i className={`fas fa-${item.icon} text-sm`}></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-blue-500 p-2 text-white text-xs text-center">
            <p>© 2025 Weather App - Panagiotis S. Georgiadis</p>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .text-2xs {
          font-size: 0.65rem;
        }
      `}</style>
    </div>
  );
}
