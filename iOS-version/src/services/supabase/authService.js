import { supabase } from './client';

/**
 * Sign up with email + password.
 * Returns { user, session } on success, throws on error.
 */
export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

const WEB_CLIENT_ID = '1023276075175-2fl8mckt0hufupll39a2cod3tgmkr936.apps.googleusercontent.com';

/**
 * Lazy-load Google Sign-In so the app doesn't crash in Expo Go
 * (native module not available there).
 */
function getGoogleSignIn() {
  try {
    const mod = require('@react-native-google-signin/google-signin');
    return { GoogleSignin: mod.GoogleSignin, statusCodes: mod.statusCodes };
  } catch {
    return null;
  }
}

/**
 * Sign in with Google.
 */
export async function signInWithGoogle() {
  const gsi = getGoogleSignIn();
  if (!gsi) {
    throw new Error('Google Sign-In is not available in Expo Go. Please use a development build.');
  }
  const { GoogleSignin, statusCodes } = gsi;

  try {
    // Configure right before sign-in (matching reference project pattern)
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });

    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    // User cancelled the sign-in flow
    if (response?.type === 'cancelled' || response?.data === null) {
      const cancelError = new Error('Sign in cancelled');
      cancelError.code = 'SIGN_IN_CANCELLED';
      throw cancelError;
    }

    const idToken = response.data?.idToken || response.idToken;

    if (!idToken) {
      throw new Error('No ID token present!');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    // Silently handle user cancellation
    if (error.code === 'SIGN_IN_CANCELLED' || error.code === statusCodes?.SIGN_IN_CANCELLED) {
      throw error;
    }
    console.error('[Auth] Google sign-in error:', error.message);
    throw error;
  }
}

/**
 * Sign in with email + password.
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Sign out.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current session (null if not signed in).
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user (null if not signed in).
 */
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Send password reset email.
 */
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

/**
 * Delete the current user's account.
 * 1. Wipes all user data from custom tables via RPC
 * 2. Signs the user out
 * Note: The auth.users record is cleaned up by the database function.
 */
export async function deleteAccount() {
  const user = await getUser();
  if (!user) throw new Error('Not signed in');

  // Delete all user data from custom tables
  const { error: rpcError } = await supabase.rpc('delete_user_data');
  if (rpcError) {
    console.error('[Auth] RPC delete error:', rpcError);
    // Continue with sign-out even if RPC fails
  }

  // Sign out to clear local session
  await signOut();
}

/**
 * Listen for auth state changes.
 * Returns unsubscribe function.
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => subscription.unsubscribe();
}
