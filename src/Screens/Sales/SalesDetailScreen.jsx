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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

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
  const { metaId, date } = route.params;
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [filter, setFilter] = useState('');
  const [filterBy, setFilterBy] = useState('description');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [totalSales, setTotalSales] = useState(0);

  const fetchSalesData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      const savedCustomers = await AsyncStorage.getItem('customersData');
      const parsedCustomers = savedCustomers ? JSON.parse(savedCustomers) : [];

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const metaData = parsedData.find((item) => item.id === metaId);
        const dailySales = metaData?.sales?.filter((sale) => sale.date === date) || [];

        const enrichedSales = dailySales.map((sale) => {
          const customerData = parsedCustomers.find(
            (customer) => customer.name === sale.customer
          );
          return {
            ...sale,
            client: customerData ? customerData.name : 'Não informado',
          };
        });

        setSales(enrichedSales);
        setFilteredSales(enrichedSales);
        calculateTotal(enrichedSales);
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

  const handleEditSale = (sale) => {
    navigation.navigate('EditSaleScreen', { sale, metaId, date });
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
              : { color: '#3CB371' }, // Verde quando informado
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

      {/* Filtro */}
      <View style={styles.filterContainer}>
        {filterBy === 'paymentMethod' ? (
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setDropdownVisible(!dropdownVisible)}
          >
            <Text style={styles.dropdownText}>
              {selectedPaymentMethod || 'Selecione o Pagamento'}
            </Text>
            <Icon name="caret-down" size={20} color="#3A86FF" />
          </TouchableOpacity>
        ) : (
          <TextInput
            style={styles.filterInput}
            placeholder={`Filtrar por ${filterOptions[filterBy]}...`}
            value={filter}
            onChangeText={setFilter}
            placeholderTextColor="#BDBDBD"
          />
        )}

        {dropdownVisible && filterBy === 'paymentMethod' && (
          <FlatList
            data={paymentMethods}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.dropdownOption,
                  selectedPaymentMethod === item && styles.selectedDropdownOption,
                ]}
                onPress={() => {
                  setSelectedPaymentMethod(item);
                  setDropdownVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    selectedPaymentMethod === item && styles.selectedDropdownOptionText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.dropdown}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() =>
          handleFilterChange(
            filterBy === 'description'
              ? 'value'
              : filterBy === 'value'
              ? 'client'
              : filterBy === 'client'
              ? 'paymentMethod'
              : 'description'
          )
        }
      >
        <Text style={styles.toggleButtonText}>{filterOptions[filterBy]}</Text>
      </TouchableOpacity>

      {/* Lista de Vendas */}
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
