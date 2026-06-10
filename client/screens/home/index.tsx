/**
 * LandricOS · 桌面
 *
 * 宫格：4×N 应用 + 4 dock 图标
 * 顶部：实时 + 天气
 * 应用列表全部走硬编码（导航固定），点击进入对应 route
 */
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import {
  MessagesSquare,
  Users,
  Phone,
  Image as ImageIcon,
  NotebookPen,
  CalendarDays,
  CloudSun,
  Plane,
  Heart,
  Music4,
  Wallet,
  ShoppingBag,
  Globe,
  Settings as SettingsIcon,
  Info,
  MapPin,
  Cpu,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { tools, persona, type Persona } from '@/utils/api';

interface AppItem {
  name: string;
  subtitle: string;
  Icon: typeof Info;
  href: string;
  gold?: boolean;
}

const APPS: AppItem[] = [
  { name: '消息', subtitle: '与她说', Icon: MessagesSquare, href: '/messages' },
  { name: '电话', subtitle: '听她声', Icon: Phone, href: '/call' },
  { name: '通讯录', subtitle: '来往人', Icon: Users, href: '/contacts' },
  { name: '朋友圈', subtitle: '灯火处', Icon: MapPin, href: '/moments' },
  { name: '一起出门', subtitle: '与她行', Icon: Plane, href: '/trip' },
  { name: '天气', subtitle: '知阴晴', Icon: CloudSun, href: '/weather' },
  { name: '日历', subtitle: '约与被约', Icon: CalendarDays, href: '/calendar' },
  { name: '备忘', subtitle: '琐碎事', Icon: NotebookPen, href: '/notes' },
  { name: '健康', subtitle: '体温心', Icon: Heart, href: '/health' },
  { name: '听曲', subtitle: '声缓缓', Icon: Music4, href: '/music' },
  { name: '相册', subtitle: '拾光影', Icon: ImageIcon, href: '/photos' },
  { name: '账簿', subtitle: '银钱事', Icon: Wallet, href: '/wallet' },
  { name: '采买', subtitle: '应季物', Icon: ShoppingBag, href: '/shop' },
  { name: '看报', subtitle: '天下事', Icon: Globe, href: '/browser' },
  { name: '情绪OS', subtitle: 'ACHERNAR', Icon: Cpu, href: '/mood', gold: true },
  { name: '设置', subtitle: '调一调', Icon: SettingsIcon, href: '/settings', gold: true },
  { name: '关于', subtitle: '此中人', Icon: Info, href: '/about' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const [now, setNow] = useState(new Date());
  const [w, setW] = useState<{ temp: number; desc: string; city: string } | null>(null);
  const [who, setWho] = useState<Persona | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const x = await tools.weather('上海');
        setW({ temp: x.temp, desc: x.desc, city: x.city });
      } catch {
        setW({ temp: 18, desc: '暮霭沉沉', city: '上海' });
      }
      try {
        const p = await persona.get();
        setWho(p.persona);
      } catch {}
    })();
  }, []);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  return (
    <Screen
      backgroundColor="#F4ECDD"
      statusBarStyle="dark"
      safeAreaEdges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 顶部信息条 */}
        <View className="px-6 pt-3 pb-6">
          <View className="flex-row items-baseline justify-between">
            <View>
              <Text
                className="text-on-surface"
                style={{ fontFamily: 'serif', fontSize: 36, fontWeight: '300' }}
              >
                {hh}
                <Text className="text-primary/50"> : </Text>
                {mm}
              </Text>
              <Text
                className="text-on-surface-variant text-xs tracking-widest mt-1"
                style={{ fontFamily: 'serif' }}
              >
                {now.getMonth() + 1} 月 {now.getDate()} 日
              </Text>
            </View>
            {w ? (
              <View className="items-end">
                <Text
                  className="text-on-surface"
                  style={{ fontFamily: 'serif', fontSize: 18 }}
                >
                  {w.temp}°
                </Text>
                <Text className="text-on-surface-variant text-[10px] tracking-wider mt-0.5">
                  {w.city} · {w.desc}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* 标题卡 */}
        <View className="px-6 mb-6">
          <View className="border border-outline bg-surface rounded-2xl p-5 flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-full border border-primary/40 items-center justify-center bg-surface-container-lowest">
              <Text
                className="text-primary"
                style={{ fontFamily: 'serif', fontSize: 18, fontWeight: '300' }}
              >
                {who?.name?.charAt(0) || '?'}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-on-surface"
                style={{ fontFamily: 'serif', fontSize: 16, letterSpacing: 4 }}
              >
                {who?.name?.charAt(0) || '?'}  宅
              </Text>
              <Text className="text-on-surface-variant text-xs mt-0.5">
                {who ? who.name : '你的角色'} · 与 TA 共享一宅
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={10}
              className="px-3 py-1.5 rounded-full border border-primary/30 active:opacity-60"
            >
              <Text
                className="text-primary text-xs"
                style={{ fontFamily: 'serif', letterSpacing: 2 }}
              >
                调 设
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 应用宫格 */}
        <View className="px-4">
          <View className="flex-row flex-wrap">
            {APPS.map((app) => (
              <Pressable
                key={app.href}
                onPress={() => router.push(app.href as any)}
                className="w-1/4 aspect-square items-center justify-center gap-1.5 active:opacity-60"
              >
                <View
                  className={`w-12 h-12 rounded-2xl items-center justify-center border ${
                    app.gold
                      ? 'bg-primary/10 border-primary/40'
                      : 'bg-surface-container border-outline'
                  }`}
                >
                  <app.Icon size={20} color={app.gold ? '#C9A876' : '#A89878'} />
                </View>
                <Text
                  className="text-on-surface text-[11px]"
                  style={{ fontFamily: 'serif' }}
                >
                  {app.name}
                </Text>
                <Text className="text-on-surface-variant text-[9px] tracking-wider">
                  {app.subtitle}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
