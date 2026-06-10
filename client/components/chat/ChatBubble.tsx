/**
 * 聊天气泡 — 胡桃木金
 *  - 自己: 主色金边，米白
 *  - 对方: 表面色描边，奶油字
 */
import { View, Text } from 'react-native';

interface ChatBubbleProps {
  side: 'self' | 'them';
  content: string;
  timestamp?: string;
}

export function ChatBubble({ side, content, timestamp }: ChatBubbleProps) {
  const isSelf = side === 'self';
  return (
    <View className={`flex-row my-1 ${isSelf ? 'justify-end' : 'justify-start'}`}>
      <View
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
          isSelf
            ? 'bg-primary/10 border border-primary/30 rounded-tr-sm'
            : 'bg-surface-container border border-outline rounded-tl-sm'
        }`}
      >
        <Text
          className={`text-[15px] leading-6 ${isSelf ? 'text-on-surface' : 'text-on-surface'}`}
          style={{ fontFamily: 'serif' }}
        >
          {content}
        </Text>
        {timestamp ? (
          <Text className="text-[10px] mt-1.5 text-on-surface-variant/70">
            {timestamp}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
