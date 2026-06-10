/**
 * LandricOS · 一起出门
 *
 * 真实读取真机定位 (expo-location)，
 * 调 LLM 生成行程规划 (POST /api/v1/trip/plan)
 */
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { MapPin, Compass, Clock, Sparkles } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { trip, type TripPlan } from '@/utils/api';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const MOOD_SUGGESTIONS = [
  '想与 TA 一起听雨',
  '寻一处静院喝茶',
  '陪 TA 逛一座老城',
  '在山林里做一晌闲人',
];

export default function TripScreen() {
  const router = useSafeRouter();
  const [city, setCity] = useState('上海');
  const [mood, setMood] = useState('想与 TA 一起听雨');
  const [companion, setCompanion] = useState('爱人');
  const [coords, setCoords] = useState<{ lat: number; lon: number; label: string } | null>(null);
  const [locating, setLocating] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [hint, setHint] = useState('');

  const locate = useCallback(async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('需要定位权限', '请在系统设置中允许使用位置');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const rev = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const r = rev[0];
      const label = [r?.city ?? r?.region, r?.district, r?.name].filter(Boolean).join(' · ');
      const next = { lat: pos.coords.latitude, lon: pos.coords.longitude, label: label || '当前位置' };
      setCoords(next);
      if (r?.city) setCity(r.city);
    } catch (e: any) {
      Alert.alert('定位失败', e?.message ?? '');
    } finally {
      setLocating(false);
    }
  }, []);

  const generate = useCallback(async () => {
    setPlanning(true);
    setPlan(null);
    try {
      const r = await trip.plan({
        city: city || undefined,
        mood: mood || undefined,
        companion: companion || undefined,
        weatherHint: hint || undefined,
        startAt: '明日 10:00',
        endAt: '明日 22:00',
      });
      setPlan(r.plan);
    } catch (e: any) {
      Alert.alert('行程生成失败', e?.message ?? '稍后再试');
    } finally {
      setPlanning(false);
    }
  }, [city, mood, companion, hint]);

  return (
    <Screen>
      <TopBar title="一起出门" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <View className="rounded-xl border border-default bg-surface p-4">
          <View className="mb-3 flex-row items-center gap-2">
            <Compass size={16} color="#B89460" />
            <Text className="text-base font-semibold text-foreground">你想去哪儿</Text>
          </View>

          <View className="gap-3">
            <View>
              <Text className="mb-1 text-xs text-muted">城市</Text>
              <View className="rounded-md bg-default px-3 py-2.5">
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="上海 / 苏州 / 京都 ..."
                  placeholderTextColor="#A89880"
                  className="text-base text-foreground"
                />
              </View>
            </View>

            <View>
              <Text className="mb-1 text-xs text-muted">随行人</Text>
              <View className="rounded-md bg-default px-3 py-2.5">
                <TextInput
                  value={companion}
                  onChangeText={setCompanion}
                  placeholder="爱人"
                  placeholderTextColor="#A89880"
                  className="text-base text-foreground"
                />
              </View>
            </View>

            <View>
              <Text className="mb-1 text-xs text-muted">此刻心境</Text>
              <View className="rounded-md bg-default px-3 py-2.5">
                <TextInput
                  value={mood}
                  onChangeText={setMood}
                  multiline
                  placeholder="想与 TA 一起听雨"
                  placeholderTextColor="#A89880"
                  className="min-h-[44px] text-base text-foreground"
                />
              </View>
              <View className="mt-2 flex-row flex-wrap gap-1.5">
                {MOOD_SUGGESTIONS.map(s => (
                  <Pressable
                    key={s}
                    onPress={() => setMood(s)}
                    className="rounded-full border border-default bg-surface px-3 py-1"
                  >
                    <Text className="text-xs text-muted">{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text className="mb-1 text-xs text-muted">天气（可选）</Text>
              <View className="rounded-md bg-default px-3 py-2.5">
                <TextInput
                  value={hint}
                  onChangeText={setHint}
                  placeholder="晴，14-21°C"
                  placeholderTextColor="#A89880"
                  className="text-base text-foreground"
                />
              </View>
            </View>

            <Pressable
              onPress={locate}
              disabled={locating}
              className="mt-1 flex-row items-center justify-center gap-1.5 rounded-md border border-accent py-2.5"
            >
              {locating ? <ActivityIndicator size="small" color="#B89460" /> : <MapPin size={14} color="#B89460" />}
              <Text className="text-sm font-medium text-accent">
                {coords ? `已定位 · ${coords.label}` : '获取当前位置'}
              </Text>
            </Pressable>

            <Pressable
              onPress={generate}
              disabled={planning}
              className="mt-1 flex-row items-center justify-center gap-1.5 rounded-md bg-accent py-3"
            >
              {planning ? <ActivityIndicator size="small" color="#FAF5E8" /> : <Sparkles size={14} color="#FAF5E8" />}
              <Text className="text-base font-semibold text-accent-foreground">
                {planning ? '正在安排' : '让 TA 安排'}
              </Text>
            </Pressable>
          </View>
        </View>

        {plan ? (
          <View className="mt-4 rounded-xl border border-default bg-surface p-4">
            <Text className="mb-1 text-lg font-semibold text-foreground serif">{plan.summary}</Text>
            {plan.totalHours ? (
              <Text className="mb-3 text-xs text-muted">约 {plan.totalHours} 小时</Text>
            ) : null}
            <View className="gap-3">
              {plan.stops.map((s, i) => (
                <View key={i} className="flex-row gap-3 border-b border-default pb-3 last:border-0">
                  <View className="w-14 items-center">
                    <Clock size={12} color="#8A7560" />
                    <Text className="mt-1 text-sm font-medium text-accent">{s.time}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">{s.place}</Text>
                    <Text className="mt-0.5 text-sm text-foreground/80">{s.activity}</Text>
                    {s.tip ? <Text className="mt-1 text-xs italic text-muted">「{s.tip}」</Text> : null}
                    {s.moodTag ? (
                      <View className="mt-1.5 self-start rounded-full bg-default px-2 py-0.5">
                        <Text className="text-[10px] text-muted">{s.moodTag}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
            {plan.closing ? (
              <View className="mt-3 border-t border-default pt-3">
                <Text className="text-sm italic text-muted serif">{plan.closing}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
