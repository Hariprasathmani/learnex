import { supabase } from './supabase.js';

export async function checkAuth() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  const path = window.location.pathname;
  const isAuthPage = path.endsWith('auth.html');
  const isIndexPage = path === '/' || path.endsWith('index.html');

  if (!session) {
    if (!isAuthPage && !isIndexPage) {
      window.location.href = 'auth.html';
      return null;
    }
    document.body.classList.add('visible'); // Show auth or landing page
    return null;
  }

  if (isAuthPage || isIndexPage) {
    // If we're on a recovery flow (URL has access_token), stay on auth.html
    if (window.location.hash.includes('access_token=')) {
      document.body.classList.add('visible');
      return session.user;
    }

    window.location.href = 'dashboard.html';
    return session.user;
  }

  // Set global user state if needed by other scripts
  window.currentUser = session.user;
  document.body.classList.add('visible');
  return session.user;
}

// Call immediately on script load
try {
  await checkAuth();
} catch(e) {
  console.error("Auth check failed", e);
  document.body.classList.add('visible');
}
