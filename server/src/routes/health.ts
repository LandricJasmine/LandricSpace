import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

function rowToLog(r: Record<string, unknown>) {
  return {
    id: r.id,
    date: r.date,
    steps: r.steps ?? 0,
    heartRate: r.heart_rate ?? 0,
    sleepHours: r.sleep_hours ?? 0,
    weightKg: r.weight_kg ?? 0,
    note: r.note || '',
    createdAt: r.created_at,
  };
}

// GET /api/v1/health  → list all health logs
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM health_logs ORDER BY date DESC LIMIT 60').all() as Record<string, unknown>[];
  res.json({ logs: rows.map(rowToLog) });
});

// POST /api/v1/health  → add a health log
router.post('/', (req, res) => {
  const { date, steps, heart_rate, sleep_hours, weight_kg, note } = req.body as Record<string, unknown>;
  if (!date) { res.status(400).json({ error: 'date required' }); return; }
  const now = new Date().toISOString();
  const result = db.prepare(
    'INSERT INTO health_logs (date, steps, heart_rate, sleep_hours, weight_kg, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(
    date as string,
    steps !== undefined ? Number(steps) : null,
    heart_rate !== undefined ? Number(heart_rate) : null,
    sleep_hours !== undefined ? Number(sleep_hours) : null,
    weight_kg !== undefined ? Number(weight_kg) : null,
    (note as string) || '',
    now,
  );
  const row = db.prepare('SELECT * FROM health_logs WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json({ log: rowToLog(row) });
});

// DELETE /api/v1/health/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM health_logs WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

export default router;
