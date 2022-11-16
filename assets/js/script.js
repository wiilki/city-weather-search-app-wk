var userFormEl = document.querySelector('#user-input-form');
var cityInputEl = document.querySelector('#search-box');
var searchesContainerEl = document.querySelector('#previous-searches-container');
var cityInputEl = document.querySelector('#search-box');
var currentWeatherContainer = document.querySelector('#current-weather-container');
var futureWeatherContainer = document.querySelector('#future-forecast-container');

var formSubmitHandler = function (event) {
    event.preventDefault();
    getCurrentData();


};

var getCurrentData = function (city) {
    var cityName = cityInputEl.value.trim();
    if (cityName) {
        //Get current weather function here
        cityInputEl.value = '';
    } else {
        alert('Please enter a city name');
    }

    var currentApiURL = 'https://api.openweathermap.org/data/2.5/weather?q=' + cityName + '&appid=8062480d86820bb8c5aa0929de58588d&units=imperial';

    fetch(currentApiURL)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                alert('Error: cannot find city');
            }
        })
        .then(function (data) {
            var cityHeader = document.createElement('h2');
            var displayTemp = document.createElement('p');
            var displayWind = document.createElement('p');
            var displayHumidity = document.createElement('p');

            cityHeader.innerHTML = data.name + " (TODAYS DATE) " + data.weather.icon;
            displayTemp.textContent = "Temp: " + data.main.temp + "°F";
            displayWind.textContent = "Wind: " + data.wind.speed + " MPH"
            displayHumidity.textContent = "Humidity: " + data.main.humidity + " %";

            currentWeatherContainer.appendChild(cityHeader);
            currentWeatherContainer.appendChild(displayTemp);
            currentWeatherContainer.appendChild(displayWind);
            currentWeatherContainer.appendChild(displayHumidity);
        });
}





userFormEl.addEventListener('submit', formSubmitHandler);
