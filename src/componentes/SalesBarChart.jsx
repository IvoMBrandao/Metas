// src/components/SalesBarChart.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const SalesBarChart = ({ soldValue, metaValue, expectedSalesValue }) => {
  const percentageSold = (soldValue / metaValue) * 100;
  const percentageGoal = 100;
  const projectedPercentage = (expectedSalesValue / metaValue) * 100;

  // Garantir que a porcentagem restante não seja menor que 0
  const percentageRemaining = Math.max(0, percentageGoal - percentageSold);

  const data = {
    labels: ['Vendida', 'Meta Restante', 'Projeção'],
    datasets: [
      {
        data: [percentageSold, percentageRemaining, projectedPercentage],
        color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`, // Cor do gráfico
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progresso da Meta</Text>
      <BarChart
        data={data}
        width={screenWidth - 40}
        height={220}
        yAxisLabel="%"
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          strokeWidth: 2,
        }}
        fromZero={true}
        showBarTops={false}
      />
      <View style={styles.legend}>
        <View style={[styles.legendItem, { backgroundColor: '#2196f3' }]} />
        <Text style={styles.legendText}>Vendida</Text>
        <View style={[styles.legendItem, { backgroundColor: '#f44336' }]} />
        <Text style={styles.legendText}>Meta Restante</Text>
        <View style={[styles.legendItem, { backgroundColor: '#4caf50' }]} />
        <Text style={styles.legendText}>Projeção</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {
    width: 20,
    height: 20,
    marginRight: 10,
    borderRadius: 10,
  },
  legendText: {
    fontSize: 16,
    marginRight: 20,
    marginBottom: 10,
  },
});

export default SalesBarChart;
