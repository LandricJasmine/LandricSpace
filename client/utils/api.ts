/**
 * LandricOS — 后端 API 客户端
 *
 * 设计原则：
 * 1. 单一 fetch 封装：所有走 /api/v1 的请求都从这里发
 * 2. 完整接口注释：每个调用都标明服务端文件 + 路由 + 参数类型
 * 3. 失败不静默：非 2xx 直接 throw，由调用方决定是否降级
 * 4. 类型安全：TypeScript 泛型在响应处推断
 *
 * API Base URL: ${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1
 */
const BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL
  ? `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1`
  : `/api/v1`; // 同源兜底（prod 场景下 backend 与前端同端口）

// === 通用类型 ===
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string };

// Overload: no options
async function request<T>(path: string): Promise<T>;
// Overload: with options
async function request<T>(
  path: string,
  init: { method?: string; headers?: Record<string, string>; body?: string }
): Promise<T>;
// Implementation
async function request<T>(
  path: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string }
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  const json = await res.json();
  return json as T;
}

// === LLM ===
/**
 * 服务端文件：server/src/routes/generate.ts
 * 接口：POST /api/v1/llm/generate
 * Body 参数：prompt: string, system?: string, temperature?: number, maxTokens?: number
 */
export const llm = {
  generate: (params: {
    prompt: string;
    system?: string;
    temperature?: number;
    maxTokens?: number;
  }) =>
    request<{ ok: true; text: string; model: string }>(
      `/llm/generate`,
      { method: 'POST', body: JSON.stringify(params) }
    ),
};

// === Config（API 密钥）===
/**
 * 服务端文件：server/src/routes/config.ts
 * 接口：GET /api/v1/config
 * 接口：PUT /api/v1/config
 * Body 参数：api_base_url?: string, api_key?: string, model_name?: string
 */
export const config = {
  get: () => request<{
    ok: true;
    api_base_url: string;
    api_key_masked: string;
    api_key_set: boolean;
    model_name: string;
  }>(`/config`),
  put: (params: { api_base_url?: string; api_key?: string; model_name?: string }) =>
    request<{ ok: true }>(`/config`, {
      method: 'PUT',
      body: JSON.stringify(params),
    }),
};

// === Persona（人设）===
/**
 * 服务端文件：server/src/routes/persona.ts
 * 接口：GET /api/v1/persona
 * 接口：PUT /api/v1/persona
 * Body 参数：name, age, birthday, birthplace, residence, current_mood, occupation, family, background, traits, speaking_style
 */
export type Persona = {
  name: string;
  age: number;
  birthday: string;
  birthplace: string;
  residence: string;
  current_mood: string;
  occupation: string;
  family: string;
  background: string;
  traits: string;
  speaking_style: string;
  updated_at: string;
};

export const persona = {
  get: () => request<{ ok: true; persona: Persona }>(`/persona`),
  put: (params: Partial<Persona>) =>
    request<{ ok: true }>(`/persona`, { method: 'PUT', body: JSON.stringify(params) }),
};

// === Contacts（联系人）===
/**
 * 服务端文件：server/src/routes/contacts.ts
 * 接口：GET /api/v1/contacts
 * 接口：POST /api/v1/contacts  Body: {name, role, relation, phone?, note?}
 * 接口：DELETE /api/v1/contacts/:id
 */
export type Contact = {
  id: number;
  name: string;
  role: string;
  relation: string;
  phone: string | null;
  note: string | null;
  is_self: number;
  created_at: string;
};

