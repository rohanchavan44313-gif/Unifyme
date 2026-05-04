let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = 'success') {
  const c = getContainer();
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 3000);
}
