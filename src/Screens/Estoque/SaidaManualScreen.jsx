import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Modal, Alert, StyleSheet
} from 'react-native';
import { getDatabase, ref, get, update, push } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';

const SaidaManualScreen = ({ route }) => {
  const { lojaId } = route.params;
  const { user } = useAuthContext();

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
    setQuantidadeSaida('');
    setMotivoSaida('');
    setIsModalVisible(true);
  };

  const handleSalvarSaida = async () => {
    if (!quantidadeSaida) {
      Alert.alert('Erro', 'Informe a quantidade de saída.');
      return;
    }

    const qtdAtual = Number(produtoSelecionado.quantidade) || 0;
    const qtdSaida = Number(quantidadeSaida);
    if (qtdSaida > qtdAtual) {
      Alert.alert('Erro', 'A quantidade de saída não pode exceder o estoque atual.');
      return;
    }

    const novaQtd = qtdAtual - qtdSaida;
    const novoProduto = {
      ...produtoSelecionado,
      quantidade: novaQtd
    };

    try {
      // 1. Atualiza produto
      const db = getDatabase();
      const produtoRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/produtos/${produtoSelecionado.id}`);
      await update(produtoRef, novoProduto);

      // 2. Salva histórico de saída
      const movRef = ref(db, `users/${user.uid}/movimentacoesData`);
      const novaMovRef = push(movRef);
      const novaMov = {
        id: novaMovRef.key,
        produtoId: produtoSelecionado.id,
        tipoMovimento: 'saida_manual',
        quantidade: qtdSaida,
        motivo: motivoSaida,
        data: new Date().toISOString()
      };
      await update(novaMovRef, novaMov);

      Alert.alert('Sucesso', 'Saída registrada com sucesso!');
      setIsModalVisible(false);
      fetchProdutos();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível registrar a saída no Firebase.');
    }
  };

  const renderProduto = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleSelectProduto(item)}
    >
      <Text>{item.nome} ({item.codigo}) - Qtd: {item.quantidade}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saída Manual</Text>

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
      />

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Saída Manual</Text>

            <Text>Quantidade de saída:</Text>
            <TextInput
              keyboardType="numeric"
              value={quantidadeSaida}
              onChangeText={setQuantidadeSaida}
              style={styles.modalInput}
            />

            <Text>Motivo da saída:</Text>
            <TextInput
              value={motivoSaida}
              onChangeText={setMotivoSaida}
              style={styles.modalInput}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.buttonModal, { backgroundColor: '#CCC' }]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttonModal, { backgroundColor: '#3A86FF' }]}
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FFF' },
  title: { fontSize: 24, marginBottom: 10 },
  searchInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  itemContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    margin: 20,
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 5,
    marginBottom: 10,
    padding: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  buttonModal: {
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
});
