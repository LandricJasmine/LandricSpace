import { Router } from 'express';
import { db } from '../db.js';
import { getLlmConfig, chat, type ChatMessage } from '../services/llm';

const router = Router();

interface TrackRow {
  id: number; title: string; artist: string; album: string;
  duration_sec: number; cover_seed: string; created_at: number;
}
function rowToTrack(r: TrackRow) {
  return {
    id: r.id, title: r.title, artist: r.artist, album: r.album,
    durationSec: r.duration_sec, coverSeed: r.cover_seed, createdAt: r.created_at,
  };
}

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM music ORDER BY id DESC LIMIT 100').all() as TrackRow[];
  res.json({ tracks: rows.map(rowToTrack) });
});

router.post('/', (req, res) => {
  const b = req.body ?? {};
  const title = String(b.title ?? '无题').slice(0, 80);
  const artist = String(b.artist ?? '未知').slice(0, 60);
  const album = String(b.album ?? '').slice(0, 80);
  const duration = Number(b.durationSec ?? 0);
  const seed = String(b.coverSeed ?? '');
  const r = db.prepare(`INSERT INTO music (title, artist, album, duration_sec, cover_seed, created_at) VALUES (?,?,?,?,?,?)`)
    .run(title, artist, album, duration, seed, Date.now());
  const row = db.prepare('SELECT * FROM music WHERE id = ?').get(r.lastInsertRowid) as TrackRow;
  res.json({ track: rowToTrack(row) });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM music WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

/**
 * 真实三方：iTunes Search API（公开免授权）
 *  - search: GET /api/v1/music/external?term=xxx
 *  - return: { results: [{ trackId, trackName, artistName, collectionName, previewUrl, artworkUrl100 }] }
 */
router.get('/external', async (req, res) => {
  const term = String(req.query.term ?? '').trim();
  if (!term) return res.json({ results: [] });
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=5`;
    const r = await fetch(url, { headers: { 'User-Agent': 'LandricOS/1.0' } });
    if (!r.ok) return res.status(502).json({ error: 'itunes_unavailable' });
    const data: any = await r.json();
    const results = (data.results ?? []).map((x: any) => ({
      trackId: x.trackId,
      trackName: x.trackName,
      artistName: x.artistName,
      collectionName: x.collectionName,
      previewUrl: x.previewUrl,
      artworkUrl100: x.artworkUrl100,
      trackTimeMillis: x.trackTimeMillis,
    })).filter((x: any) => !!x.previewUrl);
    res.json({ results });
  } catch (e: any) {
    res.status(502).json({ error: e?.message ?? 'unknown' });
  }
});

/**
 * 真实三方 / LLM：基于当前心境生成"书房"歌单（每条带真实 iTunes 预览）
 *  - recommend: POST /api/v1/music/recommend { mood?: string, occasion?: string }
 *  - return: { picks: [{ query, reason, track? }] }
 */
router.post('/recommend', async (req, res) => {
  const cfg = getLlmConfig(db);
  if (!cfg) return res.status(412).json({ error: 'llm_not_configured' });

  const mood = String(req.body?.mood ?? '夜深书斋');
  const occasion = String(req.body?.occasion ?? '灯下独酌');

  const sys = `你是LandricOS曲房的选曲人。
任务：根据用户的"心境"和"场景"给出 5 首真实存在的歌（中文 / 日文 / 古典皆可，但曲名要真实可被 iTunes 搜索到）。
要求：
- 严格返回 JSON：{"picks":[{"query":"曲名 — 歌手","reason":"推荐理由（30 字内）"}]}
- 5 个 picks，风格有差异（钢琴 / 古琴 / 现代抒情 / 法语香颂 / 古典室内乐）
- 不需要 emoji
- reason 用第一人称"我"`;

  const msgs: ChatMessage[] = [
    { role: 'system', content: sys },
    { role: 'user', content: `心境：${mood}\n场景：${occasion}` },
  ];

  try {
    const llmRes = await chat(cfg, {
      messages: msgs,
      temperature: 0.9,
      maxTokens: 700,
      responseFormat: 'json_object',
    });
    const json = llmRes.content.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(json) as { picks: Array<{ query: string; reason: string }> };
    const picks = await Promise.all(
      parsed.picks.slice(0, 5).map(async (p) => {
        try {
          const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(p.query)}&media=music&entity=song&limit=1`);
          const d: any = await r.json();
          const t = (d.results ?? [])[0];
          if (t) {
            db.prepare(`INSERT INTO music (title, artist, album, duration_sec, cover_seed, created_at) VALUES (?,?,?,?,?,?)`)
              .run(t.trackName, t.artistName, t.collectionName ?? '', Math.round((t.trackTimeMillis ?? 0) / 1000), String(t.trackId ?? ''), Date.now());
            return {
              query: p.query, reason: p.reason,
              track: {
                trackId: t.trackId, trackName: t.trackName, artistName: t.artistName,
                collectionName: t.collectionName, previewUrl: t.previewUrl,
                artworkUrl100: t.artworkUrl100, trackTimeMillis: t.trackTimeMillis,
              },
            };
          }
        } catch {}
        return { query: p.query, reason: p.reason };
      }),
    );
    res.json({ picks });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'unknown' });
  }
});

export default router;
