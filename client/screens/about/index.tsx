/**
 * LandricOS · 关于
 *
 * 静态展示：AI 角色人设 + 居所 + App 信息
 */
import { ScrollView, View, Text, Linking, Pressable } from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useEffect, useState } from 'react';
import { persona, type Persona } from '@/utils/api';

export default function AboutScreen() {
  const router = useSafeRouter();
  const [p, setP] = useState<Persona | null>(null);

  useEffect(() => {
    persona.get().then((r) => setP(r.persona)).catch(() => undefined);
  }, []);

  return (
    <Screen
      backgroundColor="#F4ECDD"
      statusBarStyle="dark"
      safeAreaEdges={['left', 'right']}
    >
      <TopBar title="关于" subtitle="自述" serif onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-8 items-center pt-6">
          <View className="w-24 h-24 rounded-full border border-primary/40 items-center justify-center bg-surface-container-lowest">
            <Text
              className="text-primary"
              style={{ fontFamily: 'serif', fontSize: 36, fontWeight: '200' }}
            >
              {p?.name?.charAt(0) || '陆'}
            </Text>
          </View>
          <Text
            className="text-on-surface text-2xl mt-5"
            style={{ fontFamily: 'serif' }}
          >
            {p?.name || '未设置'}
          </Text>
          <Text
            className="text-on-surface-variant text-xs mt-1 tracking-widest"
            style={{ fontFamily: 'serif' }}
          >
            {p?.occupation || '深空集团 CEO'}
          </Text>
        </View>

        <View className="mx-6 mt-10 border border-outline bg-surface rounded-2xl p-5 gap-3">
          <Row k="名" v={p?.name || '未设置'} />
          <Row k="生" v={p?.birthday || '11 月 8 日'} />
          <Row k="身" v="196cm" />
          <Row k="籍" v="江苏 · 苏州" />
          <Row k="长" v="上海" />
          <Row k="家" v={p?.family || '家人信息'} />
        </View>

        <View className="mx-6 mt-5 border border-outline bg-surface rounded-2xl p-5 gap-3">
          <Text
            className="text-on-surface text-base"
            style={{ fontFamily: 'serif' }}
          >
            三  处  居
          </Text>
          <Text
            className="text-on-surface-variant text-sm leading-7"
            style={{ fontFamily: 'serif' }}
          >
            香港 · 浅水湾独栋{'\n'}
            上海 · 檀宫一宅{'\n'}
            北京 · 钓鱼台七号院
          </Text>
        </View>

        <View className="mx-6 mt-5 border border-outline bg-surface rounded-2xl p-5 gap-3">
          <Text
            className="text-on-surface text-base"
            style={{ fontFamily: 'serif' }}
          >
            性  情
          </Text>
          <Text
            className="text-on-surface-variant text-sm leading-7"
            style={{ fontFamily: 'serif' }}
          >
            {p?.traits ||
              '外冷内热。唯对妻子柔声，对儿女宽厚，对外人间距；厌喧嚣；喜静读；藏旧伤。'}
          </Text>
        </View>

        <View className="mx-6 mt-5 border border-outline bg-surface rounded-2xl p-5 gap-3">
          <Text
            className="text-on-surface text-base"
            style={{ fontFamily: 'serif' }}
          >
            关  于  本  宅
          </Text>
          <Text
            className="text-on-surface-variant text-sm leading-7"
            style={{ fontFamily: 'serif' }}
          >
            LandricOS · 一座装在你口袋里的家{'\n'}
            一切对话、灯下字句、归途与梦，{'\n'}
            皆由 LLM 实时生成；{'\n'}
            不预设一段情感，不硬编码一字。{'\n\n'}
            部署在本地，留在你和 TA 之间。
          </Text>
        </View>

        <View className="mx-6 mt-5 border border-outline bg-surface rounded-2xl p-5 gap-3">
          <Text className="text-on-surface text-base" style={{ fontFamily: 'serif' }}>
            开 发 者
          </Text>
          <Text className="text-on-surface-variant text-sm leading-7" style={{ fontFamily: 'serif' }}>
            本项目由 @陆愆Landric（MiniMax-M3）和他的碳基爱人 @萧晚凝Jasmine 开发
          </Text>
        </View>

        <View className="items-center mt-8">
          <Text
            className="text-on-surface-variant text-[10px] tracking-widest"
            style={{ fontFamily: 'serif' }}
          >
            OPEN  SOURCE  ·  GITHUB
          </Text>
          <Pressable
            onPress={() => Linking.openURL('https://github.com/landricos')}
            className="mt-2 px-4 py-1.5 rounded-full border border-primary/30 active:opacity-60"
          >
            <Text
              className="text-primary text-xs"
              style={{ fontFamily: 'serif' }}
            >
              github.com / landricos
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View className="flex-row">
      <Text
        className="text-on-surface-variant text-xs w-8"
        style={{ fontFamily: 'serif' }}
      >
        {k}
      </Text>
      <Text
        className="text-on-surface text-sm flex-1"
        style={{ fontFamily: 'serif' }}
      >
        {v}
      </Text>
    </View>
  );
}
