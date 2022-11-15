var userFormEl = document.querySelector('#user-input-form');
var cityInputEl = document.querySelector('#search-box');
var searchesContainerEl = document.querySelector('#previous-searches-container');
var cityInputEl = document.querySelector('#search-box');
var currentWeatherContainer = document.querySelector('#current-weather-container');
var futureWeatherContainer = document.querySelector('#future-forecast-container');
var myAPI = "8062480d86820bb8c5aa0929de58588d";

var formSubmitHandler = function (event) {
    event.preventDefault();
  
    var cityName = cityInputEl.value.trim();
  
    if (cityName) {
     getCurrentWeather(cityName)
  
      currentWeatherContainer.textContent = '';
      cityInputEl.value = '';
    } else {
      alert('Please enter a city name');
    }
  };

  var getCurrentWeather = function (city) {
    var apiUrl = 'http://api.openweathermap.org/geo/1.0/direct?q=' + city + '&limit=5&appid=' + myAPI;
  
    fetch(apiUrl)
      .then(function (response) {
        if (response.ok) {
          console.log(response);
          response.json().then(function (data) {
            console.log(data);
          });
        } else {
          alert('Error: ' + response.statusText);
        }
      })
      .catch(function (error) {
        alert('Unable to connect to weather server');
      });
  };


  var displayCurrentWeather = function (repos, searchTerm) {
    if (repos.length === 0) {
      repoContainerEl.textContent = 'No repositories found.';
      return;
    }
  





  userFormEl.addEventListener('submit', formSubmitHandler);