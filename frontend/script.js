// Initialize map
let map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const countryFlag = document.getElementById('countryFlag');
const capital = document.getElementById('capital');
const population = document.getElementById('population');
const timezone = document.getElementById('timezone');
const currency = document.getElementById('currency');
const weatherIcon = document.getElementById('weatherIcon');
const temperature = document.getElementById('temperature');
const weatherCondition = document.getElementById('weatherCondition');

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format population number
function formatPopulation(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Search countries
async function searchCountries(query) {
    if (query.length < 2) {
        searchResults.classList.remove('active');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
        const countries = await response.json();
        
        searchResults.innerHTML = '';
        countries.forEach(country => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.textContent = country.name;
            div.onclick = () => selectCountry(country.code);
            searchResults.appendChild(div);
        });
        
        searchResults.classList.add('active');
    } catch (error) {
        console.error('Error searching countries:', error);
    }
}

// Select country and fetch details
async function selectCountry(countryCode) {
    try {
        const response = await fetch(`${API_BASE_URL}/country/${countryCode}`);
        const countryData = await response.json();
        
        // Update UI with country data
        countryFlag.src = countryData.flag;
        capital.textContent = countryData.capital || 'N/A';
        population.textContent = formatPopulation(countryData.population);
        timezone.textContent = countryData.timezone.join(', ');
        currency.textContent = countryData.currency ? `${countryData.currency.name} (${countryData.currency.symbol})` : 'N/A';
        
        // Update map
        map.setView(countryData.coordinates, 5);
        
    
        if (countryData.weather) {
            const weather = countryData.weather;
            weatherIcon.src = `http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;
            temperature.textContent = `${Math.round(weather.main.temp)}°C`;
            weatherCondition.textContent = weather.weather[0].description;
        } else {
            weatherIcon.src = '';
            temperature.textContent = 'N/A';
            weatherCondition.textContent = 'N/A';
        }
        
        // Hide search results
        searchResults.classList.remove('active');
        searchInput.value = '';
    } catch (error) {
        console.error('Error fetching country details:', error);
        alert('Error fetching country details. Please try again.');
    }
}

searchInput.addEventListener('input', debounce((e) => {
    searchCountries(e.target.value);
}, 300));

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.remove('active');
    }
}); 