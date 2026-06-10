/**
 * 商品路由
 */
import { Router } from 'express';
import { db } from '../db.js';
import { asyncHandler, HttpError } from '../middleware';

const router = Router();

function rowToProduct(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    price: r.price,
    category: r.category,
    sales: r.sales,
    imageSeed: r.image_seed,
    createdAt: r.created_at,
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const category = req.query.category as string | undefined;
    const sql = category
      ? 'SELECT * FROM products WHERE category = ? ORDER BY sales DESC'
      : 'SELECT * FROM products ORDER BY sales DESC';
    const rows = (category ? db.prepare(sql).all(category) : db.prepare(sql).all()) as Array<
      Record<string, unknown>
    >;
    res.json({ products: rows.map(rowToProduct) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, price, category, sales, imageSeed } = req.body as Record<string, unknown>;
    if (!name || price === undefined) throw new HttpError(400, 'name & price required');
    const now = Date.now();
    const info = db
      .prepare(
        'INSERT INTO products (name, price, category, sales, image_seed, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        name as string,
        Number(price),
        (category as string) ?? '',
        (sales as number) ?? 0,
        (imageSeed as string) ?? '',
        now,
      );
    const row = db
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(info.lastInsertRowid) as Record<string, unknown>;
    res.json({ product: rowToProduct(row) });
  }),
);

export default router;
