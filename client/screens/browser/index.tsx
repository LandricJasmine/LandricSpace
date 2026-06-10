/**
 * LandricOS · 浏览器
 *
 * 内部 iframe（web） / WebView（native）
 * 右上 + LLM 解读当前页
 */
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Search, Sparkles, Globe } from 'lucide-react-native';
import { llm } from '@/utils/api';
import Toast from 'react-native-toast-message';

const HINTS = [
  'https://www.sz.news.cn',
  'https://www.xinhuanet.com',
  'https://www.thepaper.cn',
];

export default function BrowserScreen() {
  const router = useSafeRouter();
  const [url, setUrl] = useState('https://www.xinhuanet.com');
  const [input, setInput] = useState('https://www.xinhuanet.com');
  const [summary, setSummary] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const go = () => {
    let u = input.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    setUrl(u);
  };

  const ask = async () => {
    setBusy(true);
    setSummary('');
    try {
      const r = await llm.generate({
        prompt: `请用你的角色的口吻，描述 ${url} 大约是什么样的地方、什么人记它（不超过 60 字），不要 emoji。`,
        temperature: 0.85,
        maxTokens: 100,
      });
      setSummary(r.text.trim());
    } catch (e: any) {
      setSummary(`（未成：${e?.message || '未知'}）`);
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
      <TopBar
        title="浏览"
        subtitle="窗外的尘"
        serif
        onBack={() => router.back()}
        rightIcon={Sparkles}
        onRightPress={ask}
      />
      <View className="px-4 pt-3">
        <View className="flex-row items-center border border-outline bg-surface rounded-2xl px-3 py-1">
          <Search size={14} color="#A89878" />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="网址"
            placeholderTextColor="#6B5D45"
            className="flex-1 text-on-surface text-[14px] py-2.5 ml-2"
            onSubmitEditing={go}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            selectionColor="#C9A876"
          />
          <Pressable
            onPress={go}
            className="px-3 py-1.5 rounded-full bg-primary active:opacity-60"
          >
            <Text
              className="text-on-primary text-xs"
              style={{ fontFamily: 'serif' }}
            >
              访
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-1 mt-3 mx-4 mb-4 border border-outline rounded-2xl overflow-hidden bg-surface">
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <iframe
            src={url}
            style={{ width: '100%', height: '100%', border: 'none', background: '#0E0B07' }}
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        ) : (
          <View className="flex-1 items-center justify-center p-6 gap-3">
            <Globe size={28} color="#C9A876" />
            <Text
              className="text-on-surface text-sm text-center"
              style={{ fontFamily: 'serif' }}
            >
              移动端建议在 Web 上浏览此页
            </Text>
            <Text
              className="text-on-surface-variant text-[11px] text-center"
              style={{ fontFamily: 'serif' }}
            >
              已输入：{url}
            </Text>
          </View>
        )}
      </View>

      <View className="px-4 mb-3 flex-row gap-2">
        {HINTS.map((h) => (
          <Pressable
            key={h}
            onPress={() => {
              setInput(h);
              setUrl(h);
            }}
            className="px-2.5 py-1 rounded-full border border-outline active:opacity-60"
          >
            <Text
              className="text-on-surface-variant text-[10px]"
              style={{ fontFamily: 'serif' }}
            >
              {h.replace('https://', '')}
            </Text>
          </Pressable>
        ))}
      </View>

      {busy ? (
        <View className="px-6 mb-3 flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#C9A876" />
          <Text
            className="text-on-surface-variant text-xs"
            style={{ fontFamily: 'serif' }}
          >
            正在问
          </Text>
        </View>
      ) : summary ? (
        <View className="px-6 pb-6">
          <View className="border border-outline bg-surface rounded-2xl p-4">
            <Text
              className="text-on-surface text-sm leading-6"
              style={{ fontFamily: 'serif' }}
            >
              {summary}
            </Text>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
