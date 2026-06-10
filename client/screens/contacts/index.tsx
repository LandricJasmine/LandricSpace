/**
 * LandricOS · 通讯录
 *
 * 列所有联系人，左滑删除
 * 右上角 + 新增
 */
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { contacts, type Contact } from '@/utils/api';
import { useFocusEffect } from 'expo-router';
import { Plus, X, MessageSquare, Phone, Trash2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function ContactsScreen() {
  const router = useSafeRouter();
  const [list, setList] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { contacts: cs } = await contacts.list();
      setList(cs);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const add = async () => {
    if (!name.trim() || !role.trim() || !relation.trim()) {
      Toast.show({ type: 'error', text1: '姓名、身份、关系必填' });
      return;
    }
    try {
      await contacts.add({
        name: name.trim(),
        role: role.trim(),
        relation: relation.trim(),
        phone: phone.trim() || undefined,
      });
      setName('');
      setRole('');
      setRelation('');
      setPhone('');
      setAdding(false);
      load();
      Toast.show({ type: 'success', text1: '已录入' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message });
    }
  };

  const remove = (c: Contact) => {
    Alert.alert('删 除', `确定删去 ${c.name} ？`, [
      { text: '保留', style: 'cancel' },
      {
        text: '删去',
        style: 'destructive',
        onPress: async () => {
          await contacts.remove(c.id);
          load();
        },
      },
    ]);
  };

  return (
    <Screen
      backgroundColor="#F4ECDD"
      statusBarStyle="dark"
      safeAreaEdges={['left', 'right']}
    >
      <TopBar
        title="通讯录"
        subtitle="来往人"
        serif
        onBack={() => router.back()}
        rightLabel="添人"
        rightIcon={Plus}
        onRightPress={() => setAdding(true)}
      />
      <FlatList
        data={list}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          adding ? (
            <View className="my-4 border border-outline bg-surface rounded-2xl p-4 gap-3">
              <Row label="姓名" value={name} onChange={setName} />
              <Row label="身份" value={role} onChange={setRole} />
              <Row label="关系" value={relation} onChange={setRelation} />
              <Row label="电话" value={phone} onChange={setPhone} />
              <View className="flex-row gap-2 mt-1">
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
                  onPress={add}
                  className="flex-1 py-2.5 rounded-xl bg-primary active:opacity-60"
                >
                  <Text
                    className="text-on-primary text-center text-sm font-semibold"
                    style={{ fontFamily: 'serif' }}
                  >
                    录 入
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
              录 上 一 段 缘
            </Text>
          )
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 py-3 border-b border-outline">
            <Pressable
              onPress={() =>
                router.push('/conversation', { contactId: item.id, name: item.name })
              }
              className="w-11 h-11 rounded-full border border-primary/30 bg-surface-container-low items-center justify-center"
            >
              <Text
                className="text-primary"
                style={{ fontFamily: 'serif', fontSize: 16 }}
              >
                {item.name.charAt(0)}
              </Text>
            </Pressable>
            <View className="flex-1">
              <View className="flex-row items-baseline gap-2">
                <Text className="text-on-surface text-[15px] font-semibold">
                  {item.name}
                </Text>
                {item.is_self ? (
                  <Text
                    className="text-primary text-[10px] tracking-widest"
                    style={{ fontFamily: 'serif' }}
                  >
                    自 己
                  </Text>
                ) : null}
              </View>
              <Text className="text-on-surface-variant text-xs mt-0.5">
                {item.role} · {item.relation}
              </Text>
            </View>
            <Pressable
              onPress={() =>
                router.push('/conversation', { contactId: item.id, name: item.name })
              }
              className="w-8 h-8 rounded-full bg-surface-container border border-outline items-center justify-center active:opacity-60"
            >
              <MessageSquare size={13} color="#C9A876" />
            </Pressable>
            <Pressable
              onPress={() => router.push('/call')}
              className="w-8 h-8 rounded-full bg-surface-container border border-outline items-center justify-center active:opacity-60"
            >
              <Phone size={13} color="#C9A876" />
            </Pressable>
            {!item.is_self ? (
              <Pressable
                onPress={() => remove(item)}
                className="w-8 h-8 rounded-full items-center justify-center active:opacity-60"
              >
                <Trash2 size={13} color="#B85858" />
              </Pressable>
            ) : null}
          </View>
        )}
      />
    </Screen>
  );
}

function Row(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View>
      <Text
        className="text-on-surface-variant text-[10px] tracking-[0.3em] mb-1"
        style={{ fontFamily: 'serif' }}
      >
        {props.label.toUpperCase()}
      </Text>
      <View className="border border-outline bg-surface-container rounded-lg px-3 py-2.5">
        <TextInput
          value={props.value}
          onChangeText={props.onChange}
          className="text-on-surface text-[14px]"
          placeholder={`填入 ${props.label}`}
          placeholderTextColor="#6B5D45"
          selectionColor="#C9A876"
        />
      </View>
    </View>
  );
}
