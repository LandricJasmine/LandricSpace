import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get(
  '/',
  (_req, res) => {
    const row = db.prepare('SELECT * FROM wallet WHERE id = 1').get() as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: 'wallet not found' });
      return;
    }
    res.json({ balance: row.balance, currency: row.currency, updatedAt: row.updated_at });
  },
);

router.put(
  '/',
  (req, res) => {
    const { balance } = req.body as { balance?: string | number };
    if (balance === undefined) {
      res.status(400).json({ error: 'balance required' });
      return;
    }
    db.prepare('UPDATE wallet SET balance = ?, updated_at = ? WHERE id = 1')
      .run(String(balance), new Date().toISOString());
    const row = db.prepare('SELECT * FROM wallet WHERE id = 1').get() as Record<string, unknown>;
    res.json({ wallet: { balance: row.balance, currency: row.currency, updatedAt: row.updated_at } });
  },
);

export default router;
