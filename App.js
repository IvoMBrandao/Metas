import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Routes from './src/Routes/Root.routes';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { AuthProvider } from './src/contexts/auth';
import { initializeApp } from './firebaseConfig';



// Manter a tela de splash visível enquanto recursos são carregados
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  const checkUpdates = async () => {
    try {
      const { isAvailable } = await Updates.checkForUpdateAsync(); // Verificar se há atualizações disponíveis

      if (isAvailable) {
        await Updates.fetchUpdateAsync(); // Baixar a atualização
        await Updates.reloadAsync(); // Recarregar o app para aplicar a atualização
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    if (!__DEV__) {
      checkUpdates();
    } else {
      setIsReady(true);
    }
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
