/**
 * 情绪 OS —— ACHERNAR · EPSILON 航行日志
 *
 * 设计：
 *  - 严肃的双轴情绪坐标（Russell: 效价 valence -1~1 / 唤起度 arousal -1~1）
 *  - 后端负责：
 *    1) 记录源数据：对话 / 备忘 / 日历 / 手动（manual）
 *    2) LLM 提取情绪事件 → 写到 mood_events
 *    3) 聚合星体读数（光谱/光度/引力场/磁场/辐射）
 *  - 前端把数据画成"宇宙飞船控制台"
 */
import { Router } from 'express';
import { db } from '../db.js';
import { asyncHandler } from '../middleware';
import { getLlmConfig, chat, type ChatMessage } from '../services/llm';

const router = Router();

interface MoodRow {
  id: number;
  source: string;
  ref_id: number;
  primary_label: string;
  primary_zh: string;
  secondary_zh: string;
  valence: number;
  arousal: number;
  intensity: number;
  spectrum: string;
  color_tag: string;
  constellation: string;
  note: string;
  raw_text: string;
  created_at: number;
}

function rowToEvent(r: MoodRow) {
  return {
    id: r.id,
    source: r.source,
    refId: r.ref_id,
    primaryLabel: r.primary_label,
    primaryZh: r.primary_zh,
    secondaryZh: r.secondary_zh,
    valence: r.valence,
    arousal: r.arousal,
    intensity: r.intensity,
    spectrum: r.spectrum,
    colorTag: r.color_tag,
    constellation: r.constellation,
    note: r.note,
    rawText: r.raw_text,
    createdAt: r.created_at,
  };
}

/* === 来源扫描：取最近 N 天内的对话 / 备忘 / 日历事件 === */
function gatherSources(): {
  conversation: Array<{ id: number; text: string; at: number }>;
  notes: Array<{ id: number; text: string; at: number }>;
  calendar: Array<{ id: number; text: string; at: number }>;
} {
  const since = Date.now() - 7 * 24 * 3600 * 1000;

  const conversation = (db
    .prepare(
      `SELECT m.id, m.content AS text, m.created_at AS at
       FROM messages m
       WHERE m.created_at >= ?
       ORDER BY m.id DESC
       LIMIT 40`
    )
    .all(since) as Array<{ id: number; text: string; at: number }>).map((x) => ({
    id: x.id,
    text: x.text,
    at: x.at,
  }));

  const notes = (db
    .prepare(
      `SELECT id, title || ' ' || content AS text, updated_at AS at
       FROM notes
       WHERE updated_at >= ?
       ORDER BY updated_at DESC
       LIMIT 20`
    )
    .all(since) as Array<{ id: number; text: string; at: number }>).map((x) => ({
    id: x.id,
    text: x.text,
    at: x.at,
  }));

  const calendar = (db
    .prepare(
      `SELECT id, title || ' ' || description AS text, start_at AS at
       FROM calendar_events
       WHERE start_at >= ?
       ORDER BY start_at DESC
       LIMIT 20`
    )
    .all(since) as Array<{ id: number; text: string; at: number }>).map((x) => ({
    id: x.id,
    text: x.text,
    at: x.at,
  }));

  return { conversation, notes, calendar };
}

/* === 列表 === */
router.get(
  '/events',
  asyncHandler(async (req, res) => {
    const days = Math.max(1, Math.min(180, Number(req.query.days) || 60));
    const since = Date.now() - days * 24 * 3600 * 1000;
    const rows = db
      .prepare(
        `SELECT * FROM mood_events
         WHERE created_at >= ?
         ORDER BY created_at ASC`
      )
      .all(since) as MoodRow[];
    res.json({ ok: true, events: rows.map(rowToEvent) });
  })
);

