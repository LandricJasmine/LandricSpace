import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

interface PersonaRow {
  id: number;
  name: string;
  description: string;
  traits: string;
  importance: number;
  avatar_seed: string;
  updated_at: number;
  age: number;
  birthday: string;
  birthplace: string;
  residence: string;
  current_mood: string;
  occupation: string;
  family: string;
  background: string;
  speaking_style: string;
}

function rowToPersona(r: PersonaRow) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    traits: JSON.parse(r.traits) as string[],
    importance: r.importance,
    avatarSeed: r.avatar_seed,
    updatedAt: r.updated_at,
    age: r.age,
    birthday: r.birthday,
    birthplace: r.birthplace,
    residence: r.residence,
    currentMood: r.current_mood,
    occupation: r.occupation,
    family: r.family,
    background: r.background,
    speakingStyle: r.speaking_style,
  };
}

router.get('/', (_req, res) => {
  let row = db.prepare('SELECT * FROM persona ORDER BY id LIMIT 1').get() as PersonaRow | undefined;
  if (!row) {
    db.prepare('INSERT INTO persona (name, updated_at) VALUES (?, ?)').run('', Date.now());
    row = db.prepare('SELECT * FROM persona ORDER BY id LIMIT 1').get() as PersonaRow;
  }
  res.json({ persona: rowToPersona(row) });
});

router.put('/', (req, res) => {
  const b = req.body ?? {};
  const traits = Array.isArray(b.traits)
    ? JSON.stringify(b.traits)
    : (typeof b.traits === 'string' ? b.traits : null);

  const now = Date.now();
  const existing = db.prepare('SELECT id FROM persona ORDER BY id LIMIT 1').get() as { id: number } | undefined;

  if (!existing) {
    db.prepare(`INSERT INTO persona (
      name, description, traits, importance, avatar_seed, updated_at,
      age, birthday, birthplace, residence, current_mood, occupation, family, background, speaking_style
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      b.name ?? '',
      b.description ?? '',
      traits ?? '[]',
      Number(b.importance ?? 3),
      b.avatarSeed ?? 'ai',
      now,
      Number(b.age ?? 0),
      b.birthday ?? '',
      b.birthplace ?? '',
      b.residence ?? '',
      b.currentMood ?? '',
      b.occupation ?? '',
      b.family ?? '',
      b.background ?? '',
      b.speakingStyle ?? '',
    );
  } else {
    const fields: string[] = [];
    const vals: any[] = [];
    const map: Record<string, string> = {
      name: 'name', description: 'description', traits: 'traits',
      importance: 'importance', avatarSeed: 'avatar_seed',
      age: 'age', birthday: 'birthday', birthplace: 'birthplace',
      residence: 'residence', currentMood: 'current_mood',
      occupation: 'occupation', family: 'family',
      background: 'background', speakingStyle: 'speaking_style',
    };
    for (const [k, col] of Object.entries(map)) {
      if (k in b) {
        fields.push(`${col} = ?`);
        if (k === 'traits') vals.push(traits);
        else if (k === 'importance' || k === 'age') vals.push(Number(b[k] ?? 0));
        else vals.push(b[k] ?? (k === 'importance' || k === 'age' ? 0 : ''));
      }
    }
    if (!fields.length) {
      const r = db.prepare('SELECT * FROM persona WHERE id = ?').get(existing.id) as PersonaRow;
      return res.json({ persona: rowToPersona(r) });
    }
    fields.push('updated_at = ?');
    vals.push(now);
    vals.push(existing.id);
    db.prepare(`UPDATE persona SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  }

  const row = db.prepare('SELECT * FROM persona ORDER BY id LIMIT 1').get() as PersonaRow;
  res.json({ persona: rowToPersona(row) });
});

export default router;
