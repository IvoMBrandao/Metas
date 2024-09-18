import React, { useState, useEffect } from 'react'; 
import { View, Text, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SalesProgressChart from '../../componentes/SalesProgressChart';  // Importar o componente

const MonthSalesScreen = ({ route, navigation }) => {
  const { metaId } = route.params;
  const [meta, setMeta] = useState(null);
  const [daysSold, setDaysSold] = useState(0);

  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('financeData');
        if (savedData) {
          const data = JSON.parse(savedData);
          const metaData = data.find(item => item.id === metaId);

          if (metaData) {
            setMeta(metaData);

            // Contar os dias distintos em que foram registradas vendas
            const uniqueDays = new Set(metaData.sales?.map(sale => sale.date));
            setDaysSold(uniqueDays.size);
          }
        }
      } catch (error) {
        console.log('Erro ao carregar dados', error);
      }
    };

    fetchMetaData();
  }, [metaId]);

  if (!meta) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Carregando...</Text>
      </View>
    );
  }

  // Calcular o valor vendido até o momento e os dias restantes
  const soldValue = parseFloat(meta.sales?.reduce((total, sale) => total + sale.value, 0) || 0);
  const metaValue = parseFloat(meta.value);
  const metaDays = parseInt(meta.salesDays, 10) || 0;
  const daysRemaining = metaDays - daysSold;

  // Calcular o Valor de Venda Esperado
  const expectedSalesValue = (metaValue / metaDays) * daysSold;

  // Calcular a Diária para os dias restantes
  const remainingValue = metaValue - soldValue;
  const dailyGoal = daysRemaining > 0 ? remainingValue / daysRemaining : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumo da Meta</Text>
      <Text style={styles.subtitle}>Valor da Meta: R$ {metaValue.toFixed(2)}</Text>
      <Text style={styles.subtitle}>Valor Vendido no Mês: R$ {soldValue.toFixed(2)}</Text>
      <Text style={styles.subtitle}>Dias Restantes: {daysRemaining}</Text>
      <Text style={styles.subtitle}>Diária: R$ {dailyGoal.toFixed(2)}</Text>
      <Text style={styles.subtitle}>Valor de Venda Esperado: R$ {expectedSalesValue.toFixed(2)}</Text>
      
      {/* Adicionar o componente do gráfico */}
      <SalesProgressChart 
        soldValue={soldValue} 
        metaValue={metaValue} 
        expectedSalesValue={expectedSalesValue} 
        dailyGoal={dailyGoal} 
      />

      <Button title="Adicionar Venda" onPress={() => navigation.navigate('AddSaleScreen', { metaId })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default MonthSalesScreen;
