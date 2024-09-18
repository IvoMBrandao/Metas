import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MetaScreen from './paginas/metas/MetaScreen';
import AddMetaScreen from './paginas/metas/AddMetaScreen';
import EditMetaScreen from './paginas/metas/EditMeta';
import AddSalesScreen from './paginas/sales/AddSalesScreen';
import SalesDetailScreen from './paginas/sales/SalesDetailScreen'
import EditSaleScreen from './paginas/sales/EditSaleScreen';


const Stack = createStackNavigator();

export default function Routes() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Meta">
        <Stack.Screen name="Meta" component={MetaScreen} />
        <Stack.Screen name="AddMeta" component={AddMetaScreen} />
        <Stack.Screen name="EditMeta" component={EditMetaScreen} />
        <Stack.Screen name="AddSalesScreen" component={AddSalesScreen} />
        <Stack.Screen name="SalesDetailScreen" component={SalesDetailScreen} />
        <Stack.Screen name="EditSaleScreen" component={EditSaleScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
