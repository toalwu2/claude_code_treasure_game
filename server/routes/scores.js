const express = require('express');
const db = require('../db');
const { requireAuth } = require('../session');

const router = express.Router();

const VALID_RESULTS = new Set(['win', 'loss', 'tie']);

router.post('/', requireAuth, (req, res) => {
  const { score, result } = req.body || {};
  if (!Number.isInteger(score) || !VALID_RESULTS.has(result)) {
    return res.status(400).json({ error: 'score (integer) and result (win|loss|tie) are required.' });
  }

  const inserted = db
    .prepare('INSERT INTO scores (user_id, score, result) VALUES (?, ?, ?)')
    .run(req.user.id, score, result);

  res.status(201).json({ id: Number(inserted.lastInsertRowid) });
});

router.get('/', requireAuth, (req, res) => {
  const history = db
    .prepare(
      'SELECT id, score, result, created_at FROM scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
    )
    .all(req.user.id);
  const bestRow = db
    .prepare('SELECT MAX(score) AS best FROM scores WHERE user_id = ?')
    .get(req.user.id);

  res.json({ history, best: bestRow.best ?? null });
});

module.exports = router;
