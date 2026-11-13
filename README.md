# Atmos — Weather, beautifully clear

A responsive, accessible weather dashboard built with HTML, CSS and vanilla JavaScript. This is a complete rebuild of the original City Weather Search coursework project.

**Live redesigned site:** https://atmos-weather-roan.vercel.app/

## Features

- Worldwide city / postal-code search with suggestions and location disambiguation
- Browser geolocation on demand (permission required; HTTPS or localhost)
- Real current conditions, feels-like temperature, high / low, wind, humidity, daily maximum UV and chance of precipitation
- Next 12 hours and a seven-day forecast
- Sunrise, sunset and daylight duration in the forecast location's local time
- °F/°C preference with consistent wind and precipitation unit conversions
- Up to eight recent locations, stored locally in the browser
- Responsive desktop/tablet/mobile layout, keyboard-friendly search, labelled controls and useful connection / API error messages
- No embedded API keys and no frontend framework or build step

## Production deployment

The live redesigned dashboard was deployed directly to the `atmos-weather` Vercel project from the current `main` source (commit `fba2428`, November 13, 2026). The previous GitHub Pages URL may still show the older coursework version.

**Deployment note:** Vercel could not attach this GitHub repository through the current Git integration, so the deployment is a source-file snapshot rather than an automatic Git deployment. Future edits to `main` require a fresh deployment until a Git connection or automated release pipeline is configured.

## Run locally

Open `index.html` in a browser, or serve the folder locally for the most consistent results:

```sh
python3 -m http.server 8000
```

Then visit http://localhost:8000.

To run the regression checks:

```sh
node --test tests/weather.test.cjs
```

The app needs an internet connection for forecast requests. The geolocation button works only when browser location access is available and allowed. You can search cities without sharing your location.

## Weather data

Forecasts and geocoding come from [Open-Meteo](https://open-meteo.com/), including its [Forecast API](https://open-meteo.com/en/docs) and [Geocoding API](https://open-meteo.com/en/docs/geocoding-api). The no-key endpoints are **free for non-commercial use** under [Open-Meteo's terms](https://open-meteo.com/en/terms); a commercial/advertising site would need an appropriate paid API plan. Weather data is provided under CC BY 4.0 and attributed in the dashboard. This project does not provide severe-weather alerts.

Current conditions are model-derived, not a station observation. Forecasts can change, and sunrise/sunset times are local to the searched location.

## Project structure

```
index.html                 Page structure and semantic controls
assets/css/style.css       Responsive design system
assets/js/script.js        API requests, search, data formatting, rendering
tests/weather.test.cjs     Mocked API regression checks
.github/workflows/ci.yml   GitHub Actions regression workflow
```

## Security & privacy

No weather API secrets are stored in the client. Recent searches and the display-unit preference are kept in browser `localStorage` and are not uploaded to this project. Weather and search requests are sent directly from the browser to Open-Meteo. Your browser only requests geolocation after you click **Use my current location**.

## Original project

This repository began as a JavaScript weather API assignment. The prior implementation used an OpenWeather API key embedded in JavaScript, HTTP icon URLs, and basic Bootstrap/jQuery styling. The new version replaces the API and removes those dependencies.
