async function request(method, path, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: {},
  };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch('/api' + path, opts);
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  auth: {
    getUser:   ()                        => request('GET',    '/auth/user'),
    login:     (username, password)      => request('POST',   '/auth/login',    { username, password }),
    register:  (username, password, dn)  => request('POST',   '/auth/register', { username, password, displayName: dn || undefined }),
    logout:    ()                        => request('GET',    '/auth/logout'),
  },
  posts: {
    getFeed:      ()           => request('GET',    '/posts'),
    create:       (imageUrl, caption) => request('POST', '/posts', { imageUrl, caption }),
    like:         (id)         => request('POST',   `/posts/${id}/likes`),
    unlike:       (id)         => request('DELETE', `/posts/${id}/likes`),
    getComments:  (id)         => request('GET',    `/posts/${id}/comments`),
    addComment:   (id, content) => request('POST',  `/posts/${id}/comments`, { content }),
  },
  users: {
    search:        (q)        => request('GET',    `/users?q=${encodeURIComponent(q)}`),
    all:           ()         => request('GET',    '/users'),
    getProfile:    (username) => request('GET',    `/users/${username}`),
    getPosts:      (username) => request('GET',    `/users/${username}/posts`),
    follow:        (username) => request('POST',   `/users/${username}/follow`),
    unfollow:      (username) => request('DELETE', `/users/${username}/follow`),
    updateProfile: (data)     => request('PATCH',  '/profile', data),
  },
  messages: {
    getConversations: ()           => request('GET',  '/messages/conversations'),
    getMessages:      (username)   => request('GET',  `/messages/${username}`),
    send:             (username, content) => request('POST', `/messages/${username}`, { content }),
  },
};
