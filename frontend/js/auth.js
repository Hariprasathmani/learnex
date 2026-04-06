import { supabase, showMessage } from './supabase.js';

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const messageBoxId = 'auth-message';

const forgotForm = document.getElementById('forgot-form');
const resetForm = document.getElementById('reset-form');
const linkForgot = document.getElementById('link-forgot-password');
const linkBackLogin = document.getElementById('link-back-login');

function switchTab(to) {
  // If we're in recovery mode, don't switch away from new-password unless explicit
  if (window.location.hash.includes('type=recovery') && to !== 'new-password') {
    return;
  }

  if (to === 'login') {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    forgotForm.classList.add('hidden');
    resetForm.classList.add('hidden');
    document.title = 'LearnEx - Sign In';
  } else if (to === 'signup') {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    forgotForm.classList.add('hidden');
    resetForm.classList.add('hidden');
    document.title = 'LearnEx - Sign Up';
  } else if (to === 'forgot') {
    tabLogin.classList.remove('active');
    tabSignup.classList.remove('active');
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    forgotForm.classList.remove('hidden');
    resetForm.classList.add('hidden');
    document.title = 'LearnEx - Reset Password';
  } else if (to === 'new-password') {
    tabLogin.classList.remove('active');
    tabSignup.classList.remove('active');
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    forgotForm.classList.add('hidden');
    resetForm.classList.remove('hidden');
    document.title = 'LearnEx - Change Password';
  }
}

tabLogin.addEventListener('click', () => switchTab('login'));
tabSignup.addEventListener('click', () => switchTab('signup'));
linkForgot.addEventListener('click', (e) => { e.preventDefault(); switchTab('forgot'); });
linkBackLogin.addEventListener('click', (e) => { e.preventDefault(); switchTab('login'); });

// Disable buttons on submit helper
function setLoading(button, loading, text) {
  button.disabled = loading;
  button.textContent = loading ? 'Please wait...' : text;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-login-submit');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  setLoading(btn, true, 'Sign In');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  setLoading(btn, false, 'Sign In');

  if (error) {
    if (error.message.includes('email')) {
      showMessage(messageBoxId, error.message + ' (Tip: You may need to disable "Confirm Email" in your Supabase Dashboard > Authentication > Providers > Email)', 'error');
    } else {
      showMessage(messageBoxId, error.message, 'error');
    }
  } else {
    window.location.href = 'dashboard.html';
  }
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-signup-submit');
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  setLoading(btn, true, 'Create Account');
  const { error, data } = await supabase.auth.signUp({
    email, password,
    options: { data: { name } }
  });
  setLoading(btn, false, 'Create Account');

  if (error) {
    if (error.message.includes('sending confirmation email') || error.message.includes('rate limit')) {
      showMessage(messageBoxId, error.message + ' - Please disable "Confirm Email" in your Supabase Dashboard (Auth > Providers > Email) to sign up without email verification during development.', 'error');
    } else {
      showMessage(messageBoxId, error.message, 'error');
    }
  } else if (data?.user?.identities?.length === 0) {
    showMessage(messageBoxId, "User already exists. Please log in.", "error");
    setTimeout(() => switchTab('login'), 2000);
  } else {
    showMessage(messageBoxId, "Signup successful! Checking verification requirements...", "success");
    setTimeout(async () => {
      // If auto-login succeeded (no email confirmation req), redirect
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = 'dashboard.html';
      } else {
        showMessage(messageBoxId, "Please check your email to confirm your account.", "info");
      }
    }, 1500);
  }
});

forgotForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-forgot-submit');
  const email = document.getElementById('forgot-email').value.trim();

  setLoading(btn, true, 'Sending...');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/auth.html',
  });
  setLoading(btn, false, 'Send Reset Link');

  if (error) {
    if (error.message.includes('email')) {
      showMessage(messageBoxId, error.message + ' (If you cannot receive emails, you can manually reset passwords in the Supabase Auth Dashboard)', 'error');
    } else {
      showMessage(messageBoxId, error.message, 'error');
    }
  } else {
    showMessage(messageBoxId, 'Password reset link sent! Check your email.', 'success');
  }
});

// Handling New Password Flow (Change Password submit)
resetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-reset-submit');
  const password = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (password !== confirmPassword) {
    showMessage(messageBoxId, 'Passwords do not match.', 'error');
    return;
  }

  setLoading(btn, true, 'Updating...');
  const { error } = await supabase.auth.updateUser({ password });
  setLoading(btn, false, 'Update Password');

  if (error) {
    showMessage(messageBoxId, error.message, 'error');
  } else {
    showMessage(messageBoxId, 'Password updated successfully! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 2000);
  }
});

// Detect Password Recovery from email link
function initRecovery() {
  if (window.location.hash.includes('access_token=') && window.location.hash.includes('type=recovery')) {
    switchTab('new-password');
    showMessage(messageBoxId, 'Set your new password below.', 'info');
  }
}

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    switchTab('new-password');
    showMessage(messageBoxId, 'Set your new password below.', 'info');
  } else if (event === "SIGNED_IN" && !window.location.hash.includes('type=recovery')) {
    // Normal redirect
  }
});

// Run once on load
initRecovery();
document.addEventListener('DOMContentLoaded', initRecovery);
