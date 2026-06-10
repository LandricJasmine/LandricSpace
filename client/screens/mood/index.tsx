/**
 * 情绪 OS · LANDRIC · 航行日志
 *
 * 设计：科幻宇宙飞船控制台
 *  - 深海军蓝/近黑底 + 金色细边 + 米金色字
 *  - 卡片 1：情绪天体（MAP-01 · STARMAP）—— 四象限散点 + 星座连线 + 标签栏 + 月份
 *  - 卡片 2：星体读数（RDG-01 · READINGS）—— 5 维进度条
 *  - LIVE 标识 + 扫描按钮
 *
 * 数据：调后端 /api/v1/mood/scan（LLM 扫描最近 7 天对话/备忘/日程）
 *      + /api/v1/mood/events + /readings
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { mood, type MoodEvent, type MoodReadings } from '@/utils/api';
import { useFocusEffect } from 'expo-router';
import { Radio, Sparkles, ChevronLeft, ChevronRight, X, Plus, ScanLine, Info, Cpu } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

const { width: WIN_W } = Dimensions.get('window');

/* === OS 主题色（深空科技风）=== */
const C = {
  bg: '#070B18',
  bgGrad: '#0A0F22',
  card: '#0F152B',
  cardAlt: '#0B1124',
  border: '#B89460',
  borderDim: 'rgba(184, 148, 96, 0.25)',
  gold: '#B89460',
  goldSoft: '#E0C490',
  ivory: '#E8D9A8',
  dim: '#8A95B5',
  dimmer: '#5A6585',
  live: '#4ADE80',
  grid: 'rgba(184, 148, 96, 0.18)',
};

/* === OBAFGKM 光谱色 === */
const SPECTRUM_COLORS: Record<string, string> = {
  O: '#7CA8FF',
  B: '#9DB8FF',
  A: '#D8E0FF',
  F: '#F1E9C5',
  G: '#FFE8B0',
  K: '#FFB070',
  M: '#FF6E50',
};

