import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';

const CrediarioReportScreen = () => {
  const [crediarios, setCrediarios] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    loadCrediarioData();
  }, []);

  useEffect(() => {
    filterData();
  }, [crediarios, selectedMonth, selectedYear, selectedFilter]);

  const loadCrediarioData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const allCrediarios = [];
        parsedData.forEach((meta) => {
          meta.sales?.forEach((sale) => {
            if (sale.paymentMethod === 'crediario' && sale.parcels) {
              allCrediarios.push(
                ...sale.parcels.map((parcel, index) => ({
                  ...parcel,
                  cliente: sale.customer,
                  descricao: sale.description,
                  numeroParcela: index + 1,
                  atrasado: !parcel.paid && new Date(parcel.date) < new Date(),
                }))
              );
            }
          });
        });
        setCrediarios(allCrediarios);
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao carregar os dados do crediário.');
      console.error('Erro ao carregar crediário:', error);
    }
  };

  const filterData = () => {
    const filteredByMonthYear = crediarios.filter((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getMonth() + 1 === selectedMonth &&
        itemDate.getFullYear() === selectedYear
      );
    });

    let result = filteredByMonthYear;
    if (selectedFilter === 'pagos') {
      result = filteredByMonthYear.filter((item) => item.paid);
    } else if (selectedFilter === 'atrasados') {
      result = filteredByMonthYear.filter((item) => item.atrasado);
    } else if (selectedFilter === 'abertos') {
      result = filteredByMonthYear.filter((item) => !item.paid && !item.atrasado);
    }

    setFilteredData(result);
  };

  const generateAndShareTextReport = async () => {
    try {
      if (filteredData.length === 0) {
        Alert.alert('Aviso', 'Nenhum dado filtrado para compartilhar.');
        return;
      }
  
      let reportText = `Relatório de Crediário (${selectedMonth}/${selectedYear}):\n\n`;
      filteredData.forEach((item) => {
        const valor = item.value !== undefined ? `R$ ${parseFloat(item.value).toFixed(2)}` : 'Não informado';
        reportText += `Cliente: ${item.cliente || 'Não informado'}\n`;
        reportText += `Descrição: ${item.descricao || 'Não informado'}\n`;
        reportText += `Parcela: ${item.numeroParcela || 'Não informado'}\n`;
        reportText += `Valor: ${valor}\n`;
        reportText += `Vencimento: ${item.date || 'Não informado'}\n`;
        reportText += `Status: ${
          item.paid ? 'Pago' : item.atrasado ? 'Atrasado' : 'Em Aberto'
        }\n\n`;
      });
  
      await Share.share({
        title: 'Relatório de Crediário',
        message: reportText,
      });
    } catch (error) {
      console.error('Erro ao compartilhar relatório:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao compartilhar o relatório.');
    }
  };
  

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>Cliente: {item.cliente}</Text>
      <Text style={styles.itemText}>Descrição: {item.descricao}</Text>
      <Text style={styles.itemText}>Parcela: {item.numeroParcela}</Text>
      <Text style={styles.itemText}>Valor: R$ {item.value}</Text>
      <Text style={styles.itemText}>Vencimento: {item.date}</Text>
      <Text style={[styles.itemText, item.atrasado ? styles.lateText : styles.onTimeText]}>
        {item.atrasado ? 'Atrasada' : 'No Prazo'}
      </Text>
      <View style={styles.checkboxContainer}>
        <Checkbox value={item.paid} disabled />
        <Text style={styles.checkboxLabel}>{item.paid ? 'Pago' : 'Não Pago'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Relatório de Crediário</Text>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFilterModalVisible(true)}
      >
        <Text style={styles.filterButtonText}>
          Filtro: {selectedFilter} - Mês: {selectedMonth} - Ano: {selectedYear}
        </Text>
      </TouchableOpacity>
      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
      />
      <TouchableOpacity style={styles.shareButton} onPress={generateAndShareTextReport}>
        <Text style={styles.shareButtonText}>Compartilhar Relatório</Text>
      </TouchableOpacity>
      <Modal visible={isFilterModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o Filtro</Text>
            <Text style={styles.modalSubtitle}>Mês:</Text>
            <View style={styles.monthContainer}>
              {[...Array(12).keys()].map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthButton,
                    selectedMonth === month + 1 && styles.selectedMonthButton,
                  ]}
                  onPress={() => setSelectedMonth(month + 1)}
                >
                  <Text
                    style={[
                      styles.monthButtonText,
                      selectedMonth === month + 1 && styles.selectedMonthButtonText,
                    ]}
                  >
                    {new Date(2023, month).toLocaleString('pt-BR', {
                      month: 'long',
                    })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalSubtitle}>Ano:</Text>
            <FlatList
              data={Array.from({ length: 2051 - 2022 }, (_, i) => i + 2022)}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.yearButton,
                    selectedYear === item && styles.selectedYearButton,
                  ]}
                  onPress={() => setSelectedYear(item)}
                >
                  <Text
                    style={[
                      styles.yearButtonText,
                      selectedYear === item && styles.selectedYearButtonText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              nestedScrollEnabled
              style={{ maxHeight: 200 }}
            />
            <Text style={styles.modalSubtitle}>Status:</Text>
            <View style={styles.statusContainer}>
              {['todos', 'pagos', 'atrasados', 'abertos'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.statusButton,
                    selectedFilter === filter && styles.selectedStatusButton,
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      selectedFilter === filter && styles.selectedStatusButtonText,
                    ]}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
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
    textAlign: 'center',
    marginBottom: 20,
    color: '#2D3142',
  },
  filterButton: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  itemContainer: {
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
  itemText: {
    fontSize: 16,
    color: '#2D3142',
    marginBottom: 5,
  },
  lateText: {
    color: '#E74C3C',
  },
  onTimeText: {
    color: '#27AE60',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 16,
    color: '#2D3142',
  },
  shareButton: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2D3142',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 10,
    color: '#2D3142',
  },
  monthContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthButton: {
    backgroundColor: '#F7F9FC',
    padding: 10,
    borderRadius: 8,
    margin: 5,
    width: '30%',
    alignItems: 'center',
  },
  selectedMonthButton: {
    backgroundColor: '#3A86FF',
  },
  monthButtonText: {
    fontSize: 14,
    color: '#2D3142',
  },
  selectedMonthButtonText: {
    color: '#FFFFFF',
  },
  yearButton: {
    padding: 10,
    backgroundColor: '#F7F9FC',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedYearButton: {
    backgroundColor: '#3A86FF',
  },
  yearButtonText: {
    fontSize: 14,
    color: '#2D3142',
  },
  selectedYearButtonText: {
    color: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusButton: {
    backgroundColor: '#F7F9FC',
    padding: 10,
    borderRadius: 8,
    margin: 5,
    width: '45%',
    alignItems: 'center',
  },
  selectedStatusButton: {
    backgroundColor: '#3A86FF',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#2D3142',
  },
  selectedStatusButtonText: {
    color: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CrediarioReportScreen;
