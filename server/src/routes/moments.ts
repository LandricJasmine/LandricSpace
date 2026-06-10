/**
 * 朋友圈 / 动态路由
 */
import { Router } from 'express';
import { db } from '../db.js';
import { asyncHandler, HttpError } from '../middleware';

const router = Router();

function rowToMoment(r: Record<string, unknown>) {
  return {
    id: r.id,
    author: r.author,
    avatarSeed: r.avatar_seed,
    content: r.content,
    imageCount: r.image_count,
    imageSeed: r.image_seed,
    likeCount: r.like_count,
    commentCount: r.comment_count,
    isLiked: !!r.is_liked,
    createdAt: r.created_at,
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const rows = db
      .prepare('SELECT * FROM moments ORDER BY created_at DESC LIMIT ?')
      .all(limit) as Array<Record<string, unknown>>;
    res.json({ moments: rows.map(rowToMoment) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { author, avatarSeed, content, imageCount, imageSeed, likeCount, commentCount } =
      req.body as Record<string, unknown>;
    if (!content) throw new HttpError(400, 'content required');

    // 获取人设信息
    const personaRow = db.prepare('SELECT name, avatar_seed FROM persona ORDER BY id LIMIT 1').get() as { name: string; avatar_seed: string } | undefined;

    const now = Date.now();
    const info = db
      .prepare(
        `INSERT INTO moments (author, avatar_seed, content, image_count, image_seed, like_count, comment_count, is_liked, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      )
      .run(
        (author as string) ?? personaRow?.name ?? '',
        (avatarSeed as string) ?? personaRow?.avatar_seed ?? 'ai',
        content as string,
        (imageCount as number) ?? 0,
        (imageSeed as string) ?? '',
        (likeCount as number) ?? 0,
        (commentCount as number) ?? 0,
        now,
      );
    const row = db
      .prepare('SELECT * FROM moments WHERE id = ?')
      .get(info.lastInsertRowid) as Record<string, unknown>;
    res.json({ moment: rowToMoment(row) });
  }),
);

router.post(
  '/:id/like',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const row = db.prepare('SELECT * FROM moments WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) throw new HttpError(404, 'Moment not found');
    const isLiked = row.is_liked ? 0 : 1;
    const newCount = isLiked ? (row.like_count as number) + 1 : (row.like_count as number) - 1;
    db.prepare('UPDATE moments SET is_liked = ?, like_count = ? WHERE id = ?').run(
      isLiked,
      newCount,
      id,
    );
    const fresh = db.prepare('SELECT * FROM moments WHERE id = ?').get(id) as Record<
      string,
      unknown
    >;
    res.json({ moment: rowToMoment(fresh) });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    db.prepare('DELETE FROM moments WHERE id = ?').run(Number(req.params.id));
    res.json({ ok: true });
  }),
);

export default router;
