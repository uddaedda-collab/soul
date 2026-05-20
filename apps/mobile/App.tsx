import 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.rose
  }
};

const linking = {
  prefixes: [
    Linking.createURL('/'),
    'soulsync://',
    process.env.EXPO_PUBLIC_APP_URL ?? 'https://soulsync.app'
  ],
  config: {
    screens: {
      Main: '',
      JoinRoom: 'join/:code',
      WatchRoom: 'room/:roomId',
      Profile: 'profile'
    }
  }
};

export default function App() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme} linking={linking}>
          <StatusBar style="light" translucent />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
