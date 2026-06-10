import { Fragment, useEffect, type ReactNode } from 'react';
import { ColorSchemeName, Platform } from 'react-native';
import { Uniwind } from 'uniwind'

// system: 跟随系统变化
// light: 固定为 light 主题
// dark: 固定为 dark 主题
// LandricOS 永远使用轻奢风亮版：暖米色底 + 深胡桃字 + 香槟金（对比度好、看得清）
const DEFAULT_THEME: 'system' | 'light' | 'dark' = 'light'

const WebOnlyColorSchemeUpdater = function ({ children }: { children?: ReactNode }) {
  useEffect(() => {
    Uniwind.setTheme(DEFAULT_THEME);
  }, []);

  useEffect(() => {
    function handleMessage(e: MessageEvent<{ event: string; colorScheme: ColorSchemeName; } | undefined>) {
      if (e.data?.event === 'coze.workbench.colorScheme') {
        const cs = e.data.colorScheme;
        if (typeof cs === 'string') {
          Uniwind.setTheme(cs);
        }
      }
    }

    if (Platform.OS === 'web') {
      window.addEventListener('message', handleMessage, false);
    }

    return () => {
      if (Platform.OS === 'web') {
        window.removeEventListener('message', handleMessage, false);
      }
    }
  }, []);

  return <Fragment>
    {children}
  </Fragment>
};

export {
  WebOnlyColorSchemeUpdater,
}
