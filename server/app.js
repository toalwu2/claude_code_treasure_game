const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { ensureSchema } = require('./db');
const { attachUser } = require('./session');
const authRoutes = require('./routes/auth');
const scoreRoutes = require('./routes/scores');

const app = express();

// Only needed when the frontend is hosted separately from this API (e.g. the
// static build on GitHub Pages calling the Vercel deployment) — same-origin
// requests (Vercel-hosted frontend, local dev via the Vite proxy) don't hit
// this at all. Comma-separated list, e.g. "https://<user>.github.io".
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
if (allowedOrigins.length > 0) {
  app.use(cors({ origin: allowedOrigins, credentials: true }));
}

app.use(express.json());
app.use(cookieParser());

// Cheap after the first call in a warm instance/process (see db.js).
app.use((req, res, next) => {
  ensureSchema().then(() => next(), next);
});

app.use(attachUser);

app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);

// On Vercel, static assets in build/ are served directly by the platform, not
// this function. Self-hosting only applies when running as a traditional
// long-lived server (e.g. `npm start` outside Vercel).
if (!process.env.VERCEL) {
  const buildDir = path.join(__dirname, '..', 'build');
  if (fs.existsSync(buildDir)) {
    app.use(express.static(buildDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(buildDir, 'index.html'));
    });
  }
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

module.exports = app;
