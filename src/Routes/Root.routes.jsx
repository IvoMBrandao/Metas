import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PublicRoutes } from './Public.routes';

export default function Routes() {
  return (
    <NavigationContainer>
      <PublicRoutes />
    </NavigationContainer>
  );
}
