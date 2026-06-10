/**
 * 钱包 / 交易路由
 */
import { Router } from 'express';
import { db } from '../db.js';
import { asyncHandler, HttpError } from '../middleware';

const router = Router();

function rowToTx(r: Record<string, unknown>) {
  return {
    id: r.id,
    type: r.type,
    amount: r.amount,
    merchant: r.merchant,
    category: r.category,
    createdAt: r.created_at,
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const rows = db
      .prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?')
      .all(limit) as Array<Record<string, unknown>>;
    const balance = db
      .prepare(
        "SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) AS balance FROM transactions",
      )
      .get() as { balance: number };
    res.json({ transactions: rows.map(rowToTx), balance: balance.balance });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { type, amount, merchant, category } = req.body as Record<string, unknown>;
    if (!type || amount === undefined || !merchant) {
      throw new HttpError(400, 'type/amount/merchant required');
    }
    const now = Date.now();
    const info = db
      .prepare(
        'INSERT INTO transactions (type, amount, merchant, category, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run(
        type as string,
        Number(amount),
        merchant as string,
        (category as string) ?? '',
        now,
      );
    const row = db
      .prepare('SELECT * FROM transactions WHERE id = ?')
      .get(info.lastInsertRowid) as Record<string, unknown>;
    res.json({ transaction: rowToTx(row) });
  }),
);

export default router;
