'use client';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
export const AUTH_SESSION_EVENT = 'taskflow-auth-session-changed';

export type SessionUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
};

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
}

function emitSessionChange() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export function getSessionToken() {
  return getStorage()?.getItem(TOKEN_KEY) ?? null;
}

export function getSessionUser() {
  const rawUser = getStorage()?.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as SessionUser;
  } catch {
    clearSession();
    return null;
  }
}

export function setSession(token: string, user: SessionUser) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
  emitSessionChange();
}

export function updateSessionUser(user: SessionUser) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const token = storage.getItem(TOKEN_KEY);

  if (!token) {
    return;
  }

  storage.setItem(USER_KEY, JSON.stringify(user));
  emitSessionChange();
}

export function clearSession() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(TOKEN_KEY);
  storage.removeItem(USER_KEY);
  emitSessionChange();
}

export function hasActiveSession() {
  return Boolean(getSessionToken());
}
