# Backend

Express + SQLite backend with JWT auth and an example `posts` resource.

## ⚠️ About password storage

As requested, passwords are stored **in plaintext** in the `users` table (see `db.js`
and `routes/auth.js`) — no hashing at all. This means:

- Anyone with read access to `data.sqlite` sees every user's raw password.
- If this is ever public-facing, a single leak exposes credentials directly,
  and since people reuse passwords, the damage isn't limited to your site.

If you want the safe version, the change is small — in `routes/auth.js`:

```js
const bcrypt = require('bcrypt');

// on register:
const hashed = await bcrypt.hash(password, 10);
// store `hashed` instead of `password`

// on login:
const match = await bcrypt.compare(password, row.password);
if (!match) { /* invalid */ }
```

Just say the word and I'll make that swap.

## Setup

```bash
npm install
cp .env.example .env   # then edit JWT_SECRET
npm start               # or: npm run dev
```

Server runs on `http://localhost:3000` by default.

## Endpoints

### Auth
| Method | Path               | Body                        | Auth |
|--------|---------------------|------------------------------|------|
| POST   | /api/auth/register  | `{ email, password }`        | No   |
| POST   | /api/auth/login      | `{ email, password }`        | No   |

Both return `{ user, token }`. Send the token as `Authorization: Bearer <token>`
on protected routes.

### Posts
| Method | Path            | Body                  | Auth |
|--------|------------------|------------------------|------|
| GET    | /api/posts       | -                       | No   |
| GET    | /api/posts/:id   | -                       | No   |
| POST   | /api/posts       | `{ title, body }`       | Yes  |
| PUT    | /api/posts/:id   | `{ title, body }`       | Yes (owner only) |
| DELETE | /api/posts/:id   | -                       | Yes (owner only) |

## Notes

- Data persists to `data.sqlite` in this folder (created automatically on first run).
- CORS is wide open (`cors()` with no options) — restrict `origin` before deploying.
- `JWT_SECRET` defaults to a dev value if `.env` is missing — always set a real one in production.
