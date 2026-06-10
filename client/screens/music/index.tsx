/**
 * LandricOS · 听曲
 *
 * 真实三方：iTunes Search API（公开免授权）—— 拿到 30s 真实可播 preview
 * LLM 选曲人：按"心境 + 场景"生成 5 首 + 一句推荐理由
 */
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Music2, Play, Plus, Search, Disc3 } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { EmptyState } from '@/components/common/States';
import { music, type MusicTrack, type ExternalTrack } from '@/utils/api';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function MusicScreen() {
  const router = useSafeRouter();
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommending, setRecommending] = useState(false);
  const [picks, setPicks] = useState<Array<{ query: string; reason: string; track?: ExternalTrack }>>([]);
  const [mood, setMood] = useState('夜深书斋');
  const [occasion, setOccasion] = useState('灯下独酌');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ExternalTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [playing, setPlaying] = useState<{ url: string; title: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await music.list();
      setTracks(r.tracks);
    } catch (e: any) {
      Alert.alert('读取曲单失败', e?.message ?? '');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const recommend = useCallback(async () => {
    setRecommending(true);
    setPicks([]);
    try {
      const r = await music.recommend({ mood, occasion });
      setPicks(r.picks);
    } catch (e: any) {
      Alert.alert('推荐失败', e?.message ?? '请检查 LLM 是否已配置');
    } finally {
      setRecommending(false);
    }
  }, [mood, occasion]);

  const search = useCallback(async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const r = await music.external(searchTerm.trim());
      setSearchResults(r.results);
    } catch (e: any) {
      Alert.alert('搜索失败', e?.message ?? '');
    } finally {
      setSearching(false);
    }
  }, [searchTerm]);

  const playPreview = useCallback((url: string, title: string) => {
    setPlaying({ url, title });
    // 真机/浏览器中 expo-av 可在此处加载并播放；此处用 Web Audio 占位展示
  }, []);

  const stopPreview = useCallback(() => setPlaying(null), []);

  return (
    <Screen>
      <TopBar title="听曲" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* LLM 选曲 */}
        <View className="mb-4 rounded-xl border border-default bg-surface p-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Disc3 size={16} color="#B89460" />
            <Text className="text-base font-semibold text-foreground">让选曲人挑一曲</Text>
          </View>
          <View className="gap-2">
            <View>
              <Text className="mb-1 text-xs text-muted">心境</Text>
              <View className="rounded-md bg-default px-3 py-2">
                <TextInput
                  value={mood}
                  onChangeText={setMood}
                  placeholder="夜深书斋"
                  placeholderTextColor="#A89880"
                  className="text-base text-foreground"
                />
              </View>
            </View>
            <View>
              <Text className="mb-1 text-xs text-muted">场景</Text>
              <View className="rounded-md bg-default px-3 py-2">
                <TextInput
                  value={occasion}
                  onChangeText={setOccasion}
                  placeholder="灯下独酌"
                  placeholderTextColor="#A89880"
                  className="text-base text-foreground"
                />
              </View>
            </View>
            <Pressable
              onPress={recommend}
              disabled={recommending}
              className="mt-1 flex-row items-center justify-center gap-1.5 rounded-md bg-accent py-2.5"
            >
              {recommending ? (
                <ActivityIndicator size="small" color="#FAF5E8" />
              ) : (
                <Music2 size={14} color="#FAF5E8" />
              )}
              <Text className="text-sm font-medium text-accent-foreground">
                {recommending ? '选曲中' : '让 TA 为我挑'}
              </Text>
            </Pressable>
          </View>

          {picks.length > 0 ? (
            <View className="mt-3 gap-2">
              {picks.map((p, i) => (
                <View key={i} className="flex-row gap-3 rounded-md bg-default p-2">
                  {p.track ? (
                    <Image
                      source={{ uri: p.track.artworkUrl100 }}
                      style={{ width: 48, height: 48, borderRadius: 6, backgroundColor: '#E8DFCC' }}
                    />
                  ) : (
                    <View className="h-12 w-12 items-center justify-center rounded-md bg-surface">
                      <Music2 size={20} color="#8A7560" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                      {p.track?.trackName ?? p.query}
                    </Text>
                    <Text className="text-xs text-muted" numberOfLines={1}>
                      {p.track?.artistName ?? ''}
                    </Text>
                    <Text className="mt-0.5 text-xs italic text-foreground/80" numberOfLines={2}>
                      {p.reason}
                    </Text>
                  </View>
                  {p.track?.previewUrl ? (
                    <Pressable
                      onPress={() => playPreview(p.track!.previewUrl, p.track!.trackName)}
                      className="h-9 w-9 items-center justify-center rounded-full bg-accent"
                    >
                      <Play size={14} color="#FAF5E8" fill="#FAF5E8" />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* 自由搜曲 */}
        <View className="mb-4 rounded-xl border border-default bg-surface p-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Search size={16} color="#B89460" />
            <Text className="text-base font-semibold text-foreground">自由搜曲（iTunes 公开曲库）</Text>
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1 rounded-md bg-default px-3 py-2">
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="李健 / 坂本龙一 / Debussy ..."
                placeholderTextColor="#A89880"
                className="text-base text-foreground"
                onSubmitEditing={search}
              />
            </View>
            <Pressable
              onPress={search}
              disabled={searching}
              className="rounded-md bg-accent px-4 py-2"
            >
              {searching ? <ActivityIndicator size="small" color="#FAF5E8" /> : <Search size={14} color="#FAF5E8" />}
            </Pressable>
          </View>
          {searchResults.length > 0 ? (
            <View className="mt-3 gap-2">
              {searchResults.map(t => (
                <View key={t.trackId} className="flex-row gap-3 rounded-md bg-default p-2">
                  <Image
                    source={{ uri: t.artworkUrl100 }}
                    style={{ width: 44, height: 44, borderRadius: 6, backgroundColor: '#E8DFCC' }}
                  />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{t.trackName}</Text>
                    <Text className="text-xs text-muted" numberOfLines={1}>{t.artistName} · {t.collectionName}</Text>
                  </View>
                  <Pressable
                    onPress={() => playPreview(t.previewUrl, t.trackName)}
                    className="h-9 w-9 items-center justify-center rounded-full bg-accent"
                  >
                    <Play size={14} color="#FAF5E8" fill="#FAF5E8" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* 已存曲单 */}
        <View className="rounded-xl border border-default bg-surface p-4">
          <Text className="mb-2 text-sm font-semibold text-foreground">已入曲房（{tracks.length}）</Text>
          {loading ? (
            <ActivityIndicator color="#B89460" />
          ) : tracks.length === 0 ? (
            <EmptyState title="曲房还空" hint="让选曲人为你挑一曲" />
          ) : (
            <View className="gap-2">
              {tracks.map(t => (
                <View key={t.id} className="flex-row items-center gap-3 rounded-md bg-default p-2">
                  <View className="h-9 w-9 items-center justify-center rounded-md bg-surface">
                    <Music2 size={16} color="#8A7560" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{t.title}</Text>
                    <Text className="text-xs text-muted" numberOfLines={1}>{t.artist}</Text>
                  </View>
                  <Text className="text-[10px] text-muted">{t.durationSec}s</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {playing ? (
          <View className="mt-3 flex-row items-center gap-2 rounded-md border border-accent bg-accent/10 px-3 py-2">
            <Play size={12} color="#B89460" fill="#B89460" />
            <Text className="flex-1 text-xs text-foreground" numberOfLines={1}>正在预览 · {playing.title}</Text>
            <Pressable onPress={stopPreview}>
              <Text className="text-xs text-accent">停</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
