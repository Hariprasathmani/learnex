import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vgbftlxsoywzgqvovwfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnYmZ0bHhzb3l3emdxdm92d2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4OTE1MTgsImV4cCI6MjA4NzQ2NzUxOH0.ib8k4LacZ6n2wEmXKeDfxmTbVzYqar6QBdMU5kdig3o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
  currentUser: null,
  currentView: 'dashboard',
  notes: [],
  streak: 0,
  lastStreakDate: null,
  planner: [],
};

// Show message utility
function showMessage(elementId, message, type) {
  const messageBox = document.getElementById(elementId);
  if (messageBox) {
    messageBox.textContent = message;
    messageBox.className = `message-box show ${type}`;
    setTimeout(() => {
      messageBox.className = 'message-box';
      messageBox.textContent = '';
    }, 4000);
  }
}
// Hash-based navigation handled after auth check in the main DOMContentLoaded below


// Page and sidebar navigation
function navigateToPage(pageId) {
  console.log('Navigating to page:', pageId);
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if (pageId === 'auth-page') {
    initAuthPage();
  }
}

function navigateToView(viewId) {
  state.currentView = viewId;
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  const pageEl = document.getElementById(`${viewId}-view`);
  if (pageEl) pageEl.classList.add('active');
  else console.error('No such view:', `${viewId}-view`);

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.querySelector(`.nav-item[data-view="${viewId}"]`)?.classList.add('active');
  if (viewId === 'dashboard') updateDashboard();
  if (viewId === 'notes') fetchNotes();
  if (viewId === 'planner') fetchPlanner();
}

// Authentication
function initAuthPage() {
  console.log('Initializing auth page');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const signupLink = document.getElementById('show-signup');
  const loginLink = document.getElementById('show-login');

  if (signupLink) {
    // Remove old listeners by replacing with a clone
    const newSignupLink = signupLink.cloneNode(true);
    signupLink.parentNode.replaceChild(newSignupLink, signupLink);
    newSignupLink.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
    });
  }

  if (loginLink) {
    const newLoginLink = loginLink.cloneNode(true);
    loginLink.parentNode.replaceChild(newLoginLink, loginLink);
    newLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      signupForm.style.display = 'none';
      loginForm.style.display = 'block';
    });
  }




  // Supabase Signup
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (!name || !email || !password) {
      showMessage('message-box', 'Please fill in all fields', 'error');
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      const msg = error.message === 'Failed to fetch'
        ? 'Signup failed: Connection error. Please check if your Supabase project is active/resumed.'
        : error.message;
      showMessage('message-box', msg, 'error');
      return;
    }
    showMessage('message-box', 'Account created! Please check your email to confirm before logging in.', 'success');
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
  });

  // Supabase Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Sign in clicked');
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showMessage('message-box', 'Please enter email and password', 'error');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('email not confirmed')) {
        showMessage('message-box', 'Please confirm your email. Check your inbox.', 'error');
      } else if (error.message === 'Failed to fetch') {
        showMessage('message-box', 'Login failed: Connection error. Please check if your Supabase project is active/resumed.', 'error');
      } else {
        showMessage('message-box', error.message, 'error');
      }
      return;
    }

    state.currentUser = data.user;
    showMessage('message-box', 'Login successful!', 'success');
    setTimeout(() => {
      navigateToPage('main-page');
      initMainPage();
      fetchNotes();
      fetchPlanner();
      fetchStreak();
    }, 500);
  });
}

function updateDashboard() {
  document.getElementById('total-notes').textContent = state.notes.length || 0;
  document.getElementById('streak-count').textContent = state.streak || 0;
  document.getElementById('total-files').textContent = state.notes.filter(note => note.file_url).length;
  const streakDisplay = document.getElementById('streak-display');
  if (streakDisplay) streakDisplay.textContent = state.streak || 0;
}

