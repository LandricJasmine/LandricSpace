/**
 * 日历日程路由
 */
import { Router } from 'express';
import { db } from '../db.js';
import { asyncHandler, HttpError } from '../middleware';

const router = Router();

function rowToEvent(r: Record<string, unknown>) {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? '',
    date: r.date,
    time: r.time,
    location: r.location,
    remind: !!r.remind,
    createdAt: r.created_at,
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = req.query.month as string | undefined; // 2025-01
    const sql = month
      ? "SELECT * FROM calendar_events WHERE substr(date, 1, 7) = ? ORDER BY date, time"
      : 'SELECT * FROM calendar_events ORDER BY date, time';
    const rows = (month ? db.prepare(sql).all(month) : db.prepare(sql).all()) as Array<
      Record<string, unknown>
    >;
    res.json({ events: rows.map(rowToEvent) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { title, date, time, location, remind } = req.body as Record<string, unknown>;
    if (!title || !date) throw new HttpError(400, 'title & date required');
    const now = Date.now();
    const info = db
      .prepare(
        'INSERT INTO calendar_events (title, date, time, location, remind, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        title as string,
        date as string,
        (time as string) ?? '',
        (location as string) ?? '',
        remind ? 1 : 0,
        now,
      );
    const row = db
      .prepare('SELECT * FROM calendar_events WHERE id = ?')
      .get(info.lastInsertRowid) as Record<string, unknown>;
    res.json({ event: rowToEvent(row) });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    db.prepare('DELETE FROM calendar_events WHERE id = ?').run(Number(req.params.id));
    res.json({ ok: true });
  }),
);

export default router;

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { title, description, date, location, reminder_minutes } = req.body as Record<string, unknown>;
    db.prepare(`
      UPDATE calendar_events
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          date = COALESCE(?, date),
          location = COALESCE(?, location),
          remind = COALESCE(?, remind)
      WHERE id = ?
    `).run(
      title as string ?? null,
      description as string ?? null,
      date as string ?? null,
      location as string ?? null,
      reminder_minutes !== undefined ? Number(reminder_minutes) : null,
      Number(req.params.id),
    );
    const row = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(Number(req.params.id)) as Record<string, unknown> | undefined;
    if (!row) { res.status(404).json({ error: 'event not found' }); return; }
    res.json({ event: rowToEvent(row) });
  }),
);
