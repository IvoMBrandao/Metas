import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Modal, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SaidaManualScreen = () => {
  const [produtos, setProdutos] = useState([]);
  const [filteredProdutos, setFilteredProdutos] = useState([]);
  const [filterValue, setFilterValue] = useState('');

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  // Dados da saída
  const [quantidadeSaida, setQuantidadeSaida] = useState('');
  const [motivoSaida, setMotivoSaida] = useState('');

  useEffect(() => {
    fetchProdutos();
  }, []);

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

  // Filtro básico
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

  const handleSelectProduto = (produto) => {
    setProdutoSelecionado(produto);
    // Zera os campos do modal
    setQuantidadeSaida('');
    setMotivoSaida('');
    setIsModalVisible(true);
  };

  const handleSalvarSaida = async () => {
    if (!quantidadeSaida) {
      Alert.alert('Erro', 'Informe a quantidade de saída.');
      return;
    }

    const qtdAtual = Number(produtoSelecionado.quantidade);
    const qtdSaida = Number(quantidadeSaida);
    if (qtdSaida > qtdAtual) {
      Alert.alert('Erro', 'A quantidade de saída não pode exceder o estoque atual.');
      return;
    }

    const novaQtd = qtdAtual - qtdSaida;
    // Atualiza o produto
    const novoProduto = {
      ...produtoSelecionado,
      quantidade: novaQtd
    };

    // Atualiza no array principal
    const index = produtos.findIndex((p) => p.id === produtoSelecionado.id);
    if (index !== -1) {
      produtos[index] = novoProduto;
    }

    await AsyncStorage.setItem('estoqueData', JSON.stringify(produtos));
    setProdutos([...produtos]);
    setFilteredProdutos([...produtos]);

    // Salva histórico de saída
    await salvarHistoricoSaida(novoProduto, qtdSaida, motivoSaida);

    Alert.alert('Sucesso', 'Saída registrada com sucesso!');
    setIsModalVisible(false);
  };

  const salvarHistoricoSaida = async (produto, qtd, motivo) => {
    try {
      const data = await AsyncStorage.getItem('movimentacoesData');
      const movs = data ? JSON.parse(data) : [];
      const novaMov = {
        id: Date.now().toString(),
        produtoId: produto.id,
        tipoMovimento: 'saida_manual',
        quantidade: qtd,
        motivo,
        data: new Date().toISOString()
      };
      movs.push(novaMov);

      await AsyncStorage.setItem('movimentacoesData', JSON.stringify(movs));
    } catch (error) {
      console.error(error);
    }
  };

  const renderProduto = ({ item }) => (
    <TouchableOpacity
      style={{ padding: 10, borderBottomWidth: 1 }}
      onPress={() => handleSelectProduto(item)}
    >
      <Text>{item.nome} ({item.codigo}) - Qtd: {item.quantidade}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 10 }}>Saída Manual</Text>

      <TextInput
        placeholder="Filtrar por nome ou código"
        value={filterValue}
        onChangeText={filtrar}
        style={{
          borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 10, marginBottom: 10
        }}
      />

      <FlatList
        data={filteredProdutos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduto}
      />

      {/* Modal de Saída */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View style={{
            backgroundColor: '#FFF',
            margin: 20,
            borderRadius: 10,
            padding: 20
          }}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Saída Manual</Text>

            <Text>Quantidade de saída:</Text>
            <TextInput
              keyboardType="numeric"
              value={quantidadeSaida}
              onChangeText={setQuantidadeSaida}
              style={{ borderWidth: 1, borderColor: '#CCC', marginBottom: 10 }}
            />

            <Text>Motivo da saída:</Text>
            <TextInput
              value={motivoSaida}
              onChangeText={setMotivoSaida}
              style={{ borderWidth: 1, borderColor: '#CCC', marginBottom: 10 }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={{ marginRight: 10, padding: 10, backgroundColor: '#CCC', borderRadius: 5 }}
                onPress={() => setIsModalVisible(false)}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 10, backgroundColor: '#3A86FF', borderRadius: 5 }}
                onPress={handleSalvarSaida}
              >
                <Text style={{ color: '#FFF' }}>Salvar</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SaidaManualScreen;
