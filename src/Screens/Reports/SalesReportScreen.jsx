import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SalesReportScreen = () => {
  const [metaSales, setMetaSales] = useState({});
  const [filterValue, setFilterValue] = useState('');
  const [filterType, setFilterType] = useState('date');

  useEffect(() => {
    const loadAllSales = async () => {
      try {
        const savedData = await AsyncStorage.getItem('financeData');
        const parsedData = savedData ? JSON.parse(savedData) : [];

        if (!Array.isArray(parsedData) || parsedData.length === 0) {
          Alert.alert('Erro', 'Nenhuma meta encontrada.');
          return;
        }

        const groupedByMeta = parsedData.reduce((acc, meta) => {
          acc[meta.name] = meta.sales || [];
          return acc;
        }, {});

        setMetaSales(groupedByMeta);
      } catch (error) {
        console.error('Erro ao carregar vendas:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao carregar as vendas.');
      }
    };

    loadAllSales();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const generateAndShareTextReport = async () => {
    try {
      let reportText = 'Relatório de Vendas:\n\n';

      Object.entries(metaSales).forEach(([metaName, sales]) => {
        reportText += `Meta: ${metaName}\n`;
        sales.forEach((sale) => {
          reportText += `  - Data: ${sale.date.split('-').reverse().join('/')}\n`;
          reportText += `    Cliente: ${sale.customer || 'Não informado'}\n`;
          reportText += `    Valor: ${formatCurrency(sale.value)}\n`;
          reportText += `    Forma de Pagamento: ${sale.paymentMethod}\n`;
          if (sale.installments) {
            reportText += `    Parcelas: ${sale.installments}x\n`;
          }
          reportText += `    Descrição: ${sale.description || 'Sem descrição'}\n`;
          reportText += '\n';
        });
        reportText += '\n';
      });

      await Share.share({
        title: 'Relatório de Vendas',
        message: reportText,
      });
    } catch (error) {
      console.error('Erro ao compartilhar relatório:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao compartilhar o relatório.');
    }
  };

  const handleFilter = () => {
    const filteredMetaSales = Object.entries(metaSales).reduce((acc, [metaName, sales]) => {
      let filteredSales = sales;

      if (filterType === 'date' && filterValue) {
        const formattedFilterDate = filterValue.split('/').reverse().join('-');
        filteredSales = filteredSales.filter((sale) => sale.date === formattedFilterDate);
      }

      if (filterType === 'value' && filterValue) {
        const value = parseFloat(filterValue);
        if (!isNaN(value)) {
          filteredSales = filteredSales.filter((sale) => sale.value === value);
        }
      }

      if (filteredSales.length > 0) {
        acc[metaName] = filteredSales;
      }

      return acc;
    }, {});

    setMetaSales(filteredMetaSales);
  };

  const clearFilters = async () => {
    setFilterValue('');
    setFilterType('date');
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      const parsedData = savedData ? JSON.parse(savedData) : [];
      const groupedByMeta = parsedData.reduce((acc, meta) => {
        acc[meta.name] = meta.sales || [];
        return acc;
      }, {});
      setMetaSales(groupedByMeta);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Relatório de Vendas</Text>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.filterInput}
          placeholder={
            filterType === 'date'
              ? 'Filtrar por data (DD/MM/AAAA)'
              : 'Filtrar por valor (ex: 100.50)'
          }
          value={filterValue}
          onChangeText={setFilterValue}
          keyboardType={filterType === 'value' ? 'numeric' : 'default'}
        />
        <TouchableOpacity
          style={[styles.button, styles.filterTypeButton]}
          onPress={() => setFilterType((prev) => (prev === 'date' ? 'value' : 'date'))}
        >
          <Text style={styles.buttonText}>
            {filterType === 'date' ? 'Filtro: Data' : 'Filtro: Valor'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleFilter}>
          <Text style={styles.buttonText}>Pesquisar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={clearFilters}>
          <Text style={styles.buttonText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={Object.entries(metaSales)}
        keyExtractor={(item) => item[0]}
        renderItem={({ item }) => {
          const [metaName, sales] = item;
          return (
            <View style={styles.metaContainer}>
              <Text style={styles.metaTitle}>Meta: {metaName}</Text>
              {sales.map((sale) => (
                <View key={sale.id} style={styles.saleItem}>
                  <Text style={styles.saleText}>
                    Data: {sale.date.split('-').reverse().join('/')}
                  </Text>
                  <Text style={styles.saleText}>
                    Cliente: {sale.customer || 'Não informado'}
                  </Text>
                  <Text style={styles.saleText}>
                    Valor: {formatCurrency(sale.value)}
                  </Text>
                  <Text style={styles.saleText}>
                    Forma de Pagamento: {sale.paymentMethod}
                  </Text>
                  {sale.installments && (
                    <Text style={styles.saleText}>
                      Parcelas: {sale.installments}x
                    </Text>
                  )}
                  <Text style={styles.saleText}>
                    Descrição: {sale.description || 'Sem descrição'}
                  </Text>
                  <View style={styles.separator} />
                </View>
              ))}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma venda encontrada.</Text>
        }
      />

      <TouchableOpacity style={styles.shareButton} onPress={generateAndShareTextReport}>
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
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterInput: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#2D3142',
  },
  button: {
    backgroundColor: '#3A86FF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  filterTypeButton: {
    backgroundColor: '#FF5733',
  },
  metaContainer: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  metaTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#3A86FF',
  },
  saleItem: {
    marginBottom: 10,
  },
  saleText: {
    fontSize: 16,
    color: '#2D3142',
  },
  separator: {
    height: 1,
    backgroundColor: '#BDBDBD',
    marginVertical: 10,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#BDBDBD',
    marginTop: 20,
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
});

export default SalesReportScreen;
