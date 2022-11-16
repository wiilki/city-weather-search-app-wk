var userFormEl = document.querySelector('#user-input-form');
var cityInputEl = document.querySelector('#search-box');
var searchesContainerEl = document.querySelector('#previous-searches-container');
var cityInputEl = document.querySelector('#search-box');
var allInfoContainer = document.querySelector('#all-weather-info');
var currentWeatherContainer = document.querySelector('#current-weather-container');
var futureWeatherContainer = document.querySelector('#future-forecast-container');
var cityHeaderDiv = document.querySelector('#city-date');
var tempDiv = document.querySelector('#current-temp');
var windDiv = document.querySelector('#current-wind');
var humidityDiv = document.querySelector('#current-humidity');;
var iconLink = document.querySelector('#icon-link')
var today = dayjs();


var formSubmitHandler = function (event) {
    event.preventDefault();
    getCurrentData();


};

// Reads user input. Error if no input
var getCurrentData = function (city) {
    var cityName = cityInputEl.value.trim();
    if (cityName) {
        cityInputEl.value = '';
    } else {
        alert('Please enter a city name');
    }

    // Call api by city name first
    var currentApiURL = 'https://api.openweathermap.org/data/2.5/weather?q=' + cityName + '&appid=8062480d86820bb8c5aa0929de58588d&units=imperial';

    // Fetch for current weather conditions
    fetch(currentApiURL)
        .then(function (response) {
            // Parse info from api
            if (response.ok) {
                return response.json();
            } else {
                alert('Error: cannot find city. Check your spelling');
            }
        })
        .then(function (data) {
            // Set display text for current weather
            cityHeaderDiv.textContent = data.name + today.format(' [(]M/D/YY[)] ');
            tempDiv.textContent = "Temp: " + data.main.temp + "°F";
            windDiv.textContent = "Wind: " + data.wind.speed + " MPH"
            humidityDiv.textContent = "Humidity: " + data.main.humidity + " %";

            // Render result to screen
            currentWeatherContainer.appendChild(cityHeaderDiv);
            currentWeatherContainer.appendChild(tempDiv);
            currentWeatherContainer.appendChild(windDiv);
            currentWeatherContainer.appendChild(humidityDiv);
        });


    fetch(currentApiURL)
        .then(function (response) {
            // Parse info from api. Error message already in previous fetch
            return response.json();
        })
        .then(function (data) {
            // Create HTML elements/tags

        });
}





userFormEl.addEventListener('submit', formSubmitHandler);
