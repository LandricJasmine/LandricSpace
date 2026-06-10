/**
 * 相册路由
 * GET  /api/v1/photos                  列表
 * POST /api/v1/photos                  新增元数据（仅字段）
 * POST /api/v1/photos/upload           真实相册上传（FormData: image, location, takenAt, isFavorite）
 * POST /api/v1/photos/:id/favorite     收藏/取消
 * DELETE /api/v1/photos/:id            删除
 */
import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { db } from '../db.js';
import { asyncHandler, HttpError } from '../middleware';

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads', 'photos');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 30 * 1024 * 1024 } });

function rowToPhoto(r: Record<string, unknown>) {
  return {
    id: r.id,
    imageSeed: r.image_seed,
    imageUrl: r.image_seed,
    takenAt: r.taken_at,
    location: r.location,
    isFavorite: !!r.is_favorite,
    createdAt: r.created_at,
  };
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = db
      .prepare('SELECT * FROM photos ORDER BY taken_at DESC')
      .all() as Array<Record<string, unknown>>;
    res.json({ photos: rows.map(rowToPhoto) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { imageSeed, takenAt, location, isFavorite } = req.body as Record<string, unknown>;
    const now = Date.now();
    const info = db
      .prepare(
        'INSERT INTO photos (image_seed, taken_at, location, is_favorite, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run(
        (imageSeed as string) ?? `seed-${now}`,
        (takenAt as number) ?? now,
        (location as string) ?? '',
        isFavorite ? 1 : 0,
        now,
      );
    const row = db
      .prepare('SELECT * FROM photos WHERE id = ?')
      .get(info.lastInsertRowid) as Record<string, unknown>;
    res.json({ photo: rowToPhoto(row) });
  }),
);

router.post(
  '/:id/favorite',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const row = db.prepare('SELECT * FROM photos WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) throw new HttpError(404, 'Photo not found');
    db.prepare('UPDATE photos SET is_favorite = ? WHERE id = ?').run(row.is_favorite ? 0 : 1, id);
    const fresh = db.prepare('SELECT * FROM photos WHERE id = ?').get(id) as Record<
      string,
      unknown
    >;
    res.json({ photo: rowToPhoto(fresh) });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    db.prepare('DELETE FROM photos WHERE id = ?').run(Number(req.params.id));
    res.json({ ok: true });
  }),
);

/**
 * 真实相册上传：FormData: image(file), location, takenAt, isFavorite
 * 返回公网可访问 URL（在本机端口 9091 直接静态托管）
 */
router.post(
  '/upload',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'image field is required');
    const now = Date.now();
    const url = `${req.protocol}://${req.get('host')}/uploads/photos/${req.file.filename}`;
    const info = db
      .prepare(
        'INSERT INTO photos (image_seed, taken_at, location, is_favorite, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run(
        url,
        Number(req.body.takenAt) || now,
        (req.body.location as string) ?? '',
        req.body.isFavorite === '1' || req.body.isFavorite === 'true' ? 1 : 0,
        now,
      );
    const row = db
      .prepare('SELECT * FROM photos WHERE id = ?')
      .get(info.lastInsertRowid) as Record<string, unknown>;
    res.json({ photo: rowToPhoto(row) });
  }),
);

export default router;
