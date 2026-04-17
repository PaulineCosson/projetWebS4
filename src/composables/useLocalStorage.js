export function readJsonFromStorage(key, fallbackValue) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function writeJsonToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readNumberFromStorage(key, fallbackValue, minValue, maxValue) {
  try {
    const storedValue = Number(localStorage.getItem(key));
    if (Number.isNaN(storedValue)) {
      return fallbackValue;
    }

    return Math.min(maxValue, Math.max(minValue, storedValue));
  } catch {
    return fallbackValue;
  }
}

export function writeStringToStorage(key, value) {
  localStorage.setItem(key, String(value));
}
