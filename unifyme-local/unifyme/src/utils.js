export function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now - d) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec/60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec/3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec/86400)}d ago`;
  return d.toLocaleDateString();
}

export function avatarHTML(user, sizeClass = 'avatar-md') {
  if (user && user.profileImageUrl) {
    return `<div class="avatar ${sizeClass}"><img src="${escape(user.profileImageUrl)}" alt="" onerror="this.parentElement.innerHTML='${(user.username||user.displayName||'U')[0].toUpperCase()}'"></div>`;
  }
  const initial = ((user && (user.username || user.displayName || user.firstName)) || 'U')[0].toUpperCase();
  return `<div class="avatar ${sizeClass}">${initial}</div>`;
}

export function escape(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function navigate(path) {
  window.location.hash = '#' + path;
}
