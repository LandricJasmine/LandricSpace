/**
 * 工具调用路由：天气 / 地图（这里只做接口预留与 LLM prompt 注入）
 * 真实地图/天气需要外部 API key，在配置里填
 */
import { Router } from 'express';
import { db } from '../db.js';
import { asyncHandler, HttpError } from '../middleware';
import { getLlmConfig, chat } from '../services/llm';

const router = Router();

/** 简单工具：基于当前时间/季节给天气（无外部 API 时的兜底） */
function getMockWeather(city: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const hour = now.getHours();
  let baseTemp = 18;
  if (month >= 6 && month <= 9) baseTemp = 28;
  else if (month >= 12 || month <= 2) baseTemp = 8;
  else if (month >= 3 && month <= 5) baseTemp = 20;
  else baseTemp = 16;
  const isDay = hour >= 6 && hour < 18;
  return {
    city,
    temperature: baseTemp,
    condition: isDay ? '多云转晴' : '夜间微凉',
    humidity: 62,
    windSpeed: 8,
    visibility: 12,
    uv: isDay ? '中等' : '无',
    airQuality: '良',
    updatedAt: now.getTime(),
  };
}

/** GET /api/v1/tools/weather?city=... — 获取天气 */
router.get(
  '/weather',
  asyncHandler(async (req, res) => {
    const city = (req.query.city as string) || '上海';
    // 真实场景：调用高德/和风天气 API；这里先 mock + LLM 给出建议
    const weather = getMockWeather(city);
    res.json({ weather });
  }),
);

/** POST /api/v1/tools/weather-advice — 让【角色名】基于天气给建议（走 LLM） */
router.post(
  '/weather-advice',
  asyncHandler(async (req, res) => {
    const { city, weather } = req.body as Record<string, unknown>;
    const cfg = getLlmConfig(db);
    if (!cfg) throw new HttpError(400, 'LLM 未配置');

    // 获取人设名
    const personaRow = db.prepare('SELECT name FROM persona ORDER BY id DESC LIMIT 1').get() as { name: string } | undefined;
    const personaName = personaRow?.name || '你的角色';

    const reply = await chat(cfg, {
      messages: [
        {
          role: 'system',
          content:
            `你是${personaName}。结合天气给爱人 1-2 句温柔低沉的出行建议。要贴合角色偏好。返回 JSON：{ "advice":"...", "action":"(动作)" }，不要 markdown 代码块。`,
        },
        {
          role: 'user',
          content: JSON.stringify({ city: city ?? '上海', weather: weather ?? getMockWeather('上海') }),
        },
      ],
      responseFormat: 'json_object',
      maxTokens: 256,
    });
    const raw = reply.content;
    const match = raw.match(/\{[\s\S]*\}/);
    let parsed: unknown = raw;
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        /* keep raw */
      }
    }
    res.json({ advice: parsed, raw });
  }),
);

/** GET /api/v1/tools/poi?keyword=... — POI 搜索（mock） */
router.get(
  '/poi',
  asyncHandler(async (req, res) => {
    const keyword = (req.query.keyword as string) || '';
    res.json({
      pois: [
        { name: `${keyword} · 浅水湾店`, distance: '320m', type: 'poi' },
        { name: `${keyword} · 檀宫店`, distance: '1.2km', type: 'poi' },
      ],
    });
  }),
);

export default router;
