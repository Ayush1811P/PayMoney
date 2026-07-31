/**
 * Supabase Configuration and Initialization
 */

const SUPABASE_URL = 'https://epncydxcvuketsdnxnhz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmN5ZHhjdnVrZXRzZG54bmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MDQ3OTQsImV4cCI6MjA5OTA4MDc5NH0.nHBp53HfK0gs8zqoAmBooStd5KtffM6OI1UAfuHIQTA';

// Initialize the Supabase client
// This expects the global 'supabase' object from the CDN script
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
