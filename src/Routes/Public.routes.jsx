import { createStackNavigator } from '@react-navigation/stack';
import { ReportScreen } from '../Screens/Reports/ReportScreen';

import AddGoalScreen from '../Screens/Goals/AddGoalsScreen';
import GoalScreen from '../Screens/Goals/GoalScreen';
import EditGoal from '../Screens/Goals/EditGoal';
import AddSalesScreen from '../Screens/Sales/AddSalesScreen';
import SalesDetailScreen from '../Screens/Sales/SalesDetailScreen';
import EditSaleScreen from '../Screens/Sales/EditSaleScreen';
import MonthSalesScreen from '../Screens/Sales/SalesDetailScreen';

const PublicStack = createStackNavigator();

export const PublicRoutes = () => {
  return (
    <PublicStack.Navigator initialRouteName='Goal'>
      <PublicStack.Screen name='Goal' component={GoalScreen} />
      <PublicStack.Screen name='Report' component={ReportScreen} />
      <PublicStack.Screen name='AddGoal' component={AddGoalScreen} />
      <PublicStack.Screen name='EditGoal' component={EditGoal} />
      <PublicStack.Screen name='AddSalesScreen' component={AddSalesScreen} />
      <PublicStack.Screen name='SalesDetailScreen' component={SalesDetailScreen} />
      <PublicStack.Screen name='EditSaleScreen' component={EditSaleScreen} />
      <PublicStack.Screen name='MonthSalesScreen' component={MonthSalesScreen} />
    </PublicStack.Navigator>
  );
};
