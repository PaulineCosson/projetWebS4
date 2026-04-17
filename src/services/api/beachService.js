import axios from 'axios';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

function isRetryableOverpassError(error) {
  const status = error?.response?.status;

  if (!status) {
    return true;
  }

  return status === 429 || status >= 500;
}

function toBeachServiceError(error) {
  const status = error?.response?.status;

  if (status === 504) {
    return new Error('Le service de recherche des plages est temporairement surcharge. Reessaie dans quelques secondes.');
  }

  if (status === 429) {
    return new Error('Trop de requetes vers le service de plages. Patiente un peu puis reessaie.');
  }

  if (status && status >= 500) {
    return new Error('Le service de plages est indisponible pour le moment. Reessaie plus tard.');
  }

  return new Error('Impossible de recuperer les plages pour cette recherche.');
}

export async function getBeachesAround(lat, lon, radiusMeters = 30000) {
  const overpassQuery = `[out:json];node["natural"="beach"](around:${radiusMeters},${lat},${lon});out;`;
  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await axios.get(endpoint, {
        params: {
          data: overpassQuery,
        },
        timeout: 15000,
      });

      return response.data?.elements ?? [];
    } catch (error) {
      lastError = error;

      if (!isRetryableOverpassError(error)) {
        break;
      }
    }
  }

  throw toBeachServiceError(lastError);
}
