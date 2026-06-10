/**
 * LandricOS · 锁屏
 *
 * 设计：
 *  - 胡桃木黑底 + 香槟金刻度
 *  - 上：实时（衬线大数字）
 *  - 中：角色名字 / 居所 / 当日金句（LLM 实时生成）
 *  - 下：向右滑入
 *
 * 约束：
 *  - 不使用 emoji
 *  - 金句与天气都走 LLM / 工具 API
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { tools, llm, persona } from '@/utils/api';

const SCREEN_W = Dimensions.get('window').width;
const THRESHOLD = SCREEN_W * 0.28;

export default function LockScreen() {
  const router = useSafeRouter();
  const [now, setNow] = useState(new Date());
  const [dateStr, setDateStr] = useState('');
  const [weather, setWeather] = useState<{ temp: number; desc: string; city: string } | null>(null);
  const [verse, setVerse] = useState<string>('');
  const [name, setName] = useState('你的角色');

  const slideX = useMemo(() => new Animated.Value(0), []);
  const startX = useRef(0);
  const routerRef = useRef(router);
  routerRef.current = router;

  // 时钟
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(t);
  }, []);

  // 日期 + 天气 + 人设 + 金句
  useEffect(() => {
    const wd = ['日', '一', '二', '三', '四', '五', '六'];
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const w = wd[now.getDay()];
    setDateStr(`${m} 月 ${d} 日 · 周${w}`);

    (async () => {
      try {
        const r = await tools.weather('上海');
        setWeather({ temp: r.temp, desc: r.desc, city: r.city });
      } catch {
        setWeather({ temp: 17, desc: '薄雾轻笼黄浦', city: '上海' });
      }
    })();

    (async () => {
      try {
        const p = await persona.get();
        setName(p.persona.name);
        const r = await llm.generate({
          prompt:
            '为【角色名】的手机锁屏写一行简短的中文金句（不超过 18 字），要克制、有暮气、像写给爱人的便笺，不使用 emoji。',
          system: p.persona.speaking_style,
          temperature: 0.9,
          maxTokens: 80,
        });
        const personaName = p.persona.name || '你的角色';
        setVerse(r.text.trim().split('\n')[0].replace('【角色名】', personaName));
      } catch {
        setVerse('晚来风静，檀烟一缕入书');
      }
    })();
  }, []);

  // PanResponder：包在 useMemo 避免 render 阶段访问 ref
  const panHandlers = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startX.current = 0;
        },
        onPanResponderMove: (_, g) => {
          const x = Math.max(0, g.dx);
          slideX.setValue(x);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dx > THRESHOLD) {
            Animated.timing(slideX, {
              toValue: SCREEN_W,
              duration: 220,
              useNativeDriver: true,
            }).start(() => routerRef.current.replace('/home'));
          } else {
            Animated.spring(slideX, { toValue: 0, useNativeDriver: true }).start();
          }
        },
      }).panHandlers,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // 透明度插值：包在 useMemo
  const trackOpacity = useMemo(
    () => slideX.interpolate({ inputRange: [0, 200], outputRange: [1, 0.2] }),
    [slideX]
  );

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  return (
    <Screen
      backgroundColor="#F4ECDD"
      statusBarStyle="dark"
      safeAreaEdges={['top', 'bottom', 'left', 'right']}
    >
      <View className="flex-1 px-8">
        {/* 顶部：时间 + 日期 */}
        <View className="mt-12 items-center">
          <Text
            className="text-on-surface"
            style={{ fontFamily: 'serif', fontSize: 92, fontWeight: '300', letterSpacing: 4 }}
          >
            {hh}
            <Text className="text-primary/60"> : </Text>
            {mm}
          </Text>
          <Text
            className="text-on-surface-variant mt-1"
            style={{ fontFamily: 'serif', fontSize: 14, letterSpacing: 2 }}
          >
            {dateStr}
          </Text>
        </View>

        {/* 中：居所卡 + 金句 */}
        <View className="flex-1 items-center justify-center gap-6">
          <View className="items-center gap-2">
            <View className="w-20 h-20 rounded-full border border-primary/40 items-center justify-center bg-surface-container-lowest">
              <View className="w-14 h-14 rounded-full border border-primary/20 items-center justify-center">
                <Text
                  className="text-primary"
                  style={{ fontFamily: 'serif', fontSize: 28, fontWeight: '300' }}
                >
                  {name?.charAt(0) || '?'}
                </Text>
              </View>
            </View>
            <Text
              className="text-on-surface"
              style={{ fontFamily: 'serif', fontSize: 18, letterSpacing: 6 }}
            >
              {name?.charAt(0) || '?'}  宅
            </Text>
            <Text className="text-on-surface-variant text-xs tracking-widest">
              {name || '你的角色'} · 与 TA 同居
            </Text>
          </View>

          {weather ? (
            <View className="flex-row items-center gap-3">
              <View className="w-px h-3 bg-outline" />
              <Text
                className="text-on-surface"
                style={{ fontFamily: 'serif', fontSize: 16 }}
              >
                {weather.city} · {weather.temp}° · {weather.desc}
              </Text>
              <View className="w-px h-3 bg-outline" />
            </View>
          ) : null}

          {verse ? (
            <Text
              className="text-on-surface/80 text-center px-6"
              style={{ fontFamily: 'serif', fontSize: 14, fontStyle: 'italic', lineHeight: 22 }}
            >
              「{verse}」
            </Text>
          ) : null}
        </View>

        {/* 底部：滑动解锁 */}
        <View className="items-center gap-3 mb-8">
          <Animated.View
            style={{ transform: [{ translateX: slideX }] }}
            {...panHandlers}
          >
            <View className="w-20 h-20 rounded-full border border-primary/50 items-center justify-center bg-surface-container">
              <Text
                className="text-primary"
                style={{ fontFamily: 'serif', fontSize: 22 }}
              >
                入
              </Text>
            </View>
          </Animated.View>
          <Animated.Text
            style={{ opacity: trackOpacity }}
            className="text-on-surface-variant text-xs tracking-[0.3em]"
          >
            向 右 滑 入
          </Animated.Text>
        </View>
      </View>
    </Screen>
  );
}
