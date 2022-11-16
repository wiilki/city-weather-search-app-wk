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

var findCityName = function (city) {
    var cityName = cityInputEl.value.trim();
    if (cityName) {
        //Get current weather function here
        cityInputEl.value = '';
    } else {
        alert('Please enter a city name');
    }


    var apiUrl = 'https://api.openweathermap.org/data/2.5/weather?q=' + cityName + '&appid=8062480d86820bb8c5aa0929de58588d';

    fetch(apiUrl)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                alert('Error: ' + response.statusText);
            }
        })
        .catch(function (error) {
            alert('Unable to connect to weather server');
        })
}




userFormEl.addEventListener('submit', formSubmitHandler);
