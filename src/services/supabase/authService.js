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
