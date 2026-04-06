import './auth-guard.js';
import { supabase, showMessage, escapeHtml } from './supabase.js';
import { renderSidebar } from './nav.js';

async function initPlanner() {
  renderSidebar('planner');
  
  // Default date to today
  document.getElementById('plan-date').valueAsDate = new Date();
  
  await fetchSessions();
  bindEvents();
}

async function fetchSessions() {
  const { data: list, error } = await supabase
    .from('planner')
    .select('*')
    .eq('user_id', window.currentUser.id)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: false });

  const listEl = document.getElementById('planner-list');

  if (error) {
    listEl.innerHTML = `<div class="text-danger" style="color:var(--danger)">Failed to load sessions: ${escapeHtml(error.message)}</div>`;
    return;
  }

  if (!list || list.length === 0) {
    listEl.innerHTML = `<div class="text-muted">No upcoming tasks... Time to relax or plan ahead!</div>`;
    return;
  }

  listEl.innerHTML = list.map(item => `
    <div class="session-item ${item.completed ? 'done' : ''}">
      <div 
        class="session-check ${item.completed ? 'done-check' : ''}" 
        onclick="toggleSession('${item.id}', ${!item.completed})"
        title="Mark as ${item.completed ? 'incomplete' : 'complete'}"
      >
        ${item.completed ? '✓' : ''}
      </div>
      <div class="session-info">
        <div class="session-task">${escapeHtml(item.task)}</div>
        <div class="session-meta">
          📅 ${new Date(item.due_date).toLocaleDateString()}
          &nbsp;&bull;&nbsp;
          ⏱️ ${item.duration} mins
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="deleteSession('${item.id}')" title="Delete session">×</button>
    </div>
  `).join('');
}

function bindEvents() {
  document.getElementById('planner-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-add-plan');
    btn.disabled = true;
    btn.textContent = 'Adding...';

    const task = document.getElementById('plan-task').value.trim();
    const due_date = document.getElementById('plan-date').value;
    const duration = parseInt(document.getElementById('plan-duration').value);

    // Make sure we have a valid task and date before sending to DB.
    if (!task || !due_date) {
      showMessage('planner-message', 'Task and Date are required.', 'error');
      btn.disabled = false;
      btn.textContent = 'Add Session';
      return;
    }

    const { error } = await supabase.from('planner').insert({
      user_id: window.currentUser.id,
      task,
      due_date,
      duration,
      completed: false
    });

    btn.disabled = false;
    btn.textContent = 'Add Session';

    if (error) {
      showMessage('planner-message', 'Error saving session: ' + error.message, 'error');
    } else {
      document.getElementById('plan-task').value = '';
      showMessage('planner-message', 'Session added!', 'success');
      fetchSessions();
    }
  });

  // Attach global functions to window for onclick handlers in innerHTML
  window.toggleSession = async (id, isComplete) => {
    const { error } = await supabase
      .from('planner')
      .update({ completed: isComplete })
      .eq('id', id);

    if (error) {
      showMessage('planner-message', 'Failed to update session', 'error');
    } else {
      fetchSessions();
    }
  };

  window.deleteSession = async (id) => {
    if (!confirm('Remove this session?')) return;
    const { error } = await supabase.from('planner').delete().eq('id', id);
    if (error) {
      showMessage('planner-message', 'Failed to delete session', 'error');
    } else {
      fetchSessions();
    }
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPlanner);
} else {
  initPlanner();
}
