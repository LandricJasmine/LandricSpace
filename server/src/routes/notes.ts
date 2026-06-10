import { Router } from 'express';
import { db } from '../db.js';
import { z } from 'zod';

const router = Router();

function rowToNote(r: Record<string, unknown>) {
  return {
    id: r.id,
    title: r.title || '',
    content: r.content,
    tag: r.tag || '',
    color: r.color || '#B89460',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const NoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, '内容不能为空'),
  tag: z.string().optional(),
  color: z.string().optional(),
});

// GET /api/v1/notes
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM notes ORDER BY created_at DESC').all() as Record<string, unknown>[];
  res.json({ notes: rows.map(rowToNote) });
});

// GET /api/v1/notes/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(Number(req.params.id)) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'not found' }); return; }
  res.json({ note: rowToNote(row) });
});

// POST /api/v1/notes
router.post('/', (req, res) => {
  const { title, content, tag, color } = NoteSchema.parse(req.body);
  const now = new Date().toISOString();
  const result = db.prepare(
    'INSERT INTO notes (title, content, tag, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(title || '', content, tag || '', color || '#B89460', now, now);
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json({ note: rowToNote(row) });
});

// PUT /api/v1/notes  ← 前端发 /notes, body 里有 id
router.put('/', (req, res) => {
  const { title, content, tag, color } = NoteSchema.partial().parse(req.body);
  if (!req.body.id) { res.status(400).json({ error: 'id required' }); return; }
  const id = Number(req.body.id);
  const updates: string[] = [];
  const vals: unknown[] = [];
  if (title !== undefined) { updates.push('title = ?'); vals.push(title); }
  if (content !== undefined) { updates.push('content = ?'); vals.push(content); }
  if (tag !== undefined) { updates.push('tag = ?'); vals.push(tag); }
  if (color !== undefined) { updates.push('color = ?'); vals.push(color); }
  if (!updates.length) { res.status(400).json({ error: 'no fields to update' }); return; }
  updates.push('updated_at = ?');
  vals.push(new Date().toISOString());
  vals.push(id);
  db.prepare(`UPDATE notes SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'not found' }); return; }
  res.json({ note: rowToNote(row) });
});

// DELETE /api/v1/notes/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM notes WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

export default router;
