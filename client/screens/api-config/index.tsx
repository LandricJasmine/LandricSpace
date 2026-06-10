/**
 * LandricOS · API 配置
 *
 * 字段：base url / api key / model name
 * 提交后保存到本地 SQLite
 */
import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { config } from '@/utils/api';
import Toast from 'react-native-toast-message';
import { Save, Eye, EyeOff } from 'lucide-react-native';

export default function ApiConfigScreen() {
  const router = useSafeRouter();
  const [base, setBase] = useState('');
  const [key, setKey] = useState('');
  const [model, setModel] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // 拉取现配置
  if (!loaded) {
    config
      .get()
      .then((c) => {
        setBase(c.api_base_url || '');
        setModel(c.model_name || '');
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }

  const save = async () => {
    if (!base.trim() || !key.trim() || !model.trim()) {
      Toast.show({ type: 'error', text1: '三项皆需填全' });
      return;
    }
    setBusy(true);
    try {
      await config.put({
        api_base_url: base.trim(),
        api_key: key.trim(),
        model_name: model.trim(),
      });
      Toast.show({ type: 'success', text1: '密钥已入柜' });
      setKey('');
      router.back();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: '保存未成', text2: e?.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      backgroundColor="#F4ECDD"
      statusBarStyle="dark"
      safeAreaEdges={['left', 'right']}
    >
      <TopBar title="密钥与底座" subtitle="此一节为你所设" serif onBack={() => router.back()} />

      <View className="px-6 pt-4 gap-5">
        <View className="border border-outline bg-surface rounded-2xl p-5">
          <Text
            className="text-on-surface text-sm"
            style={{ fontFamily: 'serif' }}
          >
            入此室，勿与人言。
          </Text>
          <Text className="text-on-surface-variant text-xs mt-1.5 leading-5">
            密钥存于本地 SQLite，仅本机调用。除爱人之外，请勿将其带出此宅。
          </Text>
        </View>

        <Field
          label="端点地址"
          hint="兼容 OpenAI 协议的服务地址"
          value={base}
          onChangeText={setBase}
          placeholder="https://api.example.com/v1"
          autoCapitalize="none"
        />
        <Field
          label="密钥"
          hint="只在你本机留存，绝不外传"
          value={key}
          onChangeText={setKey}
          placeholder="sk-..."
          autoCapitalize="none"
          secure={!show}
          right={
            <Pressable onPress={() => setShow((s) => !s)} hitSlop={10}>
              {show ? <EyeOff size={16} color="#A89878" /> : <Eye size={16} color="#A89878" />}
            </Pressable>
          }
        />
        <Field
          label="模型"
          hint="默认 gpt-4o-mini 或类似"
          value={model}
          onChangeText={setModel}
          placeholder="gpt-4o-mini"
          autoCapitalize="none"
        />

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
                收 入 柜 中
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </Screen>
  );
}

function Field(props: {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences';
  secure?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <View>
      <Text
        className="text-on-surface-variant text-[10px] tracking-[0.3em] mb-1.5"
        style={{ fontFamily: 'serif' }}
      >
        {props.label.toUpperCase()}
      </Text>
      <View className="flex-row items-center border border-outline bg-surface rounded-xl px-4">
        <TextInput
          className="flex-1 text-on-surface text-[15px] py-3.5"
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder={props.placeholder}
          placeholderTextColor="#6B5D45"
          autoCapitalize={props.autoCapitalize}
          secureTextEntry={props.secure}
          selectionColor="#C9A876"
        />
        {props.right}
      </View>
      {props.hint ? (
        <Text className="text-on-surface-variant text-[11px] mt-1.5">{props.hint}</Text>
      ) : null}
    </View>
  );
}
