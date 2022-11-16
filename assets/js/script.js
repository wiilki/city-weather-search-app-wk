var userFormEl = document.querySelector('#user-input-form');
var cityInputEl = document.querySelector('#search-box');
var searchesContainerEl = document.querySelector('#previous-searches-container');
var cityInputEl = document.querySelector('#search-box');
var currentWeatherContainer = document.querySelector('#current-weather-container');
var futureWeatherContainer = document.querySelector('#future-forecast-container');
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
            // Create HTML elements/tags
            var cityHeader = document.createElement('h2');
            var displayTemp = document.createElement('p');
            var displayWind = document.createElement('p');
            var displayHumidity = document.createElement('p');
            var displayIcon = document.createElement('i');
          
            // Set display text for current weather
            displayIcon.append(data.weather.icon);
            cityHeader.innerHTML = data.name + today.format(' [(]M/D/YY[)] ');
            cityHeader.append(displayIcon);
            displayTemp.textContent = "Temp: " + data.main.temp + "°F";
            displayWind.textContent = "Wind: " + data.wind.speed + " MPH"
            displayHumidity.textContent = "Humidity: " + data.main.humidity + " %";
            // Appened weather info to body
            currentWeatherContainer.appendChild(cityHeader);
            currentWeatherContainer.appendChild(displayTemp);
            currentWeatherContainer.appendChild(displayWind);
            currentWeatherContainer.appendChild(displayHumidity);
        });


    fetch(currentApiURL)
        .then(function (response) {
            // Parse info from api. Error message already in previous fetch
            return response.json();
        })
        .then(function (data) {
            // Create HTML elements/tags

        });

    // 'https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API%20key}
}





userFormEl.addEventListener('submit', formSubmitHandler);
