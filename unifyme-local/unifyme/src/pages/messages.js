import { api } from '../api.js';
import { navigate, avatarHTML, escape } from '../utils.js';

function timeShort(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now - d) / 1000);
  if (sec < 60) return 'now';
  if (sec < 3600) return Math.floor(sec/60) + 'm';
  if (sec < 86400) return Math.floor(sec/3600) + 'h';
  return Math.floor(sec/86400) + 'd';
}

export function mountMessages(container) {
  async function load() {
    container.innerHTML = `<div class="messages-page"><div class="centered" style="min-height:60vh"><div class="spinner"></div></div></div>`;
    try {
      const convs = await api.messages.getConversations();
      render(convs);
    } catch {
      container.innerHTML = `<div class="messages-page"><p style="color:var(--muted)">Failed to load messages.</p></div>`;
    }
  }

  function render(convs) {
    const page = document.createElement('div');
    page.className = 'messages-page';
    page.innerHTML = `<h1 class="messages-title">Messages</h1>`;

    if (convs.length === 0) {
      page.innerHTML += `
        <div class="messages-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <h3>Your Inbox</h3>
          <p style="font-size:14px">Send messages to friends.</p>
          <button class="btn btn-primary btn-sm" style="margin-top:14px;border-radius:2rem" id="find-friends-btn">Find friends to message</button>
        </div>
      `;
    } else {
      const list = document.createElement('div');
      list.innerHTML = convs.map(c => `
        <div class="conv-card" data-username="${escape(c.username)}">
          ${avatarHTML(c, 'avatar-lg')}
          <div class="conv-info">
            <div style="display:flex;justify-content:space-between;align-items:baseline">
              <span class="conv-name">${escape(c.displayName || c.username)}</span>
              <span class="conv-time">${timeShort(c.lastMessageAt)}</span>
            </div>
            <div class="conv-last">${escape(c.lastMessage || '')}</div>
          </div>
          ${c.unreadCount > 0 ? `<div class="conv-unread">${c.unreadCount}</div>` : ''}
        </div>
      `).join('');
      page.appendChild(list);

      list.querySelectorAll('.conv-card').forEach(card => {
        card.addEventListener('click', () => navigate('/messages/' + card.dataset.username));
      });
    }

    container.innerHTML = '';
    container.appendChild(page);

    container.querySelector('#find-friends-btn')?.addEventListener('click', () => navigate('/search'));
  }

  load();
  return () => {};
}
