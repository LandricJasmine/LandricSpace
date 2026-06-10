import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const dbPath = path.join(DATA_DIR, 'landricos.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS persona (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL DEFAULT '',
  description   TEXT    NOT NULL DEFAULT '',
  traits        TEXT    NOT NULL DEFAULT '[]',
  importance     INTEGER NOT NULL DEFAULT 3,
  avatar_seed   TEXT    NOT NULL DEFAULT 'ai',
  updated_at    INTEGER NOT NULL,
  age           INTEGER NOT NULL DEFAULT 0,
  birthday      TEXT    NOT NULL DEFAULT '',
  birthplace    TEXT    NOT NULL DEFAULT '',
  residence     TEXT    NOT NULL DEFAULT '',
  current_mood  TEXT    NOT NULL DEFAULT '',
  occupation    TEXT    NOT NULL DEFAULT '',
  family        TEXT    NOT NULL DEFAULT '',
  background    TEXT    NOT NULL DEFAULT '',
  speaking_style TEXT   NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS contacts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  relation      TEXT    NOT NULL DEFAULT '',
  phone         TEXT    NOT NULL DEFAULT '',
  avatar_seed   TEXT    NOT NULL DEFAULT '',
  note          TEXT    NOT NULL DEFAULT '',
  is_default    INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id    INTEGER NOT NULL,
  role          TEXT    NOT NULL,
  content       TEXT    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'done',
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS moments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id    INTEGER NOT NULL,
  content       TEXT    NOT NULL,
  image_seed    TEXT    NOT NULL DEFAULT '',
  likes         INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  content       TEXT    NOT NULL DEFAULT '',
  tag           TEXT    NOT NULL DEFAULT '',
  pinned        INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  description   TEXT    NOT NULL DEFAULT '',
  start_at      INTEGER NOT NULL,
  end_at        INTEGER NOT NULL DEFAULT 0,
  location      TEXT    NOT NULL DEFAULT '',
  category      TEXT    NOT NULL DEFAULT '',
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT    NOT NULL,
  amount        REAL    NOT NULL,
  merchant      TEXT    NOT NULL DEFAULT '',
  category      TEXT    NOT NULL DEFAULT '',
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  price         REAL    NOT NULL DEFAULT 0,
  category      TEXT    NOT NULL DEFAULT '',
  sales         INTEGER NOT NULL DEFAULT 0,
  image_seed    TEXT    NOT NULL DEFAULT '',
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  image_seed    TEXT    NOT NULL DEFAULT '',
  taken_at      INTEGER NOT NULL DEFAULT 0,
  location      TEXT    NOT NULL DEFAULT '',
  is_favorite   INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS music (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  artist        TEXT    NOT NULL DEFAULT '',
  album         TEXT    NOT NULL DEFAULT '',
  duration_sec  INTEGER NOT NULL DEFAULT 0,
  cover_seed    TEXT    NOT NULL DEFAULT '',
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS health_logs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  date         TEXT    NOT NULL,
  steps        INTEGER,
  heart_rate   INTEGER,
  sleep_hours  REAL,
  weight_kg    REAL,
  note         TEXT    NOT NULL DEFAULT '',
  created_at   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS wallet (
  id         INTEGER PRIMARY KEY,
  balance    REAL    NOT NULL DEFAULT 0,
  currency   TEXT    NOT NULL DEFAULT 'CNY',
  updated_at TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS config (
  key           TEXT    PRIMARY KEY,
  value         TEXT    NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS mood_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  source          TEXT    NOT NULL DEFAULT 'manual',
  ref_id          INTEGER NOT NULL DEFAULT 0,
  primary_label   TEXT    NOT NULL DEFAULT '',
  primary_zh      TEXT    NOT NULL DEFAULT '',
  secondary_zh    TEXT    NOT NULL DEFAULT '',
  valence         REAL    NOT NULL DEFAULT 0,
  arousal         REAL    NOT NULL DEFAULT 0,
  intensity       REAL    NOT NULL DEFAULT 0.5,
  spectrum        TEXT    NOT NULL DEFAULT 'G',
  color_tag       TEXT    NOT NULL DEFAULT '#E0D4B8',
  constellation   TEXT    NOT NULL DEFAULT '',
  note            TEXT    NOT NULL DEFAULT '',
  raw_text        TEXT    NOT NULL DEFAULT '',
  created_at      INTEGER NOT NULL
);
`;

db.exec(SCHEMA);

// 兼容老库：缺列就补
const migrations = [
  `ALTER TABLE persona ADD COLUMN age INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE persona ADD COLUMN birthday TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE persona ADD COLUMN birthplace TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE persona ADD COLUMN residence TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE persona ADD COLUMN current_mood TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE persona ADD COLUMN occupation TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE persona ADD COLUMN family TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE persona ADD COLUMN background TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE persona ADD COLUMN speaking_style TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE mood_events ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'`,
  `ALTER TABLE mood_events ADD COLUMN ref_id INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE mood_events ADD COLUMN primary_label TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE mood_events ADD COLUMN primary_zh TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE mood_events ADD COLUMN secondary_zh TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE mood_events ADD COLUMN valence REAL NOT NULL DEFAULT 0`,
  `ALTER TABLE mood_events ADD COLUMN arousal REAL NOT NULL DEFAULT 0`,
  `ALTER TABLE mood_events ADD COLUMN intensity REAL NOT NULL DEFAULT 0.5`,
  `ALTER TABLE mood_events ADD COLUMN spectrum TEXT NOT NULL DEFAULT 'G'`,
  `ALTER TABLE mood_events ADD COLUMN color_tag TEXT NOT NULL DEFAULT '#E0D4B8'`,
  `ALTER TABLE mood_events ADD COLUMN constellation TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE mood_events ADD COLUMN note TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE mood_events ADD COLUMN raw_text TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE calendar_events ADD COLUMN description TEXT NOT NULL DEFAULT ''`,
];
for (const m of migrations) {
  try { db.exec(m); } catch {}
}

// Wallet seed
try {
  db.exec(`INSERT OR IGNORE INTO wallet (id, balance, currency, updated_at) VALUES (1, 0, 'CNY', '${new Date().toISOString()}')`);
} catch {}
