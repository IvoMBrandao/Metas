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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // Importação do hook

const EntradaScreen = ({ navigation }) => { // Recebendo navigation via props
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
   * Função para carregar dados do AsyncStorage (lista de produtos).
   */
  const fetchProdutos = async () => {
    try {
      const data = await AsyncStorage.getItem('estoqueData');
      const parsed = data ? JSON.parse(data) : [];
      setProdutos(parsed);
      setFilteredProdutos(parsed);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos.');
    }
  };

  /**
   * Hook para executar fetchProdutos sempre que a tela ganhar foco.
   */
  useFocusEffect(
    useCallback(() => {
      fetchProdutos();
    }, [])
  );

  /**
   * Filtro básico (nome ou código).
   */
  const filtrar = (text) => {
    setFilterValue(text);
    if (!text.trim()) {
      setFilteredProdutos(produtos);
      return;
    }
    const filtrados = produtos.filter((prod) =>
      prod.nome.toLowerCase().includes(text.toLowerCase()) ||
      prod.codigo.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredProdutos(filtrados);
  };

  /**
   * Ao selecionar um produto, abre modal e pré-carrega os valores.
   */
  const handleSelectProduto = (produto) => {
    setProdutoSelecionado(produto);
    setQuantidadeEntrada('');
    setValorCompra(produto.valorCompra ? produto.valorCompra.toString() : '');
    setPorcentagem(produto.porcentagem ? produto.porcentagem.toString() : '');
    setValorVenda(produto.valorVenda ? produto.valorVenda.toString() : '');
    setIsModalVisible(true);
  };

  // ==============================
  // FUNÇÕES DE CÁLCULO
  // ==============================
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

  // ==============================
  // HANDLERS DOS INPUTS
  // ==============================

  /**
   * Se o usuário altera ValorCompra:
   *  - Se já tem Porcentagem preenchida, recalcula ValorVenda.
   *  - Se não tem Porcentagem mas tem ValorVenda, recalcula Porcentagem.
   *  - Se ambos estão vazios, não faz nada.
   */
  const handleValorCompraChange = (text) => {
    setValorCompra(text);
    const compra = parseFloat(text) || 0;
    const pct = parseFloat(porcentagem) || 0;
    const venda = parseFloat(valorVenda) || 0;

    // Se já existir uma porcentagem, prioriza calcular ValorVenda
    if (porcentagem) {
      setValorVenda(calcValorVenda(compra, pct));
    }
    // Se não existe porcentagem, mas existe valorVenda,
    // então prioriza recalcular porcentagem:
    else if (valorVenda) {
      const newPct = calcPorcentagem(compra, venda);
      setPorcentagem(newPct);
    }
    // Se ambos vazios, nada muda
  };

  /**
   * Se o usuário altera a Porcentagem -> recalcular ValorVenda
   *  (mantém ValorCompra fixo).
   */
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

  /**
   * Se o usuário altera o ValorVenda -> recalcular Porcentagem
   *  (mantém ValorCompra fixo).
   */
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
   * Salva a entrada no produto e também em um histórico.
   */
  const handleSalvarEntrada = async () => {
    if (!quantidadeEntrada || !valorCompra) {
      Alert.alert('Erro', 'Informe pelo menos a quantidade e valor de compra.');
      return;
    }

    const novaQtd = Number(produtoSelecionado.quantidade) + Number(quantidadeEntrada);
    const dataAtual = new Date().toISOString().split('T')[0];

    const novoProduto = {
      ...produtoSelecionado,
      quantidade: novaQtd,
      valorCompra: parseFloat(valorCompra),
      porcentagem: parseFloat(porcentagem),
      valorVenda: parseFloat(valorVenda),
      dataEntrada: dataAtual
    };

    // Atualiza no array principal
    const index = produtos.findIndex((p) => p.id === produtoSelecionado.id);
    if (index !== -1) {
      produtos[index] = novoProduto;
    }

    await AsyncStorage.setItem('estoqueData', JSON.stringify(produtos));
    setProdutos([...produtos]);
    setFilteredProdutos([...produtos]);

    // Salva histórico de entrada
    await salvarHistoricoEntrada(novoProduto, quantidadeEntrada);

    Alert.alert('Sucesso', 'Entrada salva com sucesso!');
    setIsModalVisible(false);
  };

  /**
   * Salva um registro de entrada no AsyncStorage (movimentacoesData).
   */
  const salvarHistoricoEntrada = async (produto, qtdEntrada) => {
    try {
      const data = await AsyncStorage.getItem('movimentacoesData');
      const movs = data ? JSON.parse(data) : [];
      const novaMov = {
        id: Date.now().toString(),
        produtoId: produto.id,
        tipoMovimento: 'entrada',
        quantidade: qtdEntrada,
        valorCompra: parseFloat(valorCompra),
        porcentagem: parseFloat(porcentagem),
        valorVenda: parseFloat(valorVenda),
        data: new Date().toISOString(),
      };
      movs.push(novaMov);

      await AsyncStorage.setItem('movimentacoesData', JSON.stringify(movs));
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar o histórico de entrada.');
    }
  };

  /**
   * Renderiza cada item da lista de produtos.
   */
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

  // ==============================
  // RENDER PRINCIPAL
  // ==============================
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
        onPress={() => navigation.navigate('CadastroProduto')}
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
    // Sombra leve
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

  // Modal
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
    // sombra
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
    // Sombra no botão flutuante
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 6,
  },
});
