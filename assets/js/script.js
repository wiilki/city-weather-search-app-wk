$(function () {
    var userFormEl = document.querySelector('#user-input-form');
    var cityInputEl = document.querySelector('#search-box');
    var cityInputEl = document.querySelector('#search-box');
    var currentWeatherContainer = document.querySelector('#current-weather-container');
    var cityHeaderDiv = document.querySelector('#city-date');
    var tempDiv = document.querySelector('#current-temp');
    var windDiv = document.querySelector('#current-wind');
    var humidityDiv = document.querySelector('#current-humidity');
    var pastSearchesDiv = document.querySelector('#previous-searches-container');

    var today = dayjs();
    var icons = [];
    var dates = [];
    var temps = [];
    var winds = [];
    var humids = [];
    var pastSearchesArray = [];

    renderArray();

    var formSubmitHandler = function (event) {
        event.preventDefault();
        getData();

    }

    // Reads user input. Error if no input
    var getData = function (city) {
        var cityName = cityInputEl.value.trim();

        // Blank error message
        if (cityName === '') {
            alert("Cannot be blank");

        } else {
            // Call api by city name first
            var currentApiURL = 'https://api.openweathermap.org/data/2.5/weather?q=' + cityName + '&appid=8062480d86820bb8c5aa0929de58588d&units=imperial';

            // Fetch for current weather conditions
            fetch(currentApiURL)
                .then(function (response) {
                    // Error if response cannot find city
                    if (response.status === 404) {
                        alert('Cannot find city. Check your spelling'); 
                    } else {
                        // Parse info from api
                        return response.json();
                    }
                })
                .then(function (data) {

                    // Makes sure city is not already saved in array  
                    const notIncluded = !pastSearchesArray.includes(data.name);
                    if (notIncluded) {
                        pastSearchesArray.push(data.name);
                        localStorage.setItem("past-searches", JSON.stringify(pastSearchesArray));
                        renderArray();
                    }

                    // Set display text for current weather
                    var icon = document.createElement("img");
                    tempDiv.textContent = "Temp: " + data.main.temp + "°F";
                    windDiv.textContent = "Wind: " + data.wind.speed + " MPH"
                    humidityDiv.textContent = "Humidity: " + data.main.humidity + " %";

                    // Get ID code for icon and insert into API url
                    icon.src = "http://openweathermap.org/img/wn/" + data.weather[0].icon + ".png";

                    // Render result to screen
                    cityHeaderDiv.innerHTML = data.name + today.format(' [(]M/D/YY[)] ');
                    cityHeaderDiv.appendChild(icon)
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
                    // Index starts at 8 then increments by 8 to get every 24 hours
                    for (i = 7; i < data.list.length; i = i + 8) {
                        icons.push(data.list[i].weather[0].icon);
                        dates.push(data.list[i].dt);
                        temps.push(data.list[i].main.temp);
                        winds.push(data.list[i].wind.speed);
                        humids.push(data.list[i].main.humidity);
                    };
                })
                .then(function (day) {
                    // Iterates 5 times
                    for (i = 0; i < 5; i++) {
                        // Finds specific div
                        var dayNum = document.querySelector('#day-' + i);
                        dayNum.innerHTML = '';

                        // Create dynamic elements for each box
                        var displayImage = document.createElement("img");
                        var displayDate = document.createElement('h3');
                        var displayTemp = document.createElement('p');
                        var displayWind = document.createElement('p');
                        var displayHumid = document.createElement('p');

                        // Future weather values
                        displayImage.src = "http://openweathermap.org/img/wn/" + icons[i] + ".png"
                        var newDate = dayjs.unix(dates[i]);
                        displayDate.textContent = newDate.format('M/D/YY');
                        displayTemp.textContent = 'Temp: ' + temps[i] + '°F';
                        displayWind.textContent = 'Wind: ' + winds[i] + ' MPH';
                        displayHumid.textContent = 'Humidity: ' + humids[i] + '%'

                        // Appened values to 5-day container
                        dayNum.appendChild(displayDate);
                        dayNum.appendChild(displayImage);
                        dayNum.appendChild(displayTemp);
                        dayNum.appendChild(displayWind);
                        dayNum.appendChild(displayHumid);

                        // Adds styling to each day box
                        dayNum.classList.add("day-div");

                        // Clear input box
                        cityInputEl.value = '';
                    };
                })
        }
    }


    function renderArray() {
        var storedSearches = JSON.parse(localStorage.getItem("past-searches"));
        if (storedSearches) {
            pastSearchesArray = storedSearches;
            pastSearchesDiv.innerHTML = '';
            // For the length of the parsed array
            for (i = 0; i < pastSearchesArray.length; i++) {
                // Create new button
                var displayPastSearch = document.createElement('button');
                displayPastSearch.textContent = pastSearchesArray[i];
                pastSearchesDiv.appendChild(displayPastSearch);
                displayPastSearch.classList.add("previous-searches");
            }
        }
    }

    userFormEl.addEventListener('submit', formSubmitHandler);
});