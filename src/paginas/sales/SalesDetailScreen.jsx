// src/screens/SalesDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SalesDetailScreen = ({ route }) => {
  const { metaId, date } = route.params;
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('financeData');
        if (savedData) {
          const data = JSON.parse(savedData);
          const metaData = data.find(item => item.id === metaId);
          setMeta(metaData);
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

  // Filtra vendas pelo dia selecionado
  const filteredSales = meta.sales?.filter(sale => sale.date === date) || [];
  
  // Calcula o total vendido no dia
  const totalSold = filteredSales.reduce((total, sale) => total + sale.value, 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.subtitle}>Vendas do {date}:</Text>
      {filteredSales.length > 0 ? (
        filteredSales.map((sale) => (
          <Text key={sale.id} style={styles.saleItem}>
            R$ {sale.value}
          </Text>
        ))
      ) : (
        <Text style={styles.noSales}>Nenhuma venda registrada para esta data.</Text>
      )}
      {filteredSales.length > 0 && (
        <Text style={styles.totalSold}>
          Total Vendido: R$ {totalSold.toFixed(2)}
        </Text>
      )}
    </ScrollView>
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
    fontSize: 20,
    marginBottom: 10,
  },
  saleItem: {
    fontSize: 16,
    marginVertical: 5,
  },
  noSales: {
    fontSize: 16,
    color: '#BDC3C7',
  },
  totalSold: {
    fontSize: 18,
    marginTop: 20,
    fontWeight: 'bold',
  },
});

export default SalesDetailScreen;
