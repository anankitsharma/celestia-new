import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEYS = {
    apple: 'appl_ZEOlXhfOKCJRUndMbyOjRzMZmnf',
    google: 'goog_jybZecaksxjEnNeWJXYdmlzmsFB',
};

const ENTITLEMENT_ID = 'Celestia Pro';

export const RevenueCatService = {
    async initialize(userId) {
        try {
            Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
            if (Platform.OS === 'ios') {
                await Purchases.configure({ apiKey: API_KEYS.apple, appUserID: userId });
            } else {
                await Purchases.configure({ apiKey: API_KEYS.google, appUserID: userId });
            }
            console.log('RevenueCat initialized successfully');
        } catch (e) {
            console.error('RevenueCat initialization failed:', e);
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
};
