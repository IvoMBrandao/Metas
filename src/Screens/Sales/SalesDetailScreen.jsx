import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const SalesDetailScreen = ({ route, navigation }) => {
  const { metaId, date } = route.params;
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [filter, setFilter] = useState('');
  const [filterBy, setFilterBy] = useState('description'); // 'description' or 'value'
  const [showCrediario, setShowCrediario] = useState(false);
  const [totalSales, setTotalSales] = useState(0);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCloseModalVisible, setCloseModalVisible] = useState(false);
  const [totals, setTotals] = useState({ cash: 0, pix: 0, crediario: 0 });

  const fetchSalesData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const metaData = parsedData.find((item) => item.id === metaId);
        const dailySales = metaData?.sales?.filter((sale) => sale.date === date) || [];
        setSales(dailySales);
        setFilteredSales(dailySales);
        calculateTotal(dailySales);
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao carregar as vendas.');
      console.error('Erro ao carregar vendas:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSalesData();
    }, [metaId, date])
  );

  useEffect(() => {
    applyFilter();
  }, [filter, filterBy, sales, showCrediario]);

  const applyFilter = () => {
    let displayedSales = sales;

    if (filter) {
      if (filterBy === 'description') {
        displayedSales = displayedSales.filter((sale) =>
          sale.description.toLowerCase().includes(filter.toLowerCase())
        );
      } else if (filterBy === 'value') {
        displayedSales = displayedSales.filter((sale) =>
          sale.value.toString().includes(filter)
        );
      }
    }

    if (!showCrediario) {
      displayedSales = displayedSales.filter((sale) => sale.paymentMethod !== 'crediario');
    }

    setFilteredSales(displayedSales);
    calculateTotal(displayedSales);
  };

  const calculateTotal = (salesList) => {
    const total = salesList.reduce((sum, sale) => sum + sale.value, 0);
    setTotalSales(total);
  };

  const calculateCloseTotals = () => {
    const totals = sales.reduce(
      (acc, sale) => {
        if (sale.paymentMethod === 'cash') {
          acc.cash += sale.value;
        } else if (sale.paymentMethod === 'pix') {
          acc.pix += sale.value;
        } else if (sale.paymentMethod === 'crediario') {
          acc.crediario += sale.value;
        }
        return acc;
      },
      { cash: 0, pix: 0, crediario: 0 }
    );
    setTotals(totals);
    setCloseModalVisible(true);
  };
  

  const handleEditSale = (sale) => {
    navigation.navigate('EditSaleScreen', { sale, metaId, date });
  };

  const handleDeleteSale = async (saleId) => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData) {
        const data = JSON.parse(savedData);
        const metaIndex = data.findIndex((item) => item.id === metaId);

        if (metaIndex !== -1) {
          data[metaIndex].sales = data[metaIndex].sales.filter((sale) => sale.id !== saleId);
          await AsyncStorage.setItem('financeData', JSON.stringify(data));
          fetchSalesData();
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao excluir a venda.');
      console.error('Erro ao excluir venda:', error);
    }
  };

  const toggleFilterBy = () => {
    setFilterBy((prev) => (prev === 'description' ? 'value' : 'description'));
  };

  const renderItem = ({ item }) => (
    <View style={styles.saleItem}>
      <TouchableOpacity
        onPress={() => {
          setSelectedSale(item);
          setModalVisible(true);
        }}
      >
        <Text style={styles.saleDescription}>{item.description}</Text>
        <Text style={styles.salePaymentMethod}>
          Forma de Pagamento: {item.paymentMethod}
        </Text>
        <Text style={styles.saleValue}>R$ {item.value.toFixed(2)}</Text>
      </TouchableOpacity>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => handleEditSale(item)}
        >
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => handleDeleteSale(item.id)}
        >
          <Text style={styles.buttonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendas do Dia: {date}</Text>
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.filterInput}
          placeholder={`Filtrar por ${filterBy === 'description' ? 'Descrição' : 'Valor'}...`}
          value={filter}
          onChangeText={setFilter}
          placeholderTextColor="#BDBDBD"
        />
        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.toggleButton} onPress={toggleFilterBy}>
            <Text style={styles.toggleButtonText}>
              Alternar para {filterBy === 'description' ? 'Valor' : 'Descrição'}
            </Text>
          </TouchableOpacity>
          <View style={styles.checkboxContainer}>
            <Checkbox
              value={showCrediario}
              onValueChange={setShowCrediario}
              color={showCrediario ? '#3A86FF' : undefined}
            />
            <Text style={styles.checkboxLabel}>Mostrar Crediário</Text>
          </View>
        </View>
      </View>
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
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#2D3142',
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleButton: {
    backgroundColor: '#3A86FF',
    padding: 10,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2D3142',
  },
  saleItem: {
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
  saleDescription: {
    fontSize: 16,
    color: '#2D3142',
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
    marginTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#3A86FF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3A86FF',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  noSales: {
    textAlign: 'center',
    fontSize: 16,
    color: '#BDBDBD',
  },
  totalSales: {
    fontSize: 16,
    marginTop: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2D3142',
  },
  calculateButton: {
    marginTop: 20,
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
 
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2D3142',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#2D3142',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#E74C3C',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default SalesDetailScreen;
