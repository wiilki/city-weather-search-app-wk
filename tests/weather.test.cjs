"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../assets/js/script.js"), "utf8");

class Element {
  constructor(id, handlers) {
    this.id = id;
    this.handlers = handlers;
    this.children = [];
    this.attrs = {};
    this.style = {};
    this.value = "";
    this.hidden = false;
    this.disabled = false;
    this.dataset = {};
    this.textContent = "";
    this.classList = { toggle() {}, add() {} };
  }
  setAttribute(key, value) { this.attrs[key] = value; }
  removeAttribute(key) { delete this.attrs[key]; }
  addEventListener(event, handler) { this.handlers[this.id + ":" + event] = handler; }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.append(child); return child; }
  replaceChildren(...children) { this.children = children; }
  cloneNode() { return new Element(this.id + "-clone", this.handlers); }
  contains() { return false; }
}

function fixture() {
  const days = Array.from({ length: 7 }, (_, i) => "2026-11-" + String(13 + i));
  const hours = Array.from({ length: 168 }, (_, i) =>
    new Date(Date.UTC(2026, 10, 13, i)).toISOString().slice(0, 16));
  return {
    current: {
      time: "2026-11-13T10:00", temperature_2m: 20, relative_humidity_2m: 61,
      apparent_temperature: 19, is_day: 1, precipitation: 0,
      weather_code: 2, wind_speed_10m: 12, wind_direction_10m: 200
    },
    hourly: {
      time: hours, temperature_2m: hours.map(() => 18),
      precipitation_probability: hours.map(() => 25),
      weather_code: hours.map(() => 2)
    },
    daily: {
      time: days, weather_code: days.map(() => 2),
      temperature_2m_max: days.map(() => 27),
      temperature_2m_min: days.map(() => 15),
      sunrise: days.map((day) => day + "T06:30"),
      sunset: days.map((day) => day + "T17:10"),
      uv_index_max: days.map(() => 4),
      precipitation_probability_max: days.map(() => 17)
    }
  };
}

function harness(options = {}) {
  const elements = new Map();
  const handlers = {};
  const storage = new Map();
  const calls = [];
  const get = (id) => {
    if (!elements.has(id)) elements.set(id, new Element(id, handlers));
    return elements.get(id);
  };
  const document = {
    getElementById: get,
    createElement: (tag) => new Element(tag, handlers),
    createElementNS: (_, tag) => new Element(tag, handlers),
    createTextNode: (value) => ({ textContent: value }),
    querySelector: get,
    querySelectorAll: () => [],
    addEventListener: (name, handler) => { handlers["document:" + name] = handler; }
  };
  const fetch = async (url) => {
    calls.push(String(url));
    if (options.failWeather && !String(url).includes("geocoding"))
      return { ok: false, status: 503 };
    if (String(url).includes("geocoding"))
      return { ok: true, json: async () => ({ results: options.emptySearch ? [] : [
        { name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522 }
      ] }) };
    return { ok: true, json: async () => fixture() };
  };
  const context = {
    document, window: { localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    } },
    navigator: {}, fetch, URL, URLSearchParams, AbortController,
    Intl, Date, setTimeout, clearTimeout, console
  };
  vm.runInNewContext(source, context, { filename: "script.js" });
  const flush = async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve();
  };
  return {
    get, handlers, calls, flush,
    submit(query) {
      get("city-input").value = query;
      handlers["search-form:submit"]({ preventDefault() {} });
    }
  };
}

test("initial forecast renders current, 12 hourly and seven daily rows", async () => {
  const h = harness();
  await h.flush();
  assert.equal(h.get("hero-city").textContent, "New York");
  assert.equal(h.get("hero-temperature").textContent, "68");
  assert.equal(h.get("hourly-list").children.length, 12);
  assert.equal(h.get("daily-list").children.length, 7);
  assert.equal(h.get("sunrise").textContent, "6:30 AM");
  assert.equal(h.get("sunset").textContent, "5:10 PM");
  assert.equal(h.get("dashboard").attrs["aria-busy"], "false");
  assert.equal(h.calls.length, 1);
});

test("changing units recalculates displayed weather without another API call", async () => {
  const h = harness();
  await h.flush();
  h.handlers["unit-c:click"]();
  assert.equal(h.get("hero-temperature").textContent, "20");
  assert.equal(h.get("unit-c").attrs["aria-pressed"], "true");
  assert.equal(h.get("metric-wind").children[1].textContent, "km/h");
  assert.equal(h.calls.length, 1);
});

test("city search uses geocoding and keeps previously searched cities", async () => {
  const h = harness();
  await h.flush();
  h.submit("Paris");
  await h.flush();
  assert.equal(h.get("hero-city").textContent, "Paris");
  assert.equal(h.get("recent-list").children.length, 2);
  assert.ok(h.calls.some((url) => url.includes("geocoding-api.open-meteo.com")));
  assert.ok(h.calls.some((url) => url.includes("latitude=48.8566")));
});

test("blank search presents helpful feedback instead of making a request", async () => {
  const h = harness();
  await h.flush();
  h.submit(" ");
  assert.match(h.get("search-feedback").textContent, /at least two characters/i);
  assert.equal(h.calls.length, 1);
});

test("API failure shows an error without displaying fabricated values", async () => {
  const h = harness({ failWeather: true });
  await h.flush();
  assert.match(h.get("alert-text").textContent, /unavailable/i);
  assert.equal(h.get("dashboard").attrs["aria-busy"], "false");
  assert.equal(h.get("hero-temperature").textContent, "");
});

test("unknown city preserves the last successful forecast", async () => {
  const h = harness({ emptySearch: true });
  await h.flush();
  h.submit("NoSuchCity");
  await h.flush();
  assert.match(h.get("alert-text").textContent, /No cities found/i);
  assert.equal(h.get("hero-city").textContent, "New York");
});
