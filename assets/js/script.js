"use strict";

(function () {
  // Open-Meteo's free non-commercial endpoints need no client-side API secret.
  const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
  const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
  const STORAGE_KEY = "atmos-recent-cities-v1";
  const UNIT_KEY = "atmos-temperature-unit-v1";
  const LAST_KEY = "atmos-last-city-v1";
  const MAX_RECENT = 8;
  const DEFAULT_CITY = {
    name: "New York", admin1: "New York", country: "United States",
    latitude: 40.7143, longitude: -74.006
  };
  const $ = (id) => document.getElementById(id);
  const state = {
    unit: readStorage(UNIT_KEY, "F") === "C" ? "C" : "F",
    recent: [], place: null, weather: null,
    suggestions: [], suggestionIndex: -1,
    suggestController: null, suggestTimer: null, suggestSerial: 0,
    requestController: null, requestSerial: 0
  };

  function readStorage(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (_) { return fallback; }
  }

  function writeStorage(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* Storage can be disabled. */ }
  }

  function normalizedPlace(place) {
    if (!place || typeof place.name !== "string" || !place.name.trim()) return null;
    const latitude = Number(place.latitude);
    const longitude = Number(place.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
    return {
      name: place.name.slice(0, 120),
      admin1: typeof place.admin1 === "string" ? place.admin1.slice(0, 120) : "",
      country: typeof place.country === "string" ? place.country.slice(0, 120) : "",
      latitude, longitude
    };
  }

  function placeKey(place) {
    return place.latitude.toFixed(3) + "," + place.longitude.toFixed(3);
  }

  function placeSubtitle(place) {
    return [place.admin1, place.country].filter(Boolean).join(", ") || "Weather near you";
  }

  function saveRecent(place) {
    state.recent = [place].concat(state.recent.filter((item) => placeKey(item) !== placeKey(place))).slice(0, MAX_RECENT);
    writeStorage(STORAGE_KEY, state.recent);
    writeStorage(LAST_KEY, place);
    renderRecent();
  }

  function setText(id, value) {
    $(id).textContent = String(value);
  }

  function setMetric(id, value, unit) {
    const node = $(id);
    node.replaceChildren(document.createTextNode(String(value)));
    if (unit) {
      const small = document.createElement("small");
      small.textContent = unit;
      node.appendChild(small);
    }
  }

  function temperature(value) {
    if (!Number.isFinite(value)) return "—";
    return Math.round(state.unit === "F" ? value * 9 / 5 + 32 : value) + "°";
  }

  function wind(value) {
    if (!Number.isFinite(value)) return ["—", state.unit === "F" ? "mph" : "km/h"];
    return [Math.round(state.unit === "F" ? value * 0.621371 : value), state.unit === "F" ? "mph" : "km/h"];
  }

  function precipitation(value) {
    if (!Number.isFinite(value)) return "—";
    return state.unit === "F" ? (value / 25.4).toFixed(2) + " in" : value.toFixed(1) + " mm";
  }

  function percentage(value) {
    return Number.isFinite(value) ? Math.round(Math.max(0, Math.min(100, value))) + "%" : "—";
  }

  function direction(degrees) {
    if (!Number.isFinite(degrees)) return "Wind direction unavailable";
    const names = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return names[Math.round(((degrees % 360) + 360) % 360 / 45) % 8] + " wind";
  }

  function weatherInfo(code, isDay) {
    if (code === 0) return { description: "Clear sky", emoji: isDay ? "☀️" : "🌙", wet: false };
    if (code === 1) return { description: "Mostly clear", emoji: isDay ? "🌤️" : "🌙", wet: false };
    if (code === 2) return { description: "Partly cloudy", emoji: isDay ? "⛅" : "☁️", wet: false };
    if (code === 3) return { description: "Overcast", emoji: "☁️", wet: false };
    if (code === 45 || code === 48) return { description: "Foggy", emoji: "🌫️", wet: false };
    if ([51, 53, 55, 56, 57].includes(code)) return { description: "Drizzle", emoji: "🌦️", wet: true };
    if ([61, 63, 65, 66, 67].includes(code)) return { description: "Rainy", emoji: "🌧️", wet: true };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { description: "Snowy", emoji: "🌨️", wet: true };
    if ([80, 81, 82].includes(code)) return { description: "Rain showers", emoji: "🌦️", wet: true };
    if ([95, 96, 99].includes(code)) return { description: "Thunderstorms", emoji: "⛈️", wet: true };
    return { description: "Cloudy", emoji: "☁️", wet: false };
  }

  function localDate(dateString) {
    return new Date(dateString.slice(0, 10) + "T12:00:00");
  }

  function formattedDate(dateString, options) {
    const date = localDate(dateString);
    return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-US", options).format(date);
  }

  function formattedTime(localIso) {
    if (typeof localIso !== "string" || !/T\d\d:\d\d/.test(localIso)) return "—";
    const parts = localIso.split("T")[1].split(":");
    const hour = Number(parts[0]);
    const minute = Number(parts[1]);
    if (hour > 23 || minute > 59) return "—";
    return (hour % 12 || 12) + ":" + String(minute).padStart(2, "0") + (hour >= 12 ? " PM" : " AM");
  }

  function hourLabel(localIso) {
    if (typeof localIso !== "string" || !/T\d\d:/.test(localIso)) return "—";
    const hour = Number(localIso.slice(11, 13));
    return (hour % 12 || 12) + (hour >= 12 ? " PM" : " AM");
  }

  function uvDescription(value) {
    if (!Number.isFinite(value)) return "UV data unavailable";
    if (value < 3) return "Low exposure";
    if (value < 6) return "Moderate exposure";
    if (value < 8) return "High exposure";
    if (value < 11) return "Very high exposure";
    return "Extreme exposure";
  }

  function elapsedDaylight(sunrise, sunset) {
    if (typeof sunrise !== "string" || typeof sunset !== "string") return "Daylight not available";
    const start = Date.parse(sunrise);
    const end = Date.parse(sunset);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "Daylight not available";
    const mins = Math.round((end - start) / 60000);
    return Math.floor(mins / 60) + "h " + mins % 60 + "m of daylight";
  }

  function renderUnits() {
    ["F", "C"].forEach((unit) => {
      const button = $("unit-" + unit.toLowerCase());
      const selected = state.unit === unit;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    setText("hero-degree", "°" + state.unit);
  }

  function renderRecent() {
    const container = $("recent-list");
    container.replaceChildren();
    $("recent-empty").hidden = state.recent.length > 0;
    state.recent.forEach((place) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "recent-item" + (state.place && placeKey(place) === placeKey(state.place) ? " active" : "");
      button.setAttribute("aria-label", "Weather for " + place.name + ", " + placeSubtitle(place));
      const pin = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      pin.setAttribute("class", "icon");
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", "#i-location");
      pin.appendChild(use);
      const label = document.createElement("span");
      label.className = "recent-name";
      label.textContent = place.name + (place.country ? ", " + place.country : "");
      const chevron = pin.cloneNode(true);
      chevron.replaceChildren();
      const chevronUse = document.createElementNS("http://www.w3.org/2000/svg", "use");
      chevronUse.setAttribute("href", "#i-chevron");
      chevron.appendChild(chevronUse);
      chevron.classList.add("recent-chevron");
      button.append(pin, label, chevron);
      button.addEventListener("click", () => loadPlace(place));
      container.appendChild(button);
    });
  }

  function setLoading(loading) {
    $("dashboard").setAttribute("aria-busy", String(loading));
    $("refresh-button").disabled = loading;
    $("refresh-button").classList.toggle("is-spinning", loading);
    $("search-button").disabled = loading;
    if (loading) setText("page-subtitle", "Getting the latest weather conditions…");
  }

  function showError(message) {
    setText("alert-text", message);
    $("alert").hidden = false;
  }

  function clearError() {
    $("alert").hidden = true;
  }

  async function fetchJSON(url, signal) {
    const response = await fetch(url, { signal: signal, headers: { Accept: "application/json" } });
    if (!response.ok) {
      if (response.status === 429) throw new Error("The weather service is busy. Please try again shortly.");
      throw new Error("The weather service is unavailable (" + response.status + "). Please try again.");
    }
    const data = await response.json();
    if (data.error) throw new Error(data.reason || "Weather service returned an error.");
    return data;
  }

  async function lookupCity(query, signal) {
    const url = new URL(GEOCODING_URL);
    url.search = new URLSearchParams({ name: query, count: "8", language: "en", format: "json" }).toString();
    const data = await fetchJSON(url, signal);
    const results = Array.isArray(data.results) ? data.results.map(normalizedPlace).filter(Boolean) : [];
    if (!results.length) throw new Error("No cities found. Try a different spelling or add a country.");
    return results;
  }

  async function forecastFor(place, signal) {
    const params = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
      hourly: "temperature_2m,precipitation_probability,weather_code",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
      timezone: "auto", forecast_days: "7"
    });
    const data = await fetchJSON(FORECAST_URL + "?" + params.toString(), signal);
    if (!data.current || !data.daily || !Array.isArray(data.daily.time) ||
        !Array.isArray(data.hourly && data.hourly.time) || !data.daily.time.length ||
        !Number.isFinite(data.current.temperature_2m) ||
        typeof data.current.time !== "string") {
      throw new Error("Incomplete forecast received. Please try again.");
    }
    return data;
  }

  function requestStart() {
    state.requestSerial++;
    if (state.requestController) state.requestController.abort();
    state.requestController = new AbortController();
    setLoading(true);
    clearError();
    $("search-feedback").textContent = "";
    hideSuggestions();
    return { serial: state.requestSerial, controller: state.requestController };
  }

  async function runRequest(placeOrQuery) {
    const { serial, controller } = requestStart();
    try {
      const place = typeof placeOrQuery === "string"
        ? (await lookupCity(placeOrQuery, controller.signal))[0]
        : normalizedPlace(placeOrQuery);
      if (!place) throw new Error("Select a valid city.");
      const weather = await forecastFor(place, controller.signal);
      if (serial !== state.requestSerial) return;
      state.place = place;
      state.weather = weather;
      saveRecent(place);
      renderWeather();
      $("city-input").value = "";
    } catch (error) {
      if (error.name === "AbortError" || serial !== state.requestSerial) return;
      showError(error instanceof TypeError
        ? "Can't reach the weather service. Check your connection and try again."
        : error.message || "Something went wrong loading the forecast.");
      if (state.weather) renderWeather();
      else setText("page-subtitle", "Weather could not be loaded. Try another city or refresh.");
    } finally {
      if (serial === state.requestSerial) setLoading(false);
    }
  }

  function loadPlace(place) {
    $("search-feedback").textContent = "";
    return runRequest(place);
  }

  function hideSuggestions() {
    $("suggestions").hidden = true;
    $("city-input").setAttribute("aria-expanded", "false");
    $("city-input").removeAttribute("aria-activedescendant");
    state.suggestionIndex = -1;
  }

  function cancelSuggestions() {
    clearTimeout(state.suggestTimer);
    state.suggestSerial++;
    if (state.suggestController) state.suggestController.abort();
    state.suggestController = null;
    hideSuggestions();
  }

  function renderSuggestions() {
    const container = $("suggestions");
    container.replaceChildren();
    if (!state.suggestions.length) {
      hideSuggestions();
      return;
    }
    state.suggestions.forEach((place, index) => {
      const button = document.createElement("button");
      button.id = "suggestion-" + index;
      button.className = "suggestion" + (index === state.suggestionIndex ? " is-active" : "");
      button.type = "button";
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(index === state.suggestionIndex));
      const name = document.createElement("span");
      name.className = "suggestion-name";
      name.textContent = place.name;
      const details = document.createElement("span");
      details.className = "suggestion-sub";
      details.textContent = placeSubtitle(place);
      button.append(name, details);
      button.addEventListener("click", () => {
        cancelSuggestions();
        loadPlace(place);
      });
      container.appendChild(button);
    });
    container.hidden = false;
    $("city-input").setAttribute("aria-expanded", "true");
    if (state.suggestionIndex >= 0) $("city-input").setAttribute("aria-activedescendant", "suggestion-" + state.suggestionIndex);
    else $("city-input").removeAttribute("aria-activedescendant");
  }

  async function fetchSuggestions(query) {
    if (state.suggestController) state.suggestController.abort();
    const serial = ++state.suggestSerial;
    const controller = new AbortController();
    state.suggestController = controller;
    try {
      const results = await lookupCity(query, controller.signal);
      if (serial !== state.suggestSerial || $("city-input").value.trim() !== query) return;
      state.suggestions = results;
      state.suggestionIndex = -1;
      renderSuggestions();
    } catch (error) {
      if (error.name === "AbortError" || serial !== state.suggestSerial) return;
      state.suggestions = [];
      hideSuggestions();
      // Keep search usable: form submission will display the actionable error.
    }
  }

  function renderWeather() {
    if (!state.weather || !state.place) return;
    const data = state.weather;
    const now = data.current;
    const daily = data.daily;
    const dateIndex = Math.max(0, daily.time.indexOf(now.time.slice(0, 10)));
    const current = weatherInfo(now.weather_code, now.is_day === 1);
    const high = daily.temperature_2m_max[dateIndex];
    const low = daily.temperature_2m_min[dateIndex];

    setText("page-subtitle", "Your forecast for " + state.place.name + ", updated with the latest available data.");
    setText("today-date", formattedDate(now.time, { month: "short", day: "numeric", year: "numeric" }));
    setText("hero-city", state.place.name);
    setText("hero-region", placeSubtitle(state.place));
    setText("hero-temperature", String(temperature(now.temperature_2m)).replace("°", ""));
    setText("hero-condition", current.description);
    setText("hero-feels", "Feels like " + temperature(now.apparent_temperature));
    setText("hero-high", temperature(high));
    setText("hero-low", temperature(low));
    setText("hero-date", formattedDate(now.time, { weekday: "long", month: "short", day: "numeric" }));
    setText("hero-updated", "As of " + formattedTime(now.time) + " local");
    setText("hero-icon", current.emoji);
    $("hero-icon").parentElement; // Weather symbol is decorative; layout is controlled by classes below.
    document.querySelector(".hero").classList.toggle("is-night", now.is_day === 0);
    document.querySelector(".hero").classList.toggle("is-wet", current.wet);
    renderUnits();

    const windValue = wind(now.wind_speed_10m);
    setMetric("metric-wind", windValue[0], windValue[1]);
    setText("metric-wind-sub", direction(now.wind_direction_10m));
    setMetric("metric-humidity", percentage(now.relative_humidity_2m), "");
    setText("metric-humidity-sub", "Relative humidity now");
    setMetric("metric-rain", percentage(daily.precipitation_probability_max[dateIndex]), "");
    setText("metric-rain-sub", "Highest chance today");
    const uv = daily.uv_index_max[dateIndex];
    setMetric("metric-uv", Number.isFinite(uv) ? Math.round(uv * 10) / 10 : "—", "");
    setText("metric-uv-sub", uvDescription(uv));

    renderHourly(data);
    renderDaily(data);
    renderSun(daily, dateIndex);
    renderRecent();
  }

  function renderHourly(data) {
    const list = $("hourly-list");
    list.replaceChildren();
    const hours = data.hourly;
    let start = hours.time.findIndex((time) => time >= data.current.time.slice(0, 13) + ":00");
    if (start < 0) start = 0;
    const stop = Math.min(start + 12, hours.time.length);
    for (let index = start; index < stop; index++) {
      const item = document.createElement("div");
      item.className = "hour-item" + (index === start ? " is-now" : "");
      item.setAttribute("role", "listitem");
      const time = document.createElement("span");
      time.className = "hour-time";
      time.textContent = index === start ? "Now" : hourLabel(hours.time[index]);
      const icon = document.createElement("span");
      icon.className = "hour-emoji";
      icon.setAttribute("aria-hidden", "true");
      const hourOfDay = Number(hours.time[index].slice(11, 13));
      const info = weatherInfo(hours.weather_code[index], hourOfDay >= 6 && hourOfDay < 19);
      icon.textContent = info.emoji;
      const temp = document.createElement("strong");
      temp.className = "hour-temp";
      temp.textContent = temperature(hours.temperature_2m[index]);
      const rain = document.createElement("span");
      rain.className = "hour-rain";
      rain.textContent = "☂ " + percentage(hours.precipitation_probability[index]);
      item.setAttribute("aria-label", time.textContent + ": " + info.description + ", " + temp.textContent + ", precipitation " + percentage(hours.precipitation_probability[index]));
      item.append(time, icon, temp, rain);
      list.appendChild(item);
    }
    if (start === stop) {
      const message = document.createElement("p");
      message.className = "loading-placeholder";
      message.textContent = "Hourly forecast unavailable.";
      list.appendChild(message);
    }
  }

  function renderDaily(data) {
    const list = $("daily-list");
    list.replaceChildren();
    const daily = data.daily;
    const highs = daily.temperature_2m_max.filter(Number.isFinite);
    const lows = daily.temperature_2m_min.filter(Number.isFinite);
    const min = Math.min.apply(null, lows);
    const max = Math.max.apply(null, highs);
    const spread = Math.max(1, max - min);
    daily.time.slice(0, 7).forEach((day, index) => {
      const info = weatherInfo(daily.weather_code[index], true);
      const row = document.createElement("div");
      row.className = "day-row";
      const name = document.createElement("span");
      name.className = "day-name" + (index === 0 ? " today" : "");
      name.textContent = index === 0 ? "Today" : formattedDate(day, { weekday: "short" });
      const icon = document.createElement("span");
      icon.className = "day-emoji";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = info.emoji;
      const description = document.createElement("span");
      description.className = "day-description";
      description.textContent = info.description;
      const low = document.createElement("span");
      low.className = "day-low";
      low.textContent = temperature(daily.temperature_2m_min[index]);
      const high = document.createElement("span");
      high.className = "day-high";
      high.textContent = temperature(daily.temperature_2m_max[index]);
      const track = document.createElement("span");
      track.className = "temp-track";
      track.setAttribute("aria-hidden", "true");
      const range = document.createElement("span");
      range.className = "temp-range";
      const left = (daily.temperature_2m_min[index] - min) / spread * 100;
      const width = (daily.temperature_2m_max[index] - daily.temperature_2m_min[index]) / spread * 100;
      range.style.left = (Number.isFinite(left) ? Math.max(0, left) : 0) + "%";
      range.style.width = (Number.isFinite(width) ? Math.max(3, Math.min(100, width)) : 0) + "%";
      track.appendChild(range);
      row.setAttribute("aria-label", name.textContent + ": " + info.description + ", high " + high.textContent + ", low " + low.textContent);
      row.append(name, icon, description, low, high, track);
      list.appendChild(row);
    });
  }

  function renderSun(daily, index) {
    const rise = daily.sunrise[index];
    const set = daily.sunset[index];
    setText("sunrise", formattedTime(rise));
    setText("sunset", formattedTime(set));
    setText("daylight", elapsedDaylight(rise, set));
  }

  function init() {
    const stored = readStorage(STORAGE_KEY, []);
    state.recent = (Array.isArray(stored) ? stored : []).map(normalizedPlace).filter(Boolean).slice(0, MAX_RECENT);
    renderUnits();
    renderRecent();

    $("search-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const query = $("city-input").value.trim();
      if (query.length < 2) {
        $("search-feedback").textContent = "Enter at least two characters to find a city.";
        return;
      }
      if (state.suggestionIndex >= 0 && state.suggestions[state.suggestionIndex]) {
        const chosen = state.suggestions[state.suggestionIndex];
        cancelSuggestions();
        loadPlace(chosen);
      } else {
        cancelSuggestions();
        runRequest(query);
      }
    });

    $("city-input").addEventListener("input", () => {
      $("search-feedback").textContent = "";
      clearTimeout(state.suggestTimer);
      if (state.suggestController) state.suggestController.abort();
      state.suggestSerial++;
      state.suggestions = [];
      hideSuggestions();
      const query = $("city-input").value.trim();
      if (query.length >= 2) state.suggestTimer = setTimeout(() => fetchSuggestions(query), 280);
    });

    $("city-input").addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        cancelSuggestions();
        return;
      }
      if (!state.suggestions.length || $("suggestions").hidden) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        state.suggestionIndex = event.key === "ArrowDown"
          ? (state.suggestionIndex + 1) % state.suggestions.length
          : (state.suggestionIndex - 1 + state.suggestions.length) % state.suggestions.length;
        renderSuggestions();
      }
    });

    document.addEventListener("click", (event) => {
      if (!$("search-form").contains(event.target)) hideSuggestions();
    });
    $("city-input").addEventListener("focus", () => {
      if (state.suggestions.length && $("city-input").value.trim().length >= 2) renderSuggestions();
    });

    document.querySelectorAll(".explore-city").forEach((button) => {
      button.addEventListener("click", () => runRequest(button.dataset.city));
    });

    ["F", "C"].forEach((unit) => {
      $("unit-" + unit.toLowerCase()).addEventListener("click", () => {
        state.unit = unit;
        writeStorage(UNIT_KEY, unit);
        renderUnits();
        renderWeather();
      });
    });

    $("refresh-button").addEventListener("click", () => {
      if (state.place) loadPlace(state.place);
      else runRequest(DEFAULT_CITY);
    });
    $("alert-close").addEventListener("click", clearError);

    $("location-button").addEventListener("click", () => {
      if (!navigator.geolocation) {
        showError("Your browser doesn't support location access. Search for a city instead.");
        return;
      }
      $("location-button").disabled = true;
      $("search-feedback").textContent = "Requesting location permission…";
      navigator.geolocation.getCurrentPosition(
        (position) => {
          $("location-button").disabled = false;
          $("search-feedback").textContent = "";
          loadPlace({
            name: "Current location", admin1: "", country: "Nearby forecast",
            latitude: position.coords.latitude, longitude: position.coords.longitude
          });
        },
        (error) => {
          $("location-button").disabled = false;
          $("search-feedback").textContent = "";
          showError(error.code === 1
            ? "Location permission was denied. You can search for your city instead."
            : "Could not determine your location. Search for a city instead.");
        },
        { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false }
      );
    });

    const last = normalizedPlace(readStorage(LAST_KEY, null));
    loadPlace(last || DEFAULT_CITY);
  }

  init();
})();
