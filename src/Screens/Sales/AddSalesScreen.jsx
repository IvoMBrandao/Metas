// AddSaleScreen.jsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';

// Configuração do calendário para português do Brasil
LocaleConfig.locales['pt-BR'] = {
  monthNames: [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
  ],
  monthNamesShort: [
    'Jan','Fev','Mar','Abr','Mai','Jun',
    'Jul','Ago','Set','Out','Nov','Dez',
  ],
  dayNames: [
    'Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado',
  ],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-BR';

const AddSaleScreen = ({ route, navigation }) => {
  const { metaId } = route.params;
  
  // Estados principais
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProductModalVisible, setProductModalVisible] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [searchTermProduct, setSearchTermProduct] = useState('');
  const [saleValue, setSaleValue] = useState(0);
  const [discount, setDiscount] = useState(''); // Valor do desconto
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' ou 'percentage'
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [installments, setInstallments] = useState('');
  const [installmentValue, setInstallmentValue] = useState('');
  const [isCustomerModalVisible, setCustomerModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDebit, setIsDebit] = useState(false);
  
  // Estados para o modal de quantidade de produto
  const [isQuantityModalVisible, setIsQuantityModalVisible] = useState(false);
  const [tempQuantity, setTempQuantity] = useState('');
  const [productSelectedTemp, setProductSelectedTemp] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCustomers();
      loadAllProducts();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    loadCustomers();
    loadAllProducts();
  }, []);

  // Função para carregar clientes do AsyncStorage
  const loadCustomers = async () => {
    try {
      const savedCustomers = await AsyncStorage.getItem('customersData');
      const parsedCustomers = savedCustomers ? JSON.parse(savedCustomers) : [];
      setCustomers(parsedCustomers);
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao carregar os clientes.');
      console.error('Erro ao carregar clientes:', error);
    }
  };

  // Função para carregar produtos do estoque do AsyncStorage
  const loadAllProducts = async () => {
    try {
      const data = await AsyncStorage.getItem('estoqueData');
      const parsed = data ? JSON.parse(data) : [];
      setAllProducts(parsed);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os produtos do estoque.');
      console.error(error);
    }
  };

  // Função para selecionar data no calendário
  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
  };

  // Função para calcular o valor da parcela
  const calculateInstallment = () => {
    if (saleValue && installments) {
      const value = (parseFloat(saleValue) / parseInt(installments)).toFixed(2);
      setInstallmentValue(value);
    } else {
      setInstallmentValue('');
    }
  };

  useEffect(() => {
    calculateInstallment();
  }, [saleValue, installments]);

  // Filtra clientes com base no termo de busca
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtra produtos com base no termo de busca
  const filteredProducts = allProducts.filter(
    (prod) =>
      prod.nome.toLowerCase().includes(searchTermProduct.toLowerCase()) ||
      prod.codigo.toLowerCase().includes(searchTermProduct.toLowerCase())
  );

  // Função para selecionar um produto e abrir o modal de quantidade
  const handleSelectProduct = (prod) => {
    setProductSelectedTemp(prod);
    setTempQuantity('1');
    setIsQuantityModalVisible(true);
  };

  // Função para confirmar a adição do produto com a quantidade
  const confirmAddProduct = async () => {
    const quantityNum = parseFloat(tempQuantity || '1');
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Erro', 'Quantidade inválida.');
      return;
    }

    // Verificar o estoque atual do produto
    const currentProduct = allProducts.find((p) => p.id === productSelectedTemp.id);
    const currentStock = currentProduct ? currentProduct.quantidade : 0;

    if (currentStock < quantityNum) {
      // Exibir alerta de estoque insuficiente ou zerado
      Alert.alert(
        'Estoque Insuficiente',
        `O produto "${productSelectedTemp.nome}" está com estoque ${currentStock === 0 ? 'zerado' : `insuficiente (Estoque: ${currentStock})`}. Continuar adicionando resultará em estoque negativo, o que pode gerar erros nos relatórios.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => proceedToAddProduct(quantityNum) },
        ],
        { cancelable: false }
      );
    } else {
      // Estoque suficiente, proceder normalmente
      proceedToAddProduct(quantityNum);
    }
  };

  // Função para adicionar o produto após confirmação
  const proceedToAddProduct = (quantityNum) => {
    // Obtém a última entrada para pegar o valorVenda atual
    const ultimaEntrada = productSelectedTemp.entradas && productSelectedTemp.entradas.length > 0
      ? productSelectedTemp.entradas[productSelectedTemp.entradas.length - 1]
      : null;

    const precoUnit = ultimaEntrada && ultimaEntrada.valorVenda
      ? parseFloat(ultimaEntrada.valorVenda)
      : 0;

    const subtotal = precoUnit * quantityNum;

    const newItem = {
      produtoId: productSelectedTemp.id,
      nome: productSelectedTemp.nome,
      precoUnitarioNoMomento: precoUnit, // Valor travado no momento da venda
      quantidade: quantityNum,
      subtotal,
    };
    setSelectedProducts((prev) => [...prev, newItem]);
    setIsQuantityModalVisible(false);
    setProductModalVisible(false);
  };

  // Recalcula o valor total sempre que os produtos selecionados ou o desconto mudarem
  useEffect(() => {
    const total = selectedProducts.reduce((acc, item) => acc + item.subtotal, 0);
    let discountValue = 0;
    if (discount) {
      if (discountType === 'fixed') {
        discountValue = parseFloat(discount);
      } else if (discountType === 'percentage') {
        discountValue = (total * parseFloat(discount)) / 100;
      }
    }
    const totalAfterDiscount = total - discountValue;
    setSaleValue(totalAfterDiscount >= 0 ? totalAfterDiscount : 0);
  }, [selectedProducts, discount, discountType]);

  // Função para remover um produto selecionado
  const removeSelectedProduct = (index) => {
    const arr = [...selectedProducts];
    arr.splice(index, 1);
    setSelectedProducts(arr);
  };

  // Função para salvar a venda
  const addSale = async () => {
    if (!selectedDate || selectedProducts.length === 0) {
      Alert.alert('Erro', 'Selecione uma data e adicione pelo menos 1 produto.');
      return;
    }
    if (paymentMethod === 'crediario' && !selectedCustomer) {
      Alert.alert('Erro', 'Selecione um cliente para crediário.');
      return;
    }

    // Validação do desconto
    const totalProducts = selectedProducts.reduce((acc, item) => acc + item.subtotal, 0);
    let discountValue = 0;
    if (discount) {
      if (discountType === 'fixed') {
        discountValue = parseFloat(discount);
      } else if (discountType === 'percentage') {
        discountValue = (totalProducts * parseFloat(discount)) / 100;
      }
      if (discountValue > totalProducts) {
        Alert.alert('Erro', 'O desconto não pode ser maior que o total da venda.');
        return;
      }
    }

    try {
      const saleDateObj = new Date(selectedDate + 'T00:00:00');
      saleDateObj.setHours(12, 0, 0, 0);
      const finalDate = saleDateObj.toISOString().split('T')[0];

      const savedData = await AsyncStorage.getItem('financeData');
      const parsedData = savedData ? JSON.parse(savedData) : [];
      const metaIndex = parsedData.findIndex((item) => item.id === metaId);

      if (metaIndex === -1) {
        Alert.alert('Erro', 'Meta não encontrada.');
        return;
      }

      let parcels = [];
      if (paymentMethod === 'crediario' || (paymentMethod === 'cartao' && !isDebit)) {
        const parcelValue = parseFloat(saleValue) / parseInt(installments);
        const initialDate = new Date(selectedDate);
        initialDate.setMonth(initialDate.getMonth() + 1);

        for (let i = 0; i < parseInt(installments); i++) {
          const parcelDate = new Date(initialDate);
          parcelDate.setMonth(initialDate.getMonth() + i);
          parcels.push({
            number: i + 1,
            value: parcelValue.toFixed(2),
            date: parcelDate.toISOString().split('T')[0],
            paid: false,
          });
        }
      }

      const newSale = {
        id: Date.now().toString(),
        date: finalDate,
        value: parseFloat(saleValue),
        description,
        paymentMethod: isDebit
          ? 'cartao-debito'
          : paymentMethod === 'cartao' && installments === '1'
          ? 'cartao-credito-a-vista'
          : paymentMethod === 'cartao' && parseInt(installments) > 1
          ? 'cartao-credito-parcelado'
          : paymentMethod,
        customer: selectedCustomer || null,
        installments: paymentMethod === 'crediario' ? parseInt(installments) : null,
        parcels: paymentMethod === 'crediario' ? parcels : [],
        products: selectedProducts.map((p) => ({
          produtoId: p.produtoId,
          nome: p.nome,
          precoUnitarioNoMomento: p.precoUnitarioNoMomento,
          quantidade: p.quantidade,
          subtotal: p.subtotal,
        })),
        discount: {
          type: discountType,
          value: parseFloat(discount || '0'),
        },
      };

      parsedData[metaIndex].sales = parsedData[metaIndex].sales || [];
      parsedData[metaIndex].sales.push(newSale);

      // Atualizar o estoque
      const savedStock = await AsyncStorage.getItem('estoqueData');
      const parsedStock = savedStock ? JSON.parse(savedStock) : [];

      const updatedStock = parsedStock.map((prod) => {
        const soldItem = selectedProducts.find((item) => item.produtoId === prod.id);
        if (soldItem) {
          return {
            ...prod,
            quantidade: prod.quantidade - soldItem.quantidade,
          };
        }
        return prod;
      });

      await AsyncStorage.setItem('financeData', JSON.stringify(parsedData));
      await AsyncStorage.setItem('estoqueData', JSON.stringify(updatedStock));

      Alert.alert('Sucesso', 'Venda adicionada com sucesso!');

      // Reset dos campos
      setSelectedProducts([]);
      setSaleValue(0);
      setDiscount('');
      setDiscountType('fixed');
      setSelectedCustomer('');
      setInstallments('');
      setDescription('');
      setIsDebit(false);
    } catch (error) {
      console.error('Erro ao adicionar venda', error);
      Alert.alert('Erro', 'Ocorreu um erro ao adicionar a venda.');
    }
  };

  // Função para navegar para os detalhes das vendas
  const goToSalesDetail = () => {
    if (!selectedDate) {
      Alert.alert('Erro', 'Por favor, selecione uma data.');
      return;
    }
    navigation.navigate('SalesDetailScreen', { metaId, date: selectedDate });
  };

  // Função para renderizar cada item de cliente na FlatList
  const renderCustomerItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.customerItem,
        selectedCustomer === item.name && styles.selectedCustomerItem,
      ]}
      onPress={() => {
        setSelectedCustomer(item.name);
        setCustomerModalVisible(false);
      }}
    >
      <Text style={styles.customerName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Função para renderizar cada item de produto na FlatList
  const renderProductItem = ({ item }) => {
    // Verifica se existem entradas e obtém a última entrada
    const ultimaEntrada = item.entradas && item.entradas.length > 0
      ? item.entradas[item.entradas.length - 1]
      : null;

    // Obtém o valorVenda da última entrada ou define como '0.00' se não existir
    const valorVenda = ultimaEntrada && ultimaEntrada.valorVenda
      ? ultimaEntrada.valorVenda.toFixed(2)
      : '0.00';

    return (
      <TouchableOpacity
        style={styles.productListItem}
        onPress={() => handleSelectProduct(item)}
      >
        <Text style={styles.productName2}>
          {item.nome} ({item.codigo})
        </Text>
        <Text style={styles.productPrice2}>R$ {valorVenda}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/*
        ScrollView principal com nestedScrollEnabled para permitir rolagem
      */}
      <ScrollView contentContainerStyle={styles.scrollContainer} nestedScrollEnabled>
        <Text style={styles.title}>Adicionar Venda</Text>

        {/* Calendário para selecionar a data da venda */}
        <Calendar
          onDayPress={handleDateSelect}
          markedDates={{
            [selectedDate]: { selected: true, marked: true, selectedColor: '#3A86FF' },
          }}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#2D3142',
            selectedDayBackgroundColor: '#3A86FF',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#3A86FF',
            dayTextColor: '#2D3142',
            textDisabledColor: '#d9e1e8',
            dotColor: '#3A86FF',
            selectedDotColor: '#ffffff',
            arrowColor: '#3A86FF',
            monthTextColor: '#3A86FF',
          }}
        />

        {/* Lista de produtos selecionados */}
        <Text style={styles.label2}>Produtos Selecionados:</Text>
        <View style={styles.productsBox}>
          {selectedProducts.length > 0 ? (
            selectedProducts.map((item, index) => (
              <View key={index} style={styles.selectedProductRow}>
                <Text style={styles.selectedProductName}>
                  {item.nome} (Qtd: {item.quantidade})
                </Text>
                <Text style={styles.selectedProductSubtotal}>
                  R$ {item.subtotal.toFixed(2)}
                </Text>
                <TouchableOpacity onPress={() => removeSelectedProduct(index)}>
                  <Text style={{ color: '#E74C3C', marginLeft: 8 }}>Remover</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyMsg}>Nenhum produto adicionado.</Text>
          )}
          <TouchableOpacity
            style={[styles.button, { marginTop: 10 }]}
            onPress={() => setProductModalVisible(true)}
          >
            <Text style={styles.buttonText}>+ Adicionar Produto</Text>
          </TouchableOpacity>
        </View>

        {/* Campo para selecionar o desconto */}
        <Text style={styles.label2}>Desconto:</Text>
        <View style={styles.discountContainer}>
          <TouchableOpacity
            style={[
              styles.discountTypeButton,
              discountType === 'fixed' && styles.selectedDiscountType,
            ]}
            onPress={() => setDiscountType('fixed')}
          >
            <Text
              style={[
                styles.discountTypeText,
                discountType === 'fixed' && styles.selectedDiscountTypeText,
              ]}
            >
              Fixo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.discountTypeButton,
              discountType === 'percentage' && styles.selectedDiscountType,
            ]}
            onPress={() => setDiscountType('percentage')}
          >
            <Text
              style={[
                styles.discountTypeText,
                discountType === 'percentage' && styles.selectedDiscountTypeText,
              ]}
            >
              %
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder={
            discountType === 'fixed' ? 'Valor do Desconto' : 'Desconto (%)'
          }
          value={discount.toString()}
          keyboardType="numeric"
          onChangeText={(text) => setDiscount(text)}
          placeholderTextColor="#BDBDBD"
        />

        {/* Valor Total da Venda e Parcelas */}
        <Text style={[styles.label2, { marginTop: 20 }]}>Valor Total:</Text>
        <View style={styles.totalAndInstallmentsContainer}>
          <TextInput
            style={[styles.readonlyInput, styles.totalInput]}
            editable={false}
            value={`R$ ${saleValue.toFixed(2)}`}
          />
          {/* 
            Atualização: Adiciona condição para desabilitar parcelas quando isDebit é verdadeiro 
            Apenas para 'cartao', 'crediario' continua permitindo parcelas
          */}
          {(paymentMethod === 'cartao' && !isDebit) || paymentMethod === 'crediario' ? (
            <View style={styles.installmentsContainer}>
              <Text style={styles.installmentsLabel}>x</Text>
              <TextInput
                style={styles.installmentsInput}
                placeholder="3"
                value={installments}
                keyboardType="numeric"
                onChangeText={setInstallments}
                placeholderTextColor="#BDBDBD"
                editable={!isDebit} // Desabilita quando isDebit é verdadeiro
                // Opicional: Ajusta a opacidade para indicar desabilitado
                // style={[styles.installmentsInput, isDebit && { backgroundColor: '#E0E0E0' }]}
              />
              {installments && installmentValue ? (
                <Text style={styles.installmentInfo}>
                 {installments} x R$ {installmentValue}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Campo para descrição da venda */}
        <TextInput
          style={styles.input}
          placeholder="Descrição"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor="#BDBDBD"
        />

        {/* Seleção de cliente */}
        <Text style={styles.label}>Cliente:</Text>
        <TouchableOpacity
          style={[styles.input, styles.customerSelector]}
          onPress={() => setCustomerModalVisible(true)}
        >
          <Text style={styles.customerText}>
            {selectedCustomer || 'Selecionar Cliente'}
          </Text>
        </TouchableOpacity>

        {/* Seleção de forma de pagamento */}
        <Text style={styles.label}>Forma de Pagamento:</Text>
        <View style={styles.optionsContainer}>
          {['dinheiro', 'pix', 'crediario', 'cartao'].map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.optionButton,
                paymentMethod === method && styles.selectedOption,
              ]}
              onPress={() => {
                setPaymentMethod(method);
                // Se a forma de pagamento mudar para algo que não seja 'cartao', desmarca 'isDebit'
                if (method !== 'cartao') {
                  setIsDebit(false);
                }
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  paymentMethod === method && styles.selectedOptionText,
                ]}
              >
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 
          Atualização: Checkbox para débito só aparece quando a forma de pagamento é 'cartao'
          e controla a desativação de parcelas
        */}
        {paymentMethod === 'cartao' && (
          <View style={styles.raw}>
            <View style={styles.checkboxContainer}>
              <View style={styles.checkboxWrapper}>
                <Checkbox
                  value={isDebit}
                  onValueChange={(checked) => {
                    setIsDebit(checked);
                    if (checked) setInstallments(''); // Reseta parcelas quando Débito é marcado
                  }}
                />
                <Text style={styles.checkboxLabel}>Débito</Text>
              </View>
            </View>
          </View>
        )}

        {/* Botões para adicionar venda e ver vendas do dia */}
        <TouchableOpacity style={styles.button} onPress={addSale}>
          <Text style={styles.buttonText}>Adicionar Venda</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={goToSalesDetail}
        >
          <Text style={styles.buttonText}>Ver Vendas do Dia</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal para seleção de cliente */}
      <Modal visible={isCustomerModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cliente"
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#BDBDBD"
          />
          {/* FlatList de clientes com nestedScrollEnabled */}
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderCustomerItem}
            nestedScrollEnabled
          />
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setCustomerModalVisible(false)}
          >
            <Text style={styles.modalCloseButtonText}>Fechar</Text>
          </TouchableOpacity>

          {/* Botão flutuante para adicionar cliente */}
          <TouchableOpacity
            style={styles.floatingAddButton}
            onPress={() => {
              setCustomerModalVisible(false);
              navigation.navigate('AddCustomers');
            }}
          >
            <Text style={styles.floatingAddButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal para seleção de produtos */}
      <Modal visible={isProductModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Adicionar Produto</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produto"
            value={searchTermProduct}
            onChangeText={setSearchTermProduct}
            placeholderTextColor="#BDBDBD"
          />
          {/* FlatList de produtos com nestedScrollEnabled */}
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProductItem}
            nestedScrollEnabled
          />
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setProductModalVisible(false)}
          >
            <Text style={styles.modalCloseButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal para inserir a quantidade do produto selecionado */}
      <Modal visible={isQuantityModalVisible} animationType="fade" transparent>
        <View style={styles.quantityModalOverlay}>
          <View style={styles.quantityModalContainer}>
            <Text style={styles.modalTitle}>Quantidade:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tempQuantity}
              onChangeText={setTempQuantity}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#CCC' }]}
                onPress={() => setIsQuantityModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#3A86FF' }]}
                onPress={confirmAddProduct}
              >
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default AddSaleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2D3142',
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#2D3142',
  },
  readonlyInput: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    backgroundColor: '#E0E0E0',
    fontSize: 16,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputSmall: {
    width: 60,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#2D3142',
  },
  textInline: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2D3142',
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    color: '#2D3142',
  },
  label2: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3142',
    marginBottom: 5,
  },
  customerSelector: {
    justifyContent: 'center',
  },
  customerText: {
    color: '#2D3142',
  },
  optionsContainer: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  optionButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#3A86FF',
    borderColor: '#3A86FF',
  },
  optionText: {
    fontSize: 14,
    color: '#2D3142',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FF5733',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  // Modal Container
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#F7F9FC',
    fontSize: 16,
    color: '#2D3142',
  },
  modalCloseButton: {
    backgroundColor: '#E74C3C',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#3A86FF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  floatingAddButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  // Checkbox Container
  raw: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2D3142',
  },
  // Lista de clientes
  customerItem: {
    padding: 15,
    backgroundColor: '#F7F9FC',
    borderBottomWidth: 1,
    borderBottomColor: '#BDBDBD',
  },
  selectedCustomerItem: {
    backgroundColor: '#3A86FF',
  },
  customerName: {
    fontSize: 16,
    color: '#2D3142',
  },
  // Lista de produtos no modal
  productListItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productName2: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productPrice2: {
    fontSize: 16,
    color: '#777',
  },
  // Produtos selecionados
  productsBox: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    // sombra leve
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  flatlistFix: {
    maxHeight: 150,
  },
  emptyMsg: {
    textAlign: 'center',
    color: '#999',
    marginTop: 10,
  },
  selectedProductRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  selectedProductName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  selectedProductSubtotal: {
    fontSize: 15,
    color: '#666',
  },
  // Modal de quantidade
  quantityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityModalContainer: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2D3D',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 10,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Container para os tipos de desconto
  discountContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  discountTypeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 5,
  },
  selectedDiscountType: {
    backgroundColor: '#3A86FF',
    borderColor: '#3A86FF',
  },
  discountTypeText: {
    fontSize: 14,
    color: '#2D3142',
  },
  selectedDiscountTypeText: {
    color: '#ffffff',
  },
  // Novo contêiner para Valor Total e Parcelas
  totalAndInstallmentsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalInput: {
    flex: 1,
    marginRight: 10,
  },
  installmentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  installmentsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3142',
    marginRight: 5,
  },
  installmentsInput: {
    width: 60,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#2D3142',
  },
  installmentInfo: {
    fontSize: 16,
    color: '#2D3142',
    marginLeft: 5,
  },
});
