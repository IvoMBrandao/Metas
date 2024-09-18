// src/components/SalesProgressChart.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const SalesProgressChart = ({ soldValue, metaValue, expectedSalesValue, dailyGoal }) => {
  const screenWidth = Dimensions.get('window').width;

  const data = [
    {
      name: 'Vendidos',
      population: soldValue,
      color: '#4caf50',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15
    },
    {
      name: 'Esperado Até Agora',
      population: expectedSalesValue,
      color: '#ff9800',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15
    },
    {
      name: 'Esperado Até o Final',
      population: metaValue,
      color: '#f44336',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progresso de Vendas</Text>
      <PieChart
        data={data}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundColor: '#ffffff',
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          strokeWidth: 2
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
      />
      <Text style={styles.subtitle}>Diária Esperada: R$ {dailyGoal.toFixed(2)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 10,
  },
});

export default SalesProgressChart;
