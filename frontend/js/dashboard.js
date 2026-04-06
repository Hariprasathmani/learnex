import './auth-guard.js';
import { supabase, showMessage, escapeHtml } from './supabase.js';
import { renderSidebar } from './nav.js';

let state = {
  streak: 0,
  lastStreakDate: null,
  pomodoros: 0
};

async function initDashboard() {
  renderSidebar('dashboard');
  
  await Promise.all([
    fetchStats(),
    fetchStreak(),
    fetchRecentNotes(),
    renderUsageChart()
  ]);
}

async function fetchStats() {
  const { count, error } = await supabase
    .from('notes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', window.currentUser.id);
    
  if (!error) {
    document.getElementById('dash-stat-notes').textContent = count || 0;
  }
}

async function fetchStreak() {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', window.currentUser.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('fetchStreak error:', error);
    showMessage('dashboard-message', '⚠️ Could not load streak data.', 'error');
    return;
  }

  if (data) {
    state.streak = data.streak_count || 0;
    state.lastStreakDate = data.last_streak_date;
    state.pomodoros = data.pomodoros_today || 0;
  } else {
    // Create new record
    await supabase.from('streaks').insert({
      user_id: window.currentUser.id,
      streak_count: 0,
    });
  }
  updateStreakUI();
}

function updateStreakUI() {
  const isOne = state.streak === 1;
  document.getElementById('dash-stat-streak').textContent = state.streak;
  document.getElementById('dash-streak-big').textContent = state.streak;
  document.getElementById('dash-streak-days-label').textContent = isOne ? 'day' : 'days';
  
  // Pomodoros today * 25 mins roughly
  document.getElementById('dash-stat-focus').textContent = state.pomodoros * 25;
}

const btnLogSession = document.getElementById('btn-log-session');
if (btnLogSession) {
  btnLogSession.addEventListener('click', async () => {
    const today = new Date().toISOString().slice(0, 10);

    if (state.lastStreakDate === today) {
      showMessage('dashboard-message', 'You already logged your study session today! ✅', 'error');
      return;
    }

    let newStreakCount = 1;
    if (state.lastStreakDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      
      if (yesterdayStr === state.lastStreakDate) {
        newStreakCount = (state.streak || 0) + 1;
      }
    }

    const { error } = await supabase
      .from('streaks')
      .update({
        streak_count: newStreakCount,
        last_streak_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', window.currentUser.id);

    if (error) {
      console.error('Streak error:', error);
      showMessage('dashboard-message', `Failed to update streak: ${escapeHtml(error.message || 'Check database permissions')}`, 'error');
    } else {
      state.streak = newStreakCount;
      state.lastStreakDate = today;
      updateStreakUI();
      showMessage('dashboard-message', `🔥 Great job! Streak is now ${newStreakCount} day(s)!`, 'success');
    }
  });
}

async function fetchRecentNotes() {
  const { data: notes, error } = await supabase
    .from('notes')
    .select('id, title, created_at')
    .eq('user_id', window.currentUser.id)
    .order('created_at', { ascending: false })
    .limit(3);

  const listEl = document.getElementById('recent-notes-list');
  
  if (error) {
    listEl.innerHTML = `<div class="text-danger" style="color:var(--danger)">Failed to load notes: ${escapeHtml(error.message)}</div>`;
    return;
  }

  if (!notes || notes.length === 0) {
    listEl.innerHTML = `<p class="text-muted">No notes yet. Start writing!</p>`;
    return;
  }

  listEl.innerHTML = notes.map(n => `
    <div class="recent-note-item">
      <div class="recent-note-dot"></div>
      <div>
        <div class="recent-note-title">${escapeHtml(n.title)}</div>
        <div class="recent-note-date">${new Date(n.created_at).toLocaleDateString()}</div>
      </div>
    </div>
  `).join('');
}

async function renderUsageChart() {
  if (!window.Chart) return;
  
  const labels = [];
  const dates = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'));
    labels.push(d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
  }

  // Go back 7 days
  const startD = new Date(today);
  startD.setDate(startD.getDate() - 6);
  startD.setHours(0,0,0,0);
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select('created_at')
    .eq('user_id', window.currentUser.id)
    .gte('created_at', startD.toISOString());

  const countsObj = {};
  dates.forEach(d => countsObj[d] = 0);

  if (!error && notes) {
    notes.forEach(note => {
      const nd = new Date(note.created_at);
      const dStr = nd.getFullYear() + '-' + String(nd.getMonth() + 1).padStart(2,'0') + '-' + String(nd.getDate()).padStart(2,'0');
      if (countsObj[dStr] !== undefined) {
        countsObj[dStr]++;
      }
    });
  }

  const dataPoints = dates.map(d => countsObj[d]);

  const ctx = document.getElementById('usageChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Notes Created',
        data: dataPoints,
        borderColor: '#4F46E5', // var(--accent)
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#4F46E5',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0 }
        }
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