function initMainPage() {
  if (!state.currentUser) {
    navigateToPage('auth-page');
    return;
  }
  document.getElementById('user-name').textContent =
    state.currentUser.user_metadata?.full_name || state.currentUser.email;
  document.getElementById('user-email').textContent = state.currentUser.email;

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      navigateToView(view);
    });
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    state.currentUser = null;
    navigateToPage('auth-page');
  });

  document.getElementById('increment-streak-btn').addEventListener('click', incrementStreak);
  document.getElementById('create-note-btn').addEventListener('click', () => openNoteForm());
  document.getElementById('close-note-form').addEventListener('click', closeNoteForm);
  document.getElementById('cancel-note-btn').addEventListener('click', closeNoteForm);
  document.getElementById('note-form').addEventListener('submit', handleNoteSave);

  document.getElementById('note-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const fileInfo = document.getElementById('file-info');
    fileInfo.textContent = file ? `Selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)` : '';
  });

  document.getElementById('chat-form').addEventListener('submit', handleChatSubmit);
  navigateToView('dashboard');
}

async function fetchNotes() {
  if (!state.currentUser) return;
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', state.currentUser.id)
    .order('created_at', { ascending: false });
  if (error) {
    showMessage('message-box-notes', error.message, 'error');
    state.notes = [];
  } else {
    state.notes = data || [];
  }
  renderNotes();
  updateDashboard();
  renderRecentNotes();
}

async function uploadFile(file) {
  if (!state.currentUser) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${state.currentUser.id}/${Date.now()}.${fileExt}`;
  const { data, error } = await supabase.storage.from('note-files').upload(fileName, file);
  console.log(error);
  if (error) {
    showMessage('message-box', error.message, 'error');
    return null;
  }
  const { data: { publicUrl }, error: urlError } = supabase.storage.from('note-files').getPublicUrl(fileName);
  if (urlError) {
    showMessage('message-box', urlError.message, 'error');
    return null;
  }
  return publicUrl;
}

async function handleNoteSave(e) {
  e.preventDefault();
  const noteId = document.getElementById('note-id').value;
  const title = document.getElementById('note-title-input').value;
  const content = document.getElementById('note-content-input').value;
  const fileInput = document.getElementById('note-file-input');

  let fileUrl = null;
  if (fileInput.files.length > 0) {
    fileUrl = await uploadFile(fileInput.files[0]);
  }

  if (noteId) {
    const { error } = await supabase.from('notes')
      .update({ title, content, file_url: fileUrl || undefined })
      .eq('id', noteId)
      .eq('user_id', state.currentUser.id);
    if (error) showMessage('message-box-notes', error.message, 'error');
  } else {
    const { error } = await supabase.from('notes').insert([{
      user_id: state.currentUser.id,
      title,
      content,
      file_url: fileUrl,
    }]);
    if (error) showMessage('message-box-notes', error.message, 'error');
  }
  closeNoteForm();
  fetchNotes();
}

function openNoteForm(noteId = null) {
  const modal = document.getElementById('note-form-container');
  const form = document.getElementById('note-form');
  const title = document.getElementById('note-form-title');
  form.reset();
  document.getElementById('file-info').textContent = '';
  if (noteId) {
    const note = state.notes.find(n => n.id === noteId);
    if (note) {
      title.textContent = 'Edit Note';
      document.getElementById('note-id').value = note.id;
      document.getElementById('note-title-input').value = note.title;
      document.getElementById('note-content-input').value = note.content;
      if (note.file_url) document.getElementById('file-info').textContent = `Current file linked`;
    }
  } else {
    title.textContent = 'Create Note';
    document.getElementById('note-id').value = '';
  }
  modal.classList.add('active');
}
function closeNoteForm() {
  document.getElementById('note-form-container').classList.remove('active');
}

function renderNotes() {
  const notesList = document.getElementById('notes-list');
  if (!state.notes || state.notes.length === 0) {
    notesList.innerHTML = '<p class="empty-message">No notes yet. Click "Create Note" to get started!</p>';
    return;
  }
  notesList.innerHTML = state.notes.map(note => `
    <div class="note-card">
      <div class="note-card-header">
        <h3 class="note-card-title">${note.title}</h3>
        <div class="note-card-date">${note.created_at?.substring(0, 10) || ''}</div>
      </div>
      <div class="note-card-content">${note.content}</div>
      ${note.file_url ? `<div class="note-card-file"><a href="${note.file_url}" target="_blank">📄 View Attachment</a></div>` : ''}
      <div class="note-card-actions">
        <button class="btn btn-primary" onclick="editNote('${note.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteNote('${note.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}
function renderRecentNotes() {
  const recentList = document.getElementById('recent-notes-list');
  if (!state.notes || state.notes.length === 0) {
    recentList.innerHTML = '<p class="empty-message">No notes yet. Create your first note!</p>';
    return;
  }
  const recentNotes = state.notes.slice(0, 3); // Show 3 most recent
  recentList.innerHTML = recentNotes.map(note => `
    <div class="note-card">
      <h4>${note.title}</h4>
      <div class="note-date">${note.created_at?.substring(0, 10) || ''}</div>
      ${note.file_url ? `<div><a href="${note.file_url}" target="_blank">📄 PDF</a></div>` : ''}
    </div>
  `).join('');
}


window.editNote = function (noteId) { openNoteForm(noteId); };

window.deleteNote = async function (noteId) {
  if (confirm('Are you sure you want to delete this note?')) {
    const { error } = await supabase.from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', state.currentUser.id);
    if (error) showMessage('message-box-notes', error.message, 'error');
    fetchNotes();
  }
};

// Planner integration functions
async function fetchPlanner() {
  if (!state.currentUser) return;
  const { data, error } = await supabase
    .from('planner')
    .select('*')
    .eq('user_id', state.currentUser.id)
    .order('due_date', { ascending: true });
  if (error) {
    showMessage('message-box', error.message, 'error');
    state.planner = [];
  } else {
    state.planner = data || [];
  }
  displayStudyPlan();
}

async function addPlannerTask(task, due_date, duration) {
  if (!state.currentUser) return;
  const { error } = await supabase.from('planner').insert([{
    user_id: state.currentUser.id,
    task,
    due_date,
    completed: false,
    duration
  }]);
  if (error) showMessage('message-box', error.message, 'error');
  fetchPlanner();
}

async function markPlannerCompleted(taskId, completed) {
  const { error } = await supabase.from('planner')
    .update({ completed })
    .eq('id', taskId)
    .eq('user_id', state.currentUser.id);
  if (error) showMessage('message-box', error.message, 'error');
  fetchPlanner();
}

async function deletePlannerTask(taskId) {
  const { error } = await supabase.from('planner')
    .delete()
    .eq('id', taskId)
    .eq('user_id', state.currentUser.id);
  if (error) showMessage('message-box', error.message, 'error');
  fetchPlanner();
}

const plannerForm = document.getElementById('planner-form');
plannerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const topic = document.getElementById('study-topic').value.trim();
  const date = document.getElementById('study-date').value;
  const duration = parseInt(document.getElementById('study-duration').value);
  if (!topic || !date || !duration || duration < 1) {
    alert('Please fill out all fields correctly.');
    return;
  }
  await addPlannerTask(topic, date, duration);
  plannerForm.reset();
});

