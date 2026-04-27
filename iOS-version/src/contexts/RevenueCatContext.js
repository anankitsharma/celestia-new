// V1 — RevenueCat stripped for minimal-approval submission.
// No payments, no purchase paths, no IAP/subscription review surface.
// `useRevenueCat()` returns a hardcoded "pro" object so the existing call
// sites across 7 screens compile unchanged and any premium-gated branch
// silently unlocks. No provider wrapper needed in the React tree.
// Re-enable real RevenueCat in v1.1 by restoring the previous provider body
// from git history of this file.

const STUB_VALUE = Object.freeze({
  customerInfo: null,
  offerings: null,
  isPro: true,
  isLoading: false,
  debugOverridePro: null,
  setDebugOverridePro: () => {},
  purchasePackage: async () => null,
  restorePurchases: async () => null,
});

// Provider kept as a passthrough so any legacy <RevenueCatProvider> usage
// doesn't break if the file is referenced before a reactivation.
export const RevenueCatProvider = ({ children }) => children;

// Hook returns the frozen stub directly — no React Context lookup needed.
export const useRevenueCat = () => STUB_VALUE;
