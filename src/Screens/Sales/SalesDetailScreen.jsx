import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getDatabase, ref, get } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';

const paymentMethods = [
  'dinheiro',
  'pix',
  'crediario',
  'cartao-debito',
  'cartao-credito-a-vista',
  'cartao-credito-parcelado',
];

const filterOptions = {
  description: 'Descrição',
  value: 'Valor',
  client: 'Cliente',
  paymentMethod: 'Pagamento',
};

const SalesDetailScreen = ({ route, navigation }) => {
  const { metaId, date, lojaId } = route.params;
  const { user } = useAuthContext();
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [filter, setFilter] = useState('');
  const [filterBy, setFilterBy] = useState('description');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [totalSales, setTotalSales] = useState(0);

  const fetchSalesData = async () => {
    if (!user || !user.uid) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      const db = getDatabase();
      const salesRef = ref(db, `users/${user.uid}/lojas/${lojaId}/metas/${metaId}/vendas`);
      const snapshot = await get(salesRef);
      const allSales = snapshot.exists()
        ? Object.entries(snapshot.val()).map(([id, sale]) => ({ id, ...sale }))
        : [];
      const dailySales = allSales.filter((sale) => sale.date === date);

      setSales(dailySales);
      setFilteredSales(dailySales);
      calculateTotal(dailySales);
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao carregar as vendas.');
      console.error('Erro ao carregar vendas:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSalesData();
    }, [metaId, date, lojaId, user])
  );

  useEffect(() => {
    applyFilter();
  }, [filter, filterBy, selectedPaymentMethod, sales]);

  const applyFilter = () => {
    let displayedSales = [...sales];

    if (filterBy === 'description' && filter) {
      displayedSales = displayedSales.filter((sale) =>
        sale.description?.toLowerCase().includes(filter.toLowerCase())
      );
    } else if (filterBy === 'value' && filter) {
      const filterValue = parseFloat(filter);
      if (!isNaN(filterValue)) {
        displayedSales = displayedSales.filter((sale) => sale.value === filterValue);
      }
    } else if (filterBy === 'paymentMethod' && selectedPaymentMethod) {
      displayedSales = displayedSales.filter(
        (sale) => sale.paymentMethod === selectedPaymentMethod
      );
    } else if (filterBy === 'client' && filter) {
      displayedSales = displayedSales.filter((sale) =>
        sale.client?.toLowerCase().includes(filter.toLowerCase())
      );
    }

    setFilteredSales(displayedSales);
    calculateTotal(displayedSales);
  };

  const calculateTotal = (salesList) => {
    const total = salesList.reduce((sum, sale) => sum + sale.value, 0);
    setTotalSales(total);
  };

  const confirmDelete = (saleId) => {
    Alert.alert(
      'Confirmação',
      'Tem certeza de que deseja excluir esta venda?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => handleDeleteSale(saleId) },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteSale = async (saleId) => {
    // Lógica para excluir uma venda do Firebase pode ser implementada aqui,
    // ajustando o caminho para a venda a ser removida.
    // Por enquanto, mantemos a mesma estrutura de exclusão se necessário.
  };

  const handleEditSale = (sale) => {
    navigation.navigate('EditSaleScreen', { sale, metaId, date, lojaId });
  };

  const renderItem = ({ item }) => (
    <View style={styles.saleItem}>
      <View style={styles.saleInfo}>
        <Text style={styles.saleDescription}>{item.description}</Text>
        <Text
          style={[
            styles.saleClient,
            item.client === 'Não informado'
              ? { color: '#FFC107' }
              : { color: '#3CB371' },
          ]}
        >
          Cliente: {item.client}
        </Text>
        <Text style={styles.salePaymentMethod}>Pagamento: {item.paymentMethod}</Text>
        <Text style={styles.saleValue}>R$ {item.value.toFixed(2)}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={() => handleEditSale(item)}>
          <Icon name="edit" size={28} color="#3A86FF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmDelete(item.id)}>
          <Icon name="trash" size={28} color="#E74C3C" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleFilterChange = (newFilter) => {
    setFilterBy(newFilter);
    setFilter('');
    setSelectedPaymentMethod('');
    setDropdownVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendas do Dia: {date}</Text>

      {/* ... restante do componente ... */}
      
      {filteredSales.length > 0 ? (
        <FlatList
          data={filteredSales}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      ) : (
        <Text style={styles.noSales}>Nenhuma venda encontrada.</Text>
      )}
      <Text style={styles.totalSales}>Total de Vendas: R$ {totalSales.toFixed(2)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F7F9FC',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: '#2D3142',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#2D3142',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
    color: '#2D3142',
  },
  dropdown: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    maxHeight: 150,
  },
  dropdownOption: {
    padding: 10,
  },
  selectedDropdownOption: {
    backgroundColor: '#E0E0E0',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#2D3142',
  },
  selectedDropdownOptionText: {
    fontWeight: 'bold',
  },
  toggleButton: {
    backgroundColor: '#3A86FF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 10,
  },
  saleInfo: {
    flex: 1,
  },
  saleDescription: {
    fontSize: 16,
    color: '#2D3142',
  },
  saleClient: {
    fontSize: 14,
    marginVertical: 5,
  },
  salePaymentMethod: {
    fontSize: 14,
    color: '#3A86FF',
    marginVertical: 5,
  },
  saleValue: {
    fontSize: 16,
    color: '#2D3142',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 70,
  },
  totalSales: {
    fontSize: 16,
    marginTop: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2D3142',
  },
  noSales: {
    textAlign: 'center',
    fontSize: 16,
    color: '#BDBDBD',
  },
});

export default SalesDetailScreen;
