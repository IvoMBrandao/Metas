// ProdutoDetalhesScreen.jsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProdutoDetalhesScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [produto, setProduto] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProdutoDetalhes();
  }, []);

  /**
   * Carrega o produto específico e suas entradas do AsyncStorage
   */
  const fetchProdutoDetalhes = async () => {
    try {
      // Carrega produtos do estoque
      const savedData = await AsyncStorage.getItem('estoqueData');
      const produtos = savedData ? JSON.parse(savedData) : [];

      const item = produtos.find((p) => p.id === productId);
      if (item) {
        setProduto(item);
        // Obtém as entradas diretamente do produto
        const entradasDoProduto = item.entradas ? item.entradas : [];
        // Ordena as entradas por data (mais recentes primeiro)
        entradasDoProduto.sort((a, b) => new Date(b.data) - new Date(a.data));
        setEntradas(entradasDoProduto);
      } else {
        Alert.alert('Erro', 'Produto não encontrado.');
        navigation.goBack();
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar detalhes do produto:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do produto.');
      navigation.goBack();
    }
  };

  /**
   * Formata uma string de data ISO para "DD/MM/YYYY"
   * @param {string} dataISO - Data no formato ISO (e.g., "2023-10-21T15:30:45.000Z")
   * @returns {string} - Data formatada (e.g., "21/10/2023")
   */
  const formatDate = (dataISO) => {
    if (!dataISO) return '';

    const date = new Date(dataISO);

    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0'); // Janeiro é 0
    const ano = date.getFullYear();

    return `${dia}/${mes}/${ano}`;
  };

  /**
   * Renderiza cada entrada na lista de histórico
   */
  const renderEntrada = ({ item }) => (
    <View style={styles.entradaItem}>
      <Text style={styles.entradaTipo}>Entrada</Text>
      <Text style={styles.entradaDetalhes}>
        Quantidade: {item.quantidade} {produto.unidade}
      </Text>
      <Text style={styles.entradaDetalhes}>
        Valor de Compra: R$ {typeof item.valorCompra === 'number' ? item.valorCompra.toFixed(2) : '0.00'}
      </Text>
      <Text style={styles.entradaDetalhes}>
        Porcentagem de Lucro: {typeof item.porcentagem === 'number' ? item.porcentagem.toFixed(2) : '0.00'}%
      </Text>
      <Text style={styles.entradaDetalhes}>
        Valor de Venda: R$ {typeof item.valorVenda === 'number' ? item.valorVenda.toFixed(2) : '0.00'}
      </Text>
      <Text style={styles.entradaData}>
        Data: {formatDate(item.data)}
      </Text>
    </View>
  );

  /**
   * Renderiza o cabeçalho da lista com os detalhes do produto
   */
  const renderHeader = () => {
    // Obter a última entrada para exibir detalhes atualizados
    const latestEntrada = entradas.length > 0 ? entradas[0] : null;

    return (
      <View style={styles.card}>
        <DetailItem label="Nome:" value={produto.nome} />
        <DetailItem label="Código:" value={produto.codigo} />
        <DetailItem
          label="Quantidade:"
          value={`${produto.quantidade} ${produto.unidade}`}
        />
        <DetailItem label="Categoria:" value={produto.categoria} />

        {produto.subCategoria ? (
          <DetailItem label="Subcategoria:" value={produto.subCategoria} />
        ) : null}

        <DetailItem
          label="Data de Entrada:"
          value={latestEntrada ? formatDate(latestEntrada.data) : 'N/A'}
        />
        <DetailItem
          label="Valor de Compra:"
          value={`R$ ${
            latestEntrada && typeof latestEntrada.valorCompra === 'number'
              ? latestEntrada.valorCompra.toFixed(2)
              : '0.00'
          }`}
        />
        <DetailItem
          label="Valor de Venda:"
          value={`R$ ${
            latestEntrada && typeof latestEntrada.valorVenda === 'number'
              ? latestEntrada.valorVenda.toFixed(2)
              : '0.00'
          }`}
        />
        <DetailItem
          label="Lucro:"
          value={`R$ ${
            latestEntrada && typeof latestEntrada.lucro === 'number'
              ? latestEntrada.lucro.toFixed(2)
              : '0.00'
          }`}
        />
        <DetailItem
          label="Margem de Lucro:"
          value={`${
            latestEntrada && typeof latestEntrada.porcentagem === 'number'
              ? latestEntrada.porcentagem.toFixed(2)
              : '0.00'
          }%`}
        />
        <Text style={styles.entradasTitle}>Histórico de Entradas</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3A86FF" />
        <Text style={styles.loadingText}>Carregando detalhes do produto...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={entradas}
      keyExtractor={(item) => item.id}
      renderItem={renderEntrada}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.flatListContent}
      ListEmptyComponent={
        <Text style={styles.semEntradas}>
          Nenhuma entrada registrada para este produto.
        </Text>
      }
    />
  );
};

/**
 * Componente para exibir label + value em linha
 */
const DetailItem = ({ label, value }) => (
  <View style={styles.detailLine}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

export default ProdutoDetalhesScreen;

const styles = StyleSheet.create({
  flatListContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#F0F3F9',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F0F3F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 15,
    // Sombra leve para dar aspecto de card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 15,
  },
  detailLine: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    width: 140,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  detailValue: {
    flex: 1,
    fontSize: 15,
    color: '#555',
  },
  entradasTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2D3D',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  entradaItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    // Sombra leve
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entradaTipo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3A86FF',
    marginBottom: 5,
  },
  entradaDetalhes: {
    fontSize: 14,
    color: '#2D3142',
  },
  entradaData: {
    fontSize: 14,
    color: '#2D3142',
    marginTop: 5,
  },
  semEntradas: {
    fontSize: 16,
    color: '#777777',
    textAlign: 'center',
    marginTop: 20,
  },
});
