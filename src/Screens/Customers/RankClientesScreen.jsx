import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, onValue } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';

const { width } = Dimensions.get('window');

const RankClientesScreen = ({ route, navigation }) => {
  // Recebe o lojaId via route.params
  const { lojaId } = route.params || {};
  const { user } = useAuthContext();
  const [rankedClients, setRankedClients] = useState([]);
  const [metaOptions, setMetaOptions] = useState([]);
  const [selectedMeta, setSelectedMeta] = useState('all');
  const [showMetaList, setShowMetaList] = useState(false);

  // Neste exemplo, vamos supor que as metas e vendas estejam salvas no Firebase
  // e que cada meta tenha um nó "sales" com as vendas. Você pode ajustar conforme sua estrutura.

  // Função para carregar as opções de metas (exemplo simples)
  const fetchMetaOptions = useCallback(() => {
    if (!user || !user.uid || !lojaId) return;
    const db = getDatabase();
    const metasRef = ref(db, `users/${user.uid}/lojas/${lojaId}/metas`);
    onValue(metasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const options = Object.keys(data).map((key) => ({
          id: key,
          name: data[key].name || `Meta ${key}`,
        }));
        setMetaOptions([{ id: 'all', name: 'Todas as Metas' }, ...options]);
      }
    }, (error) => {
      Alert.alert('Erro', 'Não foi possível carregar as metas.');
      console.error('Erro ao carregar metas:', error);
    });
  }, [user, lojaId]);

  // Função para calcular o ranking de clientes com base nas vendas de todas as metas (ou de uma meta específica)
  const fetchClientRankings = useCallback(() => {
    if (!user || !user.uid || !lojaId) return;
    const db = getDatabase();
    const metasRef = ref(db, `users/${user.uid}/lojas/${lojaId}/metas`);
    onValue(metasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Filtra as metas, se necessário
        const metas = selectedMeta === 'all'
          ? Object.values(data)
          : Object.values(data).filter((meta) => meta.id === selectedMeta);
        // Junta todas as vendas
        const allSales = [];
        metas.forEach((meta) => {
          if (meta.sales) {
            allSales.push(...Object.values(meta.sales));
          }
        });
        // Calcula totais por cliente
        const clientTotals = allSales.reduce((acc, sale) => {
          const client = sale.customer || 'Cliente Não Informado';
          if (!acc[client]) acc[client] = { total: 0, purchases: [] };
          acc[client].total += sale.value;
          acc[client].purchases.push(sale);
          return acc;
        }, {});
        const ranked = Object.entries(clientTotals)
          .map(([client, data]) => ({ client, total: data.total, purchases: data.purchases }))
          .sort((a, b) => b.total - a.total);
        setRankedClients(ranked);
      }
    }, (error) => {
      Alert.alert('Erro', 'Não foi possível carregar os dados dos clientes.');
      console.error('Erro ao carregar dados dos clientes:', error);
    });
  }, [user, lojaId, selectedMeta]);

  useEffect(() => {
    fetchMetaOptions();
  }, [fetchMetaOptions]);

  useFocusEffect(
    useCallback(() => {
      fetchClientRankings();
    }, [fetchClientRankings])
  );

  const getRankStyle = (index) => {
    if (index === 0) return styles.gold;
    if (index === 1) return styles.silver;
    if (index === 2) return styles.bronze;
    return styles.defaultRank;
  };

  const renderClientItem = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.clientItem, index < 3 && styles.highlight]}
      onPress={() =>
        navigation.navigate('ClientDetailsScreen', {
          clientName: item.client,
          purchases: item.purchases,
        })
      }
    >
      <View style={[styles.rankContainer, getRankStyle(index)]}>
        <Text style={styles.rank}>{index + 1}</Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.client}</Text>
        <Text style={styles.clientTotal}>R$ {item.total.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMetaItem = ({ item }) => (
    <TouchableOpacity
      style={styles.metaItem}
      onPress={() => {
        setSelectedMeta(item.id);
        setShowMetaList(false);
      }}
    >
      <Text style={styles.metaItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <View style={styles.halfMoon} />
      </View>
      <View style={styles.titleWrapper}>
        <Text style={styles.title}>Ranking de Clientes</Text>
      </View>
      <TouchableOpacity
        style={styles.metaSelector}
        onPress={() => setShowMetaList((prev) => !prev)}
      >
        <Text style={styles.metaSelectorText}>
          {metaOptions.find((meta) => meta.id === selectedMeta)?.name || 'Selecionar Meta'}
        </Text>
      </TouchableOpacity>
      {showMetaList && (
        <FlatList
          data={metaOptions}
          keyExtractor={(item) => item.id}
          renderItem={renderMetaItem}
          style={styles.metaList}
        />
      )}
      {rankedClients.length > 0 ? (
        <FlatList
          data={rankedClients}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderClientItem}
          style={styles.clientsList}
        />
      ) : (
        <Text style={styles.noClients}>Nenhum cliente encontrado.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7F9FC' },
  background: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 0.80,
    top: -width * 0.35,
    left: -width * 0.25,
    backgroundColor: '#3A86FF',
    borderBottomLeftRadius: width * 0.75,
    borderBottomRightRadius: width * 0.75,
    zIndex: 0,
  },
  titleWrapper: { alignItems: 'center', marginBottom: 20, zIndex: 1 },
  title: { fontSize: 24, fontWeight: '600', color: '#FFF', textAlign: 'center' },
  metaSelector: {
    padding: 10,
    backgroundColor: '#3A86FF',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  metaSelectorText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  metaList: { marginBottom: 20 },
  metaItem: {
    padding: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginVertical: 5,
  },
  metaItemText: { fontSize: 16, color: '#2D3142', textAlign: 'center' },
  clientsList: { flex: 1 },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  highlight: { backgroundColor: '#FFF4E6' },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rank: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 16, color: '#3A86FF', marginBottom: 5 },
  clientTotal: { fontSize: 16, fontWeight: 'bold', color: '#27AE60' },
  noClients: { textAlign: 'center', fontSize: 16, color: '#BDBDBD', marginTop: 20 },
  gold: { backgroundColor: '#FFD700' },
  silver: { backgroundColor: '#C0C0C0' },
  bronze: { backgroundColor: '#CD7F32' },
  defaultRank: { backgroundColor: '#3A86FF' },
});

export default RankClientesScreen;
