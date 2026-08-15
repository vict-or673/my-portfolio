const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// --- List all posts (public) ---
router.get('/', async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT posts.*, users.email as author FROM posts JOIN users ON posts.user_id = users.id ORDER BY posts.created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// --- Get one post (public) ---
router.get('/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM posts WHERE id = ?',
      args: [req.params.id]
    });
    const post = result.rows[0];
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// --- Create a post (requires auth) ---
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const insertResult = await db.execute({
      sql: 'INSERT INTO posts (user_id, title, body) VALUES (?, ?, ?)',
      args: [req.user.id, title, body || '']
    });

    const result = await db.execute({
      sql: 'SELECT * FROM posts WHERE id = ?',
      args: [Number(insertResult.lastInsertRowid)]
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// --- Update a post (requires auth + ownership) ---
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM posts WHERE id = ?',
      args: [req.params.id]
    });
    const post = result.rows[0];
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not your post' });

    const { title, body } = req.body;
    await db.execute({
      sql: 'UPDATE posts SET title = ?, body = ? WHERE id = ?',
      args: [title ?? post.title, body ?? post.body, req.params.id]
    });

    const updatedResult = await db.execute({
      sql: 'SELECT * FROM posts WHERE id = ?',
      args: [req.params.id]
    });
    res.json(updatedResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// --- Delete a post (requires auth + ownership) ---
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM posts WHERE id = ?',
      args: [req.params.id]
    });
    const post = result.rows[0];
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not your post' });

    await db.execute({
      sql: 'DELETE FROM posts WHERE id = ?',
      args: [req.params.id]
    });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;