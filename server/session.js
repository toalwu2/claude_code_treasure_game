const { sql } = require('./db');
const { createToken } = require('./crypto');
const asyncHandler = require('./asyncHandler');

const COOKIE_NAME = 'session_token';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function createSession(userId) {
  const token = createToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await sql`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (${token}, ${userId}, ${expiresAt.toISOString()})
  `;
  return { token, expiresAt };
}

async function destroySession(token) {
  await sql`DELETE FROM sessions WHERE token = ${token}`;
}

function setSessionCookie(res, token, expiresAt) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    // 'None' is required for the cookie to be sent on cross-site requests
    // (e.g. a GitHub Pages-hosted frontend calling this API on Vercel); it
    // requires 'secure', which is only true in production, so dev keeps
    // 'lax' (same-origin via the Vite proxy anyway).
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    expires: expiresAt,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

// Looks up the session cookie (if any) and attaches req.user; never blocks the request.
const attachUser = asyncHandler(async (req, res, next) => {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return next();

  const { rows } = await sql`
    SELECT users.id AS id, users.username AS username, sessions.expires_at AS expires_at
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = ${token}
  `;
  const row = rows[0];
  if (!row) return next();

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await destroySession(token);
    return next();
  }

  req.user = { id: row.id, username: row.username };
  req.sessionToken = token;
  next();
});

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Sign in required.' });
  }
  next();
}

module.exports = {
  COOKIE_NAME,
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  attachUser,
  requireAuth,
};
