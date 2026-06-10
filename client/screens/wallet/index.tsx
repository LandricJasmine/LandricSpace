/**
 * LandricOS · 钱包
 *
 * 流水列表 + 增/删
 * 顶部汇总
 */
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { transactions, type Transaction } from '@/utils/api';
import { useFocusEffect } from 'expo-router';
import { Plus, X, Save, Trash2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function WalletScreen() {
  const router = useSafeRouter();
  const [list, setList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('家宴');
  const [note, setNote] = useState('');
  const [occurredAt, setOccurredAt] = useState(todayKey());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { transactions: list } = await transactions.list();
      setList(list);
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
    if (!amount || isNaN(Number(amount))) {
      Toast.show({ type: 'error', text1: '填入金额' });
      return;
    }
    try {
      await transactions.add({
        amount: Number(amount),
        kind,
        category: category.trim() || '杂',
        note: note.trim() || undefined,
        occurred_at: occurredAt,
      });
      setAmount('');
      setNote('');
      setAdding(false);
      load();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message });
    }
  };

  const remove = async (t: Transaction) => {
    try {
      await transactions.remove(t.id);
      load();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message });
    }
  };

  const income = list.filter((t) => t.kind === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = list.filter((t) => t.kind === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  return (
    <Screen
      backgroundColor="#F4ECDD"
      statusBarStyle="dark"
      safeAreaEdges={['left', 'right']}
    >
      <TopBar
        title="账本"
        subtitle="出入分明"
        serif
        onBack={() => router.back()}
        rightLabel="记"
        rightIcon={Plus}
        onRightPress={() => setAdding(true)}
      />
      <View className="px-6 pt-3">
        <View className="border border-outline bg-surface rounded-2xl p-5">
          <Text
            className="text-on-surface-variant text-[10px] tracking-widest"
            style={{ fontFamily: 'serif' }}
          >
            余
          </Text>
          <Text
            className="text-on-surface mt-1"
            style={{ fontFamily: 'serif', fontSize: 36 }}
          >
            {formatMoney(balance)}
          </Text>
          <View className="mt-3 flex-row gap-6">
            <View>
              <Text
                className="text-on-surface-variant text-[10px] tracking-widest"
                style={{ fontFamily: 'serif' }}
              >
                入
              </Text>
              <Text
                className="text-primary mt-1"
                style={{ fontFamily: 'serif', fontSize: 16 }}
              >
                {formatMoney(income)}
              </Text>
            </View>
            <View>
              <Text
                className="text-on-surface-variant text-[10px] tracking-widest"
                style={{ fontFamily: 'serif' }}
              >
                出
              </Text>
              <Text
                className="text-[#B85858] mt-1"
                style={{ fontFamily: 'serif', fontSize: 16 }}
              >
                {formatMoney(expense)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <FlatList
        data={list.slice().reverse()}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#C9A876" className="mt-8" />
          ) : (
            <Text
              className="text-on-surface-variant text-sm text-center py-8"
              style={{ fontFamily: 'serif' }}
            >
              尚 无 一 笔
            </Text>
          )
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 py-3 border-b border-outline">
            <View
              className={`w-1.5 h-8 rounded-full ${
                item.kind === 'income' ? 'bg-primary' : 'bg-[#B85858]'
              }`}
            />
            <View className="flex-1">
              <Text
                className="text-on-surface text-[14px]"
                style={{ fontFamily: 'serif' }}
              >
                {item.category}
                {item.note ? ` · ${item.note}` : ''}
              </Text>
              <Text className="text-on-surface-variant text-[10px] mt-0.5">
                {item.occurred_at}
              </Text>
            </View>
            <Text
              className={item.kind === 'income' ? 'text-primary' : 'text-[#B85858]'}
              style={{ fontFamily: 'serif', fontSize: 16 }}
            >
              {item.kind === 'income' ? '+' : '−'}
              {formatMoney(item.amount)}
            </Text>
            <Pressable
              onPress={() => remove(item)}
              className="w-7 h-7 rounded-full items-center justify-center active:opacity-60"
            >
              <Trash2 size={12} color="#B85858" />
            </Pressable>
          </View>
        )}
      />

      <Modal visible={adding} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-3xl p-6 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-on-surface text-lg"
                style={{ fontFamily: 'serif' }}
              >
                记 一 笔
              </Text>
              <Pressable onPress={() => setAdding(false)}>
                <X size={20} color="#A89878" />
              </Pressable>
            </View>
            {/* 收入/支出切换 */}
            <View className="flex-row gap-2 mb-3">
              {(['expense', 'income'] as const).map((k) => (
                <Pressable
                  key={k}
                  onPress={() => setKind(k)}
                  className={`flex-1 py-2.5 rounded-xl border ${
                    kind === k
                      ? 'border-primary bg-primary/10'
                      : 'border-outline bg-surface'
                  } active:opacity-60`}
                >
                  <Text
                    className={`text-center text-sm ${
                      kind === k ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                    style={{ fontFamily: 'serif' }}
                  >
                    {k === 'expense' ? '支 出' : '收 入'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="gap-3">
              <Row label="额" value={amount} onChange={setAmount} numeric />
              <Row label="类" value={category} onChange={setCategory} />
              <Row label="日" value={occurredAt} onChange={setOccurredAt} />
              <Row label="附" value={note} onChange={setNote} />
            </View>
            <Pressable
              onPress={add}
              className="mt-5 py-3 rounded-2xl bg-primary active:opacity-60 flex-row items-center justify-center gap-2"
            >
              <Save size={14} color="#15110B" />
              <Text
                className="text-on-primary text-sm font-semibold"
                style={{ fontFamily: 'serif', letterSpacing: 2 }}
              >
                落 册
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Row(props: { label: string; value: string; onChange: (v: string) => void; numeric?: boolean }) {
  return (
    <View>
      <Text
        className="text-on-surface-variant text-[10px] tracking-[0.3em] mb-1"
        style={{ fontFamily: 'serif' }}
      >
        {props.label}
      </Text>
      <View className="border border-outline bg-surface-container rounded-xl px-4 py-1">
        <TextInput
          value={props.value}
          onChangeText={props.onChange}
          keyboardType={props.numeric ? 'numeric' : 'default'}
          className="text-on-surface text-[15px] py-3"
          placeholderTextColor="#6B5D45"
          selectionColor="#C9A876"
        />
      </View>
    </View>
  );
}

function formatMoney(n: number) {
  return `¥ ${n.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
