import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance;

if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase keys missing. Using mock client for UI demonstration.');

  // Mock Client for UI Dev
  supabaseInstance = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: (callback) => {
        // callback('SIGNED_OUT', null); 
        return { data: { subscription: { unsubscribe: () => { } } } };
      },
      signInWithPassword: ({ email, password }) => {
        console.log('Mock Sign In', email);
        // Simulate successful login
        const mockSession = { user: { email } };
        return Promise.resolve({ data: { session: mockSession }, error: null });
      },
      signOut: () => {
        console.log('Mock Sign Out');
        return Promise.resolve({ error: null });
      }
    },
    from: (table) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
    })
  };
}

export const supabase = supabaseInstance;
