const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// --- List all posts (public) ---
router.get('/', (req, res) => {
  const posts = db
    .prepare('SELECT posts.*, users.email as author FROM posts JOIN users ON posts.user_id = users.id ORDER BY posts.created_at DESC')
    .all();
  res.json(posts);
});

// --- Get one post (public) ---
router.get('/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// --- Create a post (requires auth) ---
router.post('/', requireAuth, (req, res) => {
  const { title, body } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const info = db
    .prepare('INSERT INTO posts (user_id, title, body) VALUES (?, ?, ?)')
    .run(req.user.id, title, body || '');

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(post);
});

// --- Update a post (requires auth + ownership) ---
router.put('/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not your post' });

  const { title, body } = req.body;
  db.prepare('UPDATE posts SET title = ?, body = ? WHERE id = ?')
    .run(title ?? post.title, body ?? post.body, req.params.id);

  const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// --- Delete a post (requires auth + ownership) ---
router.delete('/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not your post' });

  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
