// ─────────────────────────────────────────────────────────────────────────────
// CELESTIA — LEGAL LINKS
// Single source of truth for Terms / Privacy URLs. Required to be functional on
// any paywall (Google Play & App Store reject paywalls with dead legal links).
// ─────────────────────────────────────────────────────────────────────────────

import { Linking } from 'react-native';

export const LEGAL = {
  PRIVACY_URL: 'https://hicelestia.com/privacy',
  TERMS_URL: 'https://hicelestia.com/terms',
};

// Safe opener — never throws into render; logs and no-ops on failure.
export const openLegal = (url) => {
  Linking.openURL(url).catch((e) => {
    console.warn('[legal] could not open', url, e?.message);
  });
};
