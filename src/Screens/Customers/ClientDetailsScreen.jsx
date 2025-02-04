import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const ClientDetailsScreen = ({ route }) => {
  // Recebe via route.params: clientName e um array de compras
  const { clientName, purchases } = route.params;

  // Calcula estatísticas: média por compra e média de dias entre compras
  const calculateStats = () => {
    const totalValue = purchases.reduce((sum, sale) => sum + sale.value, 0);
    const averageValue = purchases.length > 0 ? totalValue / purchases.length : 0;

    const uniqueDates = [
      ...new Set(
        purchases.map((sale) =>
          new Date(sale.date).toISOString().split('T')[0]
        )
      ),
    ]
      .map((dateStr) => new Date(dateStr))
      .sort((a, b) => a - b);

    let totalDays = 0;
    for (let i = 1; i < uniqueDates.length; i++) {
      const diffInMs = uniqueDates[i] - uniqueDates[i - 1];
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
      totalDays += diffInDays;
    }
    const averageDays = uniqueDates.length > 1 ? totalDays / (uniqueDates.length - 1) : 0;

    return { averageValue, averageDays };
  };

  const { averageValue, averageDays } = calculateStats();

  const renderPurchaseItem = ({ item }) => (
    <View style={styles.purchaseItem}>
      <View style={styles.purchaseHeader}>
        <Text style={styles.purchaseDescription}>{item.description}</Text>
        <Text style={styles.purchaseValue}>R$ {item.value.toFixed(2)}</Text>
      </View>
      <Text style={styles.purchaseDate}>Data: {item.date}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Detalhes do Cliente</Text>
        <Text style={styles.clientName}>{clientName}</Text>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Média por Compra</Text>
          <Text style={styles.statValue}>R$ {averageValue.toFixed(2)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Média Dias Entre Compras</Text>
          <Text style={styles.statValue}>{averageDays.toFixed(1)} dias</Text>
        </View>
      </View>
      <FlatList
        data={purchases}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderPurchaseItem}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={<Text style={styles.listHeader}>Compras</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  header: {
    padding: 20,
    backgroundColor: '#3A86FF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  title: { fontSize: 20, color: '#FFF', fontWeight: 'bold' },
  clientName: { fontSize: 24, color: '#FFF', marginTop: 5, fontWeight: '600' },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 10,
    elevation: 2,
    marginTop: -20,
  },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 14, color: '#6C757D', marginBottom: 5 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#3A86FF' },
  listContainer: { padding: 20 },
  listHeader: { fontSize: 18, color: '#2D3142', fontWeight: '600', marginBottom: 10 },
  purchaseItem: {
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  purchaseDescription: { fontSize: 16, fontWeight: '600', color: '#2D3142' },
  purchaseValue: { fontSize: 16, fontWeight: 'bold', color: '#27AE60' },
  purchaseDate: { fontSize: 14, color: '#6C757D' },
});

export default ClientDetailsScreen;
