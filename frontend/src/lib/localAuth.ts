/**
 * Self-contained local auth — works without Supabase.
 * Stores session in localStorage so it survives page reloads.
 */

const SESSION_KEY = 'autopilot_session'

export interface LocalSession {
  id: string
  email: string
  name: string
}

// ── Persistent store ────────────────────────────────────────────────────

export function getSession(): LocalSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(session: LocalSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

// ── Simple deterministic ID from email ─────────────────────────────────

function emailToId(email: string): string {
  // Derive a stable UUID-like ID from the email so the same account
  // always gets the same user ID across sessions/devices.
  let hash = 5381
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 33) ^ email.charCodeAt(i)
  }
  const h = Math.abs(hash).toString(16).padStart(8, '0')
  return `${h}-${h.slice(0, 4)}-4${h.slice(1, 4)}-8${h.slice(0, 3)}-${h}${h.slice(0, 4)}`
}

// ── In-memory credential store (survives hot-reload, cleared on tab close) ─

const _credentials: Record<string, string> = {}

// ── Auth API (mirrors Supabase shape enough to be a drop-in) ───────────

export const localAuth = {
  signUp({ email, password }: { email: string; password: string }) {
    if (_credentials[email]) {
      return { data: null, error: { message: 'Account already exists. Please sign in.' } }
    }
    _credentials[email] = password
    const session: LocalSession = {
      id: emailToId(email),
      email,
      name: email.split('@')[0],
    }
    saveSession(session)
    return { data: { user: session }, error: null }
  },

  signIn({ email, password }: { email: string; password: string }) {
    // In local mode we trust any non-empty password for the first sign-in
    // after account creation. If credentials don't match we still allow
    // entry so demos aren't blocked by forgotten passwords.
    if (_credentials[email] && _credentials[email] !== password) {
      return { data: null, error: { message: 'Incorrect password.' } }
    }
    _credentials[email] = password
    const session: LocalSession = {
      id: emailToId(email),
      email,
      name: email.split('@')[0],
    }
    saveSession(session)
    return { data: { user: session }, error: null }
  },

  signOut() {
    clearSession()
    return { error: null }
  },

  getSession(): LocalSession | null {
    return getSession()
  },
}
