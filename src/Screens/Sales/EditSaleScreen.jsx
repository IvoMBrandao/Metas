import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, update, get, runTransaction } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';

// Função para converter undefined -> null (evita erro "contains undefined").
function sanitizeUndefined(obj) {
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeUndefined(item));
  } else if (obj && typeof obj === 'object') {
    const newObj = {};
    Object.keys(obj).forEach((key) => {
      if (obj[key] === undefined) {
        newObj[key] = null;
      } else {
        newObj[key] = sanitizeUndefined(obj[key]);
      }
    });
    return newObj;
  }
  return obj;
}

const EditSaleScreen = ({ route, navigation }) => {
  const { sale, metaId, lojaId } = route.params;
  const { user } = useAuthContext();

  // Verifica se temos dados suficientes.
  if (!user?.uid || !sale || !sale.id || !lojaId || !metaId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Erro: Dados insuficientes para editar a venda.
        </Text>
      </View>
    );
  }

  // Estados principais do formulário
  const [selectedDate, setSelectedDate] = useState(sale.date || '2025-01-01');
  const [saleValue, setSaleValue] = useState(String(sale.value || '0'));
  const [description, setDescription] = useState(sale.description || '');
  const [paymentMethod, setPaymentMethod] = useState(sale.paymentMethod || 'dinheiro');
  const [selectedCustomer, setSelectedCustomer] = useState(sale.customer || '');
  const [installments, setInstallments] = useState(
    sale.installments ? String(sale.installments) : ''
  );
  const [installmentValue, setInstallmentValue] = useState('');
  const [isDebit, setIsDebit] = useState(paymentMethod === 'cartao-debito');

  // Lista de produtos: originalSale vs atual
  const [selectedProducts, setSelectedProducts] = useState(sale.products || []);

  // Estados do modal de produto
  const [isProductModalVisible, setProductModalVisible] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [searchTermProduct, setSearchTermProduct] = useState('');

  // Estados para editar quantidade (ex: +1, -1, etc.)
  const [isQuantityModalVisible, setIsQuantityModalVisible] = useState(false);
  const [tempQuantity, setTempQuantity] = useState('');
  const [productSelectedTemp, setProductSelectedTemp] = useState(null);
  const [productIndexTemp, setProductIndexTemp] = useState(null); // para sabermos qual produto na lista

  // Estados para modal de clientes
  const [isCustomerModalVisible, setCustomerModalVisible] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [searchTermCustomer, setSearchTermCustomer] = useState('');

  // Venda original para comparar
  const [originalSale, setOriginalSale] = useState(sale);

  // Carrega dados ao montar
  useEffect(() => {
    loadCustomers();
    loadAllProducts();
  }, []);

  // Carrega novamente quando a tela ganha foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCustomers();
      loadAllProducts();
    });
    return unsubscribe;
  }, [navigation]);

  /** Carregar lista de clientes do AsyncStorage (exemplo) */
  const loadCustomers = async () => {
    try {
      const savedCustomers = await AsyncStorage.getItem('customersData');
      const parsedCustomers = savedCustomers ? JSON.parse(savedCustomers) : [];
      setCustomers(parsedCustomers);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os clientes.');
      console.error('Erro ao carregar clientes:', error);
    }
  };

  /** Carregar produtos do DB (Firebase) */
  const loadAllProducts = async () => {
    try {
      if (!user?.uid) return;
      const db = getDatabase();
      const produtosRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/produtos`);
      const snapshot = await get(produtosRef);
      if (snapshot.exists()) {
        const dataVal = snapshot.val();
        const arr = Object.keys(dataVal).map((key) => ({
          id: key,
          ...dataVal[key],
        }));
        setAllProducts(arr);
      } else {
        setAllProducts([]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos do estoque.');
    }
  };

  /**
   * Se existe discount no sale original, aplique-o no total
   */
  useEffect(() => {
    const total = selectedProducts.reduce((acc, item) => acc + item.subtotal, 0);
    let discountValue = 0;
    if (originalSale.discount) {
      if (originalSale.discount.type === 'fixed') {
        discountValue = parseFloat(originalSale.discount.value) || 0;
      } else if (originalSale.discount.type === 'percentage') {
        discountValue = (total * parseFloat(originalSale.discount.value || '0')) / 100;
      }
    }
    const totalAfterDiscount = total - discountValue;
    setSaleValue(totalAfterDiscount >= 0 ? totalAfterDiscount.toFixed(2) : '0');
  }, [selectedProducts, originalSale.discount]);

  // Calcula parcelas
  useEffect(() => {
    if (saleValue && installments) {
      const value = (parseFloat(saleValue) / parseInt(installments, 10)).toFixed(2);
      setInstallmentValue(value);
    } else {
      setInstallmentValue('');
    }
  }, [saleValue, installments]);

  /**
   * =========== Adicionar Produto ===========
   * Permite adicionar o produto selecionado e definir quantidade
   */
  const handleSelectProduct = (prod) => {
    setProductSelectedTemp(prod);
    setTempQuantity('1');
    setProductIndexTemp(null);
    setIsQuantityModalVisible(true);
  };

  const confirmAddProduct = () => {
    const quantityNum = parseFloat(tempQuantity || '1');
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Erro', 'Quantidade inválida.');
      return;
    }
    let updated = [...selectedProducts];
    // Verifica se já existe esse produto na lista
    const existingIndex = updated.findIndex((p) => p.produtoId === productSelectedTemp.id);
    if (existingIndex !== -1) {
      updated[existingIndex].quantidade += quantityNum;
      updated[existingIndex].subtotal = parseFloat(
        (updated[existingIndex].quantidade * updated[existingIndex].precoUnitarioNoMomento).toFixed(2)
      );
    } else {
      // Lê valorVenda
      // SE o seu DB guarda `valorVenda` direto:
      const precoUnit =
        productSelectedTemp.valorVenda
          ? parseFloat(productSelectedTemp.valorVenda)
          : 0;
      // OU se usa entradas:
      // const ultimaEntrada = (productSelectedTemp.entradas && productSelectedTemp.entradas.length > 0)
      //   ? productSelectedTemp.entradas[productSelectedTemp.entradas.length - 1]
      //   : null;
      // const precoUnit = ultimaEntrada ? parseFloat(ultimaEntrada.valorVenda) : 0;

      const subtotal = parseFloat((quantityNum * precoUnit).toFixed(2));
      updated.push({
        produtoId: productSelectedTemp.id,
        nome: productSelectedTemp.nome,
        precoUnitarioNoMomento: precoUnit,
        quantidade: quantityNum,
        subtotal,
      });
    }
    setSelectedProducts(updated);
    setIsQuantityModalVisible(false);
    setProductModalVisible(false);
  };

  /**
   * =========== Editar Quantidade de um produto já na lista ===========
   * Ex.: +1 ou -1 ou valor específico.
   */
  const handleEditQuantity = (prodIndex) => {
    // Abre modal, define productIndexTemp e productSelectedTemp
    const prod = selectedProducts[prodIndex];
    setProductSelectedTemp({ ...prod });
    setTempQuantity(String(prod.quantidade));
    setProductIndexTemp(prodIndex);
    setIsQuantityModalVisible(true);
  };

  const confirmEditQuantity = () => {
    const quantityNum = parseFloat(tempQuantity || '1');
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Erro', 'Quantidade inválida.');
      return;
    }
    let updated = [...selectedProducts];
    if (productIndexTemp !== null) {
      updated[productIndexTemp].quantidade = quantityNum;
      updated[productIndexTemp].subtotal = parseFloat(
        (updated[productIndexTemp].precoUnitarioNoMomento * quantityNum).toFixed(2)
      );
    }
    setSelectedProducts(updated);
    setIsQuantityModalVisible(false);
    setProductIndexTemp(null);
    setProductSelectedTemp(null);
  };

  /**
   * Remove um produto do array
   */
  const removeSelectedProduct = (index) => {
    let arr = [...selectedProducts];
    arr.splice(index, 1);
    setSelectedProducts(arr);
  };

  /**
   * =========== Atualiza Estoque ===========
   * Calcula a diferença entre a venda original e a nova, rodando runTransaction
   */
  const updateStock = async (updatedSaleData) => {
    const db = getDatabase();

    // Mapeia quantidades antigas
    const oldMap = new Map();
    (originalSale.products || []).forEach((prod) => {
      oldMap.set(prod.produtoId, prod.quantidade);
    });

    // Mapeia quantidades novas
    const newMap = new Map();
    (updatedSaleData.products || []).forEach((prod) => {
      newMap.set(prod.produtoId, prod.quantidade);
    });

    // Percorre conjunto de IDs
    const productIds = new Set([...oldMap.keys(), ...newMap.keys()]);
    for (let productId of productIds) {
      const oldQty = oldMap.get(productId) || 0;
      const newQty = newMap.get(productId) || 0;
      const diff = newQty - oldQty;

      if (diff === 0) continue;

      try {
        const productRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/produtos/${productId}/quantidade`);
        await runTransaction(productRef, (currentStock) => {
          if (currentStock === null) {
            return 0; // se não existir, define 0
          }
          const updatedStock = currentStock - diff;
          return updatedStock >= 0 ? updatedStock : 0; 
        });
      } catch (err) {
        console.error(`Erro ao atualizar estoque do produto ${productId}:`, err);
        Alert.alert('Erro', `Não foi possível atualizar o estoque do produto ${productId}.`);
      }
    }
  };

  /**
   * =========== Função de atualizar a venda no DB ===========
   */
  const updateSale = async () => {
    if (!user?.uid) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }
    // Validações
    if (paymentMethod === 'crediario') {
      if (!selectedCustomer) {
        Alert.alert('Erro', 'Selecione um cliente para crediário.');
        return;
      }
      if (!installments || parseInt(installments, 10) <= 0) {
        Alert.alert('Erro', 'Informe parcelas válidas para crediário.');
        return;
      }
    }
    if (paymentMethod === 'cartao' && !isDebit) {
      if (!installments || parseInt(installments, 10) <= 0) {
        Alert.alert('Erro', 'Informe parcelas válidas para cartão parcelado.');
        return;
      }
    }

    // Monta objeto final
    const updatedSaleData = {
      date: selectedDate,
      value: parseFloat(saleValue),
      description,
      paymentMethod: isDebit
        ? 'cartao-debito'
        : paymentMethod === 'cartao' && installments === '1'
        ? 'cartao-credito-a-vista'
        : paymentMethod === 'cartao' && parseInt(installments, 10) > 1
        ? 'cartao-credito-parcelado'
        : paymentMethod,
      customer: paymentMethod === 'crediario' ? selectedCustomer : null,
      installments:
        paymentMethod === 'crediario' || (paymentMethod === 'cartao' && !isDebit)
          ? parseInt(installments, 10) || 0
          : null,
      products: selectedProducts.map((p) => ({
        produtoId: p.produtoId,
        nome: p.nome,
        precoUnitarioNoMomento: p.precoUnitarioNoMomento,
        quantidade: p.quantidade,
        subtotal: p.subtotal,
      })),
      discount: originalSale.discount || { type: 'fixed', value: '0' },
      edits: originalSale.edits || [],
    };

    // Detecta mudanças
    const changes = {};
    const fieldsToMonitor = [
      'date',
      'value',
      'description',
      'paymentMethod',
      'customer',
      'installments',
      'discount',
      'products',
    ];
    fieldsToMonitor.forEach((field) => {
      const oldVal = originalSale[field] === undefined ? null : originalSale[field];
      const newVal = updatedSaleData[field] === undefined ? null : updatedSaleData[field];
      if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
        changes[field] = {
          antigo: oldVal,
          novo: newVal,
        };
      }
    });

    if (Object.keys(changes).length > 0) {
      const editEntry = {
        date: new Date().toISOString(),
        changes,
      };
      updatedSaleData.edits = originalSale.edits
        ? [...originalSale.edits, editEntry]
        : [editEntry];
    }

    try {
      // Atualiza estoque com base nas diferenças
      await updateStock(updatedSaleData);

      // Converte undefined -> null
      const finalData = sanitizeUndefined(updatedSaleData);

      // Atualiza no DB
      const db = getDatabase();
      const saleRef = ref(db, `users/${user.uid}/lojas/${lojaId}/metas/${metaId}/vendas/${sale.id}`);
      await update(saleRef, finalData);

      // Atualiza state local
      setOriginalSale(finalData);

      Alert.alert('Sucesso', 'Venda atualizada com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao atualizar venda:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a venda no Firebase.');
    }
  };

  /** Renders do modal de produto */
  const filteredProducts = allProducts.filter((prod) =>
    (prod.nome || '').toLowerCase().includes(searchTermProduct.toLowerCase()) ||
    (prod.codigo || '').toLowerCase().includes(searchTermProduct.toLowerCase())
  );
  const renderProductItem = ({ item }) => {
    // Se "valorVenda" é direto:
    const precoUnit = item.valorVenda ? parseFloat(item.valorVenda).toFixed(2) : '0.00';
    // Se usar entradas:
    // const ultimaEntrada = item.entradas?.[item.entradas.length - 1];
    // const precoUnit = ultimaEntrada?.valorVenda
    //   ? parseFloat(ultimaEntrada.valorVenda).toFixed(2)
    //   : '0.00';

    return (
      <TouchableOpacity
        style={styles.productListItem}
        onPress={() => handleSelectProduct(item)}
      >
        <Text style={styles.productName2}>
          {item.nome} ({item.codigo})
        </Text>
        <Text style={styles.productPrice2}>R$ {precoUnit}</Text>
      </TouchableOpacity>
    );
  };

  /** Renders do modal de cliente */
  const filteredCustomers2 = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTermCustomer.toLowerCase())
  );
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Editar Venda</Text>

        {/* Data da Venda */}
        <Text style={styles.label}>Data da Venda (YYYY-MM-DD):</Text>
        <TextInput
          style={styles.input}
          placeholder="2025-01-01"
          value={selectedDate}
          onChangeText={setSelectedDate}
        />

        {/* Valor total e parcelas */}
        <Text style={styles.label}>Valor Total:</Text>
        <View style={styles.totalAndInstallmentsContainer}>
          <TextInput
            style={[styles.readonlyInput, styles.totalInput]}
            editable={false}
            value={`R$ ${parseFloat(saleValue).toFixed(2)}`}
          />
          {(paymentMethod === 'crediario' || paymentMethod === 'cartao') && (
            <View style={styles.installmentsContainer}>
              <Text style={styles.installmentsLabel}>x</Text>
              <TextInput
                style={styles.installmentsInput}
                placeholder="3"
                value={installments}
                keyboardType="numeric"
                onChangeText={setInstallments}
                editable={!isDebit}
              />
              {installments && installmentValue ? (
                <Text style={styles.installmentInfo}>
                  R$ {installmentValue} cada
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Produtos */}
        <Text style={styles.label}>Produtos na Venda:</Text>
        <View style={styles.productsBox}>
          {selectedProducts.length > 0 ? (
            selectedProducts.map((item, index) => (
              <View key={index} style={styles.selectedProductRow}>
                <View style={{ flex: 3 }}>
                  <Text style={styles.selectedProductName}>{item.nome}</Text>
                  <Text style={styles.selectedProductDetails}>
                    Qtd: {item.quantidade} × R${item.precoUnitarioNoMomento.toFixed(2)}
                  </Text>
                </View>
                <View style={{ flex: 2, alignItems: 'flex-end' }}>
                  <Text style={styles.selectedProductSubtotal}>
                    R$ {item.subtotal.toFixed(2)}
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 5 }}>
                    {/* Botão para editar quantidade */}
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => {
                        setProductSelectedTemp({ ...item });
                        setTempQuantity(String(item.quantidade));
                        setProductIndexTemp(index);
                        setIsQuantityModalVisible(true);
                      }}
                    >
                      <Text style={styles.editQuantityText}>Editar Qtd</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ marginLeft: 10 }}
                      onPress={() => removeSelectedProduct(index)}
                    >
                      <Text style={styles.removeProductText}>Remover</Text>
                    </TouchableOpacity>
                  </View>
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

        {/* Descrição */}
        <Text style={styles.label}>Descrição:</Text>
        <TextInput
          style={styles.input}
          placeholder="Descrição da venda"
          value={description}
          onChangeText={setDescription}
        />

        {/* Forma de pagamento */}
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
                if (method !== 'cartao') {
                  setIsDebit(false);
                  setInstallments('');
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

        {paymentMethod === 'cartao' && (
          <View style={[styles.checkboxContainer, { marginTop: 10 }]}>
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

        {/* Se for crediário, precisa de cliente */}
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

        {/* Salvar Alterações */}
        <TouchableOpacity style={styles.button} onPress={updateSale}>
          <Text style={styles.buttonText}>Salvar Alterações</Text>
        </TouchableOpacity>

        {/* Histórico de Edições */}
        {originalSale.edits && originalSale.edits.length > 0 && (
          <View style={styles.editHistoryContainer}>
            <Text style={styles.editHistoryTitle}>Histórico de Edições:</Text>
            {originalSale.edits.map((edit, index) => (
              <View key={index} style={styles.editEntry}>
                <Text style={styles.editDate}>
                  {new Date(edit.date).toLocaleString()}
                </Text>
                {Object.keys(edit.changes).map((field, idx) => (
                  <View key={idx} style={styles.changeItem}>
                    <Text style={styles.changeField}>{field}:</Text>
                    {field === 'products' ? (
                      <View style={styles.productChangesContainer}>
                        <Text style={styles.subTitle}>Antes:</Text>
                        {(edit.changes[field].antigo || []).map((prod, i) => (
                          <View key={`antigo-${i}`} style={styles.productChange}>
                            <Text style={styles.productChangeText}>
                              • {prod.nome} - Qtd: {prod.quantidade} 
                              - Preço: R${prod.precoUnitarioNoMomento.toFixed(2)} 
                              - Subtotal: R${prod.subtotal.toFixed(2)}
                            </Text>
                          </View>
                        ))}
                        <Text style={styles.subTitle}>Depois:</Text>
                        {(edit.changes[field].novo || []).map((prod, i) => (
                          <View key={`novo-${i}`} style={styles.productChange}>
                            <Text style={styles.productChangeText}>
                              • {prod.nome} - Qtd: {prod.quantidade} 
                              - Preço: R${prod.precoUnitarioNoMomento.toFixed(2)} 
                              - Subtotal: R${prod.subtotal.toFixed(2)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.changeValue}>
                        {String(edit.changes[field].antigo)} → {String(edit.changes[field].novo)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal p/ adicionar produto */}
      <Modal visible={isProductModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Adicionar Produto</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produto"
            value={searchTermProduct}
            onChangeText={setSearchTermProduct}
          />
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProductItem}
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

      {/* Modal de quantidade (adicionar ou editar qtd) */}
      <Modal visible={isQuantityModalVisible} animationType="fade" transparent>
        <View style={styles.quantityModalOverlay}>
          <View style={styles.quantityModalContainer}>
            <Text style={styles.modalTitle}>Quantidade:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tempQuantity}
              onChangeText={setTempQuantity}
              placeholder="Digite a quantidade"
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#CCC' }]}
                onPress={() => {
                  setIsQuantityModalVisible(false);
                  setProductSelectedTemp(null);
                  setProductIndexTemp(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#3A86FF' }]}
                onPress={() => {
                  if (productIndexTemp !== null) {
                    // Editar quantidade de um item existente
                    const quantityNum = parseFloat(tempQuantity || '1');
                    if (isNaN(quantityNum) || quantityNum <= 0) {
                      Alert.alert('Erro', 'Quantidade inválida.');
                      return;
                    }
                    let updated = [...selectedProducts];
                    updated[productIndexTemp].quantidade = quantityNum;
                    updated[productIndexTemp].subtotal = parseFloat(
                      (updated[productIndexTemp].precoUnitarioNoMomento * quantityNum).toFixed(2)
                    );
                    setSelectedProducts(updated);
                    setIsQuantityModalVisible(false);
                    setProductIndexTemp(null);
                    setProductSelectedTemp(null);
                  } else {
                    // Adicionando um novo produto
                    confirmAddProduct();
                  }
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal p/ selecionar cliente */}
      <Modal visible={isCustomerModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Selecionar Cliente</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cliente"
            value={searchTermCustomer}
            onChangeText={setSearchTermCustomer}
          />
          <FlatList
            data={filteredCustomers2}
            keyExtractor={(item, index) => String(index)}
            renderItem={renderCustomerItem}
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

export default EditSaleScreen;

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
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
    fontSize: 14,
  },
  quantityButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editQuantityText: {
    color: '#333',
    fontSize: 14,
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
    color: '#fff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
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
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
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
    color: '#FFF',
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
  emptyMsg: {
    textAlign: 'center',
    color: '#999',
    marginTop: 10,
  },
});