function displayStudyPlan() {
  const studyPlanList = document.getElementById('study-plan-list');
  if (!state.planner || state.planner.length === 0) {
    studyPlanList.innerHTML = '<li class="empty-message">No study sessions planned yet.</li>';
    return;
  }
  studyPlanList.innerHTML = state.planner
    .map(item => `
      <li>
        <strong>${item.task}</strong> on ${item.due_date} · ${item.completed ? '<span style="color:green;">✔️ Completed</span>' : `<button onclick="markPlannerCompletedClick('${item.id}')">Mark Completed</button>`}
        <button onclick="deletePlannerTaskClick('${item.id}')">Delete</button>
      </li>
    `).join('');
}

window.deletePlannerTaskClick = deletePlannerTask;
window.markPlannerCompletedClick = (taskId) => markPlannerCompleted(taskId, true);

// Streak integration
async function fetchStreak() {
  if (!state.currentUser) return;
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', state.currentUser.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('fetchStreak error:', error);
    // Table likely missing — show a helpful message
    const msg = error.message?.includes('does not exist')
      ? '⚠️ Streak table not found. Please run the SQL migration in your Supabase dashboard.'
      : error.message;
    showMessage('message-box-dashboard', msg, 'error');
    state.streak = 0;
    state.lastStreakDate = null;
    updateDashboard();
    return;
  }

  if (data) {
    state.streak = data.streak_count;
    state.lastStreakDate = data.last_streak_date;
  } else {
    // No row yet — create one for this user
    const { error: insertErr } = await supabase.from('streaks').insert({
      user_id: state.currentUser.id,
      streak_count: 0,
      last_streak_date: null,
    });
    if (insertErr) console.error('streak insert error:', insertErr);
    state.streak = 0;
    state.lastStreakDate = null;
  }
  updateDashboard();
}

