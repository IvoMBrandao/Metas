import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const CrediarioDetalhesScreen = ({ route }) => {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    const fetchedSales = route.params.sales;
    setSales(fetchedSales);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhamento do Crediário</Text>
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>
              Cliente: {item.customer} - R$ {item.value}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC', padding: 20 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 10, color: '#2D3142' },
  item: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
  },
  itemText: { fontSize: 16, color: '#2D3142' },
});

export default CrediarioDetalhesScreen;
