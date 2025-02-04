import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  StyleSheet
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase, ref, get, set, update, push } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';

const EntradaScreen = ({ navigation, route }) => {
  // Receba lojaId para saber onde buscar produtos
  const { lojaId } = route.params;
  const { user } = useAuthContext();

  const [produtos, setProdutos] = useState([]);
  const [filteredProdutos, setFilteredProdutos] = useState([]);
  const [filterValue, setFilterValue] = useState('');

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  // Dados da entrada
  const [quantidadeEntrada, setQuantidadeEntrada] = useState('');
  const [valorCompra, setValorCompra] = useState('');
  const [porcentagem, setPorcentagem] = useState('');
  const [valorVenda, setValorVenda] = useState('');

  /**
   * Carrega produtos do Firebase
   */
  const fetchProdutos = async () => {
    try {
      const db = getDatabase();
      const produtosRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/produtos`);
      const snapshot = await get(produtosRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const arrayProdutos = Object.keys(data).map((key) => data[key]);
        setProdutos(arrayProdutos);
        setFilteredProdutos(arrayProdutos);
      } else {
        setProdutos([]);
        setFilteredProdutos([]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos do Firebase.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProdutos();
    }, [])
  );

  const filtrar = (text) => {
    setFilterValue(text);
    if (!text.trim()) {
      setFilteredProdutos(produtos);
      return;
    }
    const filtrados = produtos.filter((prod) =>
      prod.nome?.toLowerCase().includes(text.toLowerCase()) ||
      prod.codigo?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredProdutos(filtrados);
  };

  /**
   * Ao selecionar um produto, abrimos o modal
   */
  const handleSelectProduto = (produto) => {
    setProdutoSelecionado(produto);
    setQuantidadeEntrada('');

    // Se existe a última entrada, usamos para pré-carregar
    if (produto.entradas && produto.entradas.length > 0) {
      const ultimaEntrada = produto.entradas[produto.entradas.length - 1];
      setValorCompra(ultimaEntrada.valorCompra.toString());
      setPorcentagem(ultimaEntrada.porcentagem.toString());
      setValorVenda(ultimaEntrada.valorVenda.toString());
    } else {
      setValorCompra('');
      setPorcentagem('');
      setValorVenda('');
    }

    setIsModalVisible(true);
  };

  // Calculos
  const calcValorVenda = (compra, pct) => {
    if (!isNaN(compra) && !isNaN(pct)) {
      return (compra + (compra * pct) / 100).toFixed(2);
    }
    return '';
  };

  const calcPorcentagem = (compra, venda) => {
    if (!isNaN(compra) && !isNaN(venda) && compra !== 0) {
      return (((venda - compra) / compra) * 100).toFixed(2);
    }
    return '';
  };

  const handleValorCompraChange = (text) => {
    setValorCompra(text);
    const compra = parseFloat(text) || 0;
    const pct = parseFloat(porcentagem) || 0;
    const venda = parseFloat(valorVenda) || 0;

    if (porcentagem) {
      setValorVenda(calcValorVenda(compra, pct));
    } else if (valorVenda) {
      const newPct = calcPorcentagem(compra, venda);
      setPorcentagem(newPct);
    }
  };

  const handlePorcentagemChange = (text) => {
    setPorcentagem(text);
    const compra = parseFloat(valorCompra) || 0;
    const pct = parseFloat(text) || 0;

    if (valorCompra) {
      setValorVenda(calcValorVenda(compra, pct));
    } else {
      setValorVenda('');
    }
  };

  const handleValorVendaChange = (text) => {
    setValorVenda(text);
    const compra = parseFloat(valorCompra) || 0;
    const venda = parseFloat(text) || 0;

    if (valorCompra) {
      setPorcentagem(calcPorcentagem(compra, venda));
    } else {
      setPorcentagem('');
    }
  };

  /**
   * Salva a entrada no produto e registra movimentação
   */
  const handleSalvarEntrada = async () => {
    if (!quantidadeEntrada || !valorCompra) {
      Alert.alert('Erro', 'Informe pelo menos a quantidade e valor de compra.');
      return;
    }

    try {
      const quantidade = parseInt(quantidadeEntrada, 10);
      const compra = parseFloat(valorCompra) || 0;
      const pct = parseFloat(porcentagem) || 0;
      const venda = parseFloat(valorVenda) || 0;
      const lucroCalculado = venda - compra;
      const dataAtual = new Date().toISOString();

      // Criação da nova entrada
      const novaEntrada = {
        id: Date.now().toString(),
        data: dataAtual,
        quantidade,
        valorCompra: compra,
        porcentagem: pct,
        valorVenda: venda,
        lucro: lucroCalculado,
        valorAnterior:
          produtoSelecionado.entradas && produtoSelecionado.entradas.length > 0
            ? produtoSelecionado.entradas[produtoSelecionado.entradas.length - 1].valorVenda
            : 0
      };

      // Atualiza array de entradas
      const novasEntradas = produtoSelecionado.entradas
        ? [...produtoSelecionado.entradas, novaEntrada]
        : [novaEntrada];

      // Atualiza a quantidade total
      const novaQuantidade = (produtoSelecionado.quantidade || 0) + quantidade;

      const novoProduto = {
        ...produtoSelecionado,
        quantidade: novaQuantidade,
        entradas: novasEntradas,
        // dataEntrada: dataAtual  // Se quiser atualizar a data de entrada
      };

      // 1. Atualiza produto no Firebase
      const db = getDatabase();
      const produtoRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/produtos/${produtoSelecionado.id}`);
      await update(produtoRef, novoProduto);

      // 2. Registra movimentação em users/{uid}/movimentacoesData
      const movRef = ref(db, `users/${user.uid}/movimentacoesData`);
      const novaMovRef = push(movRef);
      const novaMovimentacao = {
        id: novaMovRef.key,
        produtoId: produtoSelecionado.id,
        tipoMovimento: 'entrada',
        quantidade,
        valorCompra: compra,
        porcentagem: pct,
        valorVenda: venda,
        data: dataAtual,
      };
      await set(novaMovRef, novaMovimentacao);

      Alert.alert('Sucesso', 'Entrada salva com sucesso!', [
        {
          text: 'Ok',
          onPress: () => setIsModalVisible(false),
        },
      ]);
      // Recarrega produtos
      fetchProdutos();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a entrada no Firebase.');
      console.error('Erro ao salvar entrada:', error);
    }
  };

  const renderProduto = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => handleSelectProduto(item)}
    >
      <Text style={styles.productName}>
        {item.nome} ({item.codigo})
      </Text>
      <Text style={styles.productDetails}>
        Qtd: {item.quantidade}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrada de Mercadorias</Text>

      <TextInput
        placeholder="Filtrar por nome ou código"
        value={filterValue}
        onChangeText={filtrar}
        style={styles.searchInput}
      />

      <FlatList
        data={filteredProdutos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduto}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum produto encontrado.</Text>
        }
      />

      {/* Modal de Entrada */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Entrada de Produto</Text>

            <Text style={styles.label}>Quantidade a entrar:</Text>
            <TextInput
              keyboardType="numeric"
              value={quantidadeEntrada}
              onChangeText={setQuantidadeEntrada}
              style={styles.input}
            />

            <Text style={styles.label}>Valor de Compra:</Text>
            <TextInput
              keyboardType="numeric"
              value={valorCompra}
              onChangeText={handleValorCompraChange}
              style={styles.input}
            />

            <Text style={styles.label}>Porcentagem de Lucro:</Text>
            <TextInput
              keyboardType="numeric"
              value={porcentagem}
              onChangeText={handlePorcentagemChange}
              style={styles.input}
            />

            <Text style={styles.label}>Valor de Venda:</Text>
            <TextInput
              keyboardType="numeric"
              value={valorVenda}
              onChangeText={handleValorVendaChange}
              style={styles.input}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#CCC' }]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#3A86FF' }]}
                onPress={handleSalvarEntrada}
              >
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>
                  Salvar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Botão flutuante para cadastrar novo produto */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('CadastroProduto', { lojaId })}
      >
        <AntDesign name="plus" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

export default EntradaScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F5F8',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1F2D3D',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFF',
    fontSize: 15,
    marginBottom: 10,
  },
  list: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    paddingHorizontal: 10,
  },
  productItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingVertical: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productDetails: {
    fontSize: 14,
    color: '#777',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    color: '#777',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    margin: 20,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2D3D',
    marginBottom: 10,
  },
  label: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    padding: 8,
    fontSize: 15,
    marginTop: 5,
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
  floatingButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: '#3A86FF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 6,
  },
});
