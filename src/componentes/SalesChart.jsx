// SalesChart.js
import React from 'react';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions, StyleSheet, View } from 'react-native';

const SalesChart = ({ chartData }) => {
  return (
    <View style={styles.chartContainer}>
      <BarChart
        data={chartData}
        width={Dimensions.get('window').width - 40}
        height={220}
        yAxisLabel="%"
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          barPercentage: 0.5,
          useShadowColorFromDataset: false,
        }}
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chart: {
    borderRadius: 16,
  },
});

export default SalesChart;
