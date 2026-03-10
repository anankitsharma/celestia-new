import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageKeys, loadObject } from '../services/storage';
import { ProfileRepository } from '../services/database/rep_profiles';

const UserProfileContext = createContext({
    userProfile: null,
    setUserProfile: async () => {},
    updateProfile: async () => {},
    partnerProfiles: [],
    addPartner: async () => {},
    updatePartner: async () => {},
    removePartner: async () => {},
    isLoading: true
});

export const UserProfileProvider = ({ children }) => {
    const [userProfile, setUserProfileState] = useState(null);
    const [partnerProfiles, setPartnerProfilesState] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const allProfiles = await ProfileRepository.getAllProfiles();

                if (allProfiles.length > 0) {
                    console.log('[UserProfileContext] Loaded from SQLite:', allProfiles.length);
                    const self = allProfiles.find(p => p.type === 'self');
                    const others = allProfiles.filter(p => p.type !== 'self');
                    setUserProfileState(self || null);
                    setPartnerProfilesState(others);
                } else {
                    // Migration: check AsyncStorage legacy data
                    const legacyProfile = await loadObject(StorageKeys.USER_PROFILE);
                    if (legacyProfile) {
                        console.log('[UserProfileContext] Migrating legacy data to SQLite...');
                        let main = null;
                        let others = [];

                        if (Array.isArray(legacyProfile)) {
                            main = legacyProfile.find(p => p.type === 'self') || legacyProfile[0];
                            others = legacyProfile.filter(p => p.id !== main?.id);
                        } else {
                            main = legacyProfile;
                            const legacyPartners = await loadObject(StorageKeys.PARTNER_PROFILES);
                            if (legacyPartners) others = legacyPartners;
                        }

                        if (main) {
                            await ProfileRepository.saveProfile({ ...main, type: 'self' });
                            setUserProfileState(main);
                        }
                        for (const p of others) {
                            await ProfileRepository.saveProfile({ ...p, type: 'other' });
                        }
                        setPartnerProfilesState(others);
                    }
                }
            } catch (e) {
                console.error('Failed to load user data', e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const setUserProfile = async (profile) => {
        setUserProfileState(profile);
        if (profile) {
            await ProfileRepository.saveProfile(profile);
        } else {
            if (userProfile?.id) {
                await ProfileRepository.deleteProfile(userProfile.id);
            }
        }
    };

    const updateProfile = async (updated) => {
        setUserProfileState(updated);
        await ProfileRepository.saveProfile(updated);
    };

    const addPartner = async (profile) => {
        const updatedPartners = [...partnerProfiles, profile];
        setPartnerProfilesState(updatedPartners);
        await ProfileRepository.saveProfile(profile);
    };

    const updatePartner = async (updated) => {
        const updatedPartners = partnerProfiles.map(p => p.id === updated.id ? updated : p);
        setPartnerProfilesState(updatedPartners);
        await ProfileRepository.saveProfile(updated);
    };

    const removePartner = async (id) => {
        const updatedPartners = partnerProfiles.filter(p => p.id !== id);
        setPartnerProfilesState(updatedPartners);
        await ProfileRepository.deleteProfile(id);
    };

    return (
        <UserProfileContext.Provider value={{
            userProfile,
            setUserProfile,
            updateProfile,
            partnerProfiles,
            addPartner,
            updatePartner,
            removePartner,
            isLoading
        }}>
            {children}
        </UserProfileContext.Provider>
    );
};

export const useUserProfile = () => useContext(UserProfileContext);
