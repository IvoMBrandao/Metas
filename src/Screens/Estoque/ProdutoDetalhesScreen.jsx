import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProdutoDetalhesScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [produto, setProduto] = useState(null);

  useEffect(() => {
    fetchProduto();
  }, []);

  /**
   * Carrega o produto específico do AsyncStorage
   */
  const fetchProduto = async () => {
    try {
      const savedData = await AsyncStorage.getItem('estoqueData');
      const produtos = savedData ? JSON.parse(savedData) : [];

      const item = produtos.find((p) => p.id === productId);
      if (item) {
        setProduto(item);
      } else {
        Alert.alert('Erro', 'Produto não encontrado.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do produto.');
      navigation.goBack();
    }
  };

  /**
   * Formata a data "AAAA-MM-DD" -> "DD/MM/AAAA"
   */
  const formatDateDMY = (dataISO) => {
    if (!dataISO || !dataISO.includes('-')) return dataISO || '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  if (!produto) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Detalhes do Produto</Text>

      {/* Card com as informações */}
      <View style={styles.card}>
        <DetailItem label="Nome:" value={produto.nome} />
        <DetailItem label="Código:" value={produto.codigo} />
        <DetailItem
          label="Quantidade:"
          value={`${produto.quantidade} ${produto.unidade}`}
        />
        <DetailItem label="Categoria:" value={produto.categoria} />

        {produto.subCategoria ? (
          <DetailItem label="Subcat:" value={produto.subCategoria} />
        ) : null}

        <DetailItem
          label="Data de Entrada:"
          value={formatDateDMY(produto.dataEntrada)}
        />
        <DetailItem label="Valor de Compra:" value={`R$ ${produto.valorCompra}`} />
        <DetailItem label="Valor de Venda:" value={`R$ ${produto.valorVenda}`} />
        <DetailItem label="Lucro:" value={`R$ ${produto.lucro}`} />
        <DetailItem
          label="Margem de Lucro:"
          value={`${produto.porcentagem}%`}
        />
      </View>
    </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: '#F0F3F9',
    paddingHorizontal: 20,
    paddingTop: 20,
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2D3D',
    marginBottom: 20,
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

});
