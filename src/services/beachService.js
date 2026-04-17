import axios from 'axios';

export async function getBeachesAround(lat, lon, radiusMeters = 30000) {
  const overpassQuery = `[out:json];node["natural"="beach"](around:${radiusMeters},${lat},${lon});out;`;

  const response = await axios.get('https://overpass-api.de/api/interpreter', {
    params: {
      data: overpassQuery,
    },
  });

  return response.data?.elements ?? [];
}
