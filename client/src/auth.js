import { useState } from "react";

const STORAGE_KEY = "janmashtami_admin_session";

// Session shape: { token, name, email }
export function getAdminSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
}

export function setAdminSession(session) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

// Small hook used anywhere the UI needs to know whether an admin is
// logged in (navbar link/logout, showing the "Add Contributor" button).
export function useAdminAuth() {
  const [admin, setAdmin] = useState(() => getAdminSession());

  function logout() {
    clearAdminSession();
    setAdmin(null);
  }

  return {
    admin,
    isAdmin: Boolean(admin?.token),
    logout
  };
}
