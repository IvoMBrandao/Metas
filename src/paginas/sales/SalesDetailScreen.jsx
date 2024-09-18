// src/screens/SalesDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SalesDetailScreen = ({ route, navigation }) => {
  const { metaId } = route.params;
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

  const handleEdit = (sale) => {
    navigation.navigate('EditSale', { sale, metaId });
  };

  const handleDelete = (saleId) => {
    Alert.alert(
      'Excluir Venda',
      'Tem certeza de que deseja excluir esta venda?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          onPress: async () => {
            try {
              const savedData = await AsyncStorage.getItem('financeData');
              if (savedData) {
                const data = JSON.parse(savedData);
                const metaData = data.find(item => item.id === metaId);
                metaData.sales = metaData.sales.filter(sale => sale.id !== saleId);
                await AsyncStorage.setItem('financeData', JSON.stringify(data));
                setMeta(metaData);
              }
            } catch (error) {
              console.log('Erro ao excluir venda', error);
            }
          },
        },
      ]
    );
  };

  if (!meta) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.subtitle}>Vendas do dia:</Text>
      {meta.sales && meta.sales.length > 0 ? (
        meta.sales.map((sale) => (
          <View key={sale.id} style={styles.saleItemContainer}>
            <Text style={styles.saleItem}>R$ {sale.value}</Text>
            <Button
              title="Editar"
              onPress={() => handleEdit(sale)}
            />
            <Button
              title="Excluir"
              color="red"
              onPress={() => handleDelete(sale.id)}
            />
          </View>
        ))
      ) : (
        <Text style={styles.noSales}>Nenhuma venda registrada.</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  saleItem: {
    fontSize: 16,
    flex: 1,
  },
  noSales: {
    fontSize: 16,
    color: '#BDC3C7',
  },
});

export default SalesDetailScreen;
