import { api } from '../api.js';
import { auth } from '../auth.js';
import { timeAgo, avatarHTML, navigate, escape } from '../utils.js';
import { showToast } from '../toast.js';

function heartIcon(filled) {
  return `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="${filled ? '#ef4444' : 'none'}" style="width:26px;height:26px;stroke:${filled ? '#ef4444' : 'currentColor'}"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}
function commentIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
}
function sendIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
}

export function createPostCard(post, container) {
  const el = document.createElement('div');
  el.className = 'post-card';
  el.dataset.postId = post.id;

  let localLiked = post.isLiked;
  let localLikes = post.likesCount;
  let commentsVisible = false;

  function render() {
    const displayName = post.displayName || post.username;
    el.innerHTML = `
      <div class="post-header">
        <div class="post-user" data-username="${escape(post.username)}">
          ${avatarHTML({ username: post.username, profileImageUrl: post.profileImageUrl }, 'avatar-md')}
          <div>
            <div class="post-user-name">${escape(displayName)}</div>
            <div class="post-user-handle">@${escape(post.username)} · <span class="time-ago">${timeAgo(post.createdAt)}</span></div>
          </div>
        </div>
      </div>
      <img class="post-image" src="${escape(post.imageUrl)}" alt="Post" loading="lazy" onerror="this.style.background='var(--surface-2)'">
      <div class="post-actions">
        <button class="post-action-btn${localLiked ? ' liked' : ''}" id="like-btn-${post.id}">
          ${heartIcon(localLiked)}
        </button>
        <button class="post-action-btn" id="comment-btn-${post.id}">
          ${commentIcon()}
        </button>
      </div>
      <div class="post-likes">${localLikes} ${localLikes === 1 ? 'like' : 'likes'}</div>
      ${post.caption ? `<div class="post-caption"><span class="post-caption-user">${escape(post.username)}</span>${escape(post.caption)}</div>` : ''}
      ${post.commentsCount > 0 && !commentsVisible ? `<button class="post-view-comments" id="view-comments-${post.id}">View all ${post.commentsCount} comments</button>` : ''}
      <div class="post-comments${commentsVisible ? '' : ' hidden'}" id="comments-${post.id}">
        <div class="centered" id="comments-loading-${post.id}" style="min-height:60px"><div class="spinner" style="width:24px;height:24px;border-width:2px"></div></div>
      </div>
      <div class="post-comment-input">
        ${avatarHTML(auth.user, 'avatar-sm')}
        <input type="text" placeholder="Add a comment…" id="comment-input-${post.id}" maxlength="500">
        <button class="post-comment-send" id="comment-send-${post.id}" disabled>${sendIcon()}</button>
      </div>
    `;

    // User profile link
    el.querySelector('.post-user').addEventListener('click', () => navigate('/profile/' + post.username));

    // Like toggle
    el.querySelector(`#like-btn-${post.id}`).addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      try {
        if (localLiked) {
          await api.posts.unlike(post.id);
          localLiked = false;
          localLikes--;
        } else {
          await api.posts.like(post.id);
          localLiked = true;
          localLikes++;
        }
        render();
      } catch(err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
      }
    });

    // View comments
    el.querySelector(`#view-comments-${post.id}`)?.addEventListener('click', () => {
      commentsVisible = true;
      loadComments();
    });

    // Comment button toggle
    el.querySelector(`#comment-btn-${post.id}`).addEventListener('click', () => {
      commentsVisible = !commentsVisible;
      if (commentsVisible) loadComments();
      else render();
    });

    // Comment input enable/disable send
    const input = el.querySelector(`#comment-input-${post.id}`);
    const sendBtn = el.querySelector(`#comment-send-${post.id}`);
    input?.addEventListener('input', () => {
      sendBtn.disabled = !input.value.trim();
    });
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) submitComment();
    });
    sendBtn?.addEventListener('click', submitComment);
  }

  async function loadComments() {
    render();
    const commentsEl = el.querySelector(`#comments-${post.id}`);
    if (!commentsEl) return;
    commentsEl.classList.remove('hidden');
    try {
      const comments = await api.posts.getComments(post.id);
      if (comments.length === 0) {
        commentsEl.innerHTML = '<div style="text-align:center;padding:12px;font-size:13px;color:var(--muted)">No comments yet. Be the first!</div>';
      } else {
        commentsEl.innerHTML = comments.map(c => `
          <div class="comment-item">
            ${avatarHTML({ username: c.username, profileImageUrl: c.profileImageUrl }, 'avatar-sm')}
            <div>
              <span class="comment-user" data-username="${escape(c.username)}">${escape(c.username)}</span>
              ${escape(c.content)}
              <span class="comment-time">${timeAgo(c.createdAt)}</span>
            </div>
          </div>
        `).join('');
        commentsEl.querySelectorAll('.comment-user').forEach(u => {
          u.addEventListener('click', () => navigate('/profile/' + u.dataset.username));
        });
      }
    } catch {
      commentsEl.innerHTML = '<div style="text-align:center;padding:12px;font-size:13px;color:var(--muted)">Failed to load comments</div>';
    }
  }

  async function submitComment() {
    const input = el.querySelector(`#comment-input-${post.id}`);
    const content = input?.value?.trim();
    if (!content) return;
    const sendBtn = el.querySelector(`#comment-send-${post.id}`);
    sendBtn.disabled = true;
    try {
      await api.posts.addComment(post.id, content);
      input.value = '';
      post.commentsCount++;
      commentsVisible = true;
      await loadComments();
    } catch(err) {
      showToast(err.message, 'error');
    } finally {
      sendBtn.disabled = false;
    }
  }

  render();
  return el;
}
