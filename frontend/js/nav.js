import { supabase } from './supabase.js';

export function renderSidebar(activePage) {
  const sidebarHTML = `
    <div class="sidebar-logo">
      <div class="logo-text">LearnEx</div>
      <div class="logo-sub">Your Learning Companion</div>
    </div>
    
    <div class="sidebar-nav">
      <a href="dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
        <span class="nav-icon">📊</span>
        <span>Dashboard</span>
      </a>
      <a href="timer.html" class="nav-item ${activePage === 'timer' ? 'active' : ''}">
        <span class="nav-icon">⏱️</span>
        <span>Pomodoro Timer</span>
      </a>
      <a href="planner.html" class="nav-item ${activePage === 'planner' ? 'active' : ''}">
        <span class="nav-icon">📅</span>
        <span>Study Planner</span>
      </a>
      <a href="notes.html" class="nav-item ${activePage === 'notes' ? 'active' : ''}">
        <span class="nav-icon">📝</span>
        <span>My Notes</span>
      </a>
      <a href="chat.html" class="nav-item ${activePage === 'chat' ? 'active' : ''}">
        <span class="nav-icon">💬</span>
        <span>Study Assistant</span>
      </a>
    </div>

    <div class="sidebar-footer">
      <div class="user-card" id="sidebar-user-card" style="display: none;">
        <div class="user-avatar" id="sidebar-avatar">U</div>
        <div class="user-info">
          <div class="user-name" id="sidebar-user-name">User Name</div>
          <div class="user-email" id="sidebar-user-email">user@example.com</div>
        </div>
      </div>
      <button id="btn-signout" class="btn-signout">Sign Out</button>
    </div>
  `;

  const sidebarEl = document.getElementById('sidebar');
  if (sidebarEl) {
    sidebarEl.innerHTML = sidebarHTML;
    bindSidebarEvents();
    populateUserInfo();
  }
}

function bindSidebarEvents() {
  const signoutBtn = document.getElementById('btn-signout');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = 'auth.html';
    });
  }

  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (hamburger && sidebar && overlay) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('open');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }
}

function populateUserInfo() {
  const currentUser = window.currentUser;
  if (!currentUser) return;
  
  const card = document.getElementById('sidebar-user-card');
  const nameEl = document.getElementById('sidebar-user-name');
  const emailEl = document.getElementById('sidebar-user-email');
  const avatarEl = document.getElementById('sidebar-avatar');

  if (card && nameEl && emailEl && avatarEl) {
    card.style.display = 'flex';
    const name = currentUser.user_metadata?.name || 'User';
    nameEl.textContent = name;
    emailEl.textContent = currentUser.email;
    avatarEl.textContent = name.charAt(0).toUpperCase();
  }
}