async function incrementStreak() {
  if (!state.currentUser) return;
  const today = new Date().toISOString().slice(0, 10);

  if (state.lastStreakDate === today) {
    showMessage('message-box-dashboard', 'You already logged your study session today! ✅', 'error');
    return;
  }

  // Consecutive day? Keep streak going, otherwise reset to 1
  let newStreakCount = 1;
  if (state.lastStreakDate) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toISOString().slice(0, 10) === state.lastStreakDate) {
      newStreakCount = (state.streak || 0) + 1;
    }
  }

  const { error } = await supabase
    .from('streaks')
    .upsert({
      user_id: state.currentUser.id,
      streak_count: newStreakCount,
      last_streak_date: today,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('incrementStreak error:', error);
    const msg = error.message?.includes('does not exist')
      ? '⚠️ Streak table not found. Please run the SQL migration in your Supabase dashboard.'
      : error.message;
    showMessage('message-box-dashboard', msg, 'error');
  } else {
    state.streak = newStreakCount;
    state.lastStreakDate = today;
    updateDashboard();
    showMessage('message-box-dashboard', `🔥 Great job! Your streak is now ${newStreakCount} day${newStreakCount === 1 ? '' : 's'}!`, 'success');
  }
}

// Chatbot - sends message to local Gemini proxy server
async function getBotResponseFromAI(message) {
  try {
    const response = await fetch('http://127.0.0.1:3001/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_message: message }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const detail = errData?.details?.error?.message || errData?.error || `HTTP ${response.status}`;
      throw new Error(detail);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    } else {
      return 'Sorry, I received an unexpected response from the AI.';
    }
  } catch (err) {
    const detailedError = err.message === 'Failed to fetch' 
      ? 'Could not connect to the AI backend. Please ensure the server is running on 127.0.0.1:3001.' 
      : err.message;
    return `⚠️ Error: ${detailedError}`;
  }
}

// Chat submit handler
async function handleChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const sendBtn = document.querySelector('#chat-form button[type="submit"]');
  const message = input.value.trim();
  if (!message) return;

  const chatMessages = document.getElementById('chat-messages');

  // Display user's message
  const userMessageDiv = document.createElement('div');
  userMessageDiv.className = 'chat-message user-message';
  userMessageDiv.innerHTML = `
    <div class="message-avatar">👤</div>
    <div class="message-content">
      <p>${escapeHtml(message)}</p>
      <span class="message-time">${formatTime()}</span>
    </div>
  `;
  chatMessages.appendChild(userMessageDiv);
  input.value = '';
  input.disabled = true;
  sendBtn.disabled = true;
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Show typing indicator
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-message bot-message';
  typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content typing-indicator">
      <span></span><span></span><span></span>
    </div>
  `;
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Fetch AI response from proxy backend
  const botReply = await getBotResponseFromAI(message);

  // Remove typing indicator
  document.getElementById('typing-indicator')?.remove();

  // Display AI response
  const botMessageDiv = document.createElement('div');
  botMessageDiv.className = 'chat-message bot-message';
  botMessageDiv.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      <p>${formatBotReply(botReply)}</p>
      <span class="message-time">${formatTime()}</span>
    </div>
  `;
  chatMessages.appendChild(botMessageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  input.disabled = false;
  sendBtn.disabled = false;
  input.focus();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function formatBotReply(text) {
  // Basic markdown-like formatting
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// NOTE: chat-form and nav-item listeners are registered inside initMainPage() only.
// Do NOT add them again here to avoid duplicate handlers.

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  const { data, error } = await supabase.auth.getSession();
  if (data && data.session && data.session.user) {
    state.currentUser = data.session.user;
    navigateToPage('main-page');
    initMainPage();
    fetchNotes();
    fetchPlanner();
    fetchStreak();
  } else {
    navigateToPage('auth-page'); // navigateToPage already calls initAuthPage() internally
  }
});

