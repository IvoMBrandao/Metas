import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ComparativeReportScreen = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [salesData, setSalesData] = useState([]);
  const [report, setReport] = useState({ current: 0, previous: 0, comparison: 0 });

  useEffect(() => {
    loadSalesData();
  }, []);

  useEffect(() => {
    calculateComparativeReport();
  }, [salesData, currentDate]);

  const loadSalesData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const allSales = [];
        parsedData.forEach((meta) => {
          meta.sales?.forEach((sale) => {
            allSales.push(sale);
          });
        });
        setSalesData(allSales);
      }
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    }
  };

  const calculateComparativeReport = () => {
    if (salesData.length === 0) return;

    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Filtrar vendas para o dia atual
    const currentSales = salesData.filter((sale) => {
      const saleDate = new Date(sale.date);
      return (
        saleDate.getDate() === currentDay &&
        saleDate.getMonth() + 1 === currentMonth &&
        saleDate.getFullYear() === currentYear
      );
    });

    // Filtrar vendas para o mesmo dia do mês anterior
    const previousSales = salesData.filter((sale) => {
      const saleDate = new Date(sale.date);
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      return (
        saleDate.getDate() === currentDay &&
        saleDate.getMonth() + 1 === previousMonth &&
        saleDate.getFullYear() === previousYear
      );
    });

    const currentTotal = currentSales.reduce((total, sale) => total + (sale.value || 0), 0);
    const previousTotal = previousSales.reduce((total, sale) => total + (sale.value || 0), 0);
    const comparison =
      previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    setReport({
      current: currentTotal,
      previous: previousTotal,
      comparison,
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Relatório Comparativo</Text>
        <View style={styles.reportContainer}>
          <Text style={styles.reportTitle}>Dia Atual</Text>
          <Text style={styles.reportValue}>{formatCurrency(report.current)}</Text>
        </View>
        <View style={styles.reportContainer}>
          <Text style={styles.reportTitle}>Dia Anterior (Mês Passado)</Text>
          <Text style={styles.reportValue}>{formatCurrency(report.previous)}</Text>
        </View>
        <View
          style={[
            styles.reportComparison,
            report.comparison < 0 ? styles.negative : styles.positive,
          ]}
        >
          <Text style={styles.comparisonText}>
            {report.comparison < 0 ? '⬇' : '⬆'} {Math.abs(report.comparison).toFixed(2)}%
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={loadSalesData}>
          <Text style={styles.buttonText}>Atualizar Relatório</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: '#2D3142',
  },
  reportContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2D3142',
  },
  reportValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  reportComparison: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positive: {
    backgroundColor: '#D4EDDA',
  },
  negative: {
    backgroundColor: '#F8D7DA',
  },
  comparisonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#155724',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ComparativeReportScreen;
