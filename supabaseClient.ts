import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dvvxnuipeblhdewfsduz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2dnhudWlwZWJsaGRld2ZzZHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNTQyNzYsImV4cCI6MjA3MDkzMDI3Nn0.mX4mVcRKZC5qC9u_tYfz75xGBEQfSZDMm54mCdMDpNk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
