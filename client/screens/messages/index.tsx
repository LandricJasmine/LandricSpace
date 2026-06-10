/**
 * LandricOS · 消息列表
 *
 * 每个联系人最新一条 + 时间
 * AI 角色自己 (is_self=1) 也占一格，便于回看
 */
import { useCallback, useState } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { contacts, messages, type Contact, type Message } from '@/utils/api';

interface Item {
  contact: Contact;
  preview?: Message;
}

export default function MessagesScreen() {
  const router = useSafeRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { contacts: cs } = await contacts.list();
      const arr: Item[] = [];
      for (const c of cs) {
        try {
          const { messages: ms } = await messages.list(c.id);
          arr.push({ contact: c, preview: ms[ms.length - 1] });
        } catch {
          arr.push({ contact: c });
        }
      }
      // 自己排前面
      arr.sort((a, b) => Number(b.contact.is_self) - Number(a.contact.is_self));
      setItems(arr);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen
      backgroundColor="#F4ECDD"
      statusBarStyle="dark"
      safeAreaEdges={['left', 'right']}
    >
      <TopBar title="消息" subtitle="与她说，与他们说" serif onBack={() => router.back()} />
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.contact.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor="#C9A876"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-32">
            <Text
              className="text-on-surface-variant text-sm"
              style={{ fontFamily: 'serif' }}
            >
              来访尚无一人
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push('/conversation', { contactId: item.contact.id, name: item.contact.name })
            }
            className="flex-row items-center gap-3 py-3.5 border-b border-outline active:opacity-60"
          >
            <View className="w-11 h-11 rounded-full border border-primary/30 bg-surface-container-low items-center justify-center">
              <Text
                className="text-primary"
                style={{ fontFamily: 'serif', fontSize: 16 }}
              >
                {item.contact.name.charAt(0)}
              </Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-baseline justify-between">
                <Text className="text-on-surface text-[15px] font-semibold">
                  {item.contact.name}
                </Text>
                {item.preview ? (
                  <Text className="text-on-surface-variant text-[10px]">
                    {formatTime(item.preview.created_at)}
                  </Text>
                ) : null}
              </View>
              <Text
                className="text-on-surface-variant text-[12px] mt-0.5"
                numberOfLines={1}
              >
                {item.preview
                  ? item.preview.content
                  : `与 ${item.contact.name} 尚无言说`}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

function formatTime(s: string) {
  const d = new Date(s.replace(' ', 'T'));
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
