import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-chart-kit';
import Card from '../../componentes/Card';

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
        <Text style={styles.title}>Nenhuma meta selecionada.</Text>
        <Button title="Voltar" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const soldValue = parseFloat(meta.sales?.reduce((total, sale) => total + (sale.value || 0), 0) || 0);
  const metaValue = parseFloat(meta.value);
  const metaDays = parseInt(meta.salesDays, 10) || 0;
  const daysRemaining = metaDays - daysSold > 0 ? metaDays - daysSold : 0;
  const dailyGoal = daysRemaining > 0 ? (metaValue - soldValue) / daysRemaining : 0;
  const daysPast = metaDays - daysRemaining;

  // Valor de Venda Esperado
  const projectedValue = (metaValue / metaDays) * daysPast;

  const percentSold = (soldValue / metaValue) * 100;
  const percentProjected = (projectedValue / metaValue) * 100;
  const missingSell = Math.max(0, metaValue - soldValue);

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
      <Card title="Informações da Meta">
        <Text style={styles.subtitle}>Valor da Meta: R$ {metaValue.toFixed(2)}</Text>
        <Text style={styles.subtitle}>
          {soldValue > 0
            ? `Valor Vendido no Mês: R$ ${soldValue.toFixed(2)}`
            : 'Nenhuma venda registrada até o momento.'}
        </Text>
        <Text style={styles.subtitle}>Falta vender: R$ {missingSell.toFixed(2)}</Text>
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
        yAxisLabel=""
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
