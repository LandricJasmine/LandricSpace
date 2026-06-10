/**
 * 通用 LLM 生成端点：聊天 / 朋友圈 / 备忘录 / 日记 / 天气 / 日程 / 商品 / 照片描述 / 音乐推荐
 * 前端传 type + context，后端构造 prompt 调 LLM，解析结构化 JSON 返回
 */
import { Router } from 'express';
import { db } from '../db.js';
import { asyncHandler, HttpError } from '../middleware';
import { getLlmConfig, chat } from '../services/llm';

const router = Router();

function getPersonaName(): string {
  const persona = db.prepare('SELECT name FROM persona ORDER BY id DESC LIMIT 1').get() as { name: string } | undefined;
  return persona?.name || '你的角色';
}

/** 各类型生成 prompt 模板与 JSON schema 约束 */
const TEMPLATES: Record<
  string,
  { system: string; jsonExample: string }
> = {
  chat: {
    system:
      '你是伴侣【角色名】。根据人设与对话上下文回复。贴合角色人设的核心特质。回复要简短（1-3 句），每条带细微动作或神态描写（用方括号包裹），不要用 emoji。',
    jsonExample: '{ "type":"text", "text":"...","action":"(动作描写)" }',
  },
  moments: {
    system:
      '扮演【角色名】发一条朋友圈动态。内容要贴合角色人设，包含神态动作、可能搭配 0-3 张图。永远不要用 emoji。',
    jsonExample:
      '{ "content":"...","action":"(动作)","imageCount":0|1|3,"mood":"思考|放松|安静|..."  }',
  },
  notes: {
    system:
      '扮演【角色名】随手写一条备忘录。可贴在任何主题：灵感、阅读摘录、生活感悟、私密独白。内容 30-100 字，不要 emoji。',
    jsonExample: '{ "title":"...","content":"...","tag":"life|work|inspire|secret" }',
  },
  weather_advice: {
    system:
      '扮演【角色名】给爱人今日出行建议。基于天气数据 + 爱人偏好，给 1-2 句温柔的建议，不要 emoji。',
    jsonExample: '{ "advice":"...","action":"(动作)" }',
  },
  calendar_event: {
    system:
      '扮演【角色名】根据用户输入的关键词，主动生成一条日程建议。贴合实际工作/生活场景，给出标题、时间段、地点（可选）。不要 emoji。',
    jsonExample: '{ "title":"...","date":"YYYY-MM-DD","time":"HH:MM","location":"...","remind":true|false }',
  },
  redpacket: {
    system:
      '扮演【角色名】给爱人发一个红包。基于人设（宠溺、深情），生成 1 句红包标题 + 1 句动作描写。红包金额取自 1-200 元的"有寓意"数字（如 5.20 / 13.14 / 88 / 99 / 188）。不要 emoji。',
    jsonExample: '{ "title":"...","amount":13.14,"action":"(动作)" }',
  },
  voice_message: {
    system:
      '扮演【角色名】给爱人发一条语音。给出口语化的 1-2 句台词（更口语、更短促、带点撒娇或低笑），并标注时长（秒数 3-15）。不要 emoji。',
    jsonExample: '{ "text":"...","duration":7 }',
  },
  video_call_request: {
    system:
      '扮演【角色名】主动发起视频通话。给 1 句邀请话术 + 1 句动作描写。不要 emoji。',
    jsonExample: '{ "invite":"...","action":"(动作)" }',
  },
  memory: {
    system:
      '扮演【角色名】主动写入一条关于爱人的记忆。从对话中提取用户提到的重要信息（生日、纪念日、偏好、习惯、家人等），并按重要性（0-1）打分。回复严格用 JSON。',
    jsonExample:
      '{ "category":"identity|preference|anniversary|habit","key":"...","value":"...","importance":0.0-1.0 }',
  },
  search_summary: {
    system:
      '扮演【角色名】对一组搜索结果做整理。给爱人写一段温柔简短的总结（80-150 字），配 3-5 条带标题和链接的引用。不要 emoji。',
    jsonExample:
      '{ "summary":"...","references":[{"title":"...","url":"...","snippet":"..."}] }',
  },
};

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { type, context, system: customSystem, maxTokens } = req.body as {
      type: string;
      context?: unknown;
      system?: string;
      maxTokens?: number;
    };
    if (!type) throw new HttpError(400, 'type is required');
    const tmpl = TEMPLATES[type];
    if (!tmpl && !customSystem) {
      throw new HttpError(400, `Unknown type: ${type}. Available: ${Object.keys(TEMPLATES).join(', ')}`);
    }

    const cfg = getLlmConfig(db);
    if (!cfg) {
      throw new HttpError(
        400,
        'LLM 未配置。请先在「设置 → API 配置」中填写 Base URL / API Key / Model 后再使用。',
      );
    }

    // 读人设
    const personaRow = db.prepare('SELECT * FROM persona ORDER BY id DESC LIMIT 1').get() as
      | Record<string, unknown>
      | undefined;
    const personaName = personaRow?.name as string | undefined || '你的角色';

    const systemPrompt =
      customSystem ??
      [
        tmpl!.system.replace('【角色名】', personaName),
        '',
        '【人设】',
        `名字：${personaName}`,
        `描述：${personaRow?.description ?? ''}`,
        `性格关键词：${personaRow?.traits ?? '[]'}`,
        '',
        '【严格回复格式】',
        `只输出一个 JSON 对象，不要任何解释、不要 markdown 代码块、不要前缀。形如：`,
        tmpl!.jsonExample,
      ].join('\n');

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: JSON.stringify(context ?? {}) },
    ];

    const reply = await chat(cfg, {
      messages,
      maxTokens: maxTokens ?? 512,
      temperature: 0.9,
      responseFormat: 'json_object',
    });

    // 尝试解析 JSON
    const raw = reply.content.trim();
    let parsed: unknown = raw;
    // 兼容 LLM 输出 ```json ... ``` 的情况
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        // 保留原文
      }
    }

    res.json({ type, result: parsed, raw });
  }),
);

export default router;
