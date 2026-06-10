/**
 * LandricOS · 聊天详情
 *
 * 核心 LLM 交互：
 *  - 若与 AI 角色本人 (is_self) 聊 → 模拟角色口吻
 *  - 其他联系人 → 模拟对方口吻
 *  - 用户输入 → 走 /api/v1/llm/generate，system prompt 来自 persona 或对方 role
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { contacts, messages, llm, persona, type Contact, type Message } from '@/utils/api';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { Send, Sparkles } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function ConversationScreen() {
  const router = useSafeRouter();
  const { contactId, name } = useSafeSearchParams<{ contactId: number; name: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [list, setList] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sys, setSys] = useState<string>('');
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(async () => {
    if (!contactId) return;
    const { contacts: cs } = await contacts.list();
    const c = cs.find((x) => x.id === contactId) || null;
    setContact(c);
    if (c) {
      const { messages: ms } = await messages.list(c.id);
      setList(ms);
    }
  }, [contactId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // 拉 system prompt：AI 角色本人 → 人设；他人 → 简单身份卡
  useEffect(() => {
    (async () => {
      if (!contact) return;
      if (contact.is_self) {
        try {
          const p = await persona.get();
          setSys(
            `你是 ${p.persona.name || '你的角色'}，${p.persona.occupation}，${p.persona.family}。${p.persona.background}。性情：${p.persona.traits}。口吻：${p.persona.speaking_style}。`
          );
        } catch {
          setSys('你是你的角色。');
        }
      } else {
        setSys(
          `你是 ${contact.name}，身份：${contact.role}，与用户关系：${contact.relation}。你说话温和、有分寸，绝不使用 emoji。`
        );
      }
    })();
  }, [contact]);

  const send = async () => {
    if (!text.trim() || !contact) return;
    const mine = text.trim();
    setText('');
    // 1. 落库 self
    try {
      const r = await messages.send({ contact_id: contact.id, role: 'self', content: mine });
      setList((p) => [
        ...p,
        { id: r.id, contact_id: contact.id, role: 'self', content: mine, created_at: new Date().toISOString() },
      ]);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: '发送未成', text2: e?.message });
      setText(mine);
      return;
    }

    // 2. 调 LLM
    setBusy(true);
    try {
      const r = await llm.generate({
        prompt: mine,
        system: sys,
        temperature: 0.85,
        maxTokens: 240,
      });
      const reply = r.text.trim();
      const saved = await messages.send({ contact_id: contact.id, role: 'them', content: reply });
      setList((p) => [
        ...p,
        {
          id: saved.id,
          contact_id: contact.id,
          role: 'them',
          content: reply,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: '对方未答', text2: e?.message });
    } finally {
      setBusy(false);
    }
  };

  if (!contact) {
    return (
      <Screen backgroundColor="#F4ECDD" statusBarStyle="dark">
        <TopBar title={name || '聊天'} serif onBack={() => router.back()} />
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
      <TopBar title={contact.name} subtitle={contact.role} serif onBack={() => router.back()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={list}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 gap-2">
              <Sparkles size={20} color="#C9A876" />
              <Text
                className="text-on-surface-variant text-xs"
                style={{ fontFamily: 'serif' }}
              >
                与 {contact.name} 的第一句，由你起
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ChatBubble
              side={item.role}
              content={item.content}
              timestamp={formatTime(item.created_at)}
            />
          )}
        />

        {/* 输入条 */}
        <View className="px-4 pb-4 pt-2 border-t border-outline bg-surface">
          <View className="flex-row items-end gap-2">
            <View className="flex-1 border border-outline bg-surface-container rounded-2xl px-4 py-2">
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="说一句"
                placeholderTextColor="#6B5D45"
                multiline
                maxLength={500}
                className="text-on-surface text-[15px] py-1"
                style={{ maxHeight: 120, minHeight: 36 }}
                selectionColor="#C9A876"
              />
            </View>
            <Pressable
              onPress={send}
              disabled={busy || !text.trim()}
              className={`w-11 h-11 rounded-full items-center justify-center ${
                busy || !text.trim() ? 'bg-surface-container' : 'bg-primary active:opacity-60'
              }`}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#C9A876" />
              ) : (
                <Send size={16} color={text.trim() ? '#15110B' : '#6B5D45'} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function formatTime(s: string) {
  const d = new Date(s.replace(' ', 'T'));
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
