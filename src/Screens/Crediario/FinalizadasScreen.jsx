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
import { getDatabase, ref, get, update } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';

const FinalizadasScreen = ({ route, navigation }) => {
  const { lojaId } = route.params || {};
  const { user } = useAuthContext();

  const [finalizedSales, setFinalizedSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchFinalizedSales();
  }, []);

  const fetchFinalizedSales = async () => {
    if (!user?.uid) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }
    if (!lojaId) {
      Alert.alert('Erro', 'lojaId não fornecido.');
      return;
    }

    try {
      const db = getDatabase();
      const credRef = ref(db, `users/${user.uid}/lojas/${lojaId}/crediarios`);
      const snapshot = await get(credRef);

      if (!snapshot.exists()) {
        setFinalizedSales([]);
        return;
      }
      const dataVal = snapshot.val();
      const credArray = Object.keys(dataVal).map((k) => dataVal[k]);

      // filtra closed === true
      const finalizados = credArray
        .filter((c) => c.closed)
        .sort((a, b) => {
          const dateA = new Date(a.closedDate || '1970-01-01');
          const dateB = new Date(b.closedDate || '1970-01-01');
          // se quiser do mais recente para o mais antigo
          return dateB - dateA;
        });

      setFinalizedSales(finalizados);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar contas finalizadas.');
      console.error(error);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '---';
    const [year, month, day] = isoString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  /**
   * Reabre conta => closed = false
   */
  const reopenSaleAccount = async (saleId) => {
    try {
      const db = getDatabase();
      const credRef = ref(db, `users/${user.uid}/lojas/${lojaId}/crediarios`);
      const snapshot = await get(credRef);

      if (!snapshot.exists()) return;

      const dataVal = snapshot.val();
      const key = Object.keys(dataVal).find((k) => dataVal[k].id === saleId);
      if (!key) return;

      const saleObj = dataVal[key];
      saleObj.closed = false;
      saleObj.closedDate = null;

      await update(ref(db, `users/${user.uid}/lojas/${lojaId}/crediarios/${key}`), saleObj);

      fetchFinalizedSales();
      setModalVisible(false);
      Alert.alert('Sucesso', 'Conta reaberta com sucesso!');
      navigation.navigate('CreditoScreen', { lojaId });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível reabrir a conta.');
      console.error(error);
    }
  };

  const renderParcelDetails = (parcels = []) => {
    return parcels.map((p, i) => (
      <Text key={i} style={styles.parcelDetails}>
        Parcela {p.id}: R$ {p.amount?.toFixed(2)} - Venc: {formatDate(p.dueDate)}
        {p.paid && p.paymentDate
          ? ` (Pago em: ${formatDate(p.paymentDate)})`
          : ''}
      </Text>
    ));
  };

  const renderSaleItem = ({ item }) => {
    // soma total do crediario
    const total = item.parcels?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
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
          {item.parcels?.length}x R$ {total.toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contas Finalizadas - Loja {lojaId}</Text>
      {finalizedSales.length > 0 ? (
        <FlatList
          data={finalizedSales}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSaleItem}
        />
      ) : (
        <Text style={styles.noSales}>Nenhuma conta finalizada encontrada.</Text>
      )}

      {/* Modal de detalhes */}
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
              <Text style={styles.modalText}>Parcelas:</Text>
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

export default FinalizadasScreen;

// Estilos
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
  saleValue: {
    fontSize: 14,
    color: '#2D3142',
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
    marginVertical: 2,
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
