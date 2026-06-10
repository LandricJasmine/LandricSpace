/**
 * 状态展示：空 / 加载 / 错误
 *  - 不使用 emoji
 *  - 衬线提示语，淡淡的暮光金
 */
import { View, Text, Pressable } from 'react-native';
import { Loader2 } from 'lucide-react-native';

export function LoadingState({ label = '正在斟酌' }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3">
      <Loader2 size={22} color="#C9A876" className="animate-spin" />
      <Text className="font-serif text-sm text-on-surface-variant">{label}</Text>
    </View>
  );
}

export function EmptyState({
  title = '尚无记录',
  hint = '待人来访',
  action,
  onAction,
}: {
  title?: string;
  hint?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-10 gap-2">
      <View className="w-12 h-12 rounded-full border border-outline bg-surface-container-low items-center justify-center">
        <View className="w-1.5 h-1.5 rounded-full bg-primary" />
      </View>
      <Text className="font-serif text-base text-on-surface">{title}</Text>
      <Text className="text-xs text-on-surface-variant text-center">{hint}</Text>
      {action ? (
        <Pressable
          onPress={onAction}
          className="mt-4 px-5 py-2 rounded-full border border-primary active:opacity-60"
        >
          <Text className="text-sm text-primary">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-10 gap-3">
      <Text className="font-serif text-base text-error">{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          className="px-5 py-2 rounded-full border border-error active:opacity-60"
        >
          <Text className="text-sm text-error">重试</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
