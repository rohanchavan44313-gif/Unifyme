import './styles.css';
import { api } from './api.js';
import { auth } from './auth.js';
import { renderLayout, updateActiveNav } from './components/layout.js';
import { mountLogin } from './pages/login.js';
import { mountFeed, mountCreatePostModal } from './pages/feed.js';
import { mountSearch } from './pages/search.js';
import { mountProfile } from './pages/profile.js';
import { mountMessages } from './pages/messages.js';
import { mountChat } from './pages/chat.js';
import { navigate } from './utils.js';

const app = document.getElementById('app');
let currentUnmount = null;

function getPath() {
  const hash = window.location.hash;
  return hash ? hash.slice(1) : '/';
}

function parseRoute(path) {
  if (path === '/' || path === '') return { name: 'feed' };
  if (path === '/search') return { name: 'search' };
  if (path === '/profile') return { name: 'profile', username: auth.user?.username };
  if (path.startsWith('/profile/')) return { name: 'profile', username: path.slice(9) };
  if (path === '/messages') return { name: 'messages' };
  if (path.startsWith('/messages/')) return { name: 'chat', username: path.slice(10) };
  return { name: 'feed' };
}

function getNavPath(routeName) {
  const map = { feed: '/', search: '/search', profile: '/profile', messages: '/messages', chat: '/messages' };
  return map[routeName] || '/';
}

async function route() {
  // Cleanup current page
  if (currentUnmount) { currentUnmount(); currentUnmount = null; }

  const path = getPath();
  const user = auth.user;

  if (!user) {
    app.innerHTML = '';
    currentUnmount = mountLogin(app, (loggedInUser) => {
      auth.user = loggedInUser;
      renderAppShell(loggedInUser);
      route();
    });
    return;
  }

  const parsed = parseRoute(path);
  updateActiveNav(getNavPath(parsed.name));

  const main = document.getElementById('main-content');
  if (!main) { renderAppShell(user); }
  const container = document.getElementById('main-content');
  if (!container) return;

  switch (parsed.name) {
    case 'feed':
      currentUnmount = mountFeed(container, openCreatePost);
      break;
    case 'search':
      currentUnmount = mountSearch(container);
      break;
    case 'profile':
      if (parsed.username) {
        currentUnmount = mountProfile(container, parsed.username);
      } else {
        navigate('/');
      }
      break;
    case 'messages':
      currentUnmount = mountMessages(container);
      break;
    case 'chat':
      currentUnmount = mountChat(container, parsed.username);
      break;
    default:
      currentUnmount = mountFeed(container, openCreatePost);
  }
}

function renderAppShell(user) {
  app.innerHTML = '';
  renderLayout(app, user, openCreatePost);
}

function openCreatePost() {
  mountCreatePostModal(() => {
    // Reload feed if we're on it
    const path = getPath();
    if (path === '/' || path === '') {
      if (currentUnmount) { currentUnmount(); currentUnmount = null; }
      const container = document.getElementById('main-content');
      if (container) currentUnmount = mountFeed(container, openCreatePost);
    }
  });
}

async function init() {
  try {
    const data = await api.auth.getUser();
    if (data.user) {
      auth.user = data.user;
      renderAppShell(data.user);
    }
  } catch {}
  route();
}

window.addEventListener('hashchange', route);
window.navigate = navigate;
init();
