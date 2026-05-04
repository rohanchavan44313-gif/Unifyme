import { api } from '../api.js';
import { auth } from '../auth.js';
import { navigate, avatarHTML, escape } from '../utils.js';
import { showToast } from '../toast.js';

export function mountProfile(container, username) {
  let profile = null;
  let posts = [];

  async function load() {
    container.innerHTML = `<div class="centered" style="min-height:60vh"><div class="spinner"></div></div>`;
    try {
      [profile, posts] = await Promise.all([
        api.users.getProfile(username),
        api.users.getPosts(username),
      ]);
      render();
    } catch {
      container.innerHTML = `<div class="centered" style="min-height:60vh;color:var(--muted)"><h3 style="color:var(--text)">User not found</h3><button class="btn btn-primary btn-sm" onclick="navigate('/')">Go Home</button></div>`;
    }
  }

  function isOwn() {
    return auth.user && (auth.user.username === username || auth.user.id === profile?.id);
  }

  function render() {
    const own = isOwn();
    const displayName = profile.displayName || profile.username;
    const initial = (profile.username || 'U')[0].toUpperCase();

    container.innerHTML = `
      <div class="profile-page">
        <div class="profile-cover"></div>
        <div class="profile-header-card">
          <div class="profile-avatar-row">
            <div class="profile-avatar">
              ${profile.profileImageUrl ? `<img src="${escape(profile.profileImageUrl)}" alt="">` : initial}
            </div>
            <div class="profile-actions">
              ${own
                ? `<button class="btn btn-secondary" id="edit-profile-btn">Edit Profile</button>`
                : `<button class="btn btn-secondary btn-sm" id="msg-btn">Message</button>
                   <button class="btn ${profile.isFollowing ? 'btn-outline' : 'btn-primary'} btn-sm" id="follow-btn">
                     ${profile.isFollowing ? 'Unfollow' : 'Follow'}
                   </button>`
              }
            </div>
          </div>

          <h2 class="profile-name">${escape(displayName)}</h2>
          <p class="profile-handle">@${escape(profile.username)}</p>

          <div class="profile-stats">
            <div class="profile-stat">
              <div class="profile-stat-num">${profile.postsCount || 0}</div>
              <div class="profile-stat-label">Posts</div>
            </div>

            <!-- CLICKABLE FOLLOWERS -->
            <div class="profile-stat" id="followers-btn" style="cursor:pointer">
              <div class="profile-stat-num">${profile.followersCount || 0}</div>
              <div class="profile-stat-label">Followers</div>
            </div>

            <!-- CLICKABLE FOLLOWING -->
            <div class="profile-stat" id="following-btn" style="cursor:pointer">
              <div class="profile-stat-num">${profile.followingCount || 0}</div>
              <div class="profile-stat-label">Following</div>
            </div>
          </div>
        </div>

        <div class="profile-grid">
          ${posts.length === 0
            ? `<div class="profile-empty"><h3>No Posts Yet</h3></div>`
            : `<div class="profile-grid-inner">${posts.map(p => `
                <div class="profile-post">
                  <img src="${escape(p.imageUrl)}">
                </div>`).join('')}</div>`
          }
        </div>
      </div>
    `;

    container.querySelector('#msg-btn')?.addEventListener('click', () => navigate('/messages/' + profile.username));
    container.querySelector('#follow-btn')?.addEventListener('click', toggleFollow);

    // 👇 NEW EVENTS
    container.querySelector('#followers-btn')?.addEventListener('click', () => openFollowModal('followers'));
    container.querySelector('#following-btn')?.addEventListener('click', () => openFollowModal('following'));
  }

  async function toggleFollow() {
    try {
      if (profile.isFollowing) {
        await api.users.unfollow(username);
        profile.isFollowing = false;
        profile.followersCount--;
      } else {
        await api.users.follow(username);
        profile.isFollowing = true;
        profile.followersCount++;
      }
      render();
    } catch(err) {
      showToast(err.message, 'error');
    }
  }

  // 🔥 FOLLOW MODAL
  async function openFollowModal(type) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    overlay.innerHTML = `
      <div class="modal" style="max-width:400px">
        <div class="modal-header">
          <h2>${type}</h2>
          <button class="modal-close" id="close-follow">✕</button>
        </div>
        <div id="follow-list" style="padding:10px">Loading...</div>
      </div>
    `;

    document.body.appendChild(overlay);

    function close() { overlay.remove(); }
    overlay.querySelector("#close-follow").onclick = close;

    try {
      const res = await fetch(`/api/users/${profile.username}/${type}`, {
        credentials: "include"
      });

      const data = await res.json();
      const list = overlay.querySelector("#follow-list");

      if (!data.length) {
        list.innerHTML = "<p>No users</p>";
        return;
      }

      list.innerHTML = data.map(u => `
        <div style="padding:8px;border-bottom:1px solid #eee">
          @${u.username}
        </div>
      `).join("");

    } catch {
      overlay.querySelector("#follow-list").innerHTML = "Error loading";
    }
  }

  load();
  return () => {};
}