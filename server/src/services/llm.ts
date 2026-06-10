/**
 * 通用 LLM 代理服务
 * 后端代替前端调用 LLM，API Key 永不离开服务器
 *
 * 支持 OpenAI 兼容协议（OpenAI / DeepSeek / 火山方舟 / Moonshot / Ollama / ...）
 */

import type Database from 'better-sqlite3';

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface LlmChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }>;
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  responseFormat?: 'text' | 'json_object';
}

export interface LlmChatResponse {
  content: string;
  finishReason: string;
  toolCalls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** 从数据库读取最新 LLM 配置 */
export function getLlmConfig(db: Database.Database): LlmConfig | null {
  const rows = db.prepare('SELECT key, value FROM config').all() as Array<{
    key: string;
    value: string;
  }>;
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  if (!map.api_base_url || !map.api_key || !map.api_model) return null;
  return {
    baseUrl: map.api_base_url.replace(/\/+$/, ''),
    apiKey: map.api_key,
    model: map.api_model,
  };
}

/** 向 LLM 端点发起 chat 请求（OpenAI 兼容协议） */
export async function chat(
  cfg: LlmConfig,
  req: LlmChatRequest,
  signal?: AbortSignal,
): Promise<LlmChatResponse> {
  const body: Record<string, unknown> = {
    model: cfg.model,
    messages: req.messages,
    temperature: req.temperature ?? 0.8,
    max_tokens: req.maxTokens ?? 1024,
  };
  if (req.tools && req.tools.length) body.tools = req.tools;
  if (req.toolChoice) body.tool_choice = req.toolChoice;
  if (req.responseFormat === 'json_object') body.response_format = { type: 'json_object' };

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`LLM ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices: Array<{
      message: {
        content: string | null;
        tool_calls?: Array<{
          id: string;
          type: 'function';
          function: { name: string; arguments: string };
        }>;
      };
      finish_reason: string;
    }>;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };

  const choice = data.choices?.[0];
  if (!choice) {
    throw new Error('LLM returned no choices');
  }

  return {
    content: choice.message.content || '',
    finishReason: choice.finish_reason || 'stop',
    toolCalls: choice.message.tool_calls,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

/** 流式 chat（Server-Sent Events，POST） */
export async function* chatStream(
  cfg: LlmConfig,
  req: LlmChatRequest,
  signal?: AbortSignal,
): AsyncGenerator<string, void, void> {
  const body: Record<string, unknown> = {
    model: cfg.model,
    messages: req.messages,
    temperature: req.temperature ?? 0.8,
    max_tokens: req.maxTokens ?? 1024,
    stream: true,
  };
  if (req.responseFormat === 'json_object') body.response_format = { type: 'json_object' };

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');
    throw new Error(`LLM ${res.status}: ${errText.slice(0, 500)}`);
  }

  const reader = res.body.getReader() as ReadableStreamDefaultReader<Uint8Array>;
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;
      if (!payload) continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        // 忽略无法解析的行
      }
    }
  }
}
