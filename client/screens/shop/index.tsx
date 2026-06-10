/**
 * LandricOS · 购物
 *
 * 物品列表：礼 / 物 / 添
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
import { products, llm, type Product } from '@/utils/api';
import { useFocusEffect } from 'expo-router';
import { Plus, X, Save, Trash2, Sparkles } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function ShopScreen() {
  const router = useSafeRouter();
  const [list, setList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');
  const [askBusy, setAskBusy] = useState(false);
  const [gift, setGift] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { products: list } = await products.list();
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
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: '名不可空' });
      return;
    }
    try {
      await products.add({
        name: name.trim(),
        category: category.trim() || undefined,
        price: price ? Number(price) : undefined,
        reason: reason.trim() || undefined,
      });
      setName('');
      setCategory('');
      setPrice('');
      setReason('');
      setAdding(false);
      load();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message });
    }
  };

  const remove = async (p: Product) => {
    try {
      await products.remove(p.id);
      load();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message });
    }
  };

  const askGift = async () => {
    setAskBusy(true);
    setGift('');
    try {
      const r = await llm.generate({
        prompt: `请以角色对爱人的口吻，写一份礼物建议（不超过 60 字），不需指定品牌，可季节或场景。`,
        temperature: 0.95,
        maxTokens: 100,
      });
      setGift(r.text.trim().split('\n').join(' '));
    } catch (e: any) {
      setGift(`（未成：${e?.message || '未知'}）`);
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
      <TopBar
        title="添物"
        subtitle="物予她"
        serif
        onBack={() => router.back()}
        rightLabel="加"
        rightIcon={Plus}
        onRightPress={() => setAdding(true)}
      />
      <View className="px-6 pt-2">
        <Pressable
          onPress={askGift}
          disabled={askBusy}
          className="self-start px-3.5 py-2 rounded-full border border-primary/30 active:opacity-60 flex-row items-center gap-2"
        >
          {askBusy ? (
            <ActivityIndicator size="small" color="#C9A876" />
          ) : (
            <>
              <Sparkles size={12} color="#C9A876" />
              <Text
                className="text-primary text-[11px]"
                style={{ fontFamily: 'serif', letterSpacing: 2 }}
              >
                为 她 选 一 件
              </Text>
            </>
          )}
        </Pressable>
        {gift ? (
          <View className="mt-3 border border-outline bg-surface rounded-2xl p-4">
            <Text
              className="text-on-surface text-sm leading-6"
              style={{ fontFamily: 'serif' }}
            >
              {gift}
            </Text>
          </View>
        ) : null}
      </View>
      <FlatList
        data={list}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#C9A876" className="mt-8" />
          ) : (
            <Text
              className="text-on-surface-variant text-sm text-center py-6"
              style={{ fontFamily: 'serif' }}
            >
              尚 无 一 件 物
            </Text>
          )
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 py-3 border-b border-outline">
            <View className="w-10 h-10 rounded-xl border border-primary/30 bg-surface-container-low items-center justify-center">
              <Text
                className="text-primary"
                style={{ fontFamily: 'serif', fontSize: 16 }}
              >
                {item.name.charAt(0)}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-on-surface text-[14px]"
                style={{ fontFamily: 'serif' }}
              >
                {item.name}
                {item.category ? ` · ${item.category}` : ''}
              </Text>
              {item.reason ? (
                <Text
                  className="text-on-surface-variant text-xs mt-0.5"
                  numberOfLines={1}
                >
                  {item.reason}
                </Text>
              ) : null}
            </View>
            {item.price != null ? (
              <Text
                className="text-primary"
                style={{ fontFamily: 'serif', fontSize: 14 }}
              >
                ¥ {item.price}
              </Text>
            ) : null}
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
                添 一 件
              </Text>
              <Pressable onPress={() => setAdding(false)}>
                <X size={20} color="#A89878" />
              </Pressable>
            </View>
            <View className="gap-3">
              <Row label="名" value={name} onChange={setName} placeholder="翡翠耳坠" />
              <Row label="类" value={category} onChange={setCategory} placeholder="首饰 / 衣" />
              <Row label="价" value={price} onChange={setPrice} numeric placeholder="68000" />
              <Row label="故" value={reason} onChange={setReason} placeholder="她记得，去年说过想要" />
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
                收 入 册
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Row(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; numeric?: boolean }) {
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
          placeholder={props.placeholder}
          placeholderTextColor="#6B5D45"
          keyboardType={props.numeric ? 'numeric' : 'default'}
          className="text-on-surface text-[15px] py-3"
          selectionColor="#C9A876"
        />
      </View>
    </View>
  );
}
