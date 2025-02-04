import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getDatabase, ref, get } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';

const CrediarioResumoScreen = ({ route, navigation }) => {
  const { lojaId } = route.params || {};
  const { user } = useAuthContext();

  const [totalPendente, setTotalPendente] = useState(0);
  const [comprasVencidas, setComprasVencidas] = useState([]);
  const [proximosVencimentos, setProximosVencimentos] = useState([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchCrediarioSales();
    }
  }, [isFocused]);

  const fetchCrediarioSales = async () => {
    if (!user?.uid) return;
    if (!lojaId) {
      Alert.alert('Erro', 'lojaId não informado.');
      return;
    }
    try {
      const db = getDatabase();
      const credRef = ref(db, `users/${user.uid}/lojas/${lojaId}/crediarios`);
      const snapshot = await get(credRef);

      if (!snapshot.exists()) {
        setTotalPendente(0);
        setComprasVencidas([]);
        setProximosVencimentos([]);
        return;
      }

      const dataVal = snapshot.val();
      // Array
      const credArray = Object.keys(dataVal).map((k) => dataVal[k]);
      // Filtra crediarios em aberto
      const abertos = credArray.filter((c) => !c.closed);

      // Calcula total pendente
      let total = 0;
      const vencidasArray = [];
      const proximasArray = [];
      const now = new Date();

      abertos.forEach((sale) => {
        // soma parcelas não pagas
        sale.parcels.forEach((p) => {
          if (!p.paid) {
            total += parseFloat(p.amount);
            const due = new Date(p.dueDate);
            if (due < now) {
              vencidasArray.push(sale);
            } else {
              // se dentro de 15 dias
              const diff = (due - now) / (1000 * 60 * 60 * 24);
              if (diff <= 15) {
                proximasArray.push(sale);
              }
            }
          }
        });
      });

      setTotalPendente(total);
      setComprasVencidas([...new Set(vencidasArray)]); // remove duplicados
      setProximosVencimentos([...new Set(proximasArray)]);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar resumo do crediário.');
      console.error(error);
    }
  };

  const navigateToCrediarioScreen = (filterType) => {
    // Exemplo: redireciona para a tela 'CreditoScreen' com um tipo de filtro
    navigation.navigate('CreditoScreen', { lojaId, filterType });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumo do Crediário - Loja {lojaId}</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigateToCrediarioScreen('totalPendente')}
      >
        <Text style={styles.cardTitle}>Total Pendente</Text>
        <Text style={styles.cardValue}>R$ {totalPendente.toFixed(2)}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigateToCrediarioScreen('comprasVencidas')}
      >
        <Text style={styles.cardTitle}>Compras Vencidas</Text>
        <Text style={styles.cardValue}>{comprasVencidas.length} compras</Text>
      </TouchableOpacity>

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

export default CrediarioResumoScreen;

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
