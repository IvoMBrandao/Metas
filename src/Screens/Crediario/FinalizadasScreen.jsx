import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FinalizadasScreen = ({ navigation }) => {
  const [finalizedSales, setFinalizedSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchFinalizedSales();
  }, []);

  const fetchFinalizedSales = async () => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const allFinalizedSales = parsedData
          .flatMap((meta) =>
            meta.sales?.filter((sale) => sale.closed) || []
          )
          .sort((a, b) => {
            const dateA = new Date(b.closedDate || '1970-01-01');
            const dateB = new Date(a.closedDate || '1970-01-01');
            return dateA - dateB;
          });
        setFinalizedSales(allFinalizedSales);
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao carregar as contas finalizadas.');
      console.error('Erro ao carregar finalizadas:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Indisponível';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };
  
  const reopenSaleAccount = async (saleId) => {
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

          parsedData[metaIndex].sales[saleIndex].closed = false;
          parsedData[metaIndex].sales[saleIndex].closedDate = null;

          await AsyncStorage.setItem('financeData', JSON.stringify(parsedData));
          fetchFinalizedSales();
          setModalVisible(false);
          Alert.alert('Sucesso', 'Conta reaberta com sucesso.');
          navigation.navigate('CreditoScreen');
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível reabrir a conta.');
      console.error('Erro ao reabrir conta:', error);
    }
  };

  const renderParcelDetails = (parcels) => {
    return parcels.map((parcel, index) => (
      <Text key={index} style={styles.parcelDetails}>
        Parcela {parcel.number}: R$ {parcel.value} - Vencimento: {formatDate(parcel.date)}
        {parcel.paid && parcel.paymentDate
          ? ` (Pago em: ${formatDate(parcel.paymentDate)})`
          : ''}
      </Text>
    ));
  };

  const renderSaleItem = ({ item }) => {
    const totalValue = item.parcels
      ? item.parcels.reduce((sum, parcel) => sum + parseFloat(parcel.value), 0).toFixed(2)
      : '0.00';
    const totalInstallments = item.parcels ? item.parcels.length : 0;
  
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
        <Text style={styles.saleValue}>
          {totalInstallments}x R$ {totalValue}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contas Finalizadas</Text>
      {finalizedSales.length > 0 ? (
        <FlatList
          data={finalizedSales}
          keyExtractor={(item) => item.id}
          renderItem={renderSaleItem}
        />
      ) : (
        <Text style={styles.noSales}>Nenhuma conta finalizada encontrada.</Text>
      )}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          {selectedSale && (
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Detalhes da Conta</Text>
              <Text style={styles.modalText}>Descrição: {selectedSale.description}</Text>
              <Text style={styles.modalText}>Cliente: {selectedSale.customer}</Text>
              <Text style={styles.modalText}>
                Finalizada em: {formatDate(selectedSale.closedDate)}
              </Text>
              <Text style={styles.modalText}>Detalhes das Parcelas:</Text>
              {renderParcelDetails(selectedSale.parcels)}
              <TouchableOpacity
                style={styles.reopenButton}
                onPress={() => reopenSaleAccount(selectedSale.id)}
              >
                <Text style={styles.reopenButtonText}>Reabrir Conta</Text>
              </TouchableOpacity>
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
    textAlign: 'center',
  },
  saleItem: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DADADA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  saleDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3142',
  },
  saleCustomer: {
    fontSize: 14,
    color: '#3A86FF',
    marginTop: 5,
  },
  saleDate: {
    fontSize: 14,
    color: '#BDC3C7',
    marginTop: 5,
  },
  noSales: {
    textAlign: 'center',
    fontSize: 16,
    color: '#BDBDBD',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#3A86FF',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#2D3142',
  },
  parcelDetails: {
    fontSize: 14,
    color: '#2D3142',
    marginVertical: 5,
  },
  reopenButton: {
    marginTop: 10,
    backgroundColor: '#3A86FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reopenButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 10,
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

export default FinalizadasScreen;
