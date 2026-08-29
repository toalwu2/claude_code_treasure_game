const express = require('express');
const { sql } = require('../db');
const { hashPassword, verifyPassword } = require('../crypto');
const asyncHandler = require('../asyncHandler');
const {
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  COOKIE_NAME,
} = require('../session');

const router = express.Router();

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const { rows: existing } = await sql`SELECT id FROM users WHERE username = ${trimmedUsername}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'That username is already taken.' });
    }

    const { salt, hash } = hashPassword(password);
    const { rows } = await sql`
      INSERT INTO users (username, password_hash, password_salt)
      VALUES (${trimmedUsername}, ${hash}, ${salt})
      RETURNING id
    `;

    const userId = rows[0].id;
    const { token, expiresAt } = await createSession(userId);
    setSessionCookie(res, token, expiresAt);
    res.status(201).json({ user: { id: userId, username: trimmedUsername } });
  }),
);

router.post(
  '/signin',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const { rows } = await sql`SELECT * FROM users WHERE username = ${username.trim()}`;
    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const { token, expiresAt } = await createSession(user.id);
    setSessionCookie(res, token, expiresAt);
    res.json({ user: { id: user.id, username: user.username } });
  }),
);

router.post(
  '/signout',
  asyncHandler(async (req, res) => {
    const token = req.cookies && req.cookies[COOKIE_NAME];
    if (token) await destroySession(token);
    clearSessionCookie(res);
    res.status(204).end();
  }),
);

router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not signed in.' });
  }
  res.json({ user: req.user });
});

module.exports = router;
