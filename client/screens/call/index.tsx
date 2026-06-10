/**
 * LandricOS · 通话
 *
 * 模拟一次电话呼入：选择联系人 → 拨号 / 接通 → 模拟对方说话的滚动字幕
 * 字幕由 LLM 实时生成
 */
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { contacts, llm, persona, type Contact } from '@/utils/api';
import { Phone, PhoneOff, Mic, MicOff, PhoneIncoming } from 'lucide-react-native';

type Phase = 'pick' | 'dialing' | 'talking' | 'ended';
type Line = { id: number; side: 'them' | 'self'; text: string };

export default function CallScreen() {
  const router = useSafeRouter();
  const [phase, setPhase] = useState<Phase>('pick');
  const [cs, setCs] = useState<Contact[]>([]);
  const [who, setWho] = useState<Contact | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [muted, setMuted] = useState(false);
  const [sec, setSec] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const counter = useRef<ReturnType<typeof setInterval> | null>(null);
  const feed = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { contacts: list } = await contacts.list();
        setCs(list.filter((c: Contact) => !c.is_self));
      } catch {}
    })();
  }, []);

  // 通话计时
  useEffect(() => {
    if (phase === 'talking') {
      counter.current = setInterval(() => setSec((s) => s + 1), 1000);
    }
    return () => {
      if (counter.current) clearInterval(counter.current);
    };
  }, [phase]);

  // 模拟对方持续说话
  useEffect(() => {
    if (phase !== 'talking' || !who) return;
    let n = 0;
    const loop = async () => {
      try {
        let sys = '';
        if (who.is_self) {
          const p = await persona.get();
          sys = `你是 ${p.persona.name}。口吻：${p.persona.speaking_style}。`;
        } else {
          sys = `你是 ${who.name}，${who.role}，${who.relation}。电话口吻，3 句以内。`;
        }
        const r = await llm.generate({
          prompt: `你正在与爱人通电话（这是第 ${++n} 句），请说一句不超过 30 字的关切。`,
          system: sys,
          temperature: 0.95,
          maxTokens: 80,
        });
        const txt = r.text.trim().split('\n')[0];
        setLines((p) => [...p, { id: Date.now() + n, side: 'them', text: txt }]);
        feed.current = setTimeout(loop, 4500);
      } catch {
        feed.current = setTimeout(loop, 4500);
      }
    };
    loop();
    return () => {
      if (feed.current) clearTimeout(feed.current);
    };
  }, [phase, who]);

  const start = (c: Contact) => {
    setWho(c);
    setPhase('dialing');
    setTimeout(() => setPhase('talking'), 1500);
  };

  const end = () => {
    if (feed.current) clearTimeout(feed.current);
    if (counter.current) clearInterval(counter.current);
    setPhase('ended');
  };

  const back = () => {
    if (feed.current) clearTimeout(feed.current);
    if (counter.current) clearInterval(counter.current);
    router.back();
  };

  // === 拨号/接通/结束 ===
  if (phase !== 'pick') {
    return (
      <Screen
        backgroundColor="#F4ECDD"
        statusBarStyle="dark"
        safeAreaEdges={['top', 'bottom', 'left', 'right']}
      >
        <View className="flex-1 px-8">
          <View className="items-center mt-16 gap-4">
            <View className="w-28 h-28 rounded-full border border-primary/40 items-center justify-center bg-surface-container-lowest">
              <Text
                className="text-primary"
                style={{ fontFamily: 'serif', fontSize: 40, fontWeight: '300' }}
              >
                {who?.name.charAt(0)}
              </Text>
            </View>
            <Text
              className="text-on-surface"
              style={{ fontFamily: 'serif', fontSize: 22, letterSpacing: 4 }}
            >
              {who?.name}
            </Text>
            <Text className="text-on-surface-variant text-xs tracking-widest">
              {phase === 'dialing'
                ? '呼 叫 中 . . .'
                : phase === 'talking'
                  ? `通 话 中 · ${fmt(sec)}`
                  : '已 结 束'}
            </Text>
          </View>

          {phase === 'talking' ? (
            <View className="mt-6 flex-1">
              <ScrollView
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              >
                {lines.length === 0 ? (
                  <View className="items-center py-12">
                    <ActivityIndicator color="#C9A876" />
                    <Text
                      className="text-on-surface-variant text-xs mt-2"
                      style={{ fontFamily: 'serif' }}
                    >
                      正在听对方开腔
                    </Text>
                  </View>
                ) : (
                  lines.map((l) => (
                    <View
                      key={l.id}
                      className={`flex-row my-1.5 ${l.side === 'them' ? 'justify-start' : 'justify-end'}`}
                    >
                      <View
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                          l.side === 'them'
                            ? 'bg-surface-container border border-outline rounded-tl-sm'
                            : 'bg-primary/10 border border-primary/30 rounded-tr-sm'
                        }`}
                      >
                        <Text
                          className="text-on-surface text-[15px] leading-6"
                          style={{ fontFamily: 'serif' }}
                        >
                          {l.text}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          ) : null}

          {/* 控制条 */}
          <View className="items-center gap-6 mb-10">
            {phase === 'talking' ? (
              <View className="flex-row gap-8">
                <Pressable
                  onPress={() => setMuted((m) => !m)}
                  className="w-14 h-14 rounded-full bg-surface-container border border-outline items-center justify-center active:opacity-60"
                >
                  {muted ? <MicOff size={20} color="#C9A876" /> : <Mic size={20} color="#C9A876" />}
                </Pressable>
                <Pressable
                  onPress={end}
                  className="w-16 h-16 rounded-full bg-error items-center justify-center active:opacity-60"
                >
                  <PhoneOff size={24} color="#F0E6D2" />
                </Pressable>
                <View className="w-14 h-14 rounded-full bg-surface-container border border-outline items-center justify-center opacity-40">
                  <PhoneIncoming size={20} color="#A89878" />
                </View>
              </View>
            ) : phase === 'ended' ? (
              <View className="items-center gap-4">
                <Text
                  className="text-on-surface-variant text-sm"
                  style={{ fontFamily: 'serif' }}
                >
                  通 话 {fmt(sec)}
                </Text>
                <Pressable
                  onPress={back}
                  className="px-6 py-2.5 rounded-full border border-primary active:opacity-60"
                >
                  <Text
                    className="text-primary text-sm"
                    style={{ fontFamily: 'serif', letterSpacing: 2 }}
                  >
                    收 线
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Screen>
    );
  }

  // === 选择联系人 ===
  return (
    <Screen
      backgroundColor="#F4ECDD"
      statusBarStyle="dark"
      safeAreaEdges={['left', 'right']}
    >
      <TopBar title="电话" subtitle="听其声" serif onBack={() => router.back()} />
      <FlatList
        data={cs}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text
            className="text-on-surface-variant text-sm text-center py-12"
            style={{ fontFamily: 'serif' }}
          >
            通讯录尚空
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => start(item)}
            className="flex-row items-center gap-3 py-3 border-b border-outline active:opacity-60"
          >
            <View className="w-11 h-11 rounded-full border border-primary/30 bg-surface-container-low items-center justify-center">
              <Text
                className="text-primary"
                style={{ fontFamily: 'serif', fontSize: 16 }}
              >
                {item.name.charAt(0)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-on-surface text-[15px]">{item.name}</Text>
              <Text className="text-on-surface-variant text-xs mt-0.5">{item.role}</Text>
            </View>
            <View className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 items-center justify-center">
              <Phone size={14} color="#C9A876" />
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

function fmt(s: number) {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
}
