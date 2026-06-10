/**
 * 消息路由：单条对话的消息流
 */
import { Router } from 'express';
import { db } from '../db.js';
import { asyncHandler, HttpError } from '../middleware';

const router = Router();

function rowToMessage(r: Record<string, unknown>) {
  return {
    id: r.id,
    contactId: r.contact_id,
    role: r.role,
    type: r.type,
    content: r.content,
    meta: JSON.parse((r.meta as string) || '{}'),
    createdAt: r.created_at,
  };
}

router.get(
  '/:contactId',
  asyncHandler(async (req, res) => {
    const contactId = Number(req.params.contactId);
    const rows = db
      .prepare('SELECT * FROM messages WHERE contact_id = ? ORDER BY created_at ASC LIMIT 500')
      .all(contactId) as Array<Record<string, unknown>>;
    res.json({ messages: rows.map(rowToMessage) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { contactId, role, type, content, meta } = req.body as Record<string, unknown>;
    if (!contactId || !role || !content) throw new HttpError(400, 'contactId/role/content required');
    const now = Date.now();
    const info = db
      .prepare(
        'INSERT INTO messages (contact_id, role, type, content, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        contactId as number,
        role as string,
        (type as string) ?? 'text',
        content as string,
        meta ? JSON.stringify(meta) : '{}',
        now,
      );
    // 同步更新 contact 的最后消息
    db.prepare(
      'UPDATE contacts SET last_message = ?, last_time = ? WHERE id = ?',
    ).run(content as string, now, contactId as number);

    const row = db
      .prepare('SELECT * FROM messages WHERE id = ?')
      .get(info.lastInsertRowid) as Record<string, unknown>;
    res.json({ message: rowToMessage(row) });
  }),
);

router.delete(
  '/:contactId',
  asyncHandler(async (req, res) => {
    db.prepare('DELETE FROM messages WHERE contact_id = ?').run(Number(req.params.contactId));
    res.json({ ok: true });
  }),
);

export default router;
