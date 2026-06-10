/**
 * LandricOS · 朋友圈详情
 */
import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { moments, llm, type Moment } from '@/utils/api';
import { Trash2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function MomentDetailScreen() {
  const router = useSafeRouter();
  const { id } = useSafeSearchParams<{ id: number }>();
  const [m, setM] = useState<Moment | null>(null);
  const [comment, setComment] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { moments: list } = await moments.list();
        setM(list.find((x: Moment) => x.id === id) || null);
      } catch {}
    })();
  }, [id]);

  const askComment = async () => {
    if (!m) return;
    setBusy(true);
    try {
      const r = await llm.generate({
        prompt: `请为下面这条朋友圈写一句有角色口吻的简短回应（不超过 30 字，不用 emoji）：\n作者：${m.author}\n内容：${m.content}\n心绪：${m.mood || '无'}`,
        temperature: 0.85,
        maxTokens: 80,
      });
      setComment(r.text.trim().split('\n')[0]);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!m) return;
    try {
      await moments.remove(m.id);
      router.back();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message });
    }
  };

  if (!m) {
    return (
      <Screen backgroundColor="#F4ECDD" statusBarStyle="dark">
        <TopBar title="灯火一段" serif onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#C9A876" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      backgroundColor="#F4ECDD"
      statusBarStyle="dark"
      safeAreaEdges={['left', 'right']}
    >
      <TopBar
        title="灯火一段"
        serif
        onBack={() => router.back()}
        rightIcon={Trash2}
        onRightPress={del}
      />
      <View className="px-6 pt-2">
        <View className="flex-row gap-3">
          <View className="w-12 h-12 rounded-full border border-primary/30 bg-surface-container-low items-center justify-center">
            <Text
              className="text-primary"
              style={{ fontFamily: 'serif', fontSize: 18 }}
            >
              {m.author.charAt(0)}
            </Text>
          </View>
          <View className="flex-1">
            <Text
              className="text-primary text-base font-semibold"
              style={{ fontFamily: 'serif' }}
            >
              {m.author}
            </Text>
            <Text
              className="text-on-surface text-[15px] mt-2 leading-7"
              style={{ fontFamily: 'serif' }}
            >
              {m.content}
            </Text>
            <View className="mt-3 flex-row items-center gap-2">
              <Text className="text-on-surface-variant text-xs">
                {new Date(m.created_at.replace(' ', 'T')).toLocaleString('zh-CN')}
              </Text>
              {m.mood ? (
                <>
                  <View className="w-1 h-1 rounded-full bg-on-surface-variant" />
                  <Text
                    className="text-on-surface-variant text-xs"
                    style={{ fontFamily: 'serif' }}
                  >
                    {m.mood}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </View>

        <View className="mt-10 border-t border-outline pt-6">
          <Pressable
            onPress={askComment}
            disabled={busy}
            className="self-start px-4 py-2 rounded-full border border-primary/30 active:opacity-60"
          >
            {busy ? (
              <ActivityIndicator size="small" color="#C9A876" />
            ) : (
              <Text
                className="text-primary text-xs"
                style={{ fontFamily: 'serif', letterSpacing: 2 }}
              >
                请 评 一 句
              </Text>
            )}
          </Pressable>

          {comment ? (
            <View className="mt-4 border border-outline bg-surface rounded-2xl p-4">
              <Text
                className="text-on-surface text-sm leading-6"
                style={{ fontFamily: 'serif' }}
              >
                {comment}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
