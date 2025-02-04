import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import { useIsFocused } from '@react-navigation/native';

// Importes do Firebase
import { getDatabase, ref, get, update } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';

export default function CreditoScreen({ route, navigation }) {
  // Recebemos lojaId da rota
  const { lojaId } = route.params || {};
  const { user } = useAuthContext();

  const [crediarios, setCrediarios] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [filterCustomer, setFilterCustomer] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);

  const isFocused = useIsFocused();

  // Carrega dados quando a tela está focada
  useEffect(() => {
    if (isFocused) {
      fetchCrediariosAbertos();
    }
  }, [isFocused]);

  // Sempre que crediarios ou filterCustomer mudam, aplicamos filtro
  useEffect(() => {
    applyFilter();
  }, [filterCustomer, crediarios]);

  /**
   * Lê do Firebase todos os crediários "abertos" (closed === false) desta loja.
   * Importante: aqui, cada "crediario" tem um array "parcels" contendo
   * { date, number, paid, value }.
   */
  const fetchCrediariosAbertos = async () => {
    if (!user?.uid) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }
    if (!lojaId) {
      Alert.alert('Erro', 'lojaId não foi fornecido.');
      return;
    }

    try {
      const db = getDatabase();
      const crediariosRef = ref(db, `users/${user.uid}/lojas/${lojaId}/crediarios`);
      const snapshot = await get(crediariosRef);

      if (!snapshot.exists()) {
        setCrediarios([]);
        return;
      }

      // converte OBJ em Array
      const dataVal = snapshot.val();
      const credArray = Object.keys(dataVal).map((key) => dataVal[key]);

      // filtra os "closed === false" e ordena pela próxima parcela
      const abertos = credArray
        .filter((item) => !item.closed)
        .sort((a, b) => {
          // pega a primeira parcela não paga e compara datas
          const nextA = a.parcels?.find((p) => !p.paid)?.date || '';
          const nextB = b.parcels?.find((p) => !p.paid)?.date || '';
          return new Date(nextA) - new Date(nextB);
        });

      setCrediarios(abertos);
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu ao carregar crediários abertos.');
      console.error(error);
    }
  };

  /**
   * Filtra por nome do cliente
   */
  const applyFilter = () => {
    if (filterCustomer.trim() === '') {
      setFilteredSales(groupByDate(crediarios));
    } else {
      const filtered = crediarios.filter((sale) =>
        (sale.customer || '').toLowerCase().includes(filterCustomer.toLowerCase())
      );
      setFilteredSales(groupByDate(filtered));
    }
  };

  /**
   * Agrupa por data da próxima parcela pendente (campo "date")
   */
  const groupByDate = (sales) => {
    const grouped = {};
    sales.forEach((sale) => {
      // Encontra a próxima parcela não paga
      const nextParcelDate = sale.parcels?.find((p) => !p.paid)?.date || 'TodasPagas';
      if (!grouped[nextParcelDate]) grouped[nextParcelDate] = [];
      grouped[nextParcelDate].push(sale);
    });

    return Object.entries(grouped).map(([date, salesArr]) => ({
      date,
      sales: salesArr,
    }));
  };

  /**
   * Formata data "AAAA-MM-DD" -> "DD/MM/AAAA"
   */
  const formatDate = (isoString) => {
    if (!isoString) return '---';
    // isoString deve ser "2025-03-02" por ex.
    const [year, month, day] = isoString.split('-');
    return `${day}/${month}/${year}`;
  };

  /**
 * Marca/desmarca uma parcela como paga
 * - grava data "YYYY-MM-DD" em paymentDate
 */
