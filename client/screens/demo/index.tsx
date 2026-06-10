import { View, Text } from 'react-native';
import { Image } from 'expo-image';

import { Screen } from '@/components/Screen';

export default function DemoPage() {
  return (
    <Screen statusBarStyle="auto">
      <View className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
        <Image
          className="w-[130px] h-[109px]"
          source="https://lf-coze-web-cdn.coze.cn/obj/eden-cn/lm-lgvj/ljhwZthlaukjlkulzlp/coze-coding/expo/coze-loading.gif"
        />
        <Text className="text-base font-bold text-foreground">APP 开发中</Text>
        <Text className="text-sm mt-2 text-muted">即将为您呈现应用界面</Text>
      </View>
    </Screen>
  );
}
