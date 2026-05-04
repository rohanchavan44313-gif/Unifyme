import { api } from '../api.js';

function eyeIcon(visible) {
  return visible
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

function getBasePath() {
  return import.meta.env.BASE_URL.replace(/\/$/, '') || '';
}

export function mountLogin(container, onSuccess) {
  let tab = 'login';
  let showPw = false;

  function render() {
    const base = getBasePath();
    container.innerHTML = `
      <div class="login-page">
        <div class="login-bg">
          <img src="${base}/images/hero-bg.png" alt="" onerror="this.style.display='none'">
          <div class="login-bg-overlay"></div>
        </div>
        <div class="login-card">
          <div class="login-logo">
            <img src="${base}/images/logo-icon.png" alt="UnifyMe" onerror="this.style.display='none'">
          </div>
          <h1 class="login-title">Welcome to <span class="gradient-text">UnifyMe</span></h1>
          <p class="login-subtitle">Made by Rohan Chavan</p>

          <div class="login-tabs">
            <button class="login-tab ${tab === 'login' ? 'active' : ''}" id="tab-login">Sign In</button>
            <button class="login-tab ${tab === 'register' ? 'active' : ''}" id="tab-register">Create Account</button>
          </div>

          <div id="login-error" style="display:none" class="form-error" style="margin-bottom:14px"></div>

          ${tab === 'login' ? loginForm() : registerForm()}

          <p class="login-community">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M12 3l1.88 5.76L20 10l-5.76 1.88L12 18l-1.88-5.76L4 10l5.76-1.88z"/></svg>
            Join the unified community
          </p>
        </div>
      </div>
    `;

    container.querySelector('#tab-login').addEventListener('click', () => { tab = 'login'; render(); });
    container.querySelector('#tab-register').addEventListener('click', () => { tab = 'register'; render(); });
    container.querySelector('#toggle-pw')?.addEventListener('click', () => { showPw = !showPw; render(); });
    container.querySelector('#login-form')?.addEventListener('submit', handleLogin);
    container.querySelector('#register-form')?.addEventListener('submit', handleRegister);
  }

  function loginForm() {
    return `
      <form id="login-form" class="login-form">
        <div class="form-group">
          <label class="form-label">Username</label>
          <input class="form-input" name="username" placeholder="your_username" autocomplete="username" required>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="form-input-wrap">
            <input class="form-input" name="password" type="${showPw ? 'text' : 'password'}" placeholder="••••••••" autocomplete="current-password" required>
            <button type="button" class="form-input-icon" id="toggle-pw">${eyeIcon(showPw)}</button>
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-lg" id="login-submit">Sign In</button>
      </form>
    `;
  }

  function registerForm() {
    return `
      <form id="register-form" class="login-form">
        <div class="form-group">
          <label class="form-label">Username <span style="color:var(--accent)">*</span></label>
          <input class="form-input" name="username" placeholder="choose_a_username" autocomplete="username" required minlength="3" maxlength="30">
          <span class="form-hint">Letters, numbers, underscores only.</span>
        </div>
        <div class="form-group">
          <label class="form-label">Display Name <span style="color:var(--muted);font-size:12px">(optional)</span></label>
          <input class="form-input" name="displayName" placeholder="Your Name" maxlength="50">
        </div>
        <div class="form-group">
          <label class="form-label">Password <span style="color:var(--accent)">*</span></label>
          <div class="form-input-wrap">
            <input class="form-input" name="password" type="${showPw ? 'text' : 'password'}" placeholder="Min 6 characters" autocomplete="new-password" required minlength="6">
            <button type="button" class="form-input-icon" id="toggle-pw">${eyeIcon(showPw)}</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Confirm Password <span style="color:var(--accent)">*</span></label>
          <input class="form-input" name="confirmPassword" type="${showPw ? 'text' : 'password'}" placeholder="Repeat password" autocomplete="new-password" required>
        </div>
        <button type="submit" class="btn btn-primary btn-lg" id="reg-submit">Create Account</button>
      </form>
    `;
  }

  function showError(msg) {
    const el = container.querySelector('#login-error');
    if (!el) return;
    el.textContent = '⚠ ' + msg;
    el.style.display = 'flex';
  }

  async function handleLogin(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector('#login-submit');
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    try {
      const data = await api.auth.login(fd.get('username').trim(), fd.get('password'));
      onSuccess(data.user);
    } catch(err) {
      showError(err.message);
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const pw = fd.get('password');
    const cpw = fd.get('confirmPassword');
    if (pw !== cpw) { showError('Passwords do not match'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(fd.get('username'))) { showError('Username: letters, numbers, underscores only'); return; }
    const btn = e.target.querySelector('#reg-submit');
    btn.disabled = true;
    btn.textContent = 'Creating account…';
    try {
      const data = await api.auth.register(fd.get('username').trim(), pw, fd.get('displayName')?.trim() || undefined);
      onSuccess(data.user);
    } catch(err) {
      showError(err.message);
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  }

  render();
  return () => {};
}
