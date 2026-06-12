import React, { createContext, useContext, useState, useEffect } from 'react';
import Purchases from 'react-native-purchases';
import { usePostHog } from 'posthog-react-native';

import { RevenueCatService } from '../services/revenueCatService';
import { useUserProfile } from './UserProfileContext';
import { buildUserProperties } from '../services/analytics';

const RevenueCatContext = createContext(null);

export const RevenueCatProvider = ({ children }) => {
    const { userProfile } = useUserProfile();
    const posthog = usePostHog();
    const [customerInfo, setCustomerInfo] = useState(null);
    const [offerings, setOfferings] = useState(null);
    const [isPro, setIsPro] = useState(false);
    const [debugOverridePro, setDebugOverridePro] = useState(__DEV__ ? true : null); // DEV: default Pro for testing
    const [isLoading, setIsLoading] = useState(true);

    // 1) Configure RevenueCat ONCE at app launch (anonymous) so offerings/prices
    //    are available immediately — including during onboarding, before any
    //    profile exists. (Previously gated on userProfile.id, which left the
    //    onboarding paywall with no prices.)
    useEffect(() => {
        let listener;
        const init = async () => {
            setIsLoading(true);
            const ok = await RevenueCatService.initialize();
            if (!ok) { setIsLoading(false); return; }

            const info = await RevenueCatService.getCustomerInfo();
            setCustomerInfo(info);
            setIsPro(RevenueCatService.isPro(info));

            const currentOfferings = await RevenueCatService.getOfferings();
            setOfferings(currentOfferings);

            setIsLoading(false);

            listener = (updated) => {
                setCustomerInfo(updated);
                setIsPro(RevenueCatService.isPro(updated));
            };
            Purchases.addCustomerInfoUpdateListener(listener);
        };

        init();

        return () => {
            if (listener) {
                try { Purchases.removeCustomerInfoUpdateListener(listener); } catch (e) {}
            }
        };
    }, []);

    // 2) When a profile id becomes known, associate the anonymous RC user with it
    //    and refresh entitlements. Does NOT block offerings/prices from loading.
    useEffect(() => {
        if (!userProfile?.id) return;
        let cancelled = false;
        (async () => {
            const info = await RevenueCatService.logIn(userProfile.id);
            if (cancelled || !info) return;
            setCustomerInfo(info);
            setIsPro(RevenueCatService.isPro(info));
            const userProps = await buildUserProperties(userProfile.id).catch(() => ({}));
            posthog?.identify(userProfile.id, {
                ...userProps,
                is_pro: RevenueCatService.isPro(info),
            });
        })();
        return () => { cancelled = true; };
    }, [userProfile?.id]);

    // Debug override: in __DEV__, allows toggling Pro mode for testing
    const effectiveIsPro = debugOverridePro !== null ? debugOverridePro : isPro;

    const value = {
        customerInfo,
        offerings,
        isPro: effectiveIsPro,
        isLoading,
        // Debug: toggle Pro mode (guarded by __DEV__ in ProfileScreen)
        debugOverridePro,
        setDebugOverridePro,
        purchasePackage: async (pack) => {
            const info = await RevenueCatService.purchasePackage(pack);
            setCustomerInfo(info);
            setIsPro(RevenueCatService.isPro(info));
            return info;
        },
        restorePurchases: async () => {
            const info = await RevenueCatService.restorePurchases();
            setCustomerInfo(info);
            setIsPro(RevenueCatService.isPro(info));
            return info;
        },
    };

    return (
        <RevenueCatContext.Provider value={value}>
            {children}
        </RevenueCatContext.Provider>
    );
};

export const useRevenueCat = () => {
    const context = useContext(RevenueCatContext);
    if (!context) {
        throw new Error('useRevenueCat must be used within a RevenueCatProvider');
    }
    return context;
};
