import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Exported so other services (e.g. the Gemini proxy client) can build
// Edge Function URLs and authenticate with the public anon key.
// Both values are safe to ship: the anon key is protected by Row Level Security.
export const SUPABASE_URL = 'https://fztexdkhuozufffgxstc.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dGV4ZGtodW96dWZmZmd4c3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDAwOTAsImV4cCI6MjA4ODUxNjA5MH0.z6qA3FqIjNaaqTXPKkbiCI1xEk_9f43KDlOKlcf_hkA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
