import { auth } from '../auth.js';
import { api } from '../api.js';
import { navigate, avatarHTML } from '../utils.js';

const NAV_ITEMS = [
  { path: '/',         label: 'Home',     icon: homeIcon },
  { path: '/search',   label: 'Search',   icon: searchIcon },
  { path: '/messages', label: 'Messages', icon: msgIcon },
  { path: '/profile',  label: 'Profile',  icon: profileIcon },
];

function homeIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
}
function searchIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`;
}
function msgIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
}
function profileIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
}
function plusIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
}
function logoutIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
}
function sparklesIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M12 3l1.88 5.76L20 10l-5.76 1.88L12 18l-1.88-5.76L4 10l5.76-1.88z"/></svg>`;
}

function getBasePath() {
  return import.meta.env.BASE_URL.replace(/\/$/, '') || '';
}

export function renderLayout(app, user, onCreatePost) {
  const u = user;
  const displayName = u.displayName || u.firstName || u.username || 'User';
  const handle = u.username || '';
  const base = getBasePath();

  app.innerHTML = `
    <div class="app-shell">
      <!-- Desktop Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon">
            <img src="${base}/images/logo-icon.png" alt="UnifyMe" onerror="this.style.display='none'">
          </div>
          <h1 class="gradient-text">UnifyMe</h1>
        </div>
        <nav class="sidebar-nav" id="sidebar-nav">
          ${NAV_ITEMS.map(n => `
            <a class="nav-link" data-path="${n.path}" href="javascript:void(0)">
              ${n.icon()} ${n.label}
            </a>
          `).join('')}
        </nav>
        <button class="sidebar-create-btn" id="sidebar-create-btn">
          ${plusIcon()} Create Post
        </button>
        <div class="sidebar-user">
          <a class="sidebar-user-link" data-path="/profile" href="javascript:void(0)">
            ${avatarHTML({ username: handle, profileImageUrl: u.profileImageUrl, firstName: u.firstName }, 'avatar-sm')}
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${displayName}</div>
              <div class="sidebar-user-handle">@${handle}</div>
            </div>
          </a>
          <button class="btn-logout" id="btn-logout" title="Log out">${logoutIcon()}</button>
        </div>
      </aside>

      <!-- Mobile Header -->
      <header class="mobile-header">
        <div class="mobile-header-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="url(#grad)" stroke-width="2" style="width:26px;height:26px">
            <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#ec4899"/></linearGradient></defs>
            <path d="M12 3l1.88 5.76L20 10l-5.76 1.88L12 18l-1.88-5.76L4 10l5.76-1.88z"/>
          </svg>
          <span class="gradient-text">UnifyMe</span>
        </div>
        <button class="btn btn-primary btn-sm" id="mobile-create-btn" style="border-radius:2rem;padding:8px 14px;">
          ${plusIcon()} New Post
        </button>
      </header>

      <!-- Main content -->
      <main class="main-content" id="main-content"></main>

      <!-- Mobile Bottom Nav -->
      <nav class="mobile-nav" id="mobile-nav">
        ${NAV_ITEMS.map(n => `
          <button class="mobile-nav-btn" data-path="${n.path}">${n.icon()}</button>
        `).join('')}
      </nav>
    </div>
  `;

  // Nav clicks - sidebar
  app.querySelectorAll('.nav-link, .sidebar-user-link').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.path));
  });

  // Nav clicks - mobile
  app.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.path));
  });

  // Create post
  const createHandler = () => { if (onCreatePost) onCreatePost(); };
  app.querySelector('#sidebar-create-btn')?.addEventListener('click', createHandler);
  app.querySelector('#mobile-create-btn')?.addEventListener('click', createHandler);

  // Logout
  app.querySelector('#btn-logout')?.addEventListener('click', async () => {
    try { await api.auth.logout(); } catch {}
    auth.clear();
    window.location.reload();
  });
}

export function updateActiveNav(currentPath) {
  document.querySelectorAll('.nav-link, .mobile-nav-btn').forEach(el => {
    const p = el.dataset.path;
    const isActive = p === currentPath || (p !== '/' && currentPath.startsWith(p));
    el.classList.toggle('active', isActive);
  });
}
