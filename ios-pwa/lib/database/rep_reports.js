// Web-compatible Report Repository using localStorage
import { loadObject, saveObject, StorageKeys } from '../storage';

export const ReportRepository = {
  getReport: async (id) => {
    const reports = (await loadObject(StorageKeys.REPORTS)) || {};
    return reports[id]?.content || null;
  },

  saveReport: async (id, profileId, type, content, subtype = null) => {
    const reports = (await loadObject(StorageKeys.REPORTS)) || {};
    reports[id] = { profileId, type, subtype, content, createdAt: Date.now() };
    await saveObject(StorageKeys.REPORTS, reports);
  },

  deleteReportsForProfile: async (profileId) => {
    const reports = (await loadObject(StorageKeys.REPORTS)) || {};
    Object.keys(reports).forEach((key) => {
      if (reports[key].profileId === profileId) delete reports[key];
    });
    await saveObject(StorageKeys.REPORTS, reports);
  },

  deleteByType: async (type) => {
    const reports = (await loadObject(StorageKeys.REPORTS)) || {};
    Object.keys(reports).forEach((key) => {
      if (reports[key].type === type) delete reports[key];
    });
    await saveObject(StorageKeys.REPORTS, reports);
  },

  getReportsForProfile: async (profileId) => {
    const reports = (await loadObject(StorageKeys.REPORTS)) || {};
    return Object.entries(reports)
      .filter(([, r]) => r.profileId === profileId)
      .map(([id, r]) => ({ id, type: r.type, subtype: r.subtype, created_at: r.createdAt }))
      .sort((a, b) => b.created_at - a.created_at);
  },
};
