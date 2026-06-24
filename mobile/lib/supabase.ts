import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://lesjnvlwehifwiepukct.supabase.co';
// anon key はパブリックキーなのでハードコードで問題なし
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlc2pudmx3ZWhpZndpZXB1a2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzQxODMsImV4cCI6MjA5NjA1MDE4M30.ma1S6hviwIJ632piu-KLrN_W3HfhDGXQnNhT0HEk9r4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
