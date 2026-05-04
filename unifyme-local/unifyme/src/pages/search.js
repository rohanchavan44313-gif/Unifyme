import { api } from '../api.js';
import { navigate, avatarHTML, escape } from '../utils.js';

export function mountSearch(container) {
  let debounceTimer = null;
  let users = [];
  let query = '';
  let initialLoaded = false;

  async function loadUsers(q) {
    query = q;
    try {
      if (q) {
        users = await api.users.search(q);
      } else {
        users = await api.users.all();
        initialLoaded = true;
      }
      renderResults();
    } catch {}
  }

  function renderResults() {
    const list = container.querySelector('#search-results');
    if (!list) return;

    if (users.length === 0) {
      list.innerHTML = query
        ? `<div class="centered" style="min-height:200px;color:var(--muted)">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;opacity:0.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
             <h3 style="color:var(--text)">No users found</h3>
             <p>No one matches "${escape(query)}"</p>
           </div>`
        : `<div class="centered" style="min-height:200px;color:var(--muted)">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;opacity:0.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
             <h3 style="color:var(--text)">Discover People</h3>
             <p>Type a name to search users</p>
           </div>`;
      return;
    }

    list.innerHTML = users.map(u => `
      <div class="user-card" data-username="${escape(u.username)}">
        ${avatarHTML(u, 'avatar-lg')}
        <div class="user-card-info">
          <div class="user-card-name">${escape(u.displayName || u.username)}</div>
          <div class="user-card-handle">@${escape(u.username)}</div>
        </div>
        <div class="user-card-followers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;display:inline;vertical-align:-2px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          ${u.followersCount}
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.user-card').forEach(card => {
      card.addEventListener('click', () => navigate('/profile/' + card.dataset.username));
    });
  }

  container.innerHTML = `
    <div class="search-page">
      <h1 class="search-title">Search</h1>
      <div class="search-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="search" id="search-input" placeholder="Search for users…" autocomplete="off">
      </div>
      <div id="search-results">
        <div class="centered" style="min-height:100px"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  const input = container.querySelector('#search-input');
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    debounceTimer = setTimeout(() => loadUsers(q), 400);
  });

  loadUsers('');

  return () => { clearTimeout(debounceTimer); };
}
