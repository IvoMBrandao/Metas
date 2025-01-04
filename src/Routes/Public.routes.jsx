import { createStackNavigator } from '@react-navigation/stack';
import { ReportScreen } from '../Screens/Reports/ReportScreen';
import AddGoalScreen from '../Screens/Goals/AddGoalsScreen';
import GoalScreen from '../Screens/Goals/GoalScreen';
import EditGoal from '../Screens/Goals/EditGoal';
import AddSalesScreen from '../Screens/Sales/AddSalesScreen';
import SalesDetailScreen from '../Screens/Sales/SalesDetailScreen';
import EditSaleScreen from '../Screens/Sales/EditSaleScreen';
import MonthSalesScreen from '../Screens/Sales/SalesDetailScreen';
import SalesReportScreen from '../Screens/Reports/SalesReportScreen';
import AddCustomersScreen from '../Screens/Customers/AddCustomersScreen';
import CustomersScreen from '../Screens/Customers/Customers';
import CreditoScreen from '../Screens/Crediario/Crediarios'
import FinalizadasScreen from '../Screens/Crediario/FinalizadasScreen'
import ReportScreens from'../Screens/Reports/Reports.jsx'
import CashRegisterScreen from '../Screens/Reports/ReportsBox'
import ComparativeReportScreen from '../Screens/Reports/ComparativeReportScreen '
import RankClientesScreen from '../Screens/Customers/RankClientesScreen'
import ClientDetailsScreen from '../Screens/Customers/ClientDetailsScreen'
import EditCustomerScreen from "../Screens/Customers/EditCustomerScreen"
import CrediarioDetalhesScreen from '../Screens/Crediario/CrediarioDetalhesScreen ';
import CrediarioResumoScreen from '../Screens/Crediario/CrediarioResumoScreen';
import CadastroProdutoScreen from '../Screens/Estoque/CadastroProdutoScreen'
import EstoqueScreen from '../Screens/Estoque/EstoqueScreen';
import EditarProdutoScreen from '../Screens/Estoque/EditarProdutoScreen';
import GerenciarCategoriasScreen from '../Screens/Estoque/GerenciarCategoriasScreen';
import EditarCategoriaScreen from '../Screens/Estoque/EditarCategoriaScreen ';
import ProdutoDetalhesScreen from '../Screens/Estoque/ProdutoDetalhesScreen';
import EntradaScreen from '../Screens/Estoque/EntradaScreen';
import SaidaManualScreen from '../Screens/Estoque/SaidaManualScreen';
import RelatorioEstoqueScreen from '../Screens/Estoque/RelatorioEstoques';


const PublicStack = createStackNavigator();

export const PublicRoutes = () => {
  return (
    <PublicStack.Navigator initialRouteName='Goal'>
      <PublicStack.Screen name='Goal' component={GoalScreen} options={{ headerShown: false }} />
      <PublicStack.Screen name='Report' component={ReportScreen} options={{ headerShown: false }} />
      <PublicStack.Screen name='AddGoal' component={AddGoalScreen} options={{ headerShown: false }}/>
      <PublicStack.Screen name='EditGoal' component={EditGoal}options={{ headerShown: false }} />
      <PublicStack.Screen name='AddSalesScreen' component={AddSalesScreen} options={{ headerShown: false }}/>
      <PublicStack.Screen name='SalesDetailScreen' component={SalesDetailScreen} options={{ headerShown: false }}/>
      <PublicStack.Screen name='EditSaleScreen' component={EditSaleScreen} options={{ headerShown: false }}/>
      <PublicStack.Screen name='MonthSalesScreen' component={MonthSalesScreen} options={{ headerShown: false }}/>
      <PublicStack.Screen name='SalesReportScreen' component={SalesReportScreen}  options={{ headerShown:false }}/>
      <PublicStack.Screen name="Customers" component={CustomersScreen} options={{ headerShown: false}} />
      <PublicStack.Screen name="AddCustomers" component={AddCustomersScreen} options={{ headerShown: false }}/>
      <PublicStack.Screen name="EditCustomer" component={EditCustomerScreen} options={{ headerShown: false }}/>
      <PublicStack.Screen name="CreditoScreen" component={CreditoScreen} options={{ headerShown: false }}/>
      <PublicStack.Screen name="Finalizadas" component={FinalizadasScreen} options={{ headerShown: false }}/>
      <PublicStack.Screen name="ReportScreen" component={ReportScreens} options={{ headerShown: false }} />
      <PublicStack.Screen name="CashRegisterScreen" component={CashRegisterScreen} options={{ headerShown: false }} />
      <PublicStack.Screen name="ComparativeReportScreen" component={ComparativeReportScreen} options={{ headerShown: false }} />
      <PublicStack.Screen name="RankClientesScreen" component={RankClientesScreen} options={{ headerShown: false }} />
      <PublicStack.Screen name="ClientDetailsScreen" component={ClientDetailsScreen} options={{ headerShown: false }} />
      <PublicStack.Screen name="CrediarioResumo" component={CrediarioResumoScreen} options={{ headerShown: false }} />
      <PublicStack.Screen name="CrediarioDetalhes" component={CrediarioDetalhesScreen}  options={{ headerShown: false }}/>
      <PublicStack.Screen name="CadastroProduto" component={CadastroProdutoScreen} options={{ headerShown: false }}/>
      <PublicStack.Screen name="Estoque" component={EstoqueScreen}  options={{ headerShown: false }}/>
      <PublicStack.Screen name="EditarProduto" component={EditarProdutoScreen}  options={{ headerShown: false }}/>
      <PublicStack.Screen name="GerenciarCategoriasScreen" component={GerenciarCategoriasScreen}  options={{ headerShown: false }}/>
      <PublicStack.Screen name="EditarCategoriaScreen" component={EditarCategoriaScreen }  options={{ headerShown: false }}/>
      <PublicStack.Screen name="ProdutoDetalhesScreen" component={ProdutoDetalhesScreen }  options={{ headerShown: false }}/>
      <PublicStack.Screen name="EntradaScreen" component={EntradaScreen }  options={{ headerShown: false }}/>
      <PublicStack.Screen name="SaidaManualScreen" component={SaidaManualScreen }  options={{ headerShown: false }}/>
      <PublicStack.Screen name="RelatorioEstoqueScreen" component={RelatorioEstoqueScreen }  options={{ headerShown: false }}/>
      

    </PublicStack.Navigator>
  );
};
