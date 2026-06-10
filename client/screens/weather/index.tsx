/**
 * LandricOS · 天气
 */
import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { tools, llm } from '@/utils/api';
import { Search, Sparkles } from 'lucide-react-native';

type W = { city: string; temp: number; desc: string; humidity: number; wind: string; date: string };

export default function WeatherScreen() {
  const router = useSafeRouter();
  const [city, setCity] = useState('上海');
  const [w, setW] = useState<W | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string>('');
  const [askBusy, setAskBusy] = useState(false);

  const load = async (c: string) => {
    setBusy(true);
    setNote('');
    try {
      const r = await tools.weather(c);
      setW(r);
    } catch (e: any) {
      setW(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load(city);
  }, []);

  const ask = async () => {
    if (!w) return;
    setAskBusy(true);
    try {
      const r = await llm.generate({
        prompt: `${w.city} 当前 ${w.temp}°C，${w.desc}，湿度 ${w.humidity}%，${w.wind}。请以角色的口吻为爱人写一段简短的出行建议（不超过 60 字，不用 emoji）。`,
        temperature: 0.9,
        maxTokens: 100,
      });
      setNote(r.text.trim().split('\n').join(' '));
    } catch (e: any) {
      setNote(`（未成：${e?.message || '未知'}）`);
    } finally {
      setAskBusy(false);
    }
  };

  return (
    <Screen
      backgroundColor="#F4ECDD"
      statusBarStyle="dark"
      safeAreaEdges={['left', 'right']}
    >
      <TopBar title="天气" subtitle="知阴晴" serif onBack={() => router.back()} />
      <View className="px-6 pt-4">
        <View className="flex-row items-center border border-outline bg-surface rounded-2xl px-4 py-1">
          <Search size={14} color="#A89878" />
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="城市名"
            placeholderTextColor="#6B5D45"
            className="flex-1 text-on-surface text-[15px] py-3 ml-2"
            onSubmitEditing={() => load(city)}
            returnKeyType="search"
            selectionColor="#C9A876"
          />
          <Pressable
            onPress={() => load(city)}
            className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 active:opacity-60"
          >
            <Text
              className="text-primary text-xs"
              style={{ fontFamily: 'serif' }}
            >
              查
            </Text>
          </Pressable>
        </View>

        {busy ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#C9A876" />
          </View>
        ) : w ? (
          <View className="mt-8 items-center">
            <Text
              className="text-on-surface-variant text-xs tracking-widest"
              style={{ fontFamily: 'serif' }}
            >
              {w.city}
            </Text>
            <Text
              className="text-on-surface mt-3"
              style={{ fontFamily: 'serif', fontSize: 96, fontWeight: '200' }}
            >
              {w.temp}°
            </Text>
            <Text
              className="text-on-surface text-base mt-1"
              style={{ fontFamily: 'serif' }}
            >
              {w.desc}
            </Text>
            <View className="mt-6 flex-row gap-8">
              <Stat label="湿 度" value={`${w.humidity}%`} />
              <Stat label="风" value={w.wind} />
            </View>
            <Text className="text-on-surface-variant text-[10px] mt-8 tracking-widest">
              {w.date}
            </Text>

            <Pressable
              onPress={ask}
              disabled={askBusy}
              className="mt-10 px-5 py-2.5 rounded-full border border-primary/30 active:opacity-60 flex-row items-center gap-2"
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
                    问 一 句 出 行 事
                  </Text>
                </>
              )}
            </Pressable>

            {note ? (
              <View className="mt-5 self-stretch border border-outline bg-surface rounded-2xl p-5">
                <Text
                  className="text-on-surface text-sm leading-7"
                  style={{ fontFamily: 'serif' }}
                >
                  {note}
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View className="mt-12 items-center">
            <Text
              className="text-on-surface-variant text-sm"
              style={{ fontFamily: 'serif' }}
            >
              未 查 得
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text
        className="text-on-surface"
        style={{ fontFamily: 'serif', fontSize: 20 }}
      >
        {value}
      </Text>
      <Text
        className="text-on-surface-variant text-[10px] mt-1 tracking-widest"
        style={{ fontFamily: 'serif' }}
      >
        {label}
      </Text>
    </View>
  );
}
