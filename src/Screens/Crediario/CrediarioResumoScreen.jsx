import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const CrediarioResumoScreen = ({ navigation }) => {
  const [crediarioSales, setCrediarioSales] = useState([]);
  const [totalPendente, setTotalPendente] = useState(0);
  const [comprasVencidas, setComprasVencidas] = useState([]);
  const [proximosVencimentos, setProximosVencimentos] = useState([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) fetchCrediarioSales();
  }, [isFocused]);

  const fetchCrediarioSales = async () => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const allCrediarioSales = parsedData.flatMap((meta) =>
          meta.sales?.filter((sale) => sale.paymentMethod === 'crediario' && !sale.closed) || []
        );
        setCrediarioSales(allCrediarioSales);
        calculateResumo(allCrediarioSales);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar crediário.');
      console.error(error);
    }
  };

  const calculateResumo = (sales) => {
    const total = sales.reduce((sum, sale) => {
      const pendente = sale.parcels
        .filter((parcel) => !parcel.paid)
        .reduce((subtotal, parcel) => subtotal + parseFloat(parcel.value), 0);
      return sum + pendente;
    }, 0);

    const vencidas = sales.filter((sale) =>
      sale.parcels.some((parcel) => !parcel.paid && new Date(parcel.date) < new Date())
    );

    const proximos = sales.flatMap((sale) =>
      sale.parcels.filter(
        (parcel) =>
          !parcel.paid &&
          new Date(parcel.date) >= new Date() &&
          new Date(parcel.date) <= new Date(new Date().setDate(new Date().getDate() + 15))
      )
    );

    setTotalPendente(total);
    setComprasVencidas(vencidas);
    setProximosVencimentos(proximos);
  };

  const navigateToCrediarioScreen = (filterType) => {
    navigation.navigate('CreditoScreen', { filterType });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumo do Crediário</Text>

      {/* Total Pendente */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigateToCrediarioScreen('totalPendente')}
      >
        <Text style={styles.cardTitle}>Total Pendente</Text>
        <Text style={styles.cardValue}>R$ {totalPendente.toFixed(2)}</Text>
      </TouchableOpacity>

      {/* Compras Vencidas */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigateToCrediarioScreen('comprasVencidas')}
      >
        <Text style={styles.cardTitle}>Compras Vencidas</Text>
        <Text style={styles.cardValue}>{comprasVencidas.length} compras</Text>
      </TouchableOpacity>

      {/* Próximos Vencimentos */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigateToCrediarioScreen('proximosVencimentos')}
      >
        <Text style={styles.cardTitle}>Próximos Vencimentos</Text>
        <Text style={styles.cardValue}>{proximosVencimentos.length} parcelas</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC', padding: 20 },
  title: { fontSize: 26, fontWeight: '600', marginBottom: 20, color: '#2D3142' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, color: '#2D3142' },
  cardValue: { fontSize: 20, fontWeight: '600', color: '#3A86FF' },
});

export default CrediarioResumoScreen;
