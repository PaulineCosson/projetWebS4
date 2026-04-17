export function getWeatherLabel(code) {
  if (code === 0) return '☀️ Soleil';
  if (code >= 1 && code <= 5) return '⛅ Éclaircies / Nuages';
  if (code >= 10 && code <= 16) return '🌧️ Pluie';
  if (code >= 20 && code <= 22) return '❄️ Neige';
  if (code >= 100 && code <= 142) return '⛈️ Orage';
  return '☁️ Couvert';
}

export function getWeatherEmoji(code) {
  if (code === 0) return '☀️';
  if (code >= 1 && code <= 5) return '⛅';
  if (code >= 10 && code <= 16) return '🌧️';
  if (code >= 100 && code <= 142) return '⛈️';
  return '☁️';
}
