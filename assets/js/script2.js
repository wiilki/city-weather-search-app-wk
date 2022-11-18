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
var icon = document.querySelector('#icon')
var today = dayjs();

var info = []

var formSubmitHandler = function (event) {
    event.preventDefault();
    getCity();
    getCurrentApi();
};


// const p = Promise.all(info)


var getCity = function (city) {
    var city = cityInputEl.value.trim()
    cityInputEl.value = '';
    info.push(city)
    console.log(info)
}

var getCurrentApi = function (response) {
    var currentApiURL = 'https://api.openweathermap.org/data/2.5/weather?q=' + info[0] + '&appid=8062480d86820bb8c5aa0929de58588d&units=imperial';
    fetch(currentApiURL)
        .then(function (response) {
            return response.json();
        });
    console.log(currentApiURL)
}




userFormEl.addEventListener('submit', formSubmitHandler);

