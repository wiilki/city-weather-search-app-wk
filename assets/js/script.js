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


var formSubmitHandler = function (event) {
    event.preventDefault();
    getData();

};

// Reads user input. Error if no input
var getData = function (city) {
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
            var image = document.createElement("img");
            tempDiv.textContent = "Temp: " + data.main.temp + "°F";
            windDiv.textContent = "Wind: " + data.wind.speed + " MPH"
            humidityDiv.textContent = "Humidity: " + data.main.humidity + " %";
            // Get ID code for icon and insert into API url
            image.src = "http://openweathermap.org/img/wn/" + data.weather[0].icon + ".png";
            // Render location, date and icon
            cityHeaderDiv.innerHTML = data.name + today.format(' [(]M/D/YY[)] ');
            cityHeaderDiv.appendChild(image)
            // Render result to screen
            currentWeatherContainer.appendChild(cityHeaderDiv);
            currentWeatherContainer.appendChild(tempDiv);
            currentWeatherContainer.appendChild(windDiv);
            currentWeatherContainer.appendChild(humidityDiv);
            // Add class, which adds border
            var currentContainer = document.querySelector("#current-weather-container");
            currentContainer.classList.add("currentContainer");
            // Add label for future weather container
            var futureContainer = document.querySelector("#future-forecast-label");
            futureContainer.textContent = "5-Day Forecast:";
            // Fetch new API created by lat & lon values
            return fetch('https://api.openweathermap.org/data/2.5/forecast?lat=' + data.coord.lat + '&lon=' + data.coord.lon + '&appid=8062480d86820bb8c5aa0929de58588d&units=imperial')
        }).then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log(data.list[2].dt)
        });
}




// var futureData = {
//     1: { city: '', date: '', temp: '', wind: '', humid: '' },
//     2: { city: '', date: '', temp: '', wind: '', humid: '' },
//     3: { city: '', date: '', temp: '', wind: '', humid: '' },
//     4: { city: '', date: '', temp: '', wind: '', humid: '' },
//     5: { city: '', date: '', temp: '', wind: '', humid: '' }
// };


userFormEl.addEventListener('submit', formSubmitHandler);
