import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../contexts/auth';
import LoginScreen from '../Screens/Login/LoginScreen';
import RegisterScreen from '../Screens/Login/RegisterScreen';
import GoalScreen from '../Screens/Goals/GoalScreen';
import AddGoalScreen from '../Screens/Goals/AddGoalsScreen';
import { ReportScreen } from '../Screens/Reports/ReportScreen';
import EditGoal from '../Screens/Goals/EditGoal';
import AddSalesScreen from '../Screens/Sales/AddSalesScreen';
import SalesDetailScreen from '../Screens/Sales/SalesDetailScreen';
import EditSaleScreen from '../Screens/Sales/EditSaleScreen';
import MonthSalesScreen from '../Screens/Sales/SalesDetailScreen';
import SalesReportScreen from '../Screens/Reports/SalesReportScreen';
import AddCustomersScreen from '../Screens/Customers/AddCustomersScreen';
import CustomersScreen from '../Screens/Customers/Customers';
import CreditoScreen from '../Screens/Crediario/Crediarios';
import FinalizadasScreen from '../Screens/Crediario/FinalizadasScreen';
import ReportScreens from '../Screens/Reports/Reports';
import CashRegisterScreen from '../Screens/Reports/ReportsBox';
import ComparativeReportScreen from '../Screens/Reports/ComparativeReportScreen ';
import RankClientesScreen from '../Screens/Customers/RankClientesScreen';
import ClientDetailsScreen from '../Screens/Customers/ClientDetailsScreen';
import EditCustomerScreen from '../Screens/Customers/EditCustomerScreen';
import CrediarioDetalhesScreen from '../Screens/Crediario/CrediarioDetalhesScreen ';
import CrediarioResumoScreen from '../Screens/Crediario/CrediarioResumoScreen';
import CadastroProdutoScreen from '../Screens/Estoque/CadastroProdutoScreen';
import EstoqueScreen from '../Screens/Estoque/EstoqueScreen';
import EditarProdutoScreen from '../Screens/Estoque/EditarProdutoScreen';
import GerenciarCategoriasScreen from '../Screens/Estoque/GerenciarCategoriasScreen';
import EditarCategoriaScreen from '../Screens/Estoque/EditarCategoriaScreen ';
import ProdutoDetalhesScreen from '../Screens/Estoque/ProdutoDetalhesScreen';
import EntradaScreen from '../Screens/Estoque/EntradaScreen';
import SaidaManualScreen from '../Screens/Estoque/SaidaManualScreen';
import RelatorioEstoqueScreen from '../Screens/Estoque/RelatorioEstoques';
import LoadingScreen from '../Screens/LoadingScreen/LoadingScreen'; // Tela de carregamento

const Stack = createStackNavigator();

export const PublicRoutes = () => {
  const { user, loading } = useContext(AuthContext);

  // Exibir tela de carregamento enquanto o estado de autenticação é verificado
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user && user.emailVerified ? (
        // Se o usuário estiver autenticado e com e-mail verificado
        <>
          <Stack.Screen name="Goal" component={GoalScreen} />
          <Stack.Screen name="Report" component={ReportScreen} />
          <Stack.Screen name="AddGoal" component={AddGoalScreen} />
          <Stack.Screen name="EditGoal" component={EditGoal} />
          <Stack.Screen name="AddSalesScreen" component={AddSalesScreen} />
          <Stack.Screen name="SalesDetailScreen" component={SalesDetailScreen} />
          <Stack.Screen name="EditSaleScreen" component={EditSaleScreen} />
          <Stack.Screen name="MonthSalesScreen" component={MonthSalesScreen} />
          <Stack.Screen name="SalesReportScreen" component={SalesReportScreen} />
          <Stack.Screen name="Customers" component={CustomersScreen} />
          <Stack.Screen name="AddCustomers" component={AddCustomersScreen} />
          <Stack.Screen name="EditCustomer" component={EditCustomerScreen} />
          <Stack.Screen name="CreditoScreen" component={CreditoScreen} />
          <Stack.Screen name="Finalizadas" component={FinalizadasScreen} />
          <Stack.Screen name="ReportScreen" component={ReportScreens} />
          <Stack.Screen name="CashRegisterScreen" component={CashRegisterScreen} />
          <Stack.Screen name="ComparativeReportScreen" component={ComparativeReportScreen} />
          <Stack.Screen name="RankClientesScreen" component={RankClientesScreen} />
          <Stack.Screen name="ClientDetailsScreen" component={ClientDetailsScreen} />
          <Stack.Screen name="CrediarioResumo" component={CrediarioResumoScreen} />
          <Stack.Screen name="CrediarioDetalhes" component={CrediarioDetalhesScreen} />
          <Stack.Screen name="CadastroProduto" component={CadastroProdutoScreen} />
          <Stack.Screen name="Estoque" component={EstoqueScreen} />
          <Stack.Screen name="EditarProduto" component={EditarProdutoScreen} />
          <Stack.Screen name="GerenciarCategoriasScreen" component={GerenciarCategoriasScreen} />
          <Stack.Screen name="EditarCategoriaScreen" component={EditarCategoriaScreen} />
          <Stack.Screen name="ProdutoDetalhesScreen" component={ProdutoDetalhesScreen} />
          <Stack.Screen name="EntradaScreen" component={EntradaScreen} />
          <Stack.Screen name="SaidaManualScreen" component={SaidaManualScreen} />
          <Stack.Screen name="RelatorioEstoqueScreen" component={RelatorioEstoqueScreen} />
        </>
      ) : (
        // Caso contrário, mostrar as telas públicas (Login e Registro)
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