export default function MoodScreen() {
  const router = useSafeRouter();
  const [events, setEvents] = useState<MoodEvent[]>([]);
  const [readings, setReadings] = useState<MoodReadings | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [tab, setTab] = useState<'mood' | 'memory' | 'diary' | 'axis' | 'lines' | 'constellation' | 'hr'>('mood');
  const [monthOffset, setMonthOffset] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [r, ev] = await Promise.all([mood.readings(60), mood.list(60)]);
      setReadings(r.readings);
      setEvents(ev.events);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message });
    } finally {
      setBusy(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const scan = async () => {
    setScanning(true);
    try {
      const r = await mood.scan();
      Toast.show({
        type: 'success',
        text1: r.llm ? '扫描完成' : '已注入 demo 星体',
        text2: r.llm ? `捕获 ${r.inserted} 个情绪星` : '请先在「设置 → API 配置」配置 LLM 后再次扫描',
      });
      await load();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message });
    } finally {
      setScanning(false);
    }
  };

  const filtered = useMemo(() => filterByMonth(events, monthOffset), [events, monthOffset]);
  const tabFiltered = useMemo(() => filterByTab(filtered, tab), [filtered, tab]);

  return (
    <Screen
      backgroundColor={C.bg}
      statusBarStyle="light"
      safeAreaEdges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* === 顶部 OS 状态栏 === */}
        <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
          <Text className="text-[10px] tracking-[0.3em]" style={{ color: C.dim, fontFamily: 'monospace' }}>
            {fmtTime()}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.live }} />
            <Text className="text-[9px] tracking-[0.3em]" style={{ color: C.live, fontFamily: 'monospace' }}>
              OS ONLINE
            </Text>
          </View>
          <Text className="text-[10px] tracking-[0.3em]" style={{ color: C.dim, fontFamily: 'monospace' }}>
            LANDRIC · 75%
          </Text>
        </View>

        {/* === 页面导航 === */}
        <View className="px-5 pt-3 pb-4 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="active:opacity-50 flex-row items-center gap-1.5">
            <ChevronLeft size={14} color={C.gold} />
            <Text className="text-[10px] tracking-[0.3em]" style={{ color: C.gold, fontFamily: 'serif' }}>
              回 首 页
            </Text>
          </Pressable>
          <View className="items-center">
            <Text
              className="tracking-[0.55em]"
              style={{ color: C.ivory, fontFamily: 'monospace', fontSize: 13, fontWeight: '600' }}
            >
              LANDRIC
            </Text>
            <View className="w-12 h-px mt-1" style={{ backgroundColor: C.border }} />
            <Text
              className="text-[9px] tracking-[0.3em] mt-1"
              style={{ color: C.dimmer, fontFamily: 'monospace' }}
            >
              LANDRIC OS
            </Text>
          </View>
          <Pressable onPress={scan} disabled={scanning} className="active:opacity-50 flex-row items-center gap-1.5">
            {scanning ? (
              <ActivityIndicator size="small" color={C.gold} />
            ) : (
              <ScanLine size={12} color={C.gold} />
            )}
            <Text className="text-[10px] tracking-[0.3em]" style={{ color: C.gold, fontFamily: 'serif' }}>
              扫 描
            </Text>
          </Pressable>
        </View>

        {/* === 卡片 1 · 情绪天体 === */}
        <View
          className="mx-4 mt-2 rounded-2xl p-4"
          style={{
            backgroundColor: C.card,
            borderColor: C.border,
            borderWidth: 1,
            shadowColor: C.gold,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.18,
            shadowRadius: 14,
            elevation: 4,
          }}
        >
          <CardHeader code="MAP-01 · STARMAP" title="情绪天体" sub="EMOTION STARMAP" />

          {/* 标签栏 */}
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
              <View className="flex-row gap-1.5">
                {(
                  [
                    ['mood', '心情'],
                    ['memory', '记忆'],
                    ['diary', '日记'],
                    ['axis', '坐标'],
                    ['lines', '连线'],
                    ['constellation', '星座'],
                    ['hr', '赫罗'],
                  ] as const
                ).map(([k, label]) => {
                  const on = tab === k;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setTab(k)}
                      className="px-3 py-1.5 rounded-md"
                      style={{
                        borderWidth: 1,
                        borderColor: on ? C.gold : C.borderDim,
                        backgroundColor: on ? 'rgba(184,148,96,0.18)' : 'transparent',
                      }}
                    >
                      <Text
                        className="text-[10px] tracking-widest"
                        style={{ color: on ? C.ivory : C.dim, fontFamily: 'serif' }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* 月份选择 */}
          <View className="flex-row items-center justify-center mt-4 gap-4">
            <Pressable onPress={() => setMonthOffset((v) => v + 1)} className="active:opacity-40">
              <ChevronLeft size={16} color={C.gold} />
            </Pressable>
            <Text
              className="tracking-[0.4em] text-xs"
              style={{ color: C.ivory, fontFamily: 'monospace' }}
            >
              {fmtMonth(monthOffset)}
            </Text>
            <Pressable onPress={() => setMonthOffset((v) => v - 1)} className="active:opacity-40">
              <ChevronRight size={16} color={C.gold} />
            </Pressable>
          </View>

          {/* 坐标网格 */}
          <Starmap events={tabFiltered} />

          {/* 光谱色条 OBAFGKM */}
          <View className="mt-4 flex-row items-center gap-1">
            {(['O', 'B', 'A', 'F', 'G', 'K', 'M'] as const).map((s, i) => (
              <View key={s} className="flex-1 items-center">
                <View
                  className="w-full h-2.5 rounded-full"
                  style={{
                    backgroundColor: SPECTRUM_COLORS[s],
                    shadowColor: SPECTRUM_COLORS[s],
                    shadowOpacity: 0.6,
                    shadowRadius: 4,
                  }}
                />
                <Text
                  className="text-[9px] mt-1.5"
                  style={{ color: C.dim, fontFamily: 'monospace' }}
                >
                  {s}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* === 卡片 2 · 星体读数 === */}
        <View
          className="mx-4 mt-4 rounded-2xl p-4"
          style={{
            backgroundColor: C.card,
            borderColor: C.border,
            borderWidth: 1,
            shadowColor: C.gold,
            shadowOpacity: 0.15,
            shadowRadius: 12,
          }}
        >
          <CardHeader code="RDG-01 · READINGS" title="星体读数" sub="STELLAR READINGS" />

          <View className="mt-4 gap-4">
            <ReadingBar
              label="光谱"
              value={readings?.spectrum ?? 'G'}
              valueLabel={readings?.spectrumLabel ?? '—'}
              ratio={(readings?.spectrumIndex ?? 4) / 6}
              gradient={['#7CA8FF', '#9DB8FF', '#D8E0FF', '#F1E9C5', '#FFE8B0', '#FFB070', '#FF6E50']}
              left="O · 灼烧"
              right="M · 翻涌"
            />
            <ReadingBar
              label="光度"
              value={`${readings?.luminosity ?? 0}`}
              ratio={readings?.luminosity ?? 0}
              gradient={['#1F2540', '#5A6585', '#A8B0C8', '#E8D9A8']}
              left="暗"
              right="亮"
            />
            <ReadingBar
              label="引力场"
              value={`${readings?.gravity ?? 0}`}
              ratio={readings?.gravity ?? 0}
              gradient={['#2A1E50', '#52338C', '#7E5DC4', '#C29CFF']}
              left="微"
              right="强"
            />
            <ReadingBar
              label="磁场"
              value={`${readings?.magnetic ?? 0}`}
              ratio={readings?.magnetic ?? 0}
              gradient={['#0F2A3A', '#1F5F77', '#3CA1B8', '#7FE0F0']}
              left="平静"
              right="风暴"
            />
            <ReadingBar
              label="辐射"
              value={`${readings?.radiation ?? 0}`}
              ratio={readings?.radiation ?? 0}
              gradient={['#2A1E10', '#7E5128', '#C2843F', '#FFA860']}
              left="收敛"
              right="炽热"
            />
          </View>

          <View className="mt-4 flex-row items-center justify-between">
            <Pressable
              onPress={() => setHelpOpen(true)}
              className="active:opacity-40 flex-row items-center gap-1.5"
            >
              <Info size={11} color={C.gold} />
              <Text className="text-[10px] tracking-[0.3em]" style={{ color: C.gold, fontFamily: 'serif' }}>
                怎 么 读
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setAddOpen(true)}
              className="active:opacity-40 flex-row items-center gap-1.5"
            >
              <Plus size={11} color={C.gold} />
              <Text className="text-[10px] tracking-[0.3em]" style={{ color: C.gold, fontFamily: 'serif' }}>
                手 动 记 录
              </Text>
            </Pressable>
          </View>
        </View>

        {/* === 近期事件 === */}
        {events.length > 0 ? (
          <View className="mx-4 mt-4">
            <Text
              className="text-[9px] tracking-[0.4em] mb-2 px-1"
              style={{ color: C.dimmer, fontFamily: 'monospace' }}
            >
              ·  近 期 捕 获  ·  RECENT EVENTS
            </Text>
            <View className="gap-2">
              {events
                .slice()
                .reverse()
                .slice(0, 10)
                .map((e) => (
                  <EventRow key={e.id} e={e} onDelete={load} />
                ))}
            </View>
          </View>
        ) : null}

        {/* 空态 */}
        {!busy && events.length === 0 ? (
          <View className="mx-4 mt-6 items-center py-10">
            <Cpu size={20} color={C.gold} />
            <Text
              className="mt-3 text-[10px] tracking-[0.4em]"
              style={{ color: C.dim, fontFamily: 'monospace' }}
            >
              · 尚 无 星 体 被 捕 获 ·
            </Text>
            <Text
              className="mt-1 text-[10px] tracking-widest"
              style={{ color: C.dimmer, fontFamily: 'serif' }}
            >
              请点击右上「扫描」让 OS 抽取情绪
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* === 手动记录 Modal === */}
      <AddEventModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={load} />

      {/* === 怎么读 Modal === */}
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} readings={readings} />
    </Screen>
  );
}

/* ============================================================ */
/* === 子组件 =================================================== */
/* ============================================================ */

function CardHeader({ code, title, sub }: { code: string; title: string; sub: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-1.5">
        <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.live }} />
        <Text className="text-[9px] tracking-[0.3em]" style={{ color: C.live, fontFamily: 'monospace' }}>
          LIVE
        </Text>
      </View>
      <View className="items-center">
        <Text
          className="text-base tracking-[0.3em]"
          style={{ color: C.ivory, fontFamily: 'serif' }}
        >
          {title}
        </Text>
        <Text
          className="text-[9px] tracking-[0.4em] mt-0.5"
          style={{ color: C.dimmer, fontFamily: 'monospace' }}
        >
          {sub}
        </Text>
        <Text
          className="text-[8px] tracking-[0.3em] mt-1"
          style={{ color: C.borderDim, fontFamily: 'monospace' }}
        >
          {code}
        </Text>
      </View>
      <View className="w-9" />
    </View>
  );
}

