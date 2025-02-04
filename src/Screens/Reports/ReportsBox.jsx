import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  Share,
} from 'react-native';
import { getDatabase, ref, get } from 'firebase/database';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { useIsFocused } from '@react-navigation/native';
import { useAuthContext } from '../../contexts/auth';

// Se estiver em modo DEV, use o ID de teste; senão, coloque o seu ID real
const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-8555818057366318/1093655083';
const interstitial = InterstitialAd.createForAdRequest(adUnitId);

const CashRegisterScreen = ({ route }) => {
  const { lojaId } = route.params || {};
  const { user } = useAuthContext();

  // Verificação de autenticação e loja
  if (!user || !user.uid || !lojaId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Erro: Usuário não autenticado ou Loja não especificada.
        </Text>
      </View>
    );
  }

  // Estados para metas, filtros e totais
  const [metas, setMetas] = useState([]);
  const [selectedMeta, setSelectedMeta] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [filterCustomer, setFilterCustomer] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [totals, setTotals] = useState({
    cash: 0,
    pix: 0,
    crediario: 0,
    debitCard: 0,
    creditCardAtSight: 0,
    creditCardInstallment: 0,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Controle de anúncio (opcional)
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  const isFocused = useIsFocused();

  useEffect(() => {
    // Carrega as metas sempre que a tela estiver focada
    if (isFocused) {
      loadMetasFromFirebase();
    }

    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setIsAdLoaded(true);
      }
    );
    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setIsAdLoaded(false);
        interstitial.load();
        // Após o anúncio ser fechado, compartilha o relatório
        generateAndShareTextReport();
      }
    );
    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, [isFocused]);

  /**
   * Carrega as metas do Firebase no caminho:
   * users/{uid}/lojas/{lojaId}/metas
   */
  const loadMetasFromFirebase = async () => {
    try {
      const db = getDatabase();
      const metasRef = ref(db, `users/${user.uid}/lojas/${lojaId}/metas`);
      const snapshot = await get(metasRef);
      if (snapshot.exists()) {
        const dataVal = snapshot.val();
        const arr = Object.keys(dataVal).map((key) => ({
          id: key,
          ...dataVal[key],
        }));
        setMetas(arr);
      } else {
        setMetas([]);
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as metas do banco.');
    }
  };

  /**
   * Função para agrupar as vendas de uma meta pela data da próxima parcela não paga.
   * Se não houver parcela pendente, usa o rótulo "TodasPagas".
   */
  const groupByDueDate = (sales) => {
    const grouped = {};
    sales.forEach((sale) => {
      // Verifica a próxima parcela não paga. Aqui, assume que cada venda tem um array "parcels"
      const nextParcelDate =
        sale.parcels?.find((p) => !p.paid)?.date || 'TodasPagas';
      if (!grouped[nextParcelDate]) grouped[nextParcelDate] = [];
      grouped[nextParcelDate].push(sale);
    });
    return Object.entries(grouped).map(([date, salesArr]) => ({
      date,
      sales: salesArr,
    }));
  };

  /**
   * Função para filtrar as vendas da meta selecionada conforme dia, mês e ano.
   * (Esta função é chamada ao clicar no botão de "Aplicar Filtros".)
   */
  const filterByMeta = () => {
    if (!selectedMeta) {
      Alert.alert('Aviso', 'Por favor, escolha uma meta.');
      return;
    }
    // Supomos que as vendas estão em selectedMeta.sales
    const metaSales = selectedMeta.sales || [];
    const filtered = metaSales.filter((sale) => {
      // sale.date deve estar no formato "YYYY-MM-DD"
      const [saleYear, saleMonth, saleDay] = sale.date.split('-');
      return (
        (!day || saleDay === day) &&
        (!month || saleMonth === month) &&
        (!year || saleYear === year)
      );
    });
    setFilteredData(filtered);

    // Calcula os totais para cada forma de pagamento
    const computedTotals = filtered.reduce(
      (acc, sale) => {
        const val = parseFloat(sale.value) || 0;
        if (sale.paymentMethod === 'dinheiro') acc.cash += val;
        if (sale.paymentMethod === 'pix') acc.pix += val;
        if (sale.paymentMethod === 'crediario') acc.crediario += val;
        if (sale.paymentMethod === 'cartao-debito') acc.debitCard += val;
        if (sale.paymentMethod === 'cartao-credito-a-vista') acc.creditCardAtSight += val;
        if (sale.paymentMethod === 'cartao-credito-parcelado')
          acc.creditCardInstallment += val;
        return acc;
      },
      {
        cash: 0,
        pix: 0,
        crediario: 0,
        debitCard: 0,
        creditCardAtSight: 0,
        creditCardInstallment: 0,
      }
    );
    setTotals(computedTotals);
  };

  /**
   * Formata uma data do formato "YYYY-MM-DD" ou ISO (com "T") para "DD/MM/YYYY"
   */
  const formatDate = (isoString) => {
    if (!isoString) return '---';
    const datePart = isoString.includes('T') ? isoString.split('T')[0] : isoString;
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  };

  /**
   * Retorna a cor de acordo com a data da próxima parcela
   */
  const getNextParcelColor = (dateString) => {
    if (!dateString || dateString === 'TodasPagas') return '#27AE60';
    const now = new Date();
    const dueDate = new Date(dateString);
    const diffDays = (dueDate - now) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return '#E74C3C'; // vencido
    if (diffDays <= 15) return '#F1C40F'; // próximo (<=15 dias)
    return '#27AE60';
  };

  /**
   * Gera e compartilha o relatório de caixa
   */
  const generateAndShareTextReport = async () => {
    try {
      if (filteredData.length === 0) {
        Alert.alert('Aviso', 'Nenhum dado filtrado para compartilhar.');
        return;
      }
      let reportText = `Relatório de Caixa (${day || '--'}/${month || '--'}/${year}):\n\n`;
      reportText += `Meta: ${selectedMeta?.name || 'Não selecionada'}\n\n`;
      reportText += `Total Dinheiro: R$ ${totals.cash.toFixed(2)}\n`;
      reportText += `Total Pix: R$ ${totals.pix.toFixed(2)}\n`;
      reportText += `Total Crediário: R$ ${totals.crediario.toFixed(2)}\n`;
      reportText += `Total Cartão Débito: R$ ${totals.debitCard.toFixed(2)}\n`;
      reportText += `Total Cartão à Vista: R$ ${totals.creditCardAtSight.toFixed(2)}\n`;
      reportText += `Total Cartão Parcelado: R$ ${totals.creditCardInstallment.toFixed(2)}\n\n`;
      filteredData.forEach((sale) => {
        const [y, m, d] = sale.date.split('-');
        const formattedDate = `${d}/${m}/${y}`;
        reportText += `Data: ${formattedDate}\n`;
        reportText += `Descrição: ${sale.description || 'Não informado'}\n`;
        reportText += `Forma de Pagamento: ${sale.paymentMethod}\n`;
        reportText += `Valor: R$ ${parseFloat(sale.value || 0).toFixed(2)}\n\n`;
      });
      await Share.share({
        title: 'Relatório de Caixa',
        message: reportText,
      });
    } catch (error) {
      console.error('Erro ao compartilhar relatório:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao compartilhar o relatório.');
    }
  };

  // Se o anúncio estiver carregado, exibe-o; senão, compartilha direto
  const handleSharePress = () => {
    if (isAdLoaded) {
      interstitial.show();
    } else {
      generateAndShareTextReport();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Caixa</Text>

      {/* Botão para abrir o modal de seleção de meta */}
      <TouchableOpacity
        style={styles.metaButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.metaButtonText}>
          {selectedMeta ? `Meta: ${selectedMeta.name}` : 'Escolher Meta'}
        </Text>
      </TouchableOpacity>

      {/* Modal de seleção de meta */}
      <Modal visible={isModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Selecione uma Meta</Text>
          <FlatList
            data={metas}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.metaItem}
                onPress={() => {
                  setSelectedMeta(item);
                  setIsModalVisible(false);
                }}
              >
                <Text style={styles.metaText}>{item.name || item.nome}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Filtros de data */}
      <View style={styles.filters}>
        <TextInput
          style={styles.input}
          placeholder="Dia"
          value={day}
          onChangeText={setDay}
          keyboardType="numeric"
          maxLength={2}
        />
        <TextInput
          style={styles.input}
          placeholder="Mês"
          value={month}
          onChangeText={setMonth}
          keyboardType="numeric"
          maxLength={2}
        />
        <TextInput
          style={styles.input}
          placeholder="Ano"
          value={year}
          onChangeText={setYear}
          keyboardType="numeric"
          maxLength={4}
        />
      </View>

      {/* Botão para aplicar filtros */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={filterByMeta}
      >
        <Text style={styles.filterButtonText}>Aplicar Filtros</Text>
      </TouchableOpacity>

      {/* Totais */}
      <View style={styles.totalsContainer}>
        <Text style={styles.totalText}>Total Dinheiro: R$ {totals.cash.toFixed(2)}</Text>
        <Text style={styles.totalText}>Total Pix: R$ {totals.pix.toFixed(2)}</Text>
        <Text style={styles.totalText}>Total Crediário: R$ {totals.crediario.toFixed(2)}</Text>
        <Text style={styles.totalText}>Total Débito: R$ {totals.debitCard.toFixed(2)}</Text>
        <Text style={styles.totalText}>
          Total Cartão à Vista: R$ {totals.creditCardAtSight.toFixed(2)}
        </Text>
        <Text style={styles.totalText}>
          Total Cartão Parcelado: R$ {totals.creditCardInstallment.toFixed(2)}
        </Text>
      </View>

      {/* Lista de vendas filtradas – agrupadas por data da próxima parcela */}
      <FlatList
        data={selectedMeta ? groupByDueDate(selectedMeta.sales || []) : []}
        keyExtractor={(item, index) => String(index)}
        renderItem={({ item }) => {
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
                  <TouchableOpacity style={styles.saleItem}>
                    <Text style={styles.saleText}>
                      Data: {saleItem.date.split('-').reverse().join('/')}
                    </Text>
                    <Text style={styles.saleText}>
                      Descrição: {saleItem.description || '---'}
                    </Text>
                    <Text style={styles.saleText}>
                      Forma: {saleItem.paymentMethod}
                    </Text>
                    <Text style={styles.saleText}>
                      Valor: R$ {parseFloat(saleItem.value || 0).toFixed(2)}
                    </Text>
                    {saleItem.parcels &&
                      saleItem.parcels.some((p) => !p.paid) && (
                        <Text style={styles.nextParcelInfo}>
                          Próx. Parcela: {formatDate(saleItem.parcels.find((p) => !p.paid)?.date || '')}
                        </Text>
                      )}
                  </TouchableOpacity>
                )}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma venda encontrada para esse filtro.</Text>
        }
      />

      {/* Botão para compartilhar relatório */}
      <TouchableOpacity style={styles.shareButton} onPress={handleSharePress}>
        <Text style={styles.shareButtonText}>Compartilhar Relatório</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CashRegisterScreen;

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F7F9FC',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2D3142',
  },
  metaButton: {
    backgroundColor: '#3A86FF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  metaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  metaItem: {
    padding: 15,
    backgroundColor: '#F7F7F7',
    marginVertical: 5,
    borderRadius: 5,
  },
  metaText: {
    fontSize: 16,
    color: '#333',
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#2D3142',
  },
  filterButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  totalsContainer: {
    marginBottom: 20,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3142',
    marginBottom: 5,
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
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  saleText: {
    fontSize: 14,
    color: '#2D3142',
  },
  nextParcelInfo: {
    fontSize: 14,
    marginTop: 5,
    color: '#2D3142',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#BDBDBD',
    marginTop: 20,
  },
  shareButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
