$(function () {
    var userFormEl = document.querySelector('#user-input-form');
    var cityInputEl = document.querySelector('#search-box');
    var currentWeatherContainer = document.querySelector('#current-weather-container');
    var cityHeaderDiv = document.querySelector('#city-date');
    var tempDiv = document.querySelector('#current-temp');
    var windDiv = document.querySelector('#current-wind');
    var humidityDiv = document.querySelector('#current-humidity');
    var pastSearchesDiv = document.querySelector('#previous-searches-container');
    var futureRow = document.querySelector('#future-forecast-row');
    var emptyModal = document.querySelector('#empty-text-modal');
    var today = dayjs();
    var pastSearchesArray = [];
    const maxSavedSearches = 10;

    // Even handler for new city search
    var formSubmitHandler = function (event) {
        event.preventDefault();
        var cityName = cityInputEl.value.trim();
        // Blank error message
        if (cityName) {
            getCurrentData(cityName);
            // Clear input box
            cityInputEl.value = '';
        } else {
            alert("Cannot be blank");
        };
    };

    // Reads user input. Error if no api response
    var getCurrentData = function (city) {
        // Call api by city name first
        var currentApiUrl = 'https://api.openweathermap.org/data/2.5/weather?q=' + city + '&appid=8062480d86820bb8c5aa0929de58588d&units=imperial';

        // Fetch for current weather conditions
        fetch(currentApiUrl)
            .then(function (response) {
                // Error if response cannot find city
                if (response.ok) {
                    // Parse info from api
                    response.json().then(function (data) {
                        displayCurrentWeather(data, city);
                    })
                } else {
                    alert("Check your spelling");
                }
            }).catch(function (error) {
                alert("Unable to connect");
            });
    };

    var displayCurrentWeather = function (data) {
        // Makes sure city is not already saved in array  
        const notIncluded = !pastSearchesArray.includes(data.name);
        if (notIncluded) {
            // Add to front of array to display most recent search first
            pastSearchesArray.unshift(data.name);
            localStorage.setItem("past-searches", JSON.stringify(pastSearchesArray));
            renderArray(history, data);
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

        var lat = data.coord.lat;
        var lon = data.coord.lon;
        getFutureData(lat, lon);
    }

    var getFutureData = function (lat, lon) {
        // Fetch new API created by lat & lon values
        var futureApiUrl = 'https://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + lon + '&appid=8062480d86820bb8c5aa0929de58588d&units=imperial';
        futureRow.innerHTML = "";
        // Fetch for future weather conditions
        fetch(futureApiUrl)
            .then(function (newResponse) {
                newResponse.json().then(function (futureData) {
                    displayFutureData(futureData, lat, lon)
                });
            }).catch(function (error) {
                alert("Unable to connect");
            });
    }

    var displayFutureData = function (futureData) {
        // Reset arrays
        var icons = [];
        var dates = [];
        var temps = [];
        var winds = [];
        var humids = [];

        // Index starts at 8 then increments by 8 to get every 24 hours
        for (i = 7; i < futureData.list.length; i = i + 8) {
            icons.push(futureData.list[i].weather[0].icon);
            dates.push(futureData.list[i].dt);
            temps.push(futureData.list[i].main.temp);
            winds.push(futureData.list[i].wind.speed);
            humids.push(futureData.list[i].main.humidity);
        };

        // Iterates 5 times
        for (j = 0; j < 5; j++) {
            // Create dynamic elements for each box
            var displayBox = document.createElement('div')
            var displayImage = document.createElement("img");
            var displayDate = document.createElement('h3');
            var displayTemp = document.createElement('p');
            var displayWind = document.createElement('p');
            var displayHumid = document.createElement('p');

            // Future weather values
            displayImage.src = "http://openweathermap.org/img/wn/" + icons[j] + ".png"
            var newDate = dayjs.unix(dates[j]);
            displayDate.textContent = newDate.format('M/D/YY');
            displayTemp.textContent = 'Temp: ' + temps[j] + '°F';
            displayWind.textContent = 'Wind: ' + winds[j] + ' MPH';
            displayHumid.textContent = 'Humidity: ' + humids[j] + '%'

            // Appened values to 5-day container
            futureRow.appendChild(displayBox);
            displayBox.appendChild(displayDate);
            displayBox.appendChild(displayImage);
            displayBox.appendChild(displayTemp);
            displayBox.appendChild(displayWind);
            displayBox.appendChild(displayHumid);

            // Adds styling to each day box
            displayBox.classList.add("day-div");
        };
    };

    var renderArray = function (history) {
        var storedSearches = JSON.parse(localStorage.getItem("past-searches"));
        if (storedSearches) {
            pastSearchesArray = storedSearches;
            pastSearchesDiv.innerHTML = '';
            // For the length of the parsed array
            for (i = 0; i < pastSearchesArray.length; i++) {
                // Set max length of search history to 10
                if (pastSearchesArray.length > maxSavedSearches) {
                    pastSearchesArray.splice(-1);
                }
                // Create new button
                var displayPastSearch = document.createElement('button');
                displayPastSearch.textContent = pastSearchesArray[i];
                pastSearchesDiv.appendChild(displayPastSearch);
                displayPastSearch.classList.add("previous-searches");
            }
        }
    }

    // Click handler for dynamic previous search buttons
    var buttonClickHandler = function (event) {
        event.preventDefault;
        // Calls getCurrentData as a function of button's text content
        var repeatCity = event.target.textContent;
        getCurrentData(repeatCity);
    };

    renderArray();
    userFormEl.addEventListener('submit', formSubmitHandler);
    pastSearchesDiv.addEventListener('click', buttonClickHandler);
});