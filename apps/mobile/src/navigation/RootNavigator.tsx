import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthScreen } from '../features/auth/AuthScreen';
import { CreateRoomScreen } from '../features/room/CreateRoomScreen';
import { HomeScreen } from '../features/room/HomeScreen';
import { JoinRoomScreen } from '../features/room/JoinRoomScreen';
import { SourcePickerScreen } from '../features/media/SourcePickerScreen';
import { WatchRoomScreen } from '../features/room/WatchRoomScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.rose} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade_from_bottom'
      }}
    >
      {!token ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={HomeScreen} />
          <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
          <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
          <Stack.Screen name="SourcePicker" component={SourcePickerScreen} />
          <Stack.Screen name="WatchRoom" component={WatchRoomScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
