const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// --- Register ---
router.post('/register', async (req, res) => {
  try {
    const { identifier, password, displayName } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        error: 'Email or phone number and password are required'
      });
    }

    const existingResult = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [identifier]
    });

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        error: 'A user with that email or phone number already exists'
      });
    }

    const insertResult = await db.execute({
      sql: 'INSERT INTO users (email, password, display_name) VALUES (?, ?, ?)',
      args: [identifier, password, displayName || '']
    });

    const user = {
      id: Number(insertResult.lastInsertRowid),
      email: identifier,
      displayName: displayName || ''
    };

    const token = jwt.sign(user, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong during registration' });
  }
});


// --- Login ---
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        error: 'Email or phone number and password are required'
      });
    }

    const result = await db.execute({
      sql: 'SELECT id, email, password, display_name FROM users WHERE email = ?',
      args: [identifier]
    });

    const row = result.rows[0];

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong during login' });
  }
});


module.exports = router;