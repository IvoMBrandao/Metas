// src/screens/SalesDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SalesDetailScreen = ({ route, navigation }) => {
  const { metaId, date } = route.params;
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    fetchMetaData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMetaData();
    });
    return unsubscribe;
  }, [metaId, date, navigation]);

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

  const handleEditSale = (sale) => {
    navigation.navigate('EditSaleScreen', { sale, metaId, date });
  };

  const handleDeleteSale = async (saleId) => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData) {
        const data = JSON.parse(savedData);
        const metaIndex = data.findIndex(item => item.id === metaId);

        if (metaIndex !== -1) {
          data[metaIndex].sales = data[metaIndex].sales.filter(sale => sale.id !== saleId);
          await AsyncStorage.setItem('financeData', JSON.stringify(data));
          fetchMetaData(); // Atualiza os dados após a exclusão
        }
      }
    } catch (error) {
      console.log('Erro ao excluir venda', error);
    }
  };

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
          <View key={sale.id} style={styles.saleItemContainer}>
            <Text style={styles.saleItem}>
              R$ {sale.value}
            </Text>
            <View style={styles.buttonContainer}>
              <Button
                title="Editar"
                onPress={() => handleEditSale(sale)}
              />
              <Button
                title="Excluir"
                color="red"
                onPress={() => Alert.alert(
                  'Confirmar Exclusão',
                  'Tem certeza que deseja excluir esta venda?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Excluir', onPress: () => handleDeleteSale(sale.id) }
                  ]
                )}
              />
            </View>
          </View>
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
  saleItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  saleItem: {
    fontSize: 16,
    flex: 1,
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
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SalesDetailScreen;
