import axios from 'axios';

const METEO_BASE_URL = 'https://api.meteo-concept.com/api/forecast';

export async function getTodayForecast(lat, lon, token) {
  const response = await axios.get(`${METEO_BASE_URL}/daily/0`, {
    params: {
      token,
      latlng: `${lat},${lon}`,
    },
  });

  return response.data?.forecast;
}

export async function getWeeklyForecastByPeriod(lat, lon, token) {
  const response = await axios.get(`${METEO_BASE_URL}/daily/periods`, {
    params: {
      token,
      latlng: `${lat},${lon}`,
    },
  });

  return response.data?.forecast ?? [];
}
