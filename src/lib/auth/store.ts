import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

export const SESSION_SECONDS = 60 * 60 * 24 * 7;
const WINDOW_MS = 15 * 60 * 1000;
const digest = (value: string) => createHash('sha256').update(value).digest('hex');

function passwordHash(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 1 << 17, r: 8, p: 1, maxmem: 192 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export function openAccounts(filename: string) {
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS attempts_expiry ON attempts(expires);
    CREATE INDEX IF NOT EXISTS session_expiry ON sessions(expires);
  `);

  function startSession(userId: number | bigint) {
    const token = randomBytes(32).toString('base64url');
    db.prepare('DELETE FROM sessions WHERE expires <= ?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(digest(token), userId, Date.now() + SESSION_SECONDS * 1000);
    return token;
  }

  return {
    async authenticate(mode: 'signup' | 'login', form: FormData) {
      const field = (key: string) => {
        const value = form.get(key);
        return typeof value === 'string' ? value : '';
      };
      const email = field('email').trim().toLowerCase();
      const password = field('password');
      const name = field('username').trim();
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };
      if (password.length < 8 || password.length > 128) return { error: 'Use a password between 8 and 128 characters.' };
      if (mode === 'signup') {
        if (name.length < 3 || name.length > 30) return { error: 'Use a username between 3 and 30 characters.' };
        if (password !== field('confirmPassword')) return { error: 'The passwords do not match.' };
      }

      const key = digest(mode + ':' + email);
      const now = Date.now();
      db.prepare('DELETE FROM attempts WHERE expires <= ?').run(now);
      const attempt = db.prepare(`INSERT INTO attempts VALUES (?, 1, ?) ON CONFLICT(key)
        DO UPDATE SET count = count + 1 RETURNING count`).get(key, now + WINDOW_MS);
      if (Number(attempt?.count) > 10) return { error: 'Too many attempts. Try again in 15 minutes.' };

      if (mode === 'signup') {
        const salt = randomBytes(16).toString('hex');
        const hash = await passwordHash(password, salt);
        db.exec('BEGIN IMMEDIATE');
        try {
          const user = db.prepare(`INSERT INTO users (email, name, salt, hash) VALUES (?, ?, ?, ?)
            ON CONFLICT(email) DO NOTHING`).run(email, name, salt, hash.toString('hex'));
          if (!user.changes) {
            db.exec('ROLLBACK');
            return { error: 'Unable to create an account with these details. Try signing in.' };
          }
          const token = startSession(user.lastInsertRowid);
          db.exec('COMMIT');
          return { token };
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
      }

      const user = db.prepare('SELECT id, salt, hash FROM users WHERE email = ?').get(email);
      const hash = await passwordHash(password, String(user?.salt ?? 'absent-account'));
      if (!user || !timingSafeEqual(hash, Buffer.from(String(user.hash), 'hex'))) {
        return { error: 'Email or password is incorrect.' };
      }
      db.prepare('DELETE FROM attempts WHERE key = ?').run(key);
      return { token: startSession(Number(user.id)) };
    },
    user(token: string) {
      const row = db.prepare(`SELECT users.name FROM sessions JOIN users ON users.id = sessions.user_id
        WHERE token_hash = ? AND expires > ?`).get(digest(token), Date.now());
      return row ? { name: String(row.name) } : null;
    },
    revoke(token: string) { db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(digest(token)); },
    close() { db.close(); },
  };
}
