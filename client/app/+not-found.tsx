import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-background">
      <Text className="text-foreground">
        页面不存在
      </Text>
      <Link href="/" className="text-accent mt-6">
        返回首页
      </Link>
    </View>
  );
}