function Starmap({ events }: { events: MoodEvent[] }) {
  // 自适应 2x2 四象限网格
  const size = Math.min(WIN_W - 64, 340);
  const half = size / 2;
  const PAD = 28;

  return (
    <View
      className="mt-4 self-center relative"
      style={{ width: size, height: size, borderColor: C.border, borderWidth: 1, borderRadius: 8 }}
    >
      {/* 4 象限背景 */}
      <View
        className="absolute"
        style={{
          left: half - 1, top: 0, width: 2, height: size, backgroundColor: C.grid,
        }}
      />
      <View
        className="absolute"
        style={{
          left: 0, top: half - 1, width: size, height: 2, backgroundColor: C.grid,
        }}
      />

      {/* 象限文字标签 */}
      <Text
        className="absolute text-[8px] tracking-widest"
        style={{ left: 4, top: 4, color: C.dimmer, fontFamily: 'monospace' }}
      >
        紧 张 / 焦 虑
      </Text>
      <Text
        className="absolute text-[8px] tracking-widest text-right"
        style={{ right: 4, top: 4, color: C.dimmer, fontFamily: 'monospace' }}
      >
        雀 跃 / 兴 奋
      </Text>
      <Text
        className="absolute text-[8px] tracking-widest"
        style={{ left: 4, bottom: 4, color: C.dimmer, fontFamily: 'monospace' }}
      >
        沮 丧 / 麻 木
      </Text>
      <Text
        className="absolute text-[8px] tracking-widest text-right"
        style={{ right: 4, bottom: 4, color: C.dimmer, fontFamily: 'monospace' }}
      >
        安 心 / 温 柔
      </Text>

      {/* 轴标签 */}
      <Text
        className="absolute -left-3 top-1/2 -translate-y-1/2 -rotate-90 text-[8px] tracking-[0.4em]"
        style={{ color: C.dim, fontFamily: 'monospace' }}
      >
        ·  激 烈
      </Text>
      <Text
        className="absolute -right-3 top-1/2 -translate-y-1/2 rotate-90 text-[8px] tracking-[0.4em]"
        style={{ color: C.dim, fontFamily: 'monospace' }}
      >
        ·  平 静
      </Text>
      <Text
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] tracking-[0.4em]"
        style={{ color: C.dim, fontFamily: 'monospace' }}
      >
        消 极
      </Text>
      <Text
        className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] tracking-[0.4em]"
        style={{ color: C.dim, fontFamily: 'monospace' }}
      >
        积 极
      </Text>

      {/* 星座连线（连临近点） */}
      <ConstellationLines events={events} size={size} />

      {/* 散点 */}
      {events.map((e, i) => {
        // x: valence 0-1 → 0..size ; y: 1-arousal 0-1 → 0..size
        const x = PAD + ((e.valence + 1) / 2) * (size - PAD * 2);
        const y = PAD + ((1 - e.arousal) / 2) * (size - PAD * 2);
        const r = 3 + e.intensity * 5;
        return (
          <View
            key={e.id}
            className="absolute items-center justify-center"
            style={{
              left: x - r,
              top: y - r,
              width: r * 2,
              height: r * 2,
            }}
          >
            <View
              className="rounded-full"
              style={{
                width: r * 2,
                height: r * 2,
                backgroundColor: e.colorTag,
                opacity: 0.85,
                shadowColor: e.colorTag,
                shadowOpacity: 0.9,
                shadowRadius: 6,
              }}
            />
            <View
              className="absolute rounded-full"
              style={{
                width: r * 4,
                height: r * 4,
                borderWidth: 1,
                borderColor: e.colorTag,
                opacity: 0.18,
              }}
            />
            {i === events.length - 1 ? (
              <Text
                className="absolute top-7 text-[8px] tracking-widest"
                style={{ color: C.ivory, fontFamily: 'serif' }}
              >
                {e.primaryZh}
              </Text>
            ) : null}
          </View>
        );
      })}

      {/* 若无数据：占位光点 */}
      {events.length === 0 ? (
        <View className="absolute inset-0 items-center justify-center">
          <View
            className="rounded-full"
            style={{
              width: 6, height: 6, backgroundColor: C.gold, opacity: 0.5,
              shadowColor: C.gold, shadowOpacity: 0.6, shadowRadius: 4,
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

function ConstellationLines({ events, size }: { events: MoodEvent[]; size: number }) {
  // 按时间顺序两两连线（最后一个 - 前一个）
  if (events.length < 2) return null;
  const PAD = 28;
  const pts = events.map((e) => ({
    x: PAD + ((e.valence + 1) / 2) * (size - PAD * 2),
    y: PAD + ((1 - e.arousal) / 2) * (size - PAD * 2),
  }));
  // 渲染：用一个绝对定位的 View 模拟折线（每段一段）
  return (
    <View className="absolute inset-0">
      {pts.slice(0, -1).map((p, i) => {
        const n = pts[i + 1];
        const dx = n.x - p.x;
        const dy = n.y - p.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ang = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View
            key={i}
            className="absolute"
            style={{
              left: p.x,
              top: p.y,
              width: len,
              height: 1,
              backgroundColor: C.gold,
              opacity: 0.4,
              transform: [{ translateY: -0.5 }, { rotateZ: `${ang}deg` }],
              transformOrigin: '0% 50%',
            }}
          />
        );
      })}
    </View>
  );
}

function ReadingBar({
  label, value, valueLabel, ratio, gradient, left, right,
}: {
  label: string; value: string | number; valueLabel?: string; ratio: number;
  gradient: string[]; left: string; right: string;
}) {
  // 简易进度条：4 段色块
  const segs = gradient.length;
  return (
    <View>
      <View className="flex-row items-baseline justify-between mb-1.5">
        <Text
          className="text-[10px] tracking-[0.4em]"
          style={{ color: C.gold, fontFamily: 'serif' }}
        >
          {label}
        </Text>
        <View className="flex-row items-baseline gap-2">
          <Text
            className="text-sm tracking-wider"
            style={{ color: C.ivory, fontFamily: 'monospace' }}
          >
            {value}
          </Text>
          {valueLabel ? (
            <Text
              className="text-[9px] tracking-widest"
              style={{ color: C.dim, fontFamily: 'serif' }}
            >
              {valueLabel}
            </Text>
          ) : null}
        </View>
      </View>
      <View className="flex-row gap-1 h-1.5">
        {Array.from({ length: segs }).map((_, i) => {
          const threshold = (i + 1) / segs;
          const lit = ratio >= threshold * 0.85;
          return (
            <View
              key={i}
              className="flex-1 rounded-full"
              style={{
                backgroundColor: lit ? gradient[i] : 'rgba(184,148,96,0.12)',
                shadowColor: lit ? gradient[i] : 'transparent',
                shadowOpacity: lit ? 0.5 : 0,
                shadowRadius: 4,
              }}
            />
          );
        })}
      </View>
      <View className="flex-row justify-between mt-1.5">
        <Text className="text-[8px] tracking-widest" style={{ color: C.dimmer, fontFamily: 'monospace' }}>
          {left}
        </Text>
        <Text className="text-[8px] tracking-widest" style={{ color: C.dimmer, fontFamily: 'monospace' }}>
          {right}
        </Text>
      </View>
    </View>
  );
}

function EventRow({ e, onDelete }: { e: MoodEvent; onDelete: () => void }) {
  const remove = () => {
    Alert.alert('确认', `删除「${e.primaryZh}」这条星体记录？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive', onPress: async () => {
          try {
            await mood.remove(e.id);
            onDelete();
          } catch (err: any) {
            Toast.show({ type: 'error', text1: err?.message });
          }
        },
      },
    ]);
  };
  return (
    <Pressable
      onLongPress={remove}
      className="rounded-xl p-3 flex-row items-start gap-3"
      style={{ backgroundColor: C.cardAlt, borderColor: C.borderDim, borderWidth: 1 }}
    >
      <View
        className="rounded-full mt-1"
        style={{
          width: 10, height: 10, backgroundColor: e.colorTag,
          shadowColor: e.colorTag, shadowOpacity: 0.6, shadowRadius: 4,
        }}
      />
      <View className="flex-1">
        <View className="flex-row items-baseline justify-between">
          <Text
            className="text-sm tracking-[0.3em]"
            style={{ color: C.ivory, fontFamily: 'serif' }}
          >
            {e.primaryZh}
            {e.secondaryZh ? (
              <Text
                className="text-[10px] tracking-widest"
                style={{ color: C.dim, fontFamily: 'serif' }}
              >
                {'  ·  '}
                {e.secondaryZh}
              </Text>
            ) : null}
          </Text>
          <Text
            className="text-[8px] tracking-widest"
            style={{ color: C.dimmer, fontFamily: 'monospace' }}
          >
            {fmtDate(e.createdAt)}
          </Text>
        </View>
        {e.constellation ? (
          <Text
            className="text-[10px] mt-1 tracking-widest"
            style={{ color: C.goldSoft, fontFamily: 'serif' }}
          >
            {e.constellation}
          </Text>
        ) : null}
        {e.note ? (
          <Text
            className="text-[11px] mt-1"
            style={{ color: C.dim, fontFamily: 'serif' }}
          >
            {e.note}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function AddEventModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [zh, setZh] = useState('');
  const [zh2, setZh2] = useState('');
  const [valence, setValence] = useState(0);
  const [arousal, setArousal] = useState(0);
  const [intensity, setIntensity] = useState(0.5);
  const [spectrum, setSpectrum] = useState<'G'>('G');
  const [constellation, setConstellation] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!zh.trim()) {
      Toast.show({ type: 'error', text1: '主情绪不能为空' });
      return;
    }
    setBusy(true);
    try {
      await mood.add({
        primaryZh: zh.trim(),
        secondaryZh: zh2.trim() || undefined,
        primaryLabel: 'manual',
        valence,
        arousal,
        intensity,
        spectrum,
        colorTag: SPECTRUM_COLORS[spectrum],
        constellation: constellation.trim() || undefined,
        note: note.trim() || undefined,
      });
      setZh(''); setZh2(''); setConstellation(''); setNote('');
      onClose();
      onSaved();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5"
          style={{ backgroundColor: C.card, borderTopColor: C.gold, borderTopWidth: 1 }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base tracking-[0.3em]" style={{ color: C.ivory, fontFamily: 'serif' }}>
              手 动 记 录
            </Text>
            <Pressable onPress={onClose} className="active:opacity-40">
              <X size={18} color={C.gold} />
            </Pressable>
          </View>

          <View className="gap-3">
            <OsInput label="主情绪" value={zh} onChange={setZh} placeholder="四字以内" />
            <OsInput label="次情绪" value={zh2} onChange={setZh2} placeholder="四字以内，可空" />
            <SliderRow label="效价" desc="消极 → 积极" value={valence} onChange={setValence} min={-1} max={1} />
            <SliderRow label="唤起" desc="平静 → 激烈" value={arousal} onChange={setArousal} min={-1} max={1} />
            <SliderRow label="强度" desc="暗 → 亮" value={intensity} onChange={setIntensity} min={0} max={1} />
            <SpectrumPicker value={spectrum} onChange={setSpectrum} />
            <OsInput label="星位" value={constellation} onChange={setConstellation} placeholder="如：心宿二 · 你的肩" />
            <OsInput label="情境" value={note} onChange={setNote} placeholder="≤30 字" />
          </View>

          <Pressable
            disabled={busy}
            onPress={submit}
            className="mt-5 rounded-xl py-3 flex-row items-center justify-center gap-2"
            style={{
              backgroundColor: 'rgba(184,148,96,0.18)',
              borderColor: C.gold,
              borderWidth: 1,
            }}
          >
            {busy ? <ActivityIndicator color={C.gold} /> : <Sparkles size={13} color={C.gold} />}
            <Text
              className="text-xs tracking-[0.4em]"
              style={{ color: C.ivory, fontFamily: 'serif' }}
            >
              收  入
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function OsInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (s: string) => void; placeholder?: string }) {
  return (
    <View>
      <Text className="text-[9px] tracking-[0.3em] mb-1" style={{ color: C.dimmer, fontFamily: 'monospace' }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.dimmer}
        className="rounded-md px-3 py-2"
        style={{
          backgroundColor: C.bgGrad,
          borderColor: C.borderDim,
          borderWidth: 1,
          color: C.ivory,
          fontFamily: 'serif',
          fontSize: 13,
        }}
      />
    </View>
  );
}

function SliderRow({ label, desc, value, onChange, min, max }: { label: string; desc: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  const ratio = max === min ? 0 : (value - min) / (max - min);
  return (
    <View>
      <View className="flex-row items-baseline justify-between mb-1">
        <Text className="text-[9px] tracking-[0.3em]" style={{ color: C.dimmer, fontFamily: 'monospace' }}>
          {label}  ·  {desc}
        </Text>
        <Text className="text-xs" style={{ color: C.ivory, fontFamily: 'monospace' }}>
          {value.toFixed(1)}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <View className="flex-1 h-1 rounded-full" style={{ backgroundColor: 'rgba(184,148,96,0.15)' }}>
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.max(0, Math.min(1, ratio)) * 100}%`,
              backgroundColor: C.gold,
              shadowColor: C.gold, shadowOpacity: 0.5, shadowRadius: 3,
            }}
          />
        </View>
        <View className="flex-row gap-1">
          <Pressable onPress={() => onChange(Math.max(min, +(value - 0.1).toFixed(1)))} className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(184,148,96,0.15)' }}>
            <Text style={{ color: C.gold, fontSize: 10 }}>−</Text>
          </Pressable>
          <Pressable onPress={() => onChange(Math.min(max, +(value + 0.1).toFixed(1)))} className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(184,148,96,0.15)' }}>
            <Text style={{ color: C.gold, fontSize: 10 }}>+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function SpectrumPicker({ value, onChange }: { value: 'G'; onChange: (s: any) => void }) {
  return (
    <View>
      <Text className="text-[9px] tracking-[0.3em] mb-1" style={{ color: C.dimmer, fontFamily: 'monospace' }}>
        光  谱
      </Text>
      <View className="flex-row gap-1">
        {(['O', 'B', 'A', 'F', 'G', 'K', 'M'] as const).map((s) => {
          const on = value === s;
          return (
            <Pressable
              key={s}
              onPress={() => onChange(s)}
              className="flex-1 items-center py-2 rounded-md"
              style={{
                backgroundColor: on ? 'rgba(184,148,96,0.18)' : C.bgGrad,
                borderColor: on ? C.gold : C.borderDim,
                borderWidth: 1,
              }}
            >
              <View
                className="w-3 h-3 rounded-full mb-1"
                style={{ backgroundColor: SPECTRUM_COLORS[s], shadowColor: SPECTRUM_COLORS[s], shadowOpacity: 0.6, shadowRadius: 3 }}
              />
              <Text className="text-[10px]" style={{ color: on ? C.ivory : C.dim, fontFamily: 'monospace' }}>
                {s}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function HelpModal({ open, onClose, readings }: { open: boolean; onClose: () => void; readings: MoodReadings | null }) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', paddingHorizontal: 24 }}
      >
        <View
          className="rounded-2xl p-5"
          style={{ backgroundColor: C.card, borderColor: C.gold, borderWidth: 1 }}
        >
          <Text
            className="text-base tracking-[0.3em] mb-3"
            style={{ color: C.ivory, fontFamily: 'serif' }}
          >
            怎 么 读 这 张 表
          </Text>
          {[
            ['光谱', '情绪的色温：O 灼蓝（激动爆发）→ M 翻涌（深沉的怨念/思念）'],
            ['光度', '情绪的整体亮度，强度 × 频次'],
            ['引力场', '效价（积极 / 消极）的绝对值，越大越把人拉向情绪'],
            ['磁场', '唤起度（平静 / 激烈）的强度，磁场越强情绪越有"回声"'],
            ['辐射', '正向情绪（valance > 0）的平均强度'],
          ].map(([k, v]) => (
            <View key={k} className="mb-2 flex-row gap-3">
              <Text
                className="text-[10px] tracking-[0.3em] mt-0.5 w-12"
                style={{ color: C.gold, fontFamily: 'serif' }}
              >
                {k}
              </Text>
              <Text
                className="flex-1 text-[11px] leading-5"
                style={{ color: C.dim, fontFamily: 'serif' }}
              >
                {v}
              </Text>
            </View>
          ))}
          <Text
            className="mt-2 text-[9px] tracking-widest"
            style={{ color: C.dimmer, fontFamily: 'monospace' }}
          >
            · 共 {readings?.eventCount ?? 0} 颗星体被纳入计算
          </Text>
          <Pressable
            onPress={onClose}
            className="mt-4 self-end px-3 py-1.5 rounded-md"
            style={{ borderColor: C.gold, borderWidth: 1 }}
          >
            <Text className="text-[10px] tracking-widest" style={{ color: C.gold, fontFamily: 'serif' }}>
              明 白 了
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

/* === 工具 === */

function filterByMonth(events: MoodEvent[], offset: number): MoodEvent[] {
  if (events.length === 0) return events;
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return events.filter((e) => {
    const d = new Date(e.createdAt);
    return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
  });
}

function filterByTab(events: MoodEvent[], tab: string): MoodEvent[] {
  // 按 tab 切换显示不同情绪切片
  switch (tab) {
    case 'memory':
      return events.filter((e) => e.intensity >= 0.55);
    case 'diary':
      return events.filter((e) => !!e.note);
    case 'axis':
      return events.filter((e) => Math.abs(e.valence) < 0.3);
    case 'lines':
      return events; // 保留全部以显连线
    case 'constellation':
      return events.filter((e) => !!e.constellation);
    case 'hr':
      return events.filter((e) => e.intensity >= 0.7);
    case 'mood':
    default:
      return events;
  }
}

function fmtMonth(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
}

function fmtTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
