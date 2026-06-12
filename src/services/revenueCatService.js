import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEYS = {
    apple: 'appl_ZEOlXhfOKCJRUndMbyOjRzMZmnf',
    google: 'goog_jybZecaksxjEnNeWJXYdmlzmsFB',
};

const ENTITLEMENT_ID = 'Celestia Pro';

export const RevenueCatService = {
    // Configure RevenueCat ANONYMOUSLY at app launch — NOT gated on a user profile.
    // This is what makes offerings/prices available during onboarding (before a
    // profile exists). The user is associated later via logIn(). Mirrors Slate AI.
    async initialize() {
        try {
            Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.ERROR);
            const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;
            // Hard guard: configuring with a blank key throws a NATIVE crash that
            // JS try/catch can't catch. Bail safely instead.
            if (!apiKey || apiKey.trim().length === 0) {
                console.warn('[RevenueCat] No API key — purchases disabled.');
                return false;
            }
            await Purchases.configure({ apiKey });
            console.log('RevenueCat initialized successfully');
            return true;
        } catch (e) {
            console.error('RevenueCat initialization failed:', e);
            return false;
        }
    },

    // Associate the anonymous RevenueCat user with the app profile id once known.
    async logIn(userId) {
        if (!userId) return null;
        try {
            const { customerInfo } = await Purchases.logIn(String(userId));
            return customerInfo;
        } catch (e) {
            console.error('RevenueCat logIn failed:', e);
            return null;
        }
    },

    async getCustomerInfo() {
        try {
            return await Purchases.getCustomerInfo();
        } catch (e) {
            console.error('Failed to get customer info:', e);
            return null;
        }
    },

    async getOfferings() {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null) {
                return offerings.current;
            }
            return null;
        } catch (e) {
            console.error('Failed to fetch offerings:', e);
            return null;
        }
    },

    async purchasePackage(pack) {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            return customerInfo;
        } catch (e) {
            if (!e.userCancelled) {
                console.error('Purchase failed:', e);
            }
            throw e;
        }
    },

    async restorePurchases() {
        try {
            return await Purchases.restorePurchases();
        } catch (e) {
            console.error('Restore failed:', e);
            throw e;
        }
    },

    isPro(customerInfo) {
        return !!(customerInfo?.entitlements.active[ENTITLEMENT_ID]);
    },

    getTrialLengthDays(customerInfo) {
        const entitlement = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
        if (!entitlement) return null;

        const periodType = (entitlement.periodType || '').toString().toUpperCase();
        if (periodType !== 'INTRO' && periodType !== 'TRIAL') return null;

        const purchaseISO = entitlement.latestPurchaseDate || entitlement.originalPurchaseDate;
        const expirationISO = entitlement.expirationDate;
        if (!purchaseISO || !expirationISO) return null;

        const purchaseDate = new Date(purchaseISO);
        const expirationDate = new Date(expirationISO);
        if (isNaN(purchaseDate) || isNaN(expirationDate)) return null;

        const ms = expirationDate.getTime() - purchaseDate.getTime();
        const days = Math.round(ms / (24 * 60 * 60 * 1000));

        if (days <= 4) return 3;
        if (days <= 10) return 7;
        return days;
    },

    getDaysUntilExpiration(customerInfo) {
        const entitlement = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
        if (!entitlement?.expirationDate) return null;

        const expirationDate = new Date(entitlement.expirationDate);
        if (isNaN(expirationDate)) return null;

        const ms = expirationDate.getTime() - Date.now();
        return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
    },
};
