/* Copy these public project settings into a script loaded before assets/supabase.js.
   Never put a service_role key here. The anon/publishable key is safe only with RLS enabled. */
window.WASHFLOW_SUPABASE = {
  url: 'https://YOUR_PROJECT_REF.supabase.co',
  anonKey: 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY',
  siteSlug: 'washflow'
};
