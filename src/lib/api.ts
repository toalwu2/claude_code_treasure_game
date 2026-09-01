export interface AuthUser {
  id: number;
  username: string;
}

export type GameResult = 'win' | 'loss' | 'tie';

export interface ScoreRecord {
  id: number;
  score: number;
  result: GameResult;
  created_at: string;
}

// Same-origin '/api' works on Vercel and in local dev (proxied by Vite). A
// statically-hosted build (e.g. GitHub Pages) has no backend of its own, so
// it needs an absolute URL to reach the API deployed elsewhere.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && typeof body.error === 'string') message = body.error;
    } catch {
      // response wasn't JSON (e.g. the dev proxy couldn't reach the API server)
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function fetchCurrentUser() {
  return request<{ user: AuthUser }>('/auth/me');
}

export function signUp(username: string, password: string) {
  return request<{ user: AuthUser }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function signIn(username: string, password: string) {
  return request<{ user: AuthUser }>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function signOut() {
  return request<void>('/auth/signout', { method: 'POST' });
}

export function submitScore(score: number, result: GameResult) {
  return request<{ id: number }>('/scores', {
    method: 'POST',
    body: JSON.stringify({ score, result }),
  });
}

export function fetchScoreHistory() {
  return request<{ history: ScoreRecord[]; best: number | null }>('/scores');
}
