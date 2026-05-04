let _user = null;

export const auth = {
  get user()  { return _user; },
  set user(u) { _user = u; },
  get isLoggedIn() { return _user !== null; },
  clear() { _user = null; },
};
