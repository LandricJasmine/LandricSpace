/**
 * LandricOS · 朋友圈
 *
 * 列表展示角色及好友发的内容
 * 右上 + 发布（角色本人）
 * 点击 → moment-detail
 */
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { moments, persona, type Moment, type Persona } from '@/utils/api';
import { useFocusEffect } from 'expo-router';
import { Plus, X, Send } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function MomentsScreen() {
  const router = useSafeRouter();
  const [list, setList] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [who, setWho] = useState<Persona | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { moments: list } = await moments.list();
      setList(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      persona.get().then((p) => setWho(p.persona)).catch(() => undefined);
    }, [load])
  );

  const post = async () => {
    if (!content.trim()) {
      Toast.show({ type: 'error', text1: '写上一句再发' });
      return;
    }
    try {
      await moments.publish({
        author: who?.name || '你的角色',
        content: content.trim(),
        mood: mood.trim() || undefined,
      });
      setContent('');
      setMood('');
      setAdding(false);
      load();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message });
    }
  };

  return (
    <Screen
      backgroundColor="#F4ECDD"
      statusBarStyle="dark"
      safeAreaEdges={['left', 'right']}
    >
      <TopBar
        title="朋友圈"
        subtitle="灯火处"
        serif
        onBack={() => router.back()}
        rightLabel="记"
        rightIcon={Plus}
        onRightPress={() => setAdding(true)}
      />
      <FlatList
        data={list}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          adding ? (
            <View className="my-4 border border-outline bg-surface rounded-2xl p-4 gap-3">
              <Text
                className="text-on-surface text-sm"
                style={{ fontFamily: 'serif' }}
              >
                以 {who?.name || '你的角色'} 名
              </Text>
              <View className="border border-outline bg-surface-container rounded-xl px-3 py-2.5">
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  className="text-on-surface text-[15px] py-1"
                  placeholder="今日所见、所思"
                  placeholderTextColor="#6B5D45"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  style={{ minHeight: 100 }}
                  selectionColor="#C9A876"
                />
              </View>
              <View className="border border-outline bg-surface-container rounded-xl px-3 py-2.5">
                <TextInput
                  value={mood}
                  onChangeText={setMood}
                  className="text-on-surface text-[14px]"
                  placeholder="此刻心绪（可选）"
                  placeholderTextColor="#6B5D45"
                  selectionColor="#C9A876"
                />
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setAdding(false)}
                  className="flex-1 py-2.5 rounded-xl border border-outline active:opacity-60"
                >
                  <Text
                    className="text-on-surface-variant text-center text-sm"
                    style={{ fontFamily: 'serif' }}
                  >
                    取 消
                  </Text>
                </Pressable>
                <Pressable
                  onPress={post}
                  className="flex-1 py-2.5 rounded-xl bg-primary active:opacity-60 flex-row items-center justify-center gap-2"
                >
                  <Send size={14} color="#15110B" />
                  <Text
                    className="text-on-primary text-sm font-semibold"
                    style={{ fontFamily: 'serif' }}
                  >
                    发 出
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#C9A876" className="mt-12" />
          ) : (
            <Text
              className="text-on-surface-variant text-center py-12"
              style={{ fontFamily: 'serif' }}
            >
              尚 无 一 段 灯 火
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push('/moment-detail', { id: item.id })}
            className="flex-row gap-3 py-4 border-b border-outline active:opacity-60"
          >
            <View className="w-10 h-10 rounded-full border border-primary/30 bg-surface-container-low items-center justify-center">
              <Text
                className="text-primary"
                style={{ fontFamily: 'serif', fontSize: 14 }}
              >
                {item.author.charAt(0)}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-primary text-[14px] font-semibold"
                style={{ fontFamily: 'serif' }}
              >
                {item.author}
              </Text>
              <Text
                className="text-on-surface text-[14px] mt-1.5 leading-6"
                style={{ fontFamily: 'serif' }}
              >
                {item.content}
              </Text>
              <View className="flex-row items-center gap-2 mt-2">
                <Text className="text-on-surface-variant text-[10px]">
                  {formatTime(item.created_at)}
                </Text>
                {item.mood ? (
                  <>
                    <View className="w-1 h-1 rounded-full bg-on-surface-variant" />
                    <Text
                      className="text-on-surface-variant text-[10px]"
                      style={{ fontFamily: 'serif' }}
                    >
                      {item.mood}
                    </Text>
                  </>
                ) : null}
              </View>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

function formatTime(s: string) {
  const d = new Date(s.replace(' ', 'T'));
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日 · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
