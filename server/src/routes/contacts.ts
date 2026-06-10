/**
 * 通讯录路由
 */
import { Router } from 'express';
import { db } from '../db.js';
import { asyncHandler, HttpError } from '../middleware';

const router = Router();

function rowToContact(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    avatarSeed: r.avatar_seed,
    isAi: !!r.is_ai,
    lastMessage: r.last_message,
    lastTime: r.last_time,
    unreadCount: r.unread_count,
    isPinned: !!r.is_pinned,
    createdAt: r.created_at,
  };
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = db
      .prepare('SELECT * FROM contacts ORDER BY is_pinned DESC, last_time DESC')
      .all() as Array<Record<string, unknown>>;
    res.json({ contacts: rows.map(rowToContact) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, phone, avatarSeed, isAi, lastMessage, isPinned } = req.body as Record<
      string,
      unknown
    >;
    if (!name || !phone) throw new HttpError(400, 'name & phone required');
    const now = Date.now();
    const info = db
      .prepare(
        `INSERT INTO contacts (name, phone, avatar_seed, is_ai, last_message, last_time, unread_count, is_pinned, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      )
      .run(
        name as string,
        phone as string,
        (avatarSeed as string) ?? 'u',
        isAi ? 1 : 0,
        (lastMessage as string) ?? '',
        (lastMessage ? now : 0),
        isPinned ? 1 : 0,
        now,
      );
    const row = db
      .prepare('SELECT * FROM contacts WHERE id = ?')
      .get(info.lastInsertRowid) as Record<string, unknown>;
    res.json({ contact: rowToContact(row) });
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { name, phone, lastMessage, unreadCount, isPinned } = req.body as Record<
      string,
      unknown
    >;
    const now = Date.now();
    db.prepare(
      `UPDATE contacts SET
         name = COALESCE(?, name),
         phone = COALESCE(?, phone),
         last_message = COALESCE(?, last_message),
         last_time = COALESCE(?, last_time),
         unread_count = COALESCE(?, unread_count),
         is_pinned = COALESCE(?, is_pinned)
       WHERE id = ?`,
    ).run(
      name ?? null,
      phone ?? null,
      lastMessage ?? null,
      lastMessage ? now : null,
      unreadCount ?? null,
      isPinned === undefined ? null : isPinned ? 1 : 0,
      id,
    );
    const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) throw new HttpError(404, 'Contact not found');
    res.json({ contact: rowToContact(row) });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    db.prepare('DELETE FROM contacts WHERE id = ?').run(Number(req.params.id));
    res.json({ ok: true });
  }),
);

export default router;
