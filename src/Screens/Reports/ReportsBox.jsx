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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-8555818057366318/1093655083';

const interstitial = InterstitialAd.createForAdRequest(adUnitId);

const CashRegisterScreen = () => {
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [totals, setTotals] = useState({
    cash: 0,
    pix: 0,
    crediario: 0,
    debitCard: 0,
    creditCardAtSight: 0,
    creditCardInstallment: 0,
  });
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [metas, setMetas] = useState([]);
  const [selectedMeta, setSelectedMeta] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    loadMetas();

    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setIsAdLoaded(true);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setIsAdLoaded(false);
      interstitial.load();
      generateAndShareTextReport(); // Compartilha após o anúncio.
    });

    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);

  const loadMetas = async () => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setMetas(parsedData); // Carrega as metas para exibição no modal.
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao carregar as metas.');
      console.error('Erro ao carregar metas:', error);
    }
  };

  const filterByMeta = async () => {
    if (!selectedMeta) {
      Alert.alert('Aviso', 'Por favor, escolha uma meta.');
      return;
    }

    const metaSales = selectedMeta.sales || [];
    const filtered = metaSales.filter((sale) => {
      const saleDate = new Date(sale.date);
      const saleDay = String(saleDate.getDate()).padStart(2, '0');
      const saleMonth = String(saleDate.getMonth() + 1).padStart(2, '0');
      const saleYear = String(saleDate.getFullYear());

      return (
        (!day || saleDay === day) &&
        (!month || saleMonth === month) &&
        (!year || saleYear === year)
      );
    });

    setFilteredData(filtered);

    const totals = filtered.reduce(
      (acc, sale) => {
        if (sale.paymentMethod === 'dinheiro') acc.cash += sale.value;
        if (sale.paymentMethod === 'pix') acc.pix += sale.value;
        if (sale.paymentMethod === 'crediario') acc.crediario += sale.value;
        if (sale.paymentMethod === 'cartao-debito') acc.debitCard += sale.value;
        if (sale.paymentMethod === 'cartao-credito-a-vista') acc.creditCardAtSight += sale.value;
        if (sale.paymentMethod === 'cartao-credito-parcelado') acc.creditCardInstallment += sale.value;
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

    setTotals(totals);
  };

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
        const saleDate = new Date(sale.date);
        const formattedDate = `${String(saleDate.getDate()).padStart(2, '0')}/${String(
          saleDate.getMonth() + 1
        ).padStart(2, '0')}/${saleDate.getFullYear()}`;
        reportText += `Data: ${formattedDate}\n`;
        reportText += `Descrição: ${sale.description || 'Não informado'}\n`;
        reportText += `Forma de Pagamento: ${sale.paymentMethod}\n`;
        reportText += `Valor: R$ ${sale.value.toFixed(2)}\n\n`;
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

      {/* Botão para abrir a lista de metas */}
      <TouchableOpacity style={styles.metaButton} onPress={() => setIsModalVisible(true)}>
        <Text style={styles.metaButtonText}>
          {selectedMeta ? `Meta: ${selectedMeta.name}` : 'Escolher Meta'}
        </Text>
      </TouchableOpacity>

      {/* Modal de Seleção de Metas */}
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
                <Text style={styles.metaText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Filtros */}
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

      {/* Botão de Aplicar Filtros */}
      <TouchableOpacity style={styles.filterButton} onPress={filterByMeta}>
        <Text style={styles.filterButtonText}>Aplicar Filtros</Text>
      </TouchableOpacity>

      {/* Totais */}
      <View style={styles.totalsContainer}>
        <Text style={styles.totalText}>Total Dinheiro: R$ {totals.cash.toFixed(2)}</Text>
        <Text style={styles.totalText}>Total Pix: R$ {totals.pix.toFixed(2)}</Text>
        <Text style={styles.totalText}>Total Crediário: R$ {totals.crediario.toFixed(2)}</Text>
        <Text style={styles.totalText}>Total Cartão Débito: R$ {totals.debitCard.toFixed(2)}</Text>
        <Text style={styles.totalText}>Total Cartão à Vista: R$ {totals.creditCardAtSight.toFixed(2)}</Text>
        <Text style={styles.totalText}>Total Cartão Parcelado: R$ {totals.creditCardInstallment.toFixed(2)}</Text>
      </View>

      {/* Lista de Vendas Filtradas */}
      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.saleItem}>
            <Text style={styles.saleText}>
              Data: {new Date(item.date).toLocaleDateString('pt-BR')}
            </Text>
            <Text style={styles.saleText}>Descrição: {item.description}</Text>
            <Text style={styles.saleText}>Forma: {item.paymentMethod}</Text>
            <Text style={styles.saleText}>Valor: R$ {item.value.toFixed(2)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma venda encontrada.</Text>}
      />

      {/* Botão de Compartilhar Relatório */}
      <TouchableOpacity style={styles.shareButton} onPress={handleSharePress}>
        <Text style={styles.shareButtonText}>Compartilhar Relatório</Text>
      </TouchableOpacity>
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
  totalsContainer: {
    marginBottom: 20,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3142',
    marginBottom: 5,
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
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#BDBDBD',
    marginTop: 20,
  },
});

export default CashRegisterScreen;
