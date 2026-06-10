/**
 * LandricOS · 健康
 *
 * 简单记录：睡眠时长、心情、步数，体重
 * 顶部展示最近一格 + LLM 解读
 */
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { health, llm, type HealthLog } from '@/utils/api';
import { useFocusEffect } from 'expo-router';
import { Plus, Sparkles, Cpu } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function HealthScreen() {
  const router = useSafeRouter();
  const [list, setList] = useState<HealthLog[]>([]);
  const [date, setDate] = useState(todayKey());
  const [sleep, setSleep] = useState('');
  const [mood, setMood] = useState('');
  const [steps, setSteps] = useState('');
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [ask, setAsk] = useState<string>('');
  const [askBusy, setAskBusy] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { logs } = await health.list();
      setList(logs);
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const add = async () => {
    if (!date) return;
    setBusy(true);
    try {
      await health.add({
        date,
        sleep_hours: sleep ? Number(sleep) : undefined,
        mood_score: mood ? Number(mood) : undefined,
        steps: steps ? Number(steps) : undefined,
        weight_kg: weight ? Number(weight) : undefined,
        note: note.trim() || undefined,
      });
      setSleep('');
      setMood('');
      setSteps('');
      setWeight('');
      setNote('');
      load();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const askAI = async () => {
    if (list.length === 0) return;
    setAskBusy(true);
    setAsk('');
    try {
      const recent = list.slice(-7);
      const summary = recent
        .map(
          (l) =>
            `${l.date}: 睡 ${l.sleep_hours ?? '-'}h, 心 ${l.mood_score ?? '-'}, 步 ${l.steps ?? '-'}, ${l.weight_kg ?? '-'}kg`
        )
        .join('\n');
      const r = await llm.generate({
        prompt: `以下是我近 7 天的健康记录：\n${summary}\n请以角色对爱人的口吻，写一段不超过 80 字的关怀（不要 emoji）。`,
        temperature: 0.85,
        maxTokens: 160,
      });
      setAsk(r.text.trim());
    } catch (e: any) {
      setAsk(`（未成：${e?.message || '未知'}）`);
    } finally {
      setAskBusy(false);
    }
  };

  const last = list[list.length - 1];

  return (
    <Screen
      backgroundColor="#F4ECDD"
      statusBarStyle="dark"
      safeAreaEdges={['left', 'right']}
    >
      <TopBar title="健康" subtitle="体温与心" serif onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 最近一格 */}
        {last ? (
          <View className="px-6 pt-3">
            <View className="border border-outline bg-surface rounded-2xl p-5">
              <Text
                className="text-on-surface-variant text-[10px] tracking-widest"
                style={{ fontFamily: 'serif' }}
              >
                最 近 一 格
              </Text>
              <Text
                className="text-on-surface text-base mt-1"
                style={{ fontFamily: 'serif' }}
              >
                {last.date}
              </Text>
              <View className="mt-4 flex-row flex-wrap gap-y-3">
                <Stat label="睡" value={last.sleep_hours != null ? `${last.sleep_hours}h` : '-'} />
                <Stat label="心" value={last.mood_score != null ? `${last.mood_score} / 5` : '-'} />
                <Stat label="步" value={last.steps != null ? String(last.steps) : '-'} />
                <Stat label="重" value={last.weight_kg != null ? `${last.weight_kg}kg` : '-'} />
              </View>
              {last.note ? (
                <Text
                  className="text-on-surface-variant text-xs mt-3 italic"
                  style={{ fontFamily: 'serif' }}
                >
                  {last.note}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* 添加记录 */}
        <View className="px-6 mt-6">
          <Text
            className="text-on-surface-variant text-[10px] tracking-[0.3em] mb-3"
            style={{ fontFamily: 'serif' }}
          >
            新  录
          </Text>
          <View className="border border-outline bg-surface rounded-2xl p-4 gap-3">
            <Row label="日" value={date} onChange={setDate} />
            <Row label="睡(h)" value={sleep} onChange={setSleep} numeric />
            <Row label="心(1-5)" value={mood} onChange={setMood} numeric />
            <Row label="步" value={steps} onChange={setSteps} numeric />
            <Row label="重(kg)" value={weight} onChange={setWeight} numeric />
            <Row label="附" value={note} onChange={setNote} />
            <Pressable
              onPress={add}
              disabled={busy}
              className="mt-1 py-3 rounded-2xl bg-primary active:opacity-60 flex-row items-center justify-center gap-2"
            >
              {busy ? (
                <ActivityIndicator color="#15110B" />
              ) : (
                <>
                  <Plus size={14} color="#15110B" />
                  <Text
                    className="text-on-primary text-sm font-semibold"
                    style={{ fontFamily: 'serif', letterSpacing: 2 }}
                  >
                    收 入
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* 解读 */}
        <View className="px-6 mt-6">
          <Pressable
            onPress={askAI}
            disabled={askBusy || list.length === 0}
            className="self-start px-4 py-2 rounded-full border border-primary/30 active:opacity-60 flex-row items-center gap-2"
          >
            {askBusy ? (
              <ActivityIndicator size="small" color="#C9A876" />
            ) : (
              <>
                <Sparkles size={13} color="#C9A876" />
                <Text
                  className="text-primary text-xs"
                  style={{ fontFamily: 'serif', letterSpacing: 2 }}
                >
                  请 解 一 段
                </Text>
              </>
            )}
          </Pressable>
          {ask ? (
            <View className="mt-4 border border-outline bg-surface rounded-2xl p-5">
              <Text
                className="text-on-surface text-sm leading-7"
                style={{ fontFamily: 'serif' }}
              >
                {ask}
              </Text>
            </View>
          ) : null}

          {/* 跳情绪 OS */}
          <Pressable
            onPress={() => router.push('/mood')}
            className="mt-6 self-start px-4 py-2 rounded-full border border-primary/30 active:opacity-60 flex-row items-center gap-2"
          >
            <Cpu size={13} color="#C9A876" />
            <Text
              className="text-primary text-xs"
              style={{ fontFamily: 'serif', letterSpacing: 2 }}
            >
              打 开 情 绪 O S
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 pr-2">
      <Text
        className="text-on-surface"
        style={{ fontFamily: 'serif', fontSize: 22 }}
      >
        {value}
      </Text>
      <Text
        className="text-on-surface-variant text-[10px] tracking-widest mt-1"
        style={{ fontFamily: 'serif' }}
      >
        {label}
      </Text>
    </View>
  );
}

function Row(props: { label: string; value: string; onChange: (v: string) => void; numeric?: boolean }) {
  return (
    <View>
      <Text
        className="text-on-surface-variant text-[10px] tracking-[0.3em] mb-1"
        style={{ fontFamily: 'serif' }}
      >
        {props.label}
      </Text>
      <View className="border border-outline bg-surface-container rounded-lg px-3 py-2.5">
        <TextInput
          value={props.value}
          onChangeText={props.onChange}
          keyboardType={props.numeric ? 'numeric' : 'default'}
          className="text-on-surface text-[14px]"
          placeholderTextColor="#6B5D45"
          selectionColor="#C9A876"
        />
      </View>
    </View>
  );
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
