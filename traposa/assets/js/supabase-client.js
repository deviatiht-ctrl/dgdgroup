// TRAPOSA Supabase Client Configuration

const SUPABASE_URL = 'https://oqjovwqmuulduuxhcnkc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xam92d3FtdXVsZHV1eGhjbmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MjgzMTMsImV4cCI6MjA5MzQwNDMxM30.EoRywTWdX8k8ixYz6EmGcJFEwLpDft-LcjHnsgydnCc';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabase = supabaseClient;
window.supabaseClient = supabaseClient;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
