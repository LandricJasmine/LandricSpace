import { Router } from 'express';
import { db } from '../db.js';
import { getLlmConfig, chat, type ChatMessage } from '../services/llm';

const router = Router();

interface PlanBody {
  city?: string;
  startAt?: string;
  endAt?: string;
  mood?: string;
  companion?: string;
  weatherHint?: string;
}

function readPersonaSummary(): { name: string; speaking_style: string; occupation: string; residence: string } {
  const r = db.prepare('SELECT name, speaking_style, occupation, residence FROM persona ORDER BY id LIMIT 1').get() as any;
  return r ?? { name: '你的角色', speaking_style: '', occupation: '', residence: '' };
}

router.post('/plan', async (req, res) => {
  const cfg = getLlmConfig(db);
  if (!cfg) return res.status(412).json({ error: 'llm_not_configured' });

  const body = (req.body ?? {}) as PlanBody;
  const p = readPersonaSummary();

  const sys = `你是 ${p.name || '你的角色'} 的私人行程秘书。
${p.name ? p.name + '的人设' : '你的人设'}：${p.occupation ?? ''} · 居于 ${p.residence ?? ''}
${p.speaking_style ? '说话风格：' + p.speaking_style : ''}

任务：根据用户的城市、时间窗、情绪、随行人与天气，给出一次贴心周到的出行安排。

要求：
- 严格返回 JSON，不要 Markdown 代码块
- 严格按以下 schema：{"summary":"一句话总结","totalHours":数字,"stops":[{"time":"HH:MM","place":"地点","activity":"做什么","durationMin":数字,"tip":"小贴士","moodTag":"氛围"}],"closing":"落幕一句"}
- 6-8 个 stops，活动有节奏（晨光 / 上午 / 午时 / 午后 / 黄昏 / 夜半）
- 地点符合 ${p.name || '你的角色'} 气质，避开嘈杂，亲近水 / 园林 / 私房菜 / 私人空间
- 出现至少一个"小确幸"细节`;

  const userMsg = `城市：${body.city ?? '上海'}
起：${body.startAt ?? '明日 10:00'}
止：${body.endAt ?? '明日 22:00'}
情绪：${body.mood ?? '想短暂抽离'}
随行：${body.companion ?? '爱人'}
天气：${body.weatherHint ?? '晴，14-21°C'}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: sys },
    { role: 'user', content: userMsg },
  ];

  const llmRes = await chat(cfg, {
    messages,
    temperature: 0.85,
    maxTokens: 1100,
    responseFormat: 'json_object',
  });
  const json = llmRes.content.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  let plan: any = {};
  try { plan = JSON.parse(json); } catch {
    plan = { summary: '一份心意，被风轻放在今夜的窗台。', stops: [], closing: json };
  }
  res.json({ plan });
});

export default router;
