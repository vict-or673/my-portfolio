const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// --- Register ---
router.post('/register', (req, res) => {
  const { identifier, password, displayName } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      error: 'Email or phone number and password are required'
    });
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(identifier);

  if (existing) {
    return res.status(409).json({
      error: 'A user with that email or phone number already exists'
    });
  }

  const info = db
    .prepare(
      'INSERT INTO users (email, password, display_name) VALUES (?, ?, ?)'
    )
    .run(identifier, password, displayName || '');

  const user = {
    id: info.lastInsertRowid,
    email: identifier,
    displayName: displayName || ''
  };

  const token = jwt.sign(user, JWT_SECRET, {
    expiresIn: '7d'
  });

  res.status(201).json({ user, token });
});


// --- Login ---
router.post('/login', (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      error: 'Email or phone number and password are required'
    });
  }

  const row = db
    .prepare(
      'SELECT id, email, password, display_name FROM users WHERE email = ?'
    )
    .get(identifier);

  if (!row || row.password !== password) {
    return res.status(401).json({
      error: 'Invalid email/phone number or password'
    });
  }

  const user = {
    id: row.id,
    email: row.email,
    displayName: row.display_name
  };

  const token = jwt.sign(user, JWT_SECRET, {
    expiresIn: '7d'
  });

  res.json({ user, token });
});


module.exports = router;