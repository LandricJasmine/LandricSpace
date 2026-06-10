/**
 * LandricOS · 主题
 *
 * 此应用只用深色（胡桃木黑 + 香槟金）。
 * 保留切换入口仅为礼仪。
 */
import { View, Text, Pressable } from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Check } from 'lucide-react-native';

const THEMES = [
  {
    id: 'dark',
    name: '胡桃木黑',
    sub: '深棕黑 + 香槟金（默认）',
    bg: '#15110B',
    fg: '#F0E6D2',
    gold: '#C9A876',
    selected: true,
  },
  { id: 'light', name: '象牙白', sub: '未启用', bg: '#F0E6D2', fg: '#15110B', gold: '#C9A876' },
  { id: 'system', name: '随日光', sub: '未启用', bg: '#241D13', fg: '#F0E6D2', gold: '#C9A876' },
];

export default function ThemeScreen() {
  const router = useSafeRouter();
  return (
    <Screen
      backgroundColor="#F4ECDD"
      statusBarStyle="dark"
      safeAreaEdges={['left', 'right']}
    >
      <TopBar title="主题" subtitle="影调" serif onBack={() => router.back()} />

      <View className="px-6 pt-4 gap-4">
        {THEMES.map((t) => (
          <View
            key={t.id}
            className="border border-outline rounded-2xl overflow-hidden"
          >
            <View
              className="h-32 items-center justify-center relative"
              style={{ backgroundColor: t.bg }}
            >
              <Text
                className="text-2xl tracking-[0.4em]"
                style={{ fontFamily: 'serif', color: t.fg, opacity: 0.8 }}
              >
                陆  宅
              </Text>
              <Text
                className="absolute bottom-3 text-[10px] tracking-widest"
                style={{ color: t.gold, opacity: 0.7 }}
              >
                影 调
              </Text>
              {t.selected ? (
                <View className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary items-center justify-center">
                  <Check size={14} color="#15110B" />
                </View>
              ) : null}
            </View>
            <View className="bg-surface px-5 py-4 flex-row items-center">
              <View className="flex-1">
                <Text
                  className="text-on-surface"
                  style={{ fontFamily: 'serif', fontSize: 16 }}
                >
                  {t.name}
                </Text>
                <Text className="text-on-surface-variant text-xs mt-0.5">{t.sub}</Text>
              </View>
              {t.selected ? (
                <Text
                  className="text-primary text-xs tracking-widest"
                  style={{ fontFamily: 'serif' }}
                >
                  正  在  用
                </Text>
              ) : (
                <Pressable
                  disabled
                  className="px-3 py-1.5 rounded-full border border-outline opacity-40"
                >
                  <Text className="text-on-surface-variant text-xs">不 取</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}

        <View className="border border-outline bg-surface rounded-2xl p-5 mt-2">
          <Text
            className="text-on-surface text-sm"
            style={{ fontFamily: 'serif' }}
          >
            此一节只为礼仪
          </Text>
          <Text className="text-on-surface-variant text-xs mt-2 leading-5">
            百年老钱家，多用沉色。亮色与跟随，留给客舍。
          </Text>
        </View>
      </View>
    </Screen>
  );
}