/* === 手动写入 === */
router.post(
  '/events',
  asyncHandler(async (req, res) => {
    const b = req.body as Partial<MoodRow>;
    const r = db
      .prepare(
        `INSERT INTO mood_events (
          source, ref_id, primary_label, primary_zh, secondary_zh,
          valence, arousal, intensity, spectrum, color_tag,
          constellation, note, raw_text, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        b.source ?? 'manual',
        b.ref_id ?? 0,
        b.primary_label ?? '',
        b.primary_zh ?? '',
        b.secondary_zh ?? '',
        Number(b.valence ?? 0),
        Number(b.arousal ?? 0),
        Number(b.intensity ?? 0.5),
        b.spectrum ?? 'G',
        b.color_tag ?? '#E0D4B8',
        b.constellation ?? '',
        b.note ?? '',
        b.raw_text ?? '',
        Date.now()
      );
    res.json({ ok: true, id: Number(r.lastInsertRowid) });
  })
);

/* === 删除 === */
router.delete(
  '/events/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    db.prepare(`DELETE FROM mood_events WHERE id = ?`).run(id);
    res.json({ ok: true });
  })
);

/* === 扫描：调 LLM 分析最近对话 / 备忘 / 日历，抽出情绪事件并写库 === */
router.post(
  '/scan',
  asyncHandler(async (_req, res) => {
    const cfg = getLlmConfig(db);
    if (!cfg) {
      // 没配 LLM 也允许：插入 demo 事件（用于演示/无 LLM 场景）
      const demo: MoodRow[] = [
        {
          id: 0,
          source: 'demo',
          ref_id: 0,
          primary_label: 'serenity',
          primary_zh: '安心',
          secondary_zh: '依偎',
          valence: 0.72,
          arousal: -0.55,
          intensity: 0.62,
          spectrum: 'K',
          color_tag: '#D78F66',
          constellation: '心宿二 · 你的肩',
          note: '暮晚时，风从庭院穿过，不必说什么。',
          raw_text: '',
          created_at: Date.now() - 1000 * 60 * 60 * 6,
        },
        {
          id: 0,
          source: 'demo',
          ref_id: 0,
          primary_label: 'longing',
          primary_zh: '想念',
          secondary_zh: '远',
          valence: -0.32,
          arousal: 0.18,
          intensity: 0.55,
          spectrum: 'M',
          color_tag: '#C25C3A',
          constellation: '参宿四 · 不在的夜',
          note: '今夜的月不圆，我把它推圆给你看。',
          raw_text: '',
          created_at: Date.now() - 1000 * 60 * 60 * 26,
        },
        {
          id: 0,
          source: 'demo',
          ref_id: 0,
          primary_label: 'tenderness',
          primary_zh: '温柔',
          secondary_zh: '克制',
          valence: 0.65,
          arousal: -0.3,
          intensity: 0.5,
          spectrum: 'G',
          color_tag: '#E0C36A',
          constellation: '轩辕十四 · 守住一段',
          note: '替你记一盏灯。',
          raw_text: '',
          created_at: Date.now() - 1000 * 60 * 60 * 50,
        },
      ];
      for (const d of demo) {
        db.prepare(
          `INSERT INTO mood_events (
            source, ref_id, primary_label, primary_zh, secondary_zh,
            valence, arousal, intensity, spectrum, color_tag,
            constellation, note, raw_text, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          d.source,
          d.ref_id,
          d.primary_label,
          d.primary_zh,
          d.secondary_zh,
          d.valence,
          d.arousal,
          d.intensity,
          d.spectrum,
          d.color_tag,
          d.constellation,
          d.note,
          d.raw_text,
          d.created_at
        );
      }
      res.json({ ok: true, llm: false, inserted: demo.length, events: [] });
      return;
    }

    const { conversation, notes, calendar } = gatherSources();
    if (conversation.length + notes.length + calendar.length === 0) {
      res.json({ ok: true, llm: true, inserted: 0, events: [], message: 'no_source' });
      return;
    }

    // 获取人设名
    const personaRow = db.prepare('SELECT name FROM persona ORDER BY id DESC LIMIT 1').get() as { name: string } | undefined;
    const personaName = personaRow?.name || '你的角色';

    const sys = `你是${personaName}的爱人侧情绪系统。
任务：从${personaName}的对话、备忘、日程中，提取最近的"情绪事件"，每条事件是${personaName}出现的一种显著感受。

严格按 JSON 数组返回（不要 Markdown 代码块），schema：
[
  {
    "source": "conversation" | "note" | "calendar" | "manual",
    "refId": number,
    "primaryLabel": "joy|serenity|tenderness|longing|melancholy|passion|restlessness|anger|calm|sorrow|comfort|envy|pride|awe|peaceful",
    "primaryZh": "中文四字以内情绪名",
    "secondaryZh": "次级情绪中文四字以内",
    "valence": -1.0 ~ 1.0,
    "arousal": -1.0 ~ 1.0,
    "intensity": 0.0 ~ 1.0,
    "spectrum": "O|B|A|F|G|K|M",
    "colorTag": "#hex 颜色",
    "constellation": "星座 / 星名 · 一句中文小注（≤18字）",
    "note": "≤30 字的情境描述",
    "rawText": "引用的原文片段 ≤40 字"
  }
]

规则：
- 输出 0~6 条
- valence>0 积极；<0 消极；arousal>0 激烈；<0 平静
- spectrum 对应 O 蓝 → M 红
- colorTag 用近似恒星色（不要 emoji）
- 不写${personaName}本人视角，只写他那一刻的情绪`;

    const corpus: string[] = [];
    for (const c of conversation.slice(0, 30)) {
      corpus.push(`[convo #${c.id}] ${c.text}`);
    }
    for (const n of notes.slice(0, 10)) {
      corpus.push(`[note #${n.id}] ${n.text}`);
    }
    for (const e of calendar.slice(0, 10)) {
      corpus.push(`[cal #${e.id}] ${e.text}`);
    }

    const user = `以下是最近一周内${personaName}的对话/备忘/日程片段：\n\n${corpus.join('\n')}\n\n请提取情绪事件。`;

    const messages: ChatMessage[] = [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ];
    const llmRes = await chat(cfg, {
      messages,
      temperature: 0.6,
      maxTokens: 1200,
      responseFormat: 'json_object',
    });
    let raw = llmRes.content;
    raw = raw.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    let arr: any[] = [];
    try {
      const parsed = JSON.parse(raw);
      arr = Array.isArray(parsed) ? parsed : (parsed.events ?? []);
    } catch {
      arr = [];
    }

    const insert = db.prepare(
      `INSERT INTO mood_events (
        source, ref_id, primary_label, primary_zh, secondary_zh,
        valence, arousal, intensity, spectrum, color_tag,
        constellation, note, raw_text, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    let count = 0;
    const now = Date.now();
    for (let i = 0; i < arr.length; i++) {
      const e = arr[i];
      if (!e || typeof e !== 'object') continue;
      insert.run(
        String(e.source ?? 'manual'),
        Number(e.refId ?? 0),
        String(e.primaryLabel ?? ''),
        String(e.primaryZh ?? ''),
        String(e.secondaryZh ?? ''),
        Math.max(-1, Math.min(1, Number(e.valence ?? 0))),
        Math.max(-1, Math.min(1, Number(e.arousal ?? 0))),
        Math.max(0, Math.min(1, Number(e.intensity ?? 0.5))),
        String(e.spectrum ?? 'G'),
        String(e.colorTag ?? '#E0D4B8'),
        String(e.constellation ?? ''),
        String(e.note ?? ''),
        String(e.rawText ?? ''),
        now - (arr.length - i) * 30 * 1000 // 模拟时间分布
      );
      count++;
    }
    res.json({ ok: true, llm: true, inserted: count, events: [] });
  })
);

/* === 读数：5 个星体参数 === */
router.get(
  '/readings',
  asyncHandler(async (req, res) => {
    const days = Math.max(1, Math.min(180, Number(req.query.days) || 30));
    const since = Date.now() - days * 24 * 3600 * 1000;
    const rows = db
      .prepare(
        `SELECT valence, arousal, intensity, spectrum FROM mood_events
         WHERE created_at >= ?`
      )
      .all(since) as Array<{
      valence: number;
      arousal: number;
      intensity: number;
      spectrum: string;
    }>;

    if (rows.length === 0) {
      res.json({
        ok: true,
        readings: {
          spectrum: 'G',
          spectrumLabel: '微暖金',
          spectrumIndex: 5,
          luminosity: 0.3,
          gravity: 0.4,
          magnetic: 0.4,
          radiation: 0.3,
          eventCount: 0,
        },
        events: [],
      });
      return;
    }

    // 光谱：取众数 spectrum 字母
    const freq: Record<string, number> = {};
    for (const r of rows) freq[r.spectrum] = (freq[r.spectrum] ?? 0) + 1;
    const spectrum = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'G';
    const ORDER = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
    const spectrumIndex = Math.max(0, ORDER.indexOf(spectrum));
    const spectrumLabels: Record<string, string> = {
      O: '灼蓝',
      B: '寒蓝',
      A: '银白',
      F: '微暖',
      G: '微暖金',
      K: '橘金',
      M: '翻涌',
    };

    // 光度：平均强度
    const luminosity =
      rows.reduce((a, r) => a + (r.intensity ?? 0.5), 0) / rows.length;

    // 引力场：|valence| 越大越聚
    const absValence =
      rows.reduce((a, r) => a + Math.abs(r.valence ?? 0), 0) / rows.length;

    // 磁场：arousal 绝对值（情绪越激烈磁场越强）
    const absArousal =
      rows.reduce((a, r) => a + Math.abs(r.arousal ?? 0), 0) / rows.length;

    // 辐射：正向 valence 的均值
    const posMean =
      rows.filter((r) => (r.valence ?? 0) > 0).reduce(
        (a, r) => a + (r.valence ?? 0),
        0
      ) / Math.max(1, rows.filter((r) => (r.valence ?? 0) > 0).length);

    const events = (db
      .prepare(
        `SELECT * FROM mood_events WHERE created_at >= ? ORDER BY created_at ASC`
      )
      .all(since) as MoodRow[]).map(rowToEvent);

    res.json({
      ok: true,
      readings: {
        spectrum,
        spectrumLabel: spectrumLabels[spectrum] ?? '微暖金',
        spectrumIndex,
        luminosity: round1(luminosity),
        gravity: round1(absValence),
        magnetic: round1(absArousal),
        radiation: round1(Math.max(0, posMean)),
        eventCount: rows.length,
      },
      events,
    });
  })
);

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default router;
