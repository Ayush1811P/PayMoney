/**
 * Supabase Configuration and Initialization
 */

const SUPABASE_URL = 'https://romdfgbohhmwsjtzphzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbWRmZ2JvaGhtc3dqdHpwaHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1OTgyNTQsImV4cCI6MjEwMTE3NDI1NH0.fmOFNjHU55zXO-Fpy8X0bhaVkANOUb8KEcr3HxjrDxo';

// Initialize the Supabase client
// This expects the global 'supabase' object from the CDN script
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
