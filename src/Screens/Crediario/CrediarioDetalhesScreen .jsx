import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export default function CrediarioDetalhesScreen({ route }) {
  // Se você enviar via params: { crediario }
  const { crediario } = route.params || {};
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(crediario);
  }, [crediario]);

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Nenhum detalhe carregado</Text>
      </View>
    );
  }

  // Exemplo: Listar as parcels
  const renderParcel = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>
        Parcela {item.id}: R$ {item.amount} - Venc: {formatDate(item.dueDate)}
      </Text>
      <Text style={styles.itemText}>
        Pago: {item.paid ? 'Sim' : 'Não'}
      </Text>
    </View>
  );

  const formatDate = (isoString) => {
    if (!isoString) return '---';
    const [year, month, day] = isoString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes do Crediário</Text>
      <Text style={styles.subtitle}>
        Cliente: {data.customer} - Valor: R${data.amount?.toFixed(2)}
      </Text>

      <FlatList
        data={data.parcels || []}
        keyExtractor={(item, index) => String(index)}
        renderItem={renderParcel}
        ListHeaderComponent={<Text style={styles.listHeader}>Parcelas</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC', padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2D3142',
  },
  subtitle: {
    fontSize: 16,
    color: '#2D3142',
    marginBottom: 15,
  },
  listHeader: {
    fontSize: 18,
    color: '#2D3142',
    fontWeight: '600',
    marginVertical: 10,
  },
  item: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
  },
  itemText: { fontSize: 16, color: '#2D3142' },
});
