const express = require('express');
const { sql } = require('../db');
const { requireAuth } = require('../session');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

const VALID_RESULTS = new Set(['win', 'loss', 'tie']);

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { score, result } = req.body || {};
    if (!Number.isInteger(score) || !VALID_RESULTS.has(result)) {
      return res
        .status(400)
        .json({ error: 'score (integer) and result (win|loss|tie) are required.' });
    }

    const { rows } = await sql`
      INSERT INTO scores (user_id, score, result)
      VALUES (${req.user.id}, ${score}, ${result})
      RETURNING id
    `;

    res.status(201).json({ id: rows[0].id });
  }),
);

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows: history } = await sql`
      SELECT id, score, result, created_at
      FROM scores
      WHERE user_id = ${req.user.id}
      ORDER BY created_at DESC
      LIMIT 20
    `;
    const { rows: bestRows } = await sql`
      SELECT MAX(score) AS best FROM scores WHERE user_id = ${req.user.id}
    `;

    res.json({ history, best: bestRows[0].best ?? null });
  }),
);

module.exports = router;
