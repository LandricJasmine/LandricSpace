import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
  // 添加其它想暂时忽略的错误或警告信息
]);

export default function RootLayout() {
  return (
    <Provider>
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          headerShown: false
        }}
      >
        <Stack.Screen name="index" options={{ title: '' }} />
        <Stack.Screen name="home" options={{ title: '' }} />
        <Stack.Screen name="settings" options={{ title: '' }} />
        <Stack.Screen name="api-config" options={{ title: '' }} />
        <Stack.Screen name="persona" options={{ title: '' }} />
        <Stack.Screen name="theme" options={{ title: '' }} />
        <Stack.Screen name="messages" options={{ title: '' }} />
        <Stack.Screen name="conversation" options={{ title: '' }} />
        <Stack.Screen name="call" options={{ title: '' }} />
        <Stack.Screen name="contacts" options={{ title: '' }} />
        <Stack.Screen name="moments" options={{ title: '' }} />
        <Stack.Screen name="moment-detail" options={{ title: '' }} />
        <Stack.Screen name="trip" options={{ title: '' }} />
        <Stack.Screen name="weather" options={{ title: '' }} />
        <Stack.Screen name="calendar" options={{ title: '' }} />
        <Stack.Screen name="notes" options={{ title: '' }} />
        <Stack.Screen name="health" options={{ title: '' }} />
        <Stack.Screen name="music" options={{ title: '' }} />
        <Stack.Screen name="photos" options={{ title: '' }} />
        <Stack.Screen name="wallet" options={{ title: '' }} />
        <Stack.Screen name="shop" options={{ title: '' }} />
        <Stack.Screen name="browser" options={{ title: '' }} />
        <Stack.Screen name="mood" options={{ title: '' }} />
        <Stack.Screen name="about" options={{ title: '' }} />
      </Stack>
      <Toast />
    </Provider>
  );
}
