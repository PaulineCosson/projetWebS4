import axios from 'axios';

export async function getCityCoordinates(cityName) {
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: {
      q: cityName,
      format: 'json',
      limit: 1,
    },
  });

  const firstResult = response.data?.[0];
  if (!firstResult) {
    throw new Error('Ville introuvable.');
  }

  return {
    lat: Number(firstResult.lat),
    lon: Number(firstResult.lon),
  };
}
