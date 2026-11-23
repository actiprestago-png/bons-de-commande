import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { StoreProvider } from '@/state/store';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      return;
    }
    const swUrl = `${window.location.origin}/bons-de-commande/sw.js`;
    navigator.serviceWorker.register(swUrl, { scope: '/bons-de-commande/' }).catch(() => {
      // The app still works online if the offline cache cannot be installed.
    });
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StoreProvider>
        <AppTabs />
      </StoreProvider>
    </ThemeProvider>
  );
}
