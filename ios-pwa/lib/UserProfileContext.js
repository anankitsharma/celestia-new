'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadObject, saveObject, StorageKeys } from './storage';
import { calculateChart } from './astrologyService';

const UserProfileContext = createContext(null);

export function UserProfileProvider({ children }) {
  const [profile, setProfileState] = useState(null);
  const [chart, setChart] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load profile on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await loadObject(StorageKeys.USER_PROFILE);
        if (saved) {
          setProfileState(saved);
          // Recalculate chart
          if (saved.birthDate && saved.birthTime && saved.location) {
            try {
              const c = calculateChart(
                saved.birthDate,
                saved.birthTime,
                saved.location,
                saved.isTimeUnknown
              );
              setChart(c);
            } catch (e) {
              console.error('[Profile] Chart calc error:', e);
            }
          }
        }
        const savedPartners = await loadObject(StorageKeys.PARTNER_PROFILES);
        if (savedPartners) setPartners(savedPartners);
      } catch (e) {
        console.error('[Profile] Load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setProfile = useCallback(async (newProfile) => {
    setProfileState(newProfile);
    await saveObject(StorageKeys.USER_PROFILE, newProfile);
    if (newProfile?.birthDate && newProfile?.birthTime && newProfile?.location) {
      try {
        const c = calculateChart(
          newProfile.birthDate,
          newProfile.birthTime,
          newProfile.location,
          newProfile.isTimeUnknown
        );
        setChart(c);
      } catch (e) {
        console.error('[Profile] Chart calc error:', e);
      }
    }
  }, []);

  const addPartner = useCallback(async (partner) => {
    const updated = [...partners, partner];
    setPartners(updated);
    await saveObject(StorageKeys.PARTNER_PROFILES, updated);
  }, [partners]);

  const removePartner = useCallback(async (partnerId) => {
    const updated = partners.filter((p) => p.id !== partnerId);
    setPartners(updated);
    await saveObject(StorageKeys.PARTNER_PROFILES, updated);
  }, [partners]);

  return (
    <UserProfileContext.Provider value={{
      profile, chart, partners, loading,
      setProfile, addPartner, removePartner,
    }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export const useUserProfile = () => {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be inside UserProfileProvider');
  return ctx;
};
