import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../../componentes/Card';

export const ReportScreen = ({ route, navigation }) => {
  const [meta, setMeta] = useState(null);
  const [daysSold, setDaysSold] = useState(0);
  const [allGoals, setAllGoals] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState(route.params?.metaId || null);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('financeData');
        if (savedData) {
          const data = JSON.parse(savedData);
          setAllGoals(data);

          if (selectedGoalId) {
            const metaData = data.find((item) => item.id === selectedGoalId);
            if (metaData) {
              setMeta(metaData);
              const uniqueDays = new Set(metaData.sales?.map((sale) => sale.date));
              setDaysSold(uniqueDays.size);
            }
          }
        }
      } catch (error) {
        console.log('Erro ao carregar dados', error);
      }
    };

    fetchMetaData();
  }, [selectedGoalId]);

  const handleGoalSelect = (goalId) => {
    setSelectedGoalId(goalId);
  };

  if (!meta && allGoals.length > 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Selecione uma Meta</Text>
          <FlatList
            data={allGoals}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.goalItem}
                onPress={() => handleGoalSelect(item.id)}
              >
                <View>
                  <Text style={styles.goalTitle}>{item.name}</Text>
                  <Text style={styles.goalValue}>
                    Valor da Meta: {formatCurrency(item.value)}
                  </Text>
                </View>
                <Text style={styles.goalActionText}>Ver Detalhes →</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContainer}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!meta) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Nenhuma meta selecionada.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const soldValue = meta.sales?.reduce((total, sale) => total + (sale.value || 0), 0) || 0;
  const metaValue = meta.value;
  const metaDays = parseInt(meta.salesDays, 10) || 0;
  const daysRemaining = metaDays - daysSold > 0 ? metaDays - daysSold : 0;
  const dailyGoal = daysRemaining > 0 ? (metaValue - soldValue) / daysRemaining : 0;
  const daysPast = metaDays - daysRemaining;
  const projectedValue = (metaValue / metaDays) * daysPast;
  const percentSold = (soldValue / metaValue) * 100;
  const missingSell = Math.max(0, metaValue - soldValue);

  const navigateToSalesReport = () => {
    navigation.navigate('SalesReportScreen', {
      metaId: selectedGoalId,
      monthYear: '2024-12',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Resumo da Meta</Text>
        <Card title="Informações da Meta">
          <Text style={styles.subtitle}>Valor da Meta: {formatCurrency(metaValue)}</Text>
          <Text style={styles.subtitle}>
            {soldValue > 0
              ? `Valor Vendido no Mês: ${formatCurrency(soldValue)}`
              : 'Nenhuma venda registrada até o momento.'}
          </Text>
          <Text style={styles.subtitle}>Falta vender: {formatCurrency(missingSell)}</Text>
          <Text style={styles.subtitle}>Dias Restantes: {daysRemaining}</Text>
          <Text style={styles.subtitle}>Diária: {formatCurrency(dailyGoal)}</Text>
          <Text style={styles.subtitle}>
            Valor de Venda Esperado: {formatCurrency(projectedValue)}
          </Text>
          <Text style={styles.subtitle}>Percentual Vendido: {percentSold.toFixed(2)}%</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2D3142',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
    color: '#2D3142',
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
  goalItem: {
    padding: 15,
    backgroundColor: '#F7F9FC',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3142',
  },
  goalValue: {
    fontSize: 16,
    color: '#27AE60',
    marginTop: 5,
  },
  goalActionText: {
    fontSize: 14,
    color: '#3A86FF',
    fontWeight: '500',
  },
});

export default ReportScreen;
