import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange, getSession, signOut as authSignOut, deleteAccount as authDeleteAccount } from '../services/supabase/authService';
import { syncLocalToCloud, syncCloudToLocal } from '../services/supabase/syncService';

const AuthContext = createContext({
  user: null,
  session: null,
  isAuthLoading: true,
  signOut: async () => {},
  deleteAccount: async () => {},
  onSignIn: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Check existing session on mount
    getSession().then(s => {
      setSession(s);
      setUser(s?.user || null);
      setIsAuthLoading(false);
    }).catch(() => setIsAuthLoading(false));

    // Listen for auth changes (session restore, token refresh, external sign-out)
    // Note: onSignIn() handles sync for explicit sign-ins from AuthScreen,
    // so we only update state here — no duplicate sync.
    const unsub = onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      }
    });

    return unsub;
  }, []);

  const handleSignOut = async () => {
    await authSignOut();
    setUser(null);
    setSession(null);
  };

  const handleDeleteAccount = async () => {
    await authDeleteAccount();
    setUser(null);
    setSession(null);
  };

  /** Called after successful sign-in/sign-up from auth screens */
  const onSignIn = async (newSession) => {
    setSession(newSession);
    setUser(newSession?.user || null);
    // Sync local data up, then pull any cloud data down
    try {
      await syncLocalToCloud();
      await syncCloudToLocal();
    } catch (e) {
      console.error('[Auth] Post-sign-in sync error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isAuthLoading, signOut: handleSignOut, deleteAccount: handleDeleteAccount, onSignIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