export const contacts = {
  list: () => request<{ ok: true; contacts: Contact[] }>(`/contacts`),
  add: (params: { name: string; role: string; relation: string; phone?: string; note?: string }) =>
    request<{ ok: true; id: number }>(`/contacts`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  remove: (id: number) => request<{ ok: true }>(`/contacts/${id}`, { method: 'DELETE' }),
};

// === Messages（消息）===
/**
 * 服务端文件：server/src/routes/messages.ts
 * 接口：GET /api/v1/messages?contact_id=
 * 接口：POST /api/v1/messages  Body: {contact_id, role: 'self'|'them', content}
 * 接口：DELETE /api/v1/messages/:id
 */
export type Message = {
  id: number;
  contact_id: number;
  role: 'self' | 'them';
  content: string;
  created_at: string;
};

export const messages = {
  list: (contactId: number) =>
    request<{ ok: true; messages: Message[] }>(`/messages?contactId=${contactId}`),
  send: (params: { contactId: number; role: 'self' | 'them'; content: string }) =>
    request<{ ok: true; id: number }>(`/messages`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  remove: (id: number) => request<{ ok: true }>(`/messages/${id}`, { method: 'DELETE' }),
};

// === Moments（朋友圈）===
/**
 * 服务端文件：server/src/routes/moments.ts
 * 接口：GET /api/v1/moments
 * 接口：POST /api/v1/moments  Body: {author, content, mood?}
 * 接口：DELETE /api/v1/moments/:id
 */
export type Moment = {
  id: number;
  author: string;
  content: string;
  mood: string | null;
  created_at: string;
};

export const moments = {
  list: () => request<{ ok: true; moments: Moment[] }>(`/moments`),
  publish: (params: { author: string; content: string; mood?: string }) =>
    request<{ ok: true; id: number }>(`/moments`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  remove: (id: number) => request<{ ok: true }>(`/moments/${id}`, { method: 'DELETE' }),
};

// === Notes（备忘录）===
/**
 * 服务端文件：server/src/routes/notes.ts
 * 接口：GET /api/v1/notes
 * 接口：POST /api/v1/notes  Body: {title, body, category?}
 * 接口：PUT /api/v1/notes/:id  Body: {title?, body?, category?}
 * 接口：DELETE /api/v1/notes/:id
 */
export type Note = {
  id: number;
  title: string;
  body: string;
  category: string;
  updated_at: string;
};

export const notes = {
  list: () => request<{ ok: true; notes: Note[] }>(`/notes`),
  add: (params: { title: string; body: string; category?: string }) =>
    request<{ ok: true; id: number }>(`/notes`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  update: (id: number, params: { title?: string; body?: string; category?: string }) =>
    request<{ ok: true }>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    }),
  remove: (id: number) => request<{ ok: true }>(`/notes/${id}`, { method: 'DELETE' }),
};

// === Calendar（日历）===
/**
 * 服务端文件：server/src/routes/calendar.ts
 * 接口：GET /api/v1/calendar
 * 接口：POST /api/v1/calendar  Body: {date: YYYY-MM-DD, title, type, time?, location?, note?}
 * 接口：PUT /api/v1/calendar/:id
 * 接口：DELETE /api/v1/calendar/:id
 */
export type CalendarEvent = {
  id: number;
  date: string;
  title: string;
  type: string;
  time: string | null;
  location: string | null;
  note: string | null;
};

export const calendar = {
  list: () => request<{ ok: true; events: CalendarEvent[] }>(`/calendar`),
  add: (params: {
    date: string;
    title: string;
    type: string;
    time?: string;
    location?: string;
    note?: string;
  }) =>
    request<{ ok: true; id: number }>(`/calendar`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  update: (
    id: number,
    params: Partial<{ title: string; date: string; type: string; time: string; location: string; note: string }>
  ) =>
    request<{ ok: true }>(`/calendar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    }),
  remove: (id: number) => request<{ ok: true }>(`/calendar/${id}`, { method: 'DELETE' }),
};

// === Wallet（钱包 / 流水）===
/**
 * 服务端文件：server/src/routes/transactions.ts
 * 接口：GET /api/v1/transactions
 * 接口：POST /api/v1/transactions  Body: {amount: number, kind: 'expense'|'income', category, merchant, note?, occurred_at?}
 * 接口：DELETE /api/v1/transactions/:id
 */
export type Transaction = {
  id: number;
  amount: number;
  kind: 'expense' | 'income';
  category: string;
  merchant?: string;
  note: string | null;
  occurred_at: string;
};

export const transactions = {
  list: () => request<{ ok: true; transactions: Transaction[] }>(`/transactions`),
  add: (params: {
    amount: number;
    kind: 'expense' | 'income';
    category: string;
    merchant?: string;
    note?: string;
    occurred_at?: string;
  }) =>
    request<{ ok: true; id: number }>(`/transactions`, {
      method: 'POST',
      body: JSON.stringify({ ...params, merchant: params.merchant ?? '' }),
    }),
  remove: (id: number) => request<{ ok: true }>(`/transactions/${id}`, { method: 'DELETE' }),
};

// === Shop（购物清单）===
/**
 * 服务端文件：server/src/routes/products.ts
 * 接口：GET /api/v1/products
 * 接口：POST /api/v1/products  Body: {name, category, price?, status?, note?}
 * 接口：DELETE /api/v1/products/:id
 */
export type Product = {
  id: number;
  name: string;
  category: string;
  price: number | null;
  reason: string | null;
  note: string | null;
  status: 'wish' | 'bought' | 'considering';
  created_at: string;
};

export const products = {
  list: () => request<{ ok: true; products: Product[] }>(`/products`),
  add: (params: {
    name: string;
    category?: string;
    price?: number;
    reason?: string;
    note?: string;
    status?: 'wish' | 'bought' | 'considering';
  }) =>
    request<{ ok: true; id: number }>(`/products`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  remove: (id: number) => request<{ ok: true }>(`/products/${id}`, { method: 'DELETE' }),
};

// === Photos · 真实相册（expo-image-picker → FormData 上传）===
/**
 * 服务端文件：server/src/routes/photos.ts
 * 接口：GET    /api/v1/photos
 * 接口：POST   /api/v1/photos/upload  multipart/form-data, field=image
 * 接口：DELETE /api/v1/photos/:id
 */
export interface PhotoItem {
  id: number;
  imageSeed: string;
  imageUrl: string;
  location: string;
  takenAt: number;
  isFavorite: boolean;
  createdAt: number;
}

export const photos = {
  list: () => request<{ photos: PhotoItem[] }>('/photos'),
  upload: (form: FormData) =>
    fetch(`${BASE}/photos/upload`, { method: 'POST', body: form }).then(async r => {
      if (!r.ok) throw new Error(await r.text());
      return r.json() as Promise<{ photo: PhotoItem }>;
    }),
  remove: (id: number) => request<{ ok: true }>(`/photos/${id}`, { method: 'DELETE' }),
};

// === Health（健康）===
/**
 * 服务端文件：server/src/routes/health.ts
 * 接口：GET /api/v1/health-metrics/log
 * 接口：POST /api/v1/health-metrics/log  Body: {date: YYYY-MM-DD, sleep_hours?, mood_score?, weight_kg?, steps?, note?}
 */
export type HealthLog = {
  id: number;
  date: string;
  sleep_hours: number | null;
  mood_score: number | null;
  weight_kg: number | null;
  steps: number | null;
  note: string | null;
};

export const health = {
  list: () => request<{ ok: true; logs: HealthLog[] }>(`/health-metrics/log`),
  add: (params: {
    date: string;
    sleep_hours?: number;
    mood_score?: number;
    weight_kg?: number;
    steps?: number;
    note?: string;
  }) =>
    request<{ ok: true; id: number }>(`/health-metrics/log`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};

// === Tools（天气）===
/**
 * 服务端文件：server/src/routes/tools.ts
 * 接口：GET /api/v1/tools/weather?city=
 */
export const tools = {
  weather: (city?: string) =>
    request<{
      ok: true;
      city: string;
      temp: number;
      desc: string;
      humidity: number;
      wind: string;
      date: string;
    }>(`/tools/weather${city ? `?city=${encodeURIComponent(city)}` : ''}`),
};

// === Health ping ===
/**
 * 服务端文件：server/src/index.ts
 * 接口：GET /api/v1/health
 */
export const ping = () => request<{ status: string; ts: number }>(`/health`);

// === 真实三方 / 硬件权限 接口 ===

export interface TripPlan {
  summary: string;
  totalHours: number;
  stops: Array<{ time: string; place: string; activity: string; durationMin: number; tip: string; moodTag: string }>;
  closing: string;
}

export const trip = {
  /**
   * 服务端文件：server/src/routes/trip.ts
   * 接口：POST /api/v1/trip/plan
   * Body: { city?: string, startAt?: string, endAt?: string, mood?: string, companion?: string, weatherHint?: string }
   */
  plan: (body: { city?: string; startAt?: string; endAt?: string; mood?: string; companion?: string; weatherHint?: string }) =>
    request<{ plan: TripPlan }>(`/trip/plan`, { method: 'POST', body: JSON.stringify(body) }),
};

export interface MusicTrack {
  id: number; title: string; artist: string; album: string;
  durationSec: number; coverSeed: string; createdAt: number;
}

export interface ExternalTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  previewUrl: string;
  artworkUrl100: string;
  trackTimeMillis: number;
}

export const music = {
  list: () => request<{ tracks: MusicTrack[] }>('/music'),
  /**
   * 服务端文件：server/src/routes/music.ts
   * 接口：GET /api/v1/music/external?term=xxx
   * Query: term: string
   */
  external: (term: string) => request<{ results: ExternalTrack[] }>(`/music/external?term=${encodeURIComponent(term)}`),
  /**
   * 服务端文件：server/src/routes/music.ts
   * 接口：POST /api/v1/music/recommend
   * Body: { mood?: string, occasion?: string }
   * 返回：{ picks: Array<{ query, reason, track?: ExternalTrack }> }
   */
  recommend: (body: { mood?: string; occasion?: string }) =>
    request<{ picks: Array<{ query: string; reason: string; track?: ExternalTrack }> }>(`/music/recommend`, {
      method: 'POST', body: JSON.stringify(body),
    }),
  add: (body: { title: string; artist: string; album?: string; durationSec?: number; coverSeed?: string }) =>
    request<{ track: MusicTrack }>(`/music`, { method: 'POST', body: JSON.stringify(body) }),
  remove: (id: number) => request<{ ok: true }>(`/music/${id}`, { method: 'DELETE' }),
};

/* === Mood · 情绪 OS（ACHERNAR · EPSILON 航行日志）===
 * 服务端文件：server/src/routes/mood.ts
 * GET  /api/v1/mood/events?days=30
 * POST /api/v1/mood/events  Body: { primaryZh, secondaryZh?, valence, arousal, intensity, spectrum, colorTag?, constellation?, note?, rawText? }
 * DEL  /api/v1/mood/events/:id
 * POST /api/v1/mood/scan   触发 LLM 扫描最近 7 天对话/备忘/日程
 * GET  /api/v1/mood/readings?days=30
 */
export interface MoodEvent {
  id: number;
  source: string;
  refId: number;
  primaryLabel: string;
  primaryZh: string;
  secondaryZh: string;
  valence: number;   // -1 消极 ↔ 1 积极
  arousal: number;   // -1 平静 ↔ 1 激烈
  intensity: number; // 0-1
  spectrum: 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';
  colorTag: string;
  constellation: string;
  note: string;
  rawText: string;
  createdAt: number;
}

export interface MoodReadings {
  spectrum: string;
  spectrumLabel: string;
  spectrumIndex: number;
  luminosity: number; // 0-1
  gravity: number;    // 0-1
  magnetic: number;   // 0-1
  radiation: number;  // 0-1
  eventCount: number;
}

export const mood = {
  list: (days = 60) =>
    request<{ ok: true; events: MoodEvent[] }>(`/mood/events?days=${days}`),
  add: (b: {
    primaryZh: string;
    secondaryZh?: string;
    primaryLabel?: string;
    valence: number;
    arousal: number;
    intensity: number;
    spectrum: string;
    colorTag?: string;
    constellation?: string;
    note?: string;
    rawText?: string;
  }) =>
    request<{ ok: true; id: number }>(`/mood/events`, {
      method: 'POST',
      body: JSON.stringify({ source: 'manual', ref_id: 0, ...b }),
    }),
  remove: (id: number) =>
    request<{ ok: true }>(`/mood/events/${id}`, { method: 'DELETE' }),
  scan: () => request<{ ok: true; llm: boolean; inserted: number }>(`/mood/scan`, { method: 'POST' }),
  readings: (days = 30) =>
    request<{ ok: true; readings: MoodReadings; events: MoodEvent[] }>(`/mood/readings?days=${days}`),
};
