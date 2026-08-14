const db = require('./db');

const post = db.prepare(`
  INSERT INTO posts (user_id, title, body)
  VALUES (?, ?, ?)
`).run(
  1,
  'My first post',
  'Hello! This is my first post from SQLite.'
);

console.log('Post created with ID:', post.lastInsertRowid);

db.close();