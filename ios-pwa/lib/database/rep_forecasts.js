// Web-compatible Forecast Repository using localStorage
import { loadObject, saveObject, StorageKeys } from '../storage';

export const ForecastRepository = {
  getForecast: async (key) => {
    const forecasts = (await loadObject(StorageKeys.FORECASTS)) || {};
    const entry = forecasts[key];
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      delete forecasts[key];
      await saveObject(StorageKeys.FORECASTS, forecasts);
      return null;
    }
    return entry.content;
  },

  saveForecast: async (key, profileId, type, dateLabel, content, expiresAt) => {
    const forecasts = (await loadObject(StorageKeys.FORECASTS)) || {};
    forecasts[key] = { profileId, type, dateLabel, content, createdAt: Date.now(), expiresAt };
    await saveObject(StorageKeys.FORECASTS, forecasts);
  },

  pruneExpired: async () => {
    const forecasts = (await loadObject(StorageKeys.FORECASTS)) || {};
    const now = Date.now();
    let changed = false;
    Object.keys(forecasts).forEach((key) => {
      if (forecasts[key].expiresAt && forecasts[key].expiresAt < now) {
        delete forecasts[key];
        changed = true;
      }
    });
    if (changed) await saveObject(StorageKeys.FORECASTS, forecasts);
  },

  deleteByType: async (type, useLike = false) => {
    const forecasts = (await loadObject(StorageKeys.FORECASTS)) || {};
    Object.keys(forecasts).forEach((key) => {
      const match = useLike ? forecasts[key].type?.includes(type) : forecasts[key].type === type;
      if (match) delete forecasts[key];
    });
    await saveObject(StorageKeys.FORECASTS, forecasts);
  },

  clearAll: async () => {
    await saveObject(StorageKeys.FORECASTS, {});
  },

  getRecentForecasts: async (profileId, limit = 3) => {
    const forecasts = (await loadObject(StorageKeys.FORECASTS)) || {};
    return Object.values(forecasts)
      .filter((f) => f.profileId === profileId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
};
