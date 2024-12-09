import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';


const CreditoScreen = ({ navigation }) => {
  const [crediarioSales, setCrediarioSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [filterCustomer, setFilterCustomer] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const isFocused = useIsFocused(); // Detecta se a tela está em foco


  useEffect(() => {
    if (isFocused) {
      fetchCrediarioSales(); // Atualiza os dados sempre que a tela for focada
    }
  }, [isFocused]);


  useEffect(() => {
    fetchCrediarioSales();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filterCustomer, crediarioSales]);

  const fetchCrediarioSales = async () => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const allCrediarioSales = parsedData
          .flatMap((meta) =>
            meta.sales?.filter(
              (sale) =>
                sale.paymentMethod === 'crediario' &&
                !sale.closed
            ) || []
          )
          .sort((a, b) => {
            const nextA = a.parcels.find((parcel) => !parcel.paid)?.date || '';
            const nextB = b.parcels.find((parcel) => !parcel.paid)?.date || '';
            return new Date(nextA) - new Date(nextB);
          });

        setCrediarioSales(allCrediarioSales);
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao carregar as vendas no crediário.');
      console.error('Erro ao carregar crediário:', error);
    }
  };

  const applyFilter = () => {
    if (filterCustomer.trim() === '') {
      setFilteredSales(groupByDueDate(crediarioSales));
    } else {
      const filtered = crediarioSales.filter((sale) =>
        sale.customer.toLowerCase().includes(filterCustomer.toLowerCase())
      );
      setFilteredSales(groupByDueDate(filtered));
    }
  };

  const groupByDueDate = (sales) => {
    const grouped = {};
    sales.forEach((sale) => {
      const nextParcelDate =
        sale.parcels.find((parcel) => !parcel.paid)?.date || 'Todas pagas';
      if (!grouped[nextParcelDate]) {
        grouped[nextParcelDate] = [];
      }
      grouped[nextParcelDate].push(sale);
    });

    return Object.entries(grouped).map(([date, sales]) => ({
      date,
      sales,
    }));
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const toggleParcelStatus = async (saleId, parcelIndex) => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const metaIndex = parsedData.findIndex((meta) =>
          meta.sales?.some((sale) => sale.id === saleId)
        );

        if (metaIndex !== -1) {
          const saleIndex = parsedData[metaIndex].sales.findIndex(
            (sale) => sale.id === saleId
          );

          const parcel =
            parsedData[metaIndex].sales[saleIndex].parcels[parcelIndex];
          const now = new Date().toISOString().split('T')[0];

          if (!parcel.paid) {
            parcel.paid = true;
            parcel.paymentDate = now;
          } else {
            parcel.paid = false;
            parcel.paymentDate = null;
          }

          await AsyncStorage.setItem('financeData', JSON.stringify(parsedData));
          fetchCrediarioSales();
          setSelectedSale((prev) => (prev
            ? {
                ...prev,
                parcels: prev.parcels.map((p, index) =>
                  index === parcelIndex
                    ? { ...p, paid: parcel.paid, paymentDate: parcel.paymentDate }
                    : p
                ),
              }
            : null));
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a parcela.');
      console.error('Erro ao atualizar parcela:', error);
    }
  };

  const closeSaleAccount = async (saleId) => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const metaIndex = parsedData.findIndex((meta) =>
          meta.sales?.some((sale) => sale.id === saleId)
        );

        if (metaIndex !== -1) {
          const saleIndex = parsedData[metaIndex].sales.findIndex(
            (sale) => sale.id === saleId
          );

          parsedData[metaIndex].sales[saleIndex].closed = true;

          await AsyncStorage.setItem('financeData', JSON.stringify(parsedData));
          fetchCrediarioSales();
          setModalVisible(false);
          Alert.alert('Sucesso', 'Conta fechada com sucesso.');
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível fechar a conta.');
      console.error('Erro ao fechar conta:', error);
    }
  };

  const renderSaleItem = ({ item }) => {
    const nextParcel = item.parcels.find((parcel) => !parcel.paid);
    return (
      <TouchableOpacity
        style={styles.saleItem}
        onPress={() => {
          setSelectedSale(item);
          setModalVisible(true);
        }}
      >
        <Text style={styles.saleDescription}>{item.description}</Text>
        <Text style={styles.saleCustomer}>Cliente: {item.customer}</Text>
        {nextParcel && (
          <Text style={styles.nextParcel}>
            Próxima Parcela: {formatDate(nextParcel.date)} - R$ {nextParcel.value}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderGroupedItem = ({ item }) => (
    <View style={styles.groupedItem}>
      <Text style={styles.groupDate}>
        Data de Vencimento: {item.date !== 'Todas pagas' ? formatDate(item.date) : 'Todas pagas'}
      </Text>
      <FlatList
        data={item.sales}
        keyExtractor={(sale) => sale.id}
        renderItem={renderSaleItem}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compras no Crediário</Text>
      <TextInput
        style={styles.filterInput}
        placeholder="Filtrar por cliente..."
        value={filterCustomer}
        onChangeText={setFilterCustomer}
        placeholderTextColor="#BDBDBD"
      />
      {filteredSales.length > 0 ? (
        <FlatList
          data={filteredSales}
          keyExtractor={(item) => item.date}
          renderItem={renderGroupedItem}
        />
      ) : (
        <Text style={styles.noSales}>Nenhuma compra no crediário encontrada.</Text>
      )}
      <TouchableOpacity
        style={styles.completedButton}
        onPress={() => navigation.navigate('Finalizadas')}
      >
        <Text style={styles.completedButtonText}>Ver Finalizadas</Text>
      </TouchableOpacity>
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          {selectedSale && (
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Detalhes da Compra</Text>
              <Text style={styles.modalText}>Descrição: {selectedSale.description}</Text>
              <Text style={styles.modalText}>Cliente: {selectedSale.customer}</Text>
              <FlatList
                data={selectedSale.parcels}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.parcelItem}>
                    <Text style={styles.parcelText}>
                      Parcela {item.number}: R$ {item.value} - {formatDate(item.date)}
                      {item.paid && item.paymentDate
                        ? ` (Pago em: ${formatDate(item.paymentDate)})`
                        : ''}
                    </Text>
                    <Checkbox
                      value={item.paid}
                      onValueChange={() => toggleParcelStatus(selectedSale.id, index)}
                      color={item.paid ? '#3A86FF' : undefined}
                    />
                  </View>
                )}
              />
              {selectedSale.parcels.every((parcel) => parcel.paid) && (
                <TouchableOpacity
                  style={styles.closeAccountButton}
                  onPress={() => closeSaleAccount(selectedSale.id)}
                >
                  <Text style={styles.closeAccountButtonText}>Fechar Conta</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
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
  filterInput: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
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
  saleCustomer: {
    fontSize: 14,
    color: '#3A86FF',
    marginVertical: 5,
  },
  nextParcel: {
    fontSize: 14,
    color: '#27AE60',
    marginTop: 5,
  },
  groupDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2D3142',
  },
  parcelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  parcelText: {
    fontSize: 16,
    color: '#2D3142',
  },
  closeAccountButton: {
    marginTop: 10,
    backgroundColor: '#3A86FF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  completedButton: {
    backgroundColor: '#27AE60',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  completedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
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
  noSales: {
    textAlign: 'center',
    fontSize: 16,
    color: '#BDBDBD',
  },
});

export default CreditoScreen;
