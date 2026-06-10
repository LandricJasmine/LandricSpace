/**
 * LandricOS · 日历
 *
 * 显示当月 + 事件列表
 * 增删事件
 */
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { calendar, type CalendarEvent } from '@/utils/api';
import { useFocusEffect } from 'expo-router';
import { Plus, X, Save, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function CalendarScreen() {
  const router = useSafeRouter();
  const [cursor, setCursor] = useState(new Date());
  const [list, setList] = useState<CalendarEvent[]>([]);
  const [selected, setSelected] = useState(dateKey(new Date()));
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('家宴');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const { events } = await calendar.list();
      setList(events);
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const add = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: '必填名目' });
      return;
    }
    try {
      await calendar.add({
        date: selected,
        title: title.trim(),
        type: type.trim() || '事',
        time: time.trim() || undefined,
        location: location.trim() || undefined,
        note: note.trim() || undefined,
      });
      setTitle('');
      setType('家宴');
      setTime('');
      setLocation('');
      setNote('');
      setAdding(false);
      load();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message });
    }
  };

  const remove = async (id: number) => {
    try {
      await calendar.remove(id);
      load();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message });
    }
  };

  const monthEvents = list.filter((e) => e.date.startsWith(dateKey(cursor).slice(0, 7)));
  const dayEvents = monthEvents.filter((e) => e.date === selected);

  return (
    <Screen
      backgroundColor="#F4ECDD"
      statusBarStyle="dark"
      safeAreaEdges={['left', 'right']}
    >
      <TopBar
        title="日历"
        subtitle="约与被约"
        serif
        onBack={() => router.back()}
        rightLabel="记"
        rightIcon={Plus}
        onRightPress={() => setAdding(true)}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* 月份切换 */}
        <View className="flex-row items-center justify-between px-6 py-3">
          <Pressable
            onPress={() => setCursor(addMonths(cursor, -1))}
            className="w-8 h-8 rounded-full bg-surface-container border border-outline items-center justify-center active:opacity-60"
          >
            <ChevronLeft size={14} color="#C9A876" />
          </Pressable>
          <Text
            className="text-on-surface text-base"
            style={{ fontFamily: 'serif' }}
          >
            {cursor.getFullYear()} 年 {cursor.getMonth() + 1} 月
          </Text>
          <Pressable
            onPress={() => setCursor(addMonths(cursor, 1))}
            className="w-8 h-8 rounded-full bg-surface-container border border-outline items-center justify-center active:opacity-60"
          >
            <ChevronRight size={14} color="#C9A876" />
          </Pressable>
        </View>

        {/* 简化日历网格 */}
        <View className="px-4">
          <View className="flex-row flex-wrap">
            {buildMonthGrid(cursor).map((d, i) => {
              if (!d) {
                return <View key={i} className="w-[14.28%] aspect-square" />;
              }
              const k = dateKey(d);
              const isSel = k === selected;
              const has = monthEvents.some((e) => e.date === k);
              return (
                <Pressable
                  key={k}
                  onPress={() => setSelected(k)}
                  className="w-[14.28%] aspect-square items-center justify-center active:opacity-60"
                >
                  <View
                    className={`w-9 h-9 rounded-full items-center justify-center ${
                      isSel ? 'bg-primary' : ''
                    }`}
                  >
                    <Text
                      className={isSel ? 'text-on-primary' : 'text-on-surface'}
                      style={{ fontFamily: 'serif' }}
                    >
                      {d.getDate()}
                    </Text>
                  </View>
                  {has ? (
                    <View
                      className={`w-1 h-1 rounded-full mt-0.5 ${
                        isSel ? 'bg-on-primary' : 'bg-primary'
                      }`}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 当日事件 */}
        <View className="px-6 mt-6">
          <Text
            className="text-on-surface-variant text-[10px] tracking-[0.3em] mb-3"
            style={{ fontFamily: 'serif' }}
          >
            {selected.replace(/-/g, ' / ')}
          </Text>
          {dayEvents.length === 0 ? (
            <Text
              className="text-on-surface-variant text-sm py-6 text-center"
              style={{ fontFamily: 'serif' }}
            >
              此 日 无 约
            </Text>
          ) : (
            dayEvents.map((e) => (
              <View
                key={e.id}
                className="flex-row items-center gap-3 py-3 border-b border-outline"
              >
                <View className="w-1 h-10 rounded-full bg-primary" />
                <View className="flex-1">
                  <Text
                    className="text-on-surface text-[15px]"
                    style={{ fontFamily: 'serif' }}
                  >
                    {e.title}
                  </Text>
                  <Text className="text-on-surface-variant text-xs mt-0.5">
                    {[e.time, e.location, e.type].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => remove(e.id)}
                  className="w-7 h-7 rounded-full items-center justify-center active:opacity-60"
                >
                  <X size={14} color="#B85858" />
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 新增弹窗 */}
      <Modal visible={adding} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-3xl p-6 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-on-surface text-lg"
                style={{ fontFamily: 'serif' }}
              >
                添 一 件 事
              </Text>
              <Pressable onPress={() => setAdding(false)}>
                <X size={20} color="#A89878" />
              </Pressable>
            </View>
            <View className="gap-3">
              <Field label="名目" value={title} onChange={setTitle} placeholder="家宴 / 出差 / 复诊…" />
              <Field label="类" value={type} onChange={setType} placeholder="家宴" />
              <Field label="时" value={time} onChange={setTime} placeholder="19:30" />
              <Field label="所" value={location} onChange={setLocation} placeholder="浅水湾" />
              <Field label="附" value={note} onChange={setNote} placeholder="诸事备注" multiline />
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
                收 入 日 历
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
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
          multiline={props.multiline}
          numberOfLines={props.multiline ? 3 : 1}
          textAlignVertical={props.multiline ? 'top' : 'center'}
          className="text-on-surface text-[15px] py-3"
          selectionColor="#C9A876"
          style={props.multiline ? { minHeight: 70 } : undefined}
        />
      </View>
    </View>
  );
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function buildMonthGrid(d: Date): (Date | null)[] {
  const year = d.getFullYear();
  const month = d.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const start = first.getDay();
  const arr: (Date | null)[] = [];
  for (let i = 0; i < start; i++) arr.push(null);
  for (let i = 1; i <= days; i++) arr.push(new Date(year, month, i));
  while (arr.length % 7 !== 0) arr.push(null);
  return arr;
}
