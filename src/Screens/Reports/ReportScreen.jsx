import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import Card from '../../Componentes/Card'; // Certifique-se de ajustar o caminho conforme necessário

export const ReportScreen = ({ route, navigation }) => {
  const [meta, setMeta] = useState(null);
  const [daysSold, setDaysSold] = useState(0);

  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('financeData');

        if (savedData) {
          const data = JSON.parse(savedData);
          const metaData = data.find((item) => item.id === route.params?.metaId);

          if (metaData) {
            setMeta(metaData);

            // Contar os dias distintos em que foram registradas vendas
            const uniqueDays = new Set(metaData.sales?.map((sale) => sale.date));
            setDaysSold(uniqueDays.size);
          }
        }
      } catch (error) {
        console.log('Erro ao carregar dados', error);
      }
    };

    fetchMetaData();
  }, [route.params?.metaId]);

  if (!meta) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Você ainda não possui metas!</Text>
      </View>
    );
  }

  const soldValue = parseFloat(meta.sales?.reduce((total, sale) => total + sale.value, 0) || 0);
  const metaValue = parseFloat(meta.value);
  const metaDays = parseInt(meta.salesDays, 10) || 0;
  const daysRemaining = metaDays - daysSold;

  // Calcular a Diária Esperada
  const remainingValue = metaValue - soldValue;
  const dailyGoal = daysRemaining > 0 ? remainingValue / daysRemaining : 0;

  // Calcular o Valor de Venda Esperado
  const dailySold = daysSold > 0 ? soldValue / daysSold : 0;
  const projectedValue = daysSold > 0 ? (soldValue / daysSold) * metaDays : 0;

  // Calcular percentuais
  const percentSold = (soldValue / metaValue) * 100;
  const percentProjected = (projectedValue / metaValue) * 100;

  // Prevenir valores negativos
  const remainingMeta = Math.max(0, ((metaValue - soldValue) / metaValue) * 100);

  const chartData = {
    labels: ['Vendidos', 'Projeção'],
    datasets: [
      {
        data: [percentSold, percentProjected],
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumo da Meta</Text>

      <Card title='Informações da Meta'>
        <Text style={styles.subtitle}>Valor da Meta: R$ {metaValue.toFixed(2)}</Text>
        <Text style={styles.subtitle}>Valor Vendido no Mês: R$ {soldValue.toFixed(2)}</Text>
        <Text style={styles.subtitle}>Dias Restantes: {daysRemaining}</Text>
        <Text style={styles.subtitle}>Diária: R$ {dailyGoal.toFixed(2)}</Text>
        <Text style={styles.subtitle}>Valor de Venda Esperado: R$ {projectedValue.toFixed(2)}</Text>
        <Text style={styles.subtitle}>Percentual Vendido: {percentSold.toFixed(2)}%</Text>
        <Text style={styles.subtitle}>Percentual Projetado: {percentProjected.toFixed(2)}%</Text>
      </Card>

      <BarChart
        data={chartData}
        width={Dimensions.get('window').width - 40}
        height={250}
        yAxisLabel='%'
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          barPercentage: 0.5,
        }}
        style={styles.chart}
      />
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
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