const toggleParcelStatus = async (saleId, parcelIndex) => {
  try {
    // Precisamos ler do DB -> atualizar -> gravar
    const db = getDatabase();
    const crediariosRef = ref(db, `users/${user.uid}/lojas/${lojaId}/crediarios`);
    const snapshot = await get(crediariosRef);

    if (!snapshot.exists()) return;

    const dataVal = snapshot.val();
    // localiza o item
    const key = Object.keys(dataVal).find((k) => dataVal[k].id === saleId);
    if (!key) return;

    const saleObj = dataVal[key];

    // alterna "paid"
    if (saleObj.parcels[parcelIndex].paid) {
      // se já estava pago, reverte
      saleObj.parcels[parcelIndex].paid = false;
      saleObj.parcels[parcelIndex].paymentDate = null;
    } else {
      // marca como pago => grava somente a data "YYYY-MM-DD"
      saleObj.parcels[parcelIndex].paid = true;
      const onlyDate = new Date().toISOString().split('T')[0];
      saleObj.parcels[parcelIndex].paymentDate = onlyDate;
    }

    // faz update no DB
    await update(ref(db, `users/${user.uid}/lojas/${lojaId}/crediarios/${key}`), saleObj);

    // recarrega e atualiza o selectedSale no modal
    fetchCrediariosAbertos();
    setSelectedSale((prev) =>
      prev
        ? {
            ...prev,
            parcels: prev.parcels.map((p, i) =>
              i === parcelIndex
                ? {
                    ...p,
                    paid: saleObj.parcels[parcelIndex].paid,
                    paymentDate: saleObj.parcels[parcelIndex].paymentDate,
                  }
                : p
            ),
          }
        : null
    );
  } catch (error) {
    Alert.alert('Erro', 'Não foi possível atualizar a parcela.');
    console.error(error);
  }
};

  /**
   * Fecha conta (closed = true)
   */
  const closeSaleAccount = async (saleId) => {
    try {
      const db = getDatabase();
      const crediariosRef = ref(db, `users/${user.uid}/lojas/${lojaId}/crediarios`);
      const snapshot = await get(crediariosRef);

      if (!snapshot.exists()) return;

      const dataVal = snapshot.val();
      const key = Object.keys(dataVal).find((k) => dataVal[k].id === saleId);
      if (!key) return;

      const saleObj = dataVal[key];
      saleObj.closed = true;
      saleObj.closedDate = new Date().toISOString();

      await update(ref(db, `users/${user.uid}/lojas/${lojaId}/crediarios/${key}`), saleObj);

      fetchCrediariosAbertos();
      setModalVisible(false);
      Alert.alert('Sucesso', 'Conta fechada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível fechar a conta.');
      console.error(error);
    }
  };

  /**
   * Determina cor do texto pela data
   */
  const getNextParcelColor = (dateString) => {
    if (!dateString || dateString === 'TodasPagas') return '#27AE60';
    const now = new Date();
    const dueDate = new Date(dateString);
    const diff = (dueDate - now) / (1000 * 60 * 60 * 24);
    if (diff < 0) return '#E74C3C'; // vencido
    if (diff <= 15) return '#F1C40F'; // faltam <= 15 dias
    return '#27AE60'; // ok
  };

  /**
   * Render item do group
   */
  const renderGroupedItem = ({ item }) => {
    // item = { date: '2025-03-02', sales: [...], ou "TodasPagas" }
    const dateLabel =
      item.date === 'TodasPagas' ? 'Todas as parcelas pagas' : formatDate(item.date);

    return (
      <View style={styles.groupedItem}>
        <Text style={[styles.groupDate, { color: getNextParcelColor(item.date) }]}>
          Data de Vencimento: {dateLabel}
        </Text>

        <FlatList
          data={item.sales}
          keyExtractor={(sale) => String(sale.id)}
          renderItem={({ item: saleItem }) => (
            <TouchableOpacity
              style={styles.saleItem}
              onPress={() => {
                setSelectedSale(saleItem);
                setModalVisible(true);
              }}
            >
              <Text style={styles.saleDescription}>{saleItem.description}</Text>
              <Text style={styles.saleCustomer}>Cliente: {saleItem.customer}</Text>
              {/* Exibir próxima parcela pendente, se houver */}
              {saleItem.parcels.some((p) => !p.paid) && (
                <Text style={styles.nextParcelInfo}>
                  Próx. Parcela: {formatDate(saleItem.parcels.find((p) => !p.paid)?.date || '')}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compras no Crediário - Loja {lojaId}</Text>

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

      {/* Botão para ver finalizadas (contas fechadas) */}
      <TouchableOpacity
        style={styles.completedButton}
        onPress={() => navigation.navigate('Finalizadas', { lojaId })}
      >
        <Text style={styles.completedButtonText}>Ver Finalizadas</Text>
      </TouchableOpacity>

      {/* Modal Detalhe */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          {selectedSale && (
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Detalhes da Compra</Text>
              <Text style={styles.modalText}>
                Descrição: {selectedSale.description}
              </Text>
              <Text style={styles.modalText}>
                Cliente: {selectedSale.customer}
              </Text>
              <Text style={styles.modalText}>
                Valor Total: R${Number(selectedSale.amount || 0).toFixed(2)}
              </Text>

              <FlatList
                data={selectedSale.parcels}
                keyExtractor={(item, index) => String(index)}
                renderItem={({ item: parcel, index }) => {
                  // IMPORTANTE: parcel.date e parcel.value
                  // "date" = "2025-03-02", "value" = "95.00" etc
                  const parcelValue = parseFloat(parcel.value) || 0;
                  return (
                    <View style={styles.parcelItem}>
                      <Text style={styles.parcelText}>
                        Parcela {parcel.number}: R$ {parcelValue.toFixed(2)} -{' '}
                        {formatDate(parcel.date)}
                        {parcel.paid && parcel.paymentDate
                          ? ` (Pago em: ${formatDate(parcel.paymentDate)})`
                          : ''}
                      </Text>
                      <Checkbox
                        value={parcel.paid}
                        onValueChange={() => toggleParcelStatus(selectedSale.id, index)}
                        color={parcel.paid ? '#3A86FF' : undefined}
                      />
                    </View>
                  );
                }}
              />

              {/* Só mostra botao FecharConta se todas pagas */}
              {selectedSale.parcels.every((p) => p.paid) && (
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
}

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
  noSales: {
    textAlign: 'center',
    fontSize: 16,
    color: '#BDBDBD',
  },
  groupedItem: {
    marginBottom: 20,
  },
  groupDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
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
  nextParcelInfo: {
    fontSize: 14,
    marginTop: 5,
    color: '#2D3142',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#2D3142',
  },
  parcelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  parcelText: {
    fontSize: 15,
    color: '#2D3142',
    marginRight: 10,
    flexWrap: 'wrap',
    flex: 1,
  },
  closeAccountButton: {
    marginTop: 10,
    backgroundColor: '#3A86FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeAccountButtonText: {
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
