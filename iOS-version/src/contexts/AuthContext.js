import React, { createContext, useContext } from 'react';
import { resetAllAppData } from '../services/storage';

// V1 stub — auth removed for first App Store submission to remove
// the 4.8 (Sign-in-with-Apple) requirement and shrink the privacy
// nutrition-label scope. The provider returns an anonymous, unauthenticated
// state. Re-enable real Supabase auth in v1.1 alongside Sign in with Apple
// (see git history of this file on the `main` branch).
const AuthContext = createContext({
  user: null,
  session: null,
  isAuthLoading: false,
  signOut: async () => {},
  deleteAccount: async () => {},
  onSignIn: async () => {},
});

export function AuthProvider({ children }) {
  // No auth state to track. Without an account, "delete account" becomes
  // a local-data wipe — satisfies 5.1.1(v) for non-authed apps.
  const value = {
    user: null,
    session: null,
    isAuthLoading: false,
    signOut: async () => {},
    deleteAccount: async () => {
      try { await resetAllAppData(); } catch (e) { console.warn('reset failed', e); }
    },
    onSignIn: async () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
