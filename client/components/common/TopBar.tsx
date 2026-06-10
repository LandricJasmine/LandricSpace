/**
 * 顶部导航栏 — LandricOS 风格
 *  - 玻璃感，背景半透明，胡桃木金边
 *  - 标题可选衬线（serif）显庄重
 */
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, type LucideIcon } from 'lucide-react-native';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  serif?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  /** 当 safeAreaEdges 去掉 top 时，外部已加 paddingTop，这里再叠加 12px 即可 */
  compact?: boolean;
  rightLabel?: string;
  onRightPress?: () => void;
  rightIcon?: LucideIcon;
}

export function TopBar({
  title,
  subtitle,
  serif = false,
  onBack,
  right,
  compact = false,
  rightLabel,
  onRightPress,
  rightIcon: RightIcon,
}: TopBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ paddingTop: compact ? 12 : insets.top + 12 }}
      className="flex-row items-center justify-between px-5 pb-4 border-b border-outline"
    >
      <View className="flex-row items-center gap-3 flex-1">
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            className="w-9 h-9 rounded-full items-center justify-center bg-surface-container-high active:opacity-60"
          >
            <ChevronLeft size={20} color="#C9A876" />
          </Pressable>
        ) : null}
        <View className="flex-1">
          {title ? (
            <Text
              numberOfLines={1}
              className={serif ? 'font-serif text-xl text-on-surface' : 'text-xl font-semibold text-on-surface'}
            >
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text className="text-xs text-on-surface-variant mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {right
        ? right
        : onRightPress && RightIcon
          ? (
            <Pressable
              onPress={onRightPress}
              hitSlop={12}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high active:opacity-60"
            >
              <RightIcon size={14} color="#C9A876" />
              {rightLabel ? (
                <Text className="text-xs text-primary">{rightLabel}</Text>
              ) : null}
            </Pressable>
          )
          : null}
    </View>
  );
}
