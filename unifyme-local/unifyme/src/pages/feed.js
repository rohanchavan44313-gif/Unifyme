import { api } from '../api.js';
import { showToast } from '../toast.js';
import { createPostCard } from '../components/post-card.js';

export function mountFeed(container, onOpenCreatePost) {
  let posts = [];

  async function load() {
    container.innerHTML = `<div class="feed-page"><div class="centered" style="min-height:60vh"><div class="spinner"></div></div></div>`;
    try {
      posts = await api.posts.getFeed();
      render();
    } catch(err) {
      container.innerHTML = `<div class="feed-page"><div class="centered" style="min-height:60vh"><p style="color:var(--muted)">Failed to load feed. <button onclick="location.reload()" class="btn btn-ghost btn-sm">Retry</button></p></div></div>`;
    }
  }

  function render() {
    const page = document.createElement('div');
    page.className = 'feed-page';

    if (posts.length === 0) {
      page.innerHTML = `
        <h1 class="feed-title">For You</h1>
        <div class="feed-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <h3>Your feed is empty</h3>
          <p style="font-size:14px">Create a post or follow people to get started.</p>
        </div>
      `;
    } else {
      const postsContainer = document.createElement('div');
      postsContainer.innerHTML = `<h1 class="feed-title">For You</h1>`;
      posts.forEach(post => {
        postsContainer.appendChild(createPostCard(post));
      });
      page.appendChild(postsContainer);
    }

    container.innerHTML = '';
    container.appendChild(page);
  }

  load();
  return () => {};
}

export function mountCreatePostModal(onSuccess) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" id="create-post-modal">
      <div class="modal-header">
        <h2 class="modal-title">✨ Create New Post</h2>
        <button class="modal-close" id="modal-close">✕</button>
      </div>

      <div class="form-group">
        <label class="form-label">Image URL</label>
        <div style="display:flex;gap:8px">
          <input class="form-input" id="post-image-url" placeholder="https://..." style="flex:1">
          <button class="btn btn-secondary btn-sm" id="random-img-btn" style="white-space:nowrap">Random</button>
        </div>
      </div>

      <!-- NEW FILE UPLOAD -->
      <div class="form-group" style="margin-top:10px">
        <label class="form-label">Upload Image</label>
        <input type="file" id="post-image-file" accept="image/*">
      </div>

      <div class="image-preview hidden" id="img-preview">
        <img id="img-preview-el" src="" alt="preview" style="width:100%;height:100%;object-fit:cover">
      </div>

      <div class="form-group" style="margin-top:14px">
        <label class="form-label">Caption</label>
        <textarea class="form-input" id="post-caption" placeholder="Write a caption…" rows="3" style="resize:none;padding:12px 14px"></textarea>
      </div>

      <div class="modal-actions">
        <button class="btn btn-ghost" id="cancel-post">Cancel</button>
        <button class="btn btn-primary" id="submit-post" disabled>Share Post</button>
      </div>

      <div id="post-error" class="form-error hidden" style="margin-top:10px"></div>
    </div>
  `;

  const RANDOM_IMAGES = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop',
  ];

  document.body.appendChild(overlay);

  const urlInput = overlay.querySelector('#post-image-url');
  const fileInputEl = overlay.querySelector('#post-image-file');
  const preview = overlay.querySelector('#img-preview');
  const previewImg = overlay.querySelector('#img-preview-el');
  const submitBtn = overlay.querySelector('#submit-post');

  function validateUrl(url) {
    try { new URL(url); return true; } catch { return false; }
  }

  function checkValid() {
    const url = urlInput.value.trim();
    const file = fileInputEl.files[0];
    const validUrl = validateUrl(url);

    if (validUrl) {
      previewImg.src = url;
      preview.classList.remove('hidden');
    } else if (file) {
      previewImg.src = URL.createObjectURL(file);
      preview.classList.remove('hidden');
    } else {
      preview.classList.add('hidden');
    }

    submitBtn.disabled = !(validUrl || file);
  }

  urlInput.addEventListener('input', checkValid);
  fileInputEl.addEventListener('change', checkValid);

  overlay.querySelector('#random-img-btn').addEventListener('click', () => {
    const url = RANDOM_IMAGES[Math.floor(Math.random() * RANDOM_IMAGES.length)];
    urlInput.value = url;
    checkValid();
  });

  function close() { overlay.remove(); }

  overlay.querySelector('#modal-close').addEventListener('click', close);
  overlay.querySelector('#cancel-post').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#submit-post').addEventListener('click', async () => {
    const file = fileInputEl.files[0];
    let imageUrl = urlInput.value.trim();

    if (file) {
      imageUrl = await fileToBase64(file);
    }

    const caption = overlay.querySelector('#post-caption').value.trim();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting…';

    const errEl = overlay.querySelector('#post-error');
    errEl.classList.add('hidden');

    try {
      await api.posts.create(imageUrl, caption || undefined);
      showToast('Post created!');
      close();
      if (onSuccess) onSuccess();
    } catch(err) {
      errEl.textContent = '⚠ ' + err.message;
      errEl.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Share Post';
    }
  });
}

// helper
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}