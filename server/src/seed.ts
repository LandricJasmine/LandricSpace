/**
 * 预设种子数据：人设模板 / 联系人 / 消息
 * 严格遵守"不硬编码"原则：以下内容只作为"占位结构",
 * 实际生成内容在运行时由 LLM 动态产出。
 */

import { db } from './db.js';

const now = Date.now();

/** 预置默认人设（首次访问自动初始化，但这里也提供显式入口） */
export function seedPersona() {
  const exists = db.prepare('SELECT id FROM persona LIMIT 1').get();
  if (exists) return;
  db.prepare(
    `INSERT INTO persona (name, description, traits, importance, avatar_seed, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    '',
    '',
    JSON.stringify([]),
    5,
    'ai',
    now,
  );
}

/** 预置联系人（默认为空，用户自己添加） */
export function seedContacts() {
  const exists = db.prepare('SELECT COUNT(*) AS c FROM contacts').get() as { c: number };
  if (exists.c > 0) return;
  // 不预置任何联系人，用户自己添加
}

/** 预置几个空消息占位（让 messages 表有结构） */
export function seedMessages() {
  const exists = db.prepare('SELECT COUNT(*) AS c FROM messages').get() as { c: number };
  if (exists.c > 0) return;
  // 不预置消息，等待用户添加联系人后由 LLM 生成
}

/** 预置一些空白动态/备忘/日程结构（实际内容由 LLM 填） */
export function seedMoments() {
  const exists = db.prepare('SELECT COUNT(*) AS c FROM moments').get() as { c: number };
  if (exists.c > 0) return;
  // 不预置动态，等待用户由 LLM 生成
}

export function runSeeds() {
  seedPersona();
  seedContacts();
  seedMessages();
  seedMoments();
  // eslint-disable-next-line no-console
  console.log('[seed] database seeded (idempotent)');
}
