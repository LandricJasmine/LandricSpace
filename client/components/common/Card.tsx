/**
 * 胡桃木卡 — 圆角 16，金边 1px，纸感背景
 */
import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  /** elevated: 加 shadow-card | flat: 仅描边 | sunken: 凹陷（用于内嵌） */
  variant?: 'elevated' | 'flat' | 'sunken';
  padded?: boolean;
}

export function Card({
  variant = 'flat',
  padded = true,
  className = '',
  children,
  ...rest
}: CardProps) {
  const base = 'rounded-2xl border border-outline bg-surface';
  const pad = padded ? 'p-4' : '';
  const elev = variant === 'elevated' ? 'shadow-card' : '';
  const sink = variant === 'sunken' ? 'bg-surface-container-lowest' : '';
  return (
    <View className={`${base} ${pad} ${elev} ${sink} ${className}`} {...rest}>
      {children}
    </View>
  );
}
