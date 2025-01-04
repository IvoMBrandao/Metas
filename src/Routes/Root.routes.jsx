import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PublicRoutes } from './Public.routes';
import Adsbanner from '../componentes/Adsbanner';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.hideAsync();

export default function Routes() {
  return (
    <NavigationContainer>
      <PublicRoutes />
      <Adsbanner />
    </NavigationContainer>
  );
}
