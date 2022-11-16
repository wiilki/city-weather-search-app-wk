var userFormEl = document.querySelector('#user-input-form');
var cityInputEl = document.querySelector('#search-box');
var searchesContainerEl = document.querySelector('#previous-searches-container');
var cityInputEl = document.querySelector('#search-box');
var currentWeatherContainer = document.querySelector('#current-weather-container');
var futureWeatherContainer = document.querySelector('#future-forecast-container');

var formSubmitHandler = function (event) {
    event.preventDefault();
    findCityName();
};

var lonCoord;
var latCoord;
var cityNameDisplay;
var currentTemp;
var currentWind;
var currentHumidity;


var findCityName = function (city) {
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
            cityNameDisplay = data.name;
            lonCoord = data.coord.lon;
            latCoord = data.coord.lat;
            currentTemp = data.main.temp + "°F";
            currentWind = data.wind.speed + " MPH"
            currentHumidity = data.main.humidity + " %";
            currentIcon = data.weather.icon;

            console.log(cityNameDisplay);
            console.log(currentTemp);
            console.log(currentWind);
            console.log(currentHumidity);
            console.log(currentIcon);
        });
  
}





userFormEl.addEventListener('submit', formSubmitHandler);
