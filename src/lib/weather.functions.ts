import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  lat: z.number(),
  lon: z.number(),
  units: z.enum(["auto", "metric", "imperial"]).default("auto"),
});

const IMPERIAL_COUNTRIES = new Set(["US", "LR", "MM", "KY", "PW", "FM", "MH"]);

const CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with hail",
};

export const getWeather = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }) => {
    const { lat, lon } = data;

    let place = "Your location";
    let countryCode = "";
    try {
      const geoRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      );
      if (geoRes.ok) {
        const geo = (await geoRes.json()) as {
          city?: string;
          locality?: string;
          principalSubdivision?: string;
          countryCode?: string;
          countryName?: string;
        };
        countryCode = (geo.countryCode ?? "").toUpperCase();
        const city = geo.city || geo.locality || geo.principalSubdivision;
        const region = geo.principalSubdivision && geo.principalSubdivision !== city ? geo.principalSubdivision : geo.countryName;
        place = [city, region].filter(Boolean).join(", ") || place;
      }
    } catch {
      /* keep fallback place */
    }

    const system =
      data.units === "auto" ? (IMPERIAL_COUNTRIES.has(countryCode) ? "imperial" : "metric") : data.units;
    const tempUnit = system === "imperial" ? "fahrenheit" : "celsius";
    const windUnit = system === "imperial" ? "mph" : "kmh";
    const precipUnit = system === "imperial" ? "inch" : "mm";

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min` +
      `&forecast_days=1&timezone=auto` +
      `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipUnit}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather service unavailable");
    const json = (await res.json()) as {
      current: {
        temperature_2m: number;
        apparent_temperature: number;
        relative_humidity_2m: number;
        weather_code: number;
        wind_speed_10m: number;
      };
      daily: { temperature_2m_max: number[]; temperature_2m_min: number[] };
    };

    return {
      place,
      countryCode,
      system,
      temperature: Math.round(json.current.temperature_2m),
      feelsLike: Math.round(json.current.apparent_temperature),
      humidity: Math.round(json.current.relative_humidity_2m),
      wind: Math.round(json.current.wind_speed_10m),
      high: Math.round(json.daily.temperature_2m_max[0]),
      low: Math.round(json.daily.temperature_2m_min[0]),
      code: json.current.weather_code,
      summary: CODES[json.current.weather_code] ?? "Current conditions",
      tempUnit: system === "imperial" ? "°F" : "°C",
      windUnit: system === "imperial" ? "mph" : "km/h",
    };
  });
