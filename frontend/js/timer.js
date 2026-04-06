import './auth-guard.js';
import { supabase, showMessage } from './supabase.js';
import { renderSidebar } from './nav.js';

let settings = { focus: 25, shortBreak: 5, longBreak: 15 };
let state = {
  phase: 'focus', // 'focus', 'shortBreak', 'longBreak'
  cycleCount: 0,
  timeLeft: 25 * 60,
  isRunning: false,
  totalFocusMins: 0,
  totalBreakMins: 0,
  totalPomodoros: 0, // from db
};

let timerInterval = null;

const TOTAL_DASH = 2 * Math.PI * 130; // Radius = 130
const ring = document.getElementById('timer-ring');
const digits = document.getElementById('timer-digits');
const phaseLabel = document.getElementById('timer-phase-label');
const toggleBtn = document.getElementById('btn-timer-toggle');
const resetBtn = document.getElementById('btn-timer-reset');
const dotsContainer = document.getElementById('pomodoro-dots');

async function initTimer() {
  renderSidebar('timer');
  ring.style.strokeDasharray = TOTAL_DASH;
  ring.style.strokeDashoffset = 0;
  
  await fetchDbStats();
  updateUI();
  renderDots();
  bindEvents();
}

async function fetchDbStats() {
  const { data, error } = await supabase
    .from('streaks')
    .select('pomodoros_today, last_streak_date')
    .eq('user_id', window.currentUser.id)
    .single();

  if (!error && data) {
    const today = new Date().toISOString().slice(0, 10);
    if (data.last_streak_date === today) {
      state.totalPomodoros = data.pomodoros_today || 0;
    } else {
      state.totalPomodoros = 0;
    }
  }
}

async function updateDbPomos(qty) {
  state.totalPomodoros += qty;
  const today = new Date().toISOString().slice(0, 10);
  
  // Update UI immediately
  document.getElementById('stat-pomos').textContent = state.totalPomodoros;

  // Update the new count
  const { error } = await supabase
    .from('streaks')
    .update({
      pomodoros_today: state.totalPomodoros,
      last_streak_date: today,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', window.currentUser.id);
  
  if (error) {
    console.warn('Failed to save Pomodoro count to DB', error);
  }
}

function updateUI() {
  // Update time digits
  const m = Math.floor(state.timeLeft / 60).toString().padStart(2, '0');
  const s = (state.timeLeft % 60).toString().padStart(2, '0');
  digits.textContent = `${m}:${s}`;
  document.title = `${m}:${s} - LearnEx Timer`;

  // Update ring progress
  const totalSeconds = getPhaseSeconds(state.phase);
  const percent = state.timeLeft / totalSeconds;
  const offset = TOTAL_DASH - (percent * TOTAL_DASH);
  ring.style.strokeDashoffset = offset;

  // Update Phase Colors
  ring.style.stroke = state.phase === 'focus' ? 'var(--accent)' : 'var(--success)';
  phaseLabel.style.color = state.phase === 'focus' ? 'var(--accent)' : 'var(--success)';
  phaseLabel.style.background = state.phase === 'focus' ? 'var(--accent-glow)' : 'var(--success-glow)';

  // Update Stats
  document.getElementById('stat-f-mins').textContent = state.totalFocusMins;
  document.getElementById('stat-pomos').textContent = state.totalPomodoros;
  document.getElementById('stat-breaks').textContent = state.totalBreakMins;

  if (state.phase === 'focus') phaseLabel.textContent = 'Focus';
  else if (state.phase === 'shortBreak') phaseLabel.textContent = 'Short Break';
  else phaseLabel.textContent = 'Long Break';

  toggleBtn.textContent = state.isRunning ? 'Pause' : 'Start';
}

function renderDots() {
  // Show 4 dots total for a full cycle
  let html = '';
  for (let i = 0; i < 4; i++) {
    const isDone = i < (state.cycleCount % 4);
    html += `<div class="pomo-dot ${isDone ? 'done' : ''}"></div>`;
  }
  dotsContainer.innerHTML = html;
}

function getPhaseSeconds(phase) {
  if (phase === 'focus') return settings.focus * 60;
  if (phase === 'shortBreak') return settings.shortBreak * 60;
  return settings.longBreak * 60;
}

function playBell() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 1.5);
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 2.5);
}

function switchPhase() {
  playBell();
  
  if (state.phase === 'focus') {
    state.totalFocusMins += settings.focus;
    updateDbPomos(1); // Increment pomodoros in DB
    state.cycleCount++;
    
    // Every 4 cycles = long break
    if (state.cycleCount > 0 && state.cycleCount % 4 === 0) {
      state.phase = 'longBreak';
    } else {
      state.phase = 'shortBreak';
    }
  } else {
    // End of a break
    if (state.phase === 'longBreak') {
      state.totalBreakMins += settings.longBreak;
      state.cycleCount = 0; // Reset visual cycle after long break
    } else {
      state.totalBreakMins += settings.shortBreak;
    }
    state.phase = 'focus';
  }
  
  state.timeLeft = getPhaseSeconds(state.phase);
  renderDots();
  
  if (state.isRunning) {
    // Stop auto-starting breaks based on user preference? 
    // We'll auto-pause on phase switch so they don't lose time if afk
    pauseTimer();
  }
  
  updateUI();
  showMessage('timer-message', `Time for: ${phaseLabel.textContent}!`, 'success');
}

function tick() {
  if (state.timeLeft > 0) {
    state.timeLeft--;
    updateUI();
  } else {
    switchPhase();
  }
}

function toggleTimer() {
  if (state.isRunning) pauseTimer();
  else startTimer();
}

function startTimer() {
  if (state.isRunning) return;
  state.isRunning = true;
  timerInterval = setInterval(tick, 1000);
  updateUI();
}

function pauseTimer() {
  state.isRunning = false;
  clearInterval(timerInterval);
  updateUI();
}

function resetTimer() {
  pauseTimer();
  state.phase = 'focus';
  state.timeLeft = getPhaseSeconds('focus');
  state.cycleCount = 0;
  renderDots();
  updateUI();
}

function bindEvents() {
  toggleBtn.addEventListener('click', toggleTimer);
  resetBtn.addEventListener('click', resetTimer);

  /* Settings Modal */
  const modal = document.getElementById('timer-modal-wrap');
  document.getElementById('btn-timer-settings').addEventListener('click', () => {
    document.getElementById('setting-focus').value = settings.focus;
    document.getElementById('setting-short').value = settings.shortBreak;
    document.getElementById('setting-long').value = settings.longBreak;
    modal.classList.add('open');
    pauseTimer();
  });
  
  document.getElementById('btn-close-timer-modal').addEventListener('click', () => modal.classList.remove('open'));
  
  document.getElementById('btn-save-settings').addEventListener('click', () => {
    const f = parseInt(document.getElementById('setting-focus').value) || 25;
    const s = parseInt(document.getElementById('setting-short').value) || 5;
    const l = parseInt(document.getElementById('setting-long').value) || 15;
    
    settings = { focus: f, shortBreak: s, longBreak: l };
    modal.classList.remove('open');
    resetTimer(); // Apply new times immediately
    showMessage('timer-message', 'Settings saved!', 'success');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTimer);
} else {
  initTimer();
}
