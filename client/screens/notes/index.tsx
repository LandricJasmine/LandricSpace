/**
 * LandricOS · 备忘录
 *
 * 列表 + 内嵌 Modal 增/改/删
 */
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { notes, type Note } from '@/utils/api';
import { useFocusEffect } from 'expo-router';
import { Plus, X, Save, Trash2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function NotesScreen() {
  const router = useSafeRouter();
  const [list, setList] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { notes: ns } = await notes.list();
      setList(ns);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openAdd = () => {
    setEditing(null);
    setTitle('');
    setBody('');
    setCategory('');
    setAdding(true);
  };

  const openEdit = (n: Note) => {
    setEditing(n);
    setTitle(n.title);
    setBody(n.body);
    setCategory(n.category);
    setAdding(true);
  };

  const save = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: '题不可空' });
      return;
    }
    try {
      if (editing) {
        await notes.update(editing.id, {
          title: title.trim(),
          body: body.trim(),
          category: category.trim() || undefined,
        });
      } else {
        await notes.add({
          title: title.trim(),
          body: body.trim(),
          category: category.trim() || undefined,
        });
      }
      setAdding(false);
      load();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message });
    }
  };

  const del = async (n: Note) => {
    try {
      await notes.remove(n.id);
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
        title="备忘"
        subtitle="琐碎事"
        serif
        onBack={() => router.back()}
        rightLabel="记"
        rightIcon={Plus}
        onRightPress={openAdd}
      />
      <FlatList
        data={list}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#C9A876" className="mt-12" />
          ) : (
            <Text
              className="text-on-surface-variant text-center py-12"
              style={{ fontFamily: 'serif' }}
            >
              笔 记 尚 空
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openEdit(item)}
            className="border-b border-outline py-3.5 active:opacity-60"
          >
            <View className="flex-row items-baseline justify-between">
              <Text
                className="text-on-surface text-[15px] font-semibold flex-1"
                style={{ fontFamily: 'serif' }}
              >
                {item.title}
              </Text>
              {item.category ? (
                <Text
                  className="text-primary text-[10px] tracking-widest ml-2"
                  style={{ fontFamily: 'serif' }}
                >
                  {item.category}
                </Text>
              ) : null}
            </View>
            {item.body ? (
              <Text
                className="text-on-surface-variant text-[13px] mt-1.5 leading-5"
                numberOfLines={2}
              >
                {item.body}
              </Text>
            ) : null}
            <View className="flex-row items-center gap-2 mt-1.5">
              <Text className="text-on-surface-variant text-[10px]">
                {new Date(item.updated_at.replace(' ', 'T')).toLocaleString('zh-CN')}
              </Text>
              <Pressable
                onPress={() => del(item)}
                className="ml-auto px-2 py-1 active:opacity-60"
                hitSlop={6}
              >
                <Trash2 size={12} color="#B85858" />
              </Pressable>
            </View>
          </Pressable>
        )}
      />

      <Modal visible={adding} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-3xl p-6 pb-10 max-h-[88%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-on-surface text-lg"
                style={{ fontFamily: 'serif' }}
              >
                {editing ? '改 笔 记' : '新 笔 记'}
              </Text>
              <Pressable onPress={() => setAdding(false)}>
                <X size={20} color="#A89878" />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View className="gap-3">
                <View>
                  <Text
                    className="text-on-surface-variant text-[10px] tracking-[0.3em] mb-1"
                    style={{ fontFamily: 'serif' }}
                  >
                    题
                  </Text>
                  <View className="border border-outline bg-surface-container rounded-xl px-4 py-1">
                    <TextInput
                      value={title}
                      onChangeText={setTitle}
                      placeholder="题"
                      placeholderTextColor="#6B5D45"
                      className="text-on-surface text-[15px] py-3"
                      selectionColor="#C9A876"
                    />
                  </View>
                </View>
                <View>
                  <Text
                    className="text-on-surface-variant text-[10px] tracking-[0.3em] mb-1"
                    style={{ fontFamily: 'serif' }}
                  >
                    类
                  </Text>
                  <View className="border border-outline bg-surface-container rounded-xl px-4 py-1">
                    <TextInput
                      value={category}
                      onChangeText={setCategory}
                      placeholder="事 / 物 / 念"
                      placeholderTextColor="#6B5D45"
                      className="text-on-surface text-[14px] py-3"
                      selectionColor="#C9A876"
                    />
                  </View>
                </View>
                <View>
                  <Text
                    className="text-on-surface-variant text-[10px] tracking-[0.3em] mb-1"
                    style={{ fontFamily: 'serif' }}
                  >
                    录
                  </Text>
                  <View className="border border-outline bg-surface-container rounded-xl px-4 py-1">
                    <TextInput
                      value={body}
                      onChangeText={setBody}
                      placeholder="细事一段"
                      placeholderTextColor="#6B5D45"
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                      className="text-on-surface text-[15px] py-3"
                      selectionColor="#C9A876"
                      style={{ minHeight: 130 }}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
            <Pressable
              onPress={save}
              className="mt-5 py-3 rounded-2xl bg-primary active:opacity-60 flex-row items-center justify-center gap-2"
            >
              <Save size={14} color="#15110B" />
              <Text
                className="text-on-primary text-sm font-semibold"
                style={{ fontFamily: 'serif', letterSpacing: 2 }}
              >
                收 入 笔 记
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
