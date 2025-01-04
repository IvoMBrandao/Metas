import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Routes from './src/Routes/Root.routes';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { AuthProvider } from './src/contexts/auth';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  const checkUpdates = async () => {
    try {
      const { isAvailable } = await Updates.checkForUpdateAsync(); // Check for updates and return information about the update

      if (isAvailable) {
        await Updates.fetchUpdateAsync(); // Fetch the update and cache it until the app is restarted
        await Updates.reloadAsync(); // Reload the app to apply the update
      }
    } catch (error) {
      console.error('Failed to check for updates', error);
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    if (!__DEV__) {
      checkUpdates();
    } else setIsReady(true);
  }, []);

  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
