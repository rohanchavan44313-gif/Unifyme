import { api } from '../api.js';
import { auth } from '../auth.js';
import { navigate, avatarHTML, escape } from '../utils.js';
import { showToast } from '../toast.js';

export function mountChat(container, username) {
  let profile = null;
  let messages = [];
  let pollInterval = null;
  let destroyed = false;

  async function loadProfile() {
    try {
      profile = await api.users.getProfile(username);
    } catch {}
  }

  async function loadMessages() {
    try {
      const newMsgs = await api.messages.getMessages(username);
      if (destroyed) return;
      const changed = JSON.stringify(newMsgs) !== JSON.stringify(messages);
      if (changed) {
        messages = newMsgs;
        renderMessages();
      }
    } catch {}
  }

  async function init() {
    container.innerHTML = `<div class="chat-page"><div class="centered" style="flex:1"><div class="spinner"></div></div></div>`;
    await loadProfile();
    await loadMessages();
    if (destroyed) return;
    renderFull();
    pollInterval = setInterval(loadMessages, 3000);
  }

  function renderFull() {
    const displayName = profile ? (profile.displayName || profile.username) : username;
    const handle = profile ? profile.username : username;

    container.innerHTML = `
      <div class="chat-page">
        <header class="chat-header">
          <button class="chat-back" id="chat-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          ${avatarHTML(profile || { username }, 'avatar-md')}
          <div class="chat-user-info" id="chat-user-link">
            <div class="chat-user-name">${escape(displayName)}</div>
            <div class="chat-user-handle">@${escape(handle)}</div>
          </div>
        </header>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input-area">
          <input type="text" class="chat-input" id="chat-input" placeholder="Message…" maxlength="1000" autocomplete="off">
          <button class="chat-send" id="chat-send" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    `;

    container.querySelector('#chat-back').addEventListener('click', () => navigate('/messages'));
    container.querySelector('#chat-user-link').addEventListener('click', () => navigate('/profile/' + username));

    const input = container.querySelector('#chat-input');
    const sendBtn = container.querySelector('#chat-send');

    input.addEventListener('input', () => { sendBtn.disabled = !input.value.trim(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && input.value.trim()) sendMessage(); });
    sendBtn.addEventListener('click', sendMessage);

    renderMessages();
    input.focus();
  }

  function renderMessages() {
    const container2 = document.querySelector('#chat-messages');
    if (!container2) return;

    const myId = auth.user?.id;
    const atBottom = container2.scrollHeight - container2.clientHeight - container2.scrollTop < 60;

    if (messages.length === 0) {
      container2.innerHTML = `
        <div class="chat-empty">
          ${avatarHTML(profile || { username }, 'avatar-xl')}
          <p>You and @${escape(username)}</p>
          <span style="font-size:13px;color:var(--muted)">Start the conversation!</span>
        </div>
      `;
      return;
    }

    container2.innerHTML = messages.map((msg, i) => {
      const isMe = msg.fromUserId === myId;
      const showAvatar = !isMe && (i === messages.length - 1 || messages[i + 1]?.fromUserId !== msg.fromUserId);
      return `
        <div class="msg-row ${isMe ? 'me' : 'them'}">
          ${!isMe ? `<div style="width:32px;flex-shrink:0;display:flex;align-items:flex-end;padding-bottom:2px">
            ${showAvatar ? avatarHTML(profile || { username }, 'avatar-sm') : ''}
          </div>` : ''}
          <div class="msg-bubble ${isMe ? 'me' : 'them'}">${escape(msg.content)}</div>
        </div>
      `;
    }).join('');

    if (atBottom || messages.length <= 5) {
      container2.scrollTop = container2.scrollHeight;
    }
  }

  async function sendMessage() {
    const input = document.querySelector('#chat-input');
    const sendBtn = document.querySelector('#chat-send');
    const content = input?.value?.trim();
    if (!content) return;
    input.value = '';
    sendBtn.disabled = true;
    try {
      const msg = await api.messages.send(username, content);
      messages.push(msg);
      renderMessages();
    } catch(err) {
      showToast(err.message, 'error');
      input.value = content;
      sendBtn.disabled = false;
    }
  }

  init();

  return () => {
    destroyed = true;
    if (pollInterval) clearInterval(pollInterval);
  };
}
