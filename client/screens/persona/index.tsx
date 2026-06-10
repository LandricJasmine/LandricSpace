/**
 * LandricOS · 人设编辑
 *
 * 字段：name / age / birthday / birthplace / residence / current_mood /
 *       occupation / family / background / traits / speaking_style
 */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { persona, type Persona } from '@/utils/api';
import Toast from 'react-native-toast-message';
import { Save } from 'lucide-react-native';

const FIELDS: { key: keyof Persona; label: string; placeholder: string; multi?: boolean }[] = [
  { key: 'name', label: '姓名', placeholder: '你的角色名' },
  { key: 'age', label: '年岁', placeholder: '18' },
  { key: 'birthday', label: '生辰', placeholder: '2000-01-01' },
  { key: 'birthplace', label: '籍贯', placeholder: '北京' },
  { key: 'residence', label: '住所', placeholder: '北京 · 上海' },
  { key: 'occupation', label: '所营', placeholder: '医生 / 律师 / 作家' },
  { key: 'family', label: '家室', placeholder: '家人信息' },
  { key: 'current_mood', label: '此刻', placeholder: '此刻心情' },
  { key: 'background', label: '来历', placeholder: '角色背景故事…', multi: true },
  { key: 'traits', label: '性情', placeholder: '性格特点…', multi: true },
  { key: 'speaking_style', label: '口吻', placeholder: '说话风格…', multi: true },
];

export default function PersonaScreen() {
  const router = useSafeRouter();
  const [p, setP] = useState<Partial<Persona>>({});
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    persona
      .get()
      .then((r) => {
        setP(r.persona);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      // age 转 number
      const payload: any = { ...p };
      if (payload.age) payload.age = Number(payload.age);
      await persona.put(payload);
      Toast.show({ type: 'success', text1: '人设已存' });
      router.back();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: '保存未成', text2: e?.message });
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) {
    return (
      <Screen backgroundColor="#F4ECDD" statusBarStyle="dark">
        <TopBar title="人设" subtitle="此身此名" serif onBack={() => router.back()} />
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
        title="人设"
        subtitle="此身此名，此宅此人"
        serif
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 pt-4 gap-4">
          {FIELDS.map((f) => (
            <Field
              key={f.key as string}
              label={f.label}
              value={(p[f.key] as any) ?? ''}
              onChangeText={(v) => setP((prev) => ({ ...prev, [f.key]: v }))}
              placeholder={f.placeholder}
              multi={f.multi}
              numeric={f.key === 'age'}
            />
          ))}

          <Pressable
            onPress={save}
            disabled={busy}
            className="mt-2 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary active:opacity-60"
          >
            {busy ? (
              <ActivityIndicator size="small" color="#15110B" />
            ) : (
              <>
                <Save size={16} color="#15110B" />
                <Text
                  className="text-on-primary text-sm font-semibold"
                  style={{ fontFamily: 'serif', letterSpacing: 2 }}
                >
                  入  册
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multi?: boolean;
  numeric?: boolean;
}) {
  return (
    <View>
      <Text
        className="text-on-surface-variant text-[10px] tracking-[0.3em] mb-1.5"
        style={{ fontFamily: 'serif' }}
      >
        {props.label.toUpperCase()}
      </Text>
      <View className="border border-outline bg-surface rounded-xl px-4 py-1">
        <TextInput
          className="text-on-surface text-[15px] py-3"
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder={props.placeholder}
          placeholderTextColor="#6B5D45"
          multiline={props.multi}
          numberOfLines={props.multi ? 4 : 1}
          textAlignVertical={props.multi ? 'top' : 'center'}
          keyboardType={props.numeric ? 'numeric' : 'default'}
          selectionColor="#C9A876"
          style={props.multi ? { minHeight: 100 } : undefined}
        />
      </View>
    </View>
  );
}
