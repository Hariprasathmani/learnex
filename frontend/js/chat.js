import './auth-guard.js';
import { showMessage, escapeHtml } from './supabase.js';
import { renderSidebar } from './nav.js';

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('btn-chat-send');
let isWaitingForResponse = false;

function initChat() {
  renderSidebar('chat');
  document.getElementById('welcome-time').textContent = formatAMPM(new Date());

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isWaitingForResponse) return;

    const message = chatInput.value.trim();
    if (!message) return;

    // Remove any previous error message overlays if we're trying again
    const msgBox = document.getElementById('chat-message-box');
    if (msgBox) msgBox.classList.remove('show');

    // 1. Show user message
    appendMessage('user', escapeHtml(message));
    chatInput.value = '';
    
    // 2. Disable input and show typing indicator
    isWaitingForResponse = true;
    chatInput.disabled = true;
    sendBtn.disabled = true;
    showTypingIndicator();

    try {
      const response = await fetch('http://127.0.0.1:3001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_message: message }),
      });

      if (!response.ok) {
        // Attempt to get error details from the server response
        let errorMsg = `Server returned ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.details || errorMsg;
        } catch (e) { /* ignore parse error */ }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      removeTypingIndicator();

      if (data.choices && data.choices[0] && data.choices[0].message) {
        const rawText = data.choices[0].message.content;
        
        // We use marked library included via CDN in the HTML
        let parsedHtml = '';
        if (typeof window.marked !== 'undefined') {
          // Use marked for robust markdown parsing
          parsedHtml = window.marked.parse(rawText);
        } else {
          // Fallback if marked failed to load
          parsedHtml = `<p>${escapeHtml(rawText)}</p>`;
        }
        
        appendMessage('bot', parsedHtml);
      } else {
        throw new Error('Invalid response format from Gemini proxy');
      }
    } catch (error) {
      console.error('Chat error:', error);
      removeTypingIndicator();
      const detailedError = error.message === 'Failed to fetch' 
        ? 'Could not connect to the AI backend. Please ensure the server is running on 127.0.0.1:3001.' 
        : error.message;
      appendMessage('bot', `<p style="color:var(--danger)">⚠️ Error: ${detailedError}</p>`);
    } finally {
      // 3. Re-enable input
      isWaitingForResponse = false;
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  });
}

function appendMessage(sender, contentHTML) {
  const time = formatAMPM(new Date());
  const isUser = sender === 'user';
  
  const msgEl = document.createElement('div');
  msgEl.className = `chat-message ${isUser ? 'user' : 'bot'}`;
  
  msgEl.innerHTML = `
    <div class="msg-avatar">${isUser ? '👤' : '🤖'}</div>
    <div class="msg-bubble">
      ${contentHTML}
      <span class="msg-time">${time}</span>
    </div>
  `;
  
  chatBox.appendChild(msgEl);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
  const li = document.createElement('div');
  li.className = 'chat-message bot';
  li.id = 'typing-indicator';
  li.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-bubble" style="padding: 0;">
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  chatBox.appendChild(li);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function formatAMPM(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return hours + ':' + minutes + ' ' + ampm;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChat);
} else {
  initChat();
}
