/**
 * 应用配置路由：API / 人设 / 主题 / 锁屏密码
 */
import { Router } from 'express';
import { db } from '../db.js';
import { asyncHandler, HttpError } from '../middleware';

const router = Router();

/** GET /api/v1/config — 获取应用所有配置（Key 不返回原文，用 mask 代替） */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = db.prepare('SELECT key, value FROM config').all() as Array<{
      key: string;
      value: string;
    }>;
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    // 敏感字段做掩码
    if (map.api_key) {
      const k = map.api_key;
      map.api_key = k.length > 8 ? `${k.slice(0, 4)}****${k.slice(-4)}` : '****';
    }
    res.json({ config: map });
  }),
);

/** PUT /api/v1/config — 批量更新配置 */
router.put(
  '/',
  asyncHandler(async (req, res) => {
    const updates = req.body as Record<string, string | undefined>;
    if (!updates || typeof updates !== 'object') {
      throw new HttpError(400, 'Body must be an object');
    }
    const now = Date.now();
    const stmt = db.prepare(
      'INSERT INTO config (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
    );
    const tx = db.transaction((entries: Array<[string, string]>) => {
      for (const [k, v] of entries) stmt.run(k, String(v), now);
    });
    tx(Object.entries(updates).filter(([, v]) => v !== undefined) as Array<[string, string]>);
    res.json({ ok: true });
  }),
);

/** DELETE /api/v1/config/:key — 清除某项配置 */
router.delete(
  '/:key',
  asyncHandler(async (req, res) => {
    db.prepare('DELETE FROM config WHERE key = ?').run(req.params.key);
    res.json({ ok: true });
  }),
);

/** POST /api/v1/config/test-connection — 测试 LLM 连接 */
router.post(
  '/test-connection',
  asyncHandler(async (_req, res) => {
    // 动态导入避免循环
    const { getLlmConfig, chat } = await import('../services/llm');
    const cfg = getLlmConfig(db);
    if (!cfg) throw new HttpError(400, 'LLM 未配置');
    const reply = await chat(cfg, {
      messages: [
        { role: 'system', content: '你是一个测试助手，请用一个词回答。' },
        { role: 'user', content: 'ping' },
      ],
      maxTokens: 16,
      temperature: 0,
    });
    res.json({ ok: true, reply: reply.content });
  }),
);

export default router;
