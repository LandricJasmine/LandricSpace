/**
 * LandricOS · 设置
 *
 * 列表分组：账号 / 模型 / 人设 / 主题 / 关于
 * 每行带 chevron 跳到对应 page
 */
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { ChevronRight, KeyRound, User, Palette, Info, ShieldCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { config, persona } from '@/utils/api';

const SECTIONS: {
  title: string;
  rows: { label: string; hint: string; Icon: any; href: string; danger?: boolean }[];
}[] = [
  {
    title: '模型',
    rows: [{ label: 'API 密钥与底座', hint: 'OpenAI 兼容端点', Icon: KeyRound, href: '/api-config' }],
  },
  {
    title: '人设',
    rows: [
      { label: 'AI 角色', hint: '姓名、籍贯、口吻、性情', Icon: User, href: '/persona' },
      { label: '主题', hint: '深色为默认', Icon: Palette, href: '/theme' },
    ],
  },
  {
    title: '其他',
    rows: [
      { label: '关于此宅', hint: '为何做此应用', Icon: Info, href: '/about' },
      { label: '安全须知', hint: '本地优先，数据自存', Icon: ShieldCheck, href: '/about' },
    ],
  },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const [mask, setMask] = useState<string>('未配');
  const [who, setWho] = useState<Awaited<ReturnType<typeof persona.get>>['persona'] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const c = await config.get();
        setMask(c.api_key_set ? c.api_key_masked : '未配');
      } catch {}
      try {
        const p = await persona.get();
        setWho(p.persona);
      } catch {}
    })();
  }, []);

  return (
    <Screen
      backgroundColor="#F4ECDD"
      statusBarStyle="dark"
      safeAreaEdges={['left', 'right']}
    >
      <TopBar title="调设" subtitle="此宅之内" serif onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 当前状态卡 */}
        <View className="px-6 mt-2 mb-6">
          <View className="border border-outline bg-surface rounded-2xl p-5">
            <Text
              className="text-on-surface"
              style={{ fontFamily: 'serif', fontSize: 18, letterSpacing: 4 }}
            >
              陆  宅
            </Text>
            <Text className="text-on-surface-variant text-xs mt-1">
              {who ? `${who.name || '未设置'} · ${who.age || ''} · ${who.birthday || ''}` : '你的角色信息'}
            </Text>
            <View className="mt-4 flex-row gap-6">
              <View>
                <Text
                  className="text-on-surface"
                  style={{ fontFamily: 'serif', fontSize: 20 }}
                >
                  {mask}
                </Text>
                <Text className="text-on-surface-variant text-[10px] mt-0.5 tracking-widest">
                  API KEY
                </Text>
              </View>
              <View>
                <Text
                  className="text-on-surface"
                  style={{ fontFamily: 'serif', fontSize: 20 }}
                >
                  深 色
                </Text>
                <Text className="text-on-surface-variant text-[10px] mt-0.5 tracking-widest">
                  THEME
                </Text>
              </View>
            </View>
          </View>
        </View>

        {SECTIONS.map((sec) => (
          <View key={sec.title} className="px-6 mb-6">
            <Text
              className="text-on-surface-variant text-[10px] tracking-[0.3em] mb-2"
              style={{ fontFamily: 'serif' }}
            >
              {sec.title.toUpperCase()}
            </Text>
            <View className="border border-outline bg-surface rounded-2xl overflow-hidden">
              {sec.rows.map((r, i) => (
                <Pressable
                  key={r.href + r.label}
                  onPress={() => router.push(r.href as any)}
                  className={`flex-row items-center px-4 py-3.5 active:opacity-60 ${
                    i < sec.rows.length - 1 ? 'border-b border-outline' : ''
                  }`}
                >
                  <View className="w-8 h-8 rounded-lg bg-surface-container-low border border-outline items-center justify-center mr-3">
                    <r.Icon size={14} color="#C9A876" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-on-surface text-[15px]">{r.label}</Text>
                    <Text className="text-on-surface-variant text-[11px] mt-0.5">{r.hint}</Text>
                  </View>
                  <ChevronRight size={16} color="#A89878" />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
