import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PublicRoutes } from './Public.routes';
import Adsbanner from '../componentes/Adsbanner';



export default function Routes() {
  return (
    <NavigationContainer>
      <PublicRoutes />
      <Adsbanner/>
    </NavigationContainer>
  );
}
