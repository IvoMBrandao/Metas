import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';

const EditSaleScreen = ({ route, navigation }) => {
  const { sale, metaId } = route.params;

  // Estados principais
  const [selectedDate, setSelectedDate] = useState(sale.date);
  const [saleValue, setSaleValue] = useState(sale.value.toString());
  const [description, setDescription] = useState(sale.description);
  const [paymentMethod, setPaymentMethod] = useState(sale.paymentMethod || 'dinheiro');
  const [selectedCustomer, setSelectedCustomer] = useState(sale.customer || '');
  const [installments, setInstallments] = useState(
    sale.installments ? sale.installments.toString() : ''
  );
  const [installmentValue, setInstallmentValue] = useState('');
  const [isDebit, setIsDebit] = useState(paymentMethod === 'cartao-debito');

  // Estados para gerenciar produtos na venda
  const [selectedProducts, setSelectedProducts] = useState(sale.products || []);
  const [isProductModalVisible, setProductModalVisible] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [searchTermProduct, setSearchTermProduct] = useState('');
  const [isQuantityModalVisible, setIsQuantityModalVisible] = useState(false);
  const [tempQuantity, setTempQuantity] = useState('');
  const [productSelectedTemp, setProductSelectedTemp] = useState(null);

  // Estados para seleção de cliente
  const [isCustomerModalVisible, setCustomerModalVisible] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [searchTermCustomer, setSearchTermCustomer] = useState('');

  // Estado para armazenar os valores originais para comparação
  const [originalSale, setOriginalSale] = useState(sale);

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

  // Função para calcular o valor da parcela
  useEffect(() => {
    calculateInstallment();
  }, [saleValue, installments, selectedProducts]);

  const calculateInstallment = () => {
    if (saleValue && installments) {
      const value = (parseFloat(saleValue) / parseInt(installments)).toFixed(2);
      setInstallmentValue(value);
    } else {
      setInstallmentValue('');
    }
  };

  // Recalcula o valor total sempre que os produtos selecionados ou o desconto mudarem
  useEffect(() => {
    const total = selectedProducts.reduce((acc, item) => acc + item.subtotal, 0);
    let discountValue = 0;
    if (sale.discount) {
      if (sale.discount.type === 'fixed') {
        discountValue = parseFloat(sale.discount.value);
      } else if (sale.discount.type === 'percentage') {
        discountValue = (total * parseFloat(sale.discount.value)) / 100;
      }
    }
    const totalAfterDiscount = total - discountValue;
    setSaleValue(totalAfterDiscount >= 0 ? totalAfterDiscount.toFixed(2) : '0');
  }, [selectedProducts, sale.discount]);

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
        `O produto "${productSelectedTemp.nome}" está com estoque ${
          currentStock === 0
            ? 'zerado'
            : `insuficiente (Estoque: ${currentStock})`
        }. Continuar adicionando resultará em estoque negativo, o que pode gerar erros nos relatórios.`,
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
    const precoUnit = parseFloat(productSelectedTemp.valorVenda || '0');
    const subtotal = precoUnit * quantityNum;

    // Verificar se o produto já está na lista
    const existingProductIndex = selectedProducts.findIndex(
      (item) => item.produtoId === productSelectedTemp.id
    );

    let updatedProducts = [...selectedProducts];
    if (existingProductIndex !== -1) {
      // Atualizar a quantidade e subtotal do produto existente
      const existingProduct = updatedProducts[existingProductIndex];
      existingProduct.quantidade += quantityNum;
      existingProduct.subtotal = parseFloat(
        (existingProduct.quantidade * existingProduct.precoUnitarioNoMomento).toFixed(2)
      );
    } else {
      // Adicionar novo produto
      const newItem = {
        produtoId: productSelectedTemp.id,
        nome: productSelectedTemp.nome,
        precoUnitarioNoMomento: precoUnit, // Valor travado no momento da venda
        quantidade: quantityNum,
        subtotal,
      };
      updatedProducts.push(newItem);
    }

    setSelectedProducts(updatedProducts);
    setIsQuantityModalVisible(false);
    setProductModalVisible(false);
  };

  // Função para remover um produto selecionado
  const removeSelectedProduct = (index) => {
    const arr = [...selectedProducts];
    arr.splice(index, 1);
    setSelectedProducts(arr);
  };

  // Função para salvar a venda atualizada
  const updateSale = async () => {
    if (
      !saleValue ||
      (paymentMethod === 'crediario' && (!selectedCustomer || !installments)) ||
      (paymentMethod === 'cartao' && !isDebit && !installments)
    ) {
      Alert.alert(
        'Erro',
        paymentMethod === 'crediario'
          ? 'Por favor, selecione um cliente e insira o número de parcelas.'
          : 'Por favor, insira o valor da venda.'
      );
      return;
    }

    try {
      const savedData = await AsyncStorage.getItem('financeData');
      const parsedData = savedData ? JSON.parse(savedData) : [];
      const metaIndex = parsedData.findIndex((item) => item.id === metaId);

      if (metaIndex === -1) {
        Alert.alert('Erro', 'Meta não encontrada.');
        return;
      }

      // Identificar mudanças para o histórico de edições
      const changes = {};

      // Comparar campos principais
      if (originalSale.date !== selectedDate) {
        changes['Data'] = { antigo: originalSale.date, novo: selectedDate };
      }

      if (parseFloat(originalSale.value).toFixed(2) !== parseFloat(saleValue).toFixed(2)) {
        changes['Valor'] = { antigo: `R$ ${originalSale.value.toFixed(2)}`, novo: `R$ ${parseFloat(saleValue).toFixed(2)}` };
      }

      if (originalSale.description !== description) {
        changes['Descrição'] = { antigo: originalSale.description, novo: description };
      }

      if (originalSale.paymentMethod !== paymentMethod) {
        changes['Forma de Pagamento'] = { antigo: originalSale.paymentMethod, novo: paymentMethod };
      }

      if (paymentMethod === 'crediario' && originalSale.customer !== selectedCustomer) {
        changes['Cliente'] = { antigo: originalSale.customer, novo: selectedCustomer };
      }

      if (
        paymentMethod === 'crediario' &&
        originalSale.installments?.toString() !== installments
      ) {
        changes['Parcelas'] = { antigo: originalSale.installments.toString(), novo: installments };
      }

      // Comparar produtos
      if (JSON.stringify(originalSale.products) !== JSON.stringify(selectedProducts)) {
        changes['Produtos'] = {
          antigo: originalSale.products.map(p => ({
            Nome: p.nome,
            Quantidade: p.quantidade,
            'Preço Unitário': `R$ ${p.precoUnitarioNoMomento.toFixed(2)}`,
            Subtotal: `R$ ${p.subtotal.toFixed(2)}`,
          })),
          novo: selectedProducts.map(p => ({
            Nome: p.nome,
            Quantidade: p.quantidade,
            'Preço Unitário': `R$ ${p.precoUnitarioNoMomento.toFixed(2)}`,
            Subtotal: `R$ ${p.subtotal.toFixed(2)}`,
          })),
        };
      }

      // Adicionar histórico de edição se houver mudanças
      if (Object.keys(changes).length > 0) {
        const editEntry = {
          date: new Date().toISOString(),
          changes,
        };

        // Nova lógica para crediário e cartão parcelado: Cálculo das parcelas
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

        // Atualizar a venda específica com as mudanças
        const updatedSales = parsedData[metaIndex].sales.map((s) =>
          s.id === sale.id
            ? {
                ...s,
                date: selectedDate,
                value: parseFloat(saleValue),
                description,
                paymentMethod: isDebit
                  ? 'cartao-debito'
                  : paymentMethod === 'cartao' && installments === '1'
                  ? 'cartao-credito-a-vista'
                  : paymentMethod === 'cartao' && parseInt(installments) > 1
                  ? 'cartao-credito-parcelado'
                  : paymentMethod,
                customer: paymentMethod === 'crediario' ? selectedCustomer : null,
                installments: paymentMethod === 'crediario' ? parseInt(installments) : null,
                parcels:
                  paymentMethod === 'crediario' || (paymentMethod === 'cartao' && !isDebit)
                    ? parcels
                    : [],
                products: selectedProducts.map((p) => ({
                  produtoId: p.produtoId,
                  nome: p.nome,
                  precoUnitarioNoMomento: p.precoUnitarioNoMomento,
                  quantidade: p.quantidade,
                  subtotal: p.subtotal,
                })),
                discount: sale.discount || { type: 'fixed', value: '0' }, // Mantém o desconto existente
                edits: s.edits ? [...s.edits, editEntry] : [editEntry],
              }
            : s
        );

        parsedData[metaIndex].sales = updatedSales;

        // Atualizar o estoque
        const savedStock = await AsyncStorage.getItem('estoqueData');
        const parsedStock = savedStock ? JSON.parse(savedStock) : [];

        // Recalcular o estoque baseado nas alterações dos produtos
        // Primeiro, recuperar a venda antiga para ajustar o estoque corretamente
        const oldSale = originalSale;
        const oldProducts = oldSale ? oldSale.products : [];

        // Atualizar estoque: adicionar de volta as quantidades antigas
        let updatedStock = parsedStock.map((prod) => {
          const oldSoldItem = oldProducts.find((item) => item.produtoId === prod.id);
          if (oldSoldItem) {
            return {
              ...prod,
              quantidade: prod.quantidade + oldSoldItem.quantidade,
            };
          }
          return prod;
        });

        // Subtrair as novas quantidades vendidas
        updatedStock = updatedStock.map((prod) => {
          const newSoldItem = selectedProducts.find((item) => item.produtoId === prod.id);
          if (newSoldItem) {
            return {
              ...prod,
              quantidade: prod.quantidade - newSoldItem.quantidade,
            };
          }
          return prod;
        });

        await AsyncStorage.setItem('financeData', JSON.stringify(parsedData));
        await AsyncStorage.setItem('estoqueData', JSON.stringify(updatedStock));

        // Atualizar o estado original da venda para futuras edições
        setOriginalSale({
          ...originalSale,
          date: selectedDate,
          value: parseFloat(saleValue),
          description,
          paymentMethod,
          customer: paymentMethod === 'crediario' ? selectedCustomer : null,
          installments: paymentMethod === 'crediario' ? parseInt(installments) : null,
          products: selectedProducts,
        });

        Alert.alert('Sucesso', 'Venda atualizada com sucesso!');
        navigation.goBack();
      } else {
        // Se não houver mudanças, apenas alertar e retornar
        Alert.alert('Nenhuma Mudança', 'Nenhuma alteração foi feita na venda.');
      }
    } catch (error) {
      console.error('Erro ao atualizar venda', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar a venda.');
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

  // Funções para gerenciar produtos na venda

  // Filtrar produtos com base no termo de busca
  const filteredProducts = allProducts.filter(
    (prod) =>
      prod.nome.toLowerCase().includes(searchTermProduct.toLowerCase()) ||
      prod.codigo.toLowerCase().includes(searchTermProduct.toLowerCase())
  );

  // Filtrar clientes com base no termo de busca
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTermCustomer.toLowerCase())
  );

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
  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productListItem}
      onPress={() => handleSelectProduct(item)}
    >
      <Text style={styles.productName2}>
        {item.nome} ({item.codigo})
      </Text>
      <Text style={styles.productPrice2}>R$ {item.valorVenda}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Editar Venda</Text>

        {/* Valor Total da Venda e Parcelas */}
        <Text style={[styles.label2, { marginTop: 20 }]}>Valor Total:</Text>
        <View style={styles.totalAndInstallmentsContainer}>
          <TextInput
            style={[styles.readonlyInput, styles.totalInput]}
            editable={false}
            value={`R$ ${parseFloat(saleValue).toFixed(2)}`}
          />
          {(paymentMethod === 'cartao' || paymentMethod === 'crediario') && (
            <View style={styles.installmentsContainer}>
              <Text style={styles.installmentsLabel}>x</Text>
              <TextInput
                style={styles.installmentsInput}
                placeholder="3"
                value={installments}
                keyboardType="numeric"
                onChangeText={setInstallments}
                placeholderTextColor="#BDBDBD"
              />
              {installments && installmentValue ? (
                <Text style={styles.installmentInfo}>
                  R$ {installmentValue} cada
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Lista de Produtos na Venda */}
        <Text style={styles.label2}>Produtos na Venda:</Text>
        <View style={styles.productsBox}>
          {selectedProducts.length > 0 ? (
            selectedProducts.map((item, index) => (
              <View key={index} style={styles.selectedProductRow}>
                <View style={{ flex: 3 }}>
                  <Text style={styles.selectedProductName}>{item.nome}</Text>
                  <Text style={styles.selectedProductDetails}>
                    Quantidade: {item.quantidade} x R$ {item.precoUnitarioNoMomento.toFixed(2)}
                  </Text>
                </View>
                <View style={{ flex: 2, alignItems: 'flex-end' }}>
                  <Text style={styles.selectedProductSubtotal}>
                    R$ {item.subtotal.toFixed(2)}
                  </Text>
                  <TouchableOpacity onPress={() => removeSelectedProduct(index)}>
                    <Text style={styles.removeProductText}>Remover</Text>
                  </TouchableOpacity>
                </View>
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

        {/* Campo para selecionar o cliente somente se for crediário */}
        {paymentMethod === 'crediario' && (
          <>
            <Text style={styles.label}>Cliente:</Text>
            <TouchableOpacity
              style={[styles.input, styles.customerSelector]}
              onPress={() => setCustomerModalVisible(true)}
            >
              <Text style={styles.customerText}>
                {selectedCustomer || 'Selecionar Cliente'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Campo para descrição da venda */}
        <TextInput
          style={styles.input}
          placeholder="Descrição"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor="#BDBDBD"
        />

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
                if (method === 'crediario' && !selectedCustomer) {
                  Alert.alert(
                    'Erro',
                    'É necessário selecionar um cliente antes de alterar para Crediário.'
                  );
                  return;
                }
                setPaymentMethod(method);
                if (method !== 'cartao') {
                  setIsDebit(false);
                  setInstallments('');
                }
              }}
              disabled={method === 'crediario' && !selectedCustomer}
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

        {/* Checkbox para débito se a forma de pagamento for cartão */}
        {paymentMethod === 'cartao' && (
          <View style={styles.checkboxContainer}>
            <Checkbox
              value={isDebit}
              onValueChange={(checked) => {
                setIsDebit(checked);
                if (checked) setInstallments('');
              }}
            />
            <Text style={styles.checkboxLabel}>Débito</Text>
          </View>
        )}

        {/* Botão para atualizar a venda */}
        <TouchableOpacity style={styles.button} onPress={updateSale}>
          <Text style={styles.buttonText}>Atualizar Venda</Text>
        </TouchableOpacity>

        {/* Histórico de Edições */}
        {sale.edits && sale.edits.length > 0 && (
          <View style={styles.editHistoryContainer}>
            <Text style={styles.editHistoryTitle}>Histórico de Edições:</Text>
            {sale.edits.map((edit, index) => (
              <View key={index} style={styles.editEntry}>
                <Text style={styles.editDate}>
                  {new Date(edit.date).toLocaleString()}
                </Text>
                {Object.keys(edit.changes).map((field, idx) => (
                  <View key={idx} style={styles.changeItem}>
                    <Text style={styles.changeField}>{field}:</Text>
                    {field === 'Produtos' ? (
                      <View style={styles.productChangesContainer}>
                        <Text style={styles.subTitle}>Antes:</Text>
                        {edit.changes[field].antigo.map((prod, i) => (
                          <View key={`antigo-${i}`} style={styles.productChange}>
                            <Text style={styles.productChangeText}>
                              • {prod.Nome} - Quantidade: {prod.Quantidade} - Preço Unitário: {prod['Preço Unitário']} - Subtotal: {prod.Subtotal}
                            </Text>
                          </View>
                        ))}
                        <Text style={styles.subTitle}>Depois:</Text>
                        {edit.changes[field].novo.map((prod, i) => (
                          <View key={`novo-${i}`} style={styles.productChange}>
                            <Text style={styles.productChangeText}>
                              • {prod.Nome} - Quantidade: {prod.Quantidade} - Preço Unitário: {prod['Preço Unitário']} - Subtotal: {prod.Subtotal}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.changeValue}>
                        {edit.changes[field].antigo} → {edit.changes[field].novo}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal para seleção de produtos */}
      <Modal visible={isProductModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Adicionar Produto</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produto"
            value={searchTermProduct}
            onChangeText={setSearchTermProduct}
            placeholderTextColor="#BDBDBD"
          />
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProductItem}
            nestedScrollEnabled
            ListEmptyComponent={<Text style={styles.emptyMsg}>Nenhum produto encontrado.</Text>}
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

      {/* Modal para seleção de cliente */}
      <Modal visible={isCustomerModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Selecionar Cliente</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cliente"
            value={searchTermCustomer}
            onChangeText={setSearchTermCustomer}
            placeholderTextColor="#BDBDBD"
          />
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCustomerItem}
            nestedScrollEnabled
            ListEmptyComponent={<Text style={styles.emptyMsg}>Nenhum cliente encontrado.</Text>}
          />
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setCustomerModalVisible(false)}
          >
            <Text style={styles.modalCloseButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2D3142',
  },
  button: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  customerSelector: {
    justifyContent: 'center',
  },
  customerText: {
    color: '#2D3142',
  },
  productsBox: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
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
  selectedProductDetails: {
    fontSize: 14,
    color: '#666',
  },
  selectedProductSubtotal: {
    fontSize: 15,
    color: '#666',
  },
  removeProductText: {
    color: '#E74C3C',
    marginTop: 5,
    fontSize: 14,
  },
  emptyMsg: {
    textAlign: 'center',
    color: '#999',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2D3142',
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
  editHistoryContainer: {
    marginTop: 30,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  editHistoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2D3142',
  },
  editEntry: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    paddingBottom: 10,
  },
  editDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 5,
  },
  changeItem: {
    marginBottom: 5,
  },
  changeField: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  changeValue: {
    color: '#333',
    paddingLeft: 10,
  },
  productChangesContainer: {
    paddingLeft: 10,
  },
  productChange: {
    marginLeft: 10,
    marginBottom: 2,
  },
  productChangeText: {
    fontSize: 14,
    color: '#555',
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3142',
    marginTop: 5,
    marginBottom: 3,
  },
});

export default EditSaleScreen;
