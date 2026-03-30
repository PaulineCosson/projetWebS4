import axios from 'axios';

const METEO_TOKEN = '3d0daaa21857e5f9aa6e80141f12537e8da21ca647e8cdbda9e52ce8eda1b037';

export default {
  async getCityCoords(city) {
    const { data } = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${city}&limit=1`);
    if (!data.length) throw new Error("Ville introuvable");
    return { lat: data[0].lat, lon: data[0].lon, name: data[0].display_name };
  },

  async getBeaches(lat, lon) {
    // 1. On réduit le rayon à 10km (10000) pour gagner en rapidité
    // 2. On ajoute [timeout:10] : si le serveur met + de 10s, il coupe proprement
    const query = `[out:json][timeout:10];
      node["natural"="beach"](around:10000,${lat},${lon});
      out;`;

    try {
      const { data } = await axios.post("https://overpass.kumi.systems/api/interpreter", query, {
        timeout: 15000 // Timeout Axios de 15 secondes
      });

      return data.elements.map(b => ({
        id: b.id,
        name: b.tags.name || "Plage sans nom",
        lat: b.lat,
        lon: b.lon
      }));
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
        throw new Error("Le serveur de recherche est saturé. Réessayez dans un instant.");
      }
      throw error;
    }
  }

  async getWeather(lat, lon) {
    const { data } = await axios.get(`https://api.meteo-concept.com/api/forecast/daily/0?token=${METEO_TOKEN}&latlng=${lat},${lon}`);
    return data;
  }
};
