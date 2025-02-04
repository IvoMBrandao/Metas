import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { getDatabase, ref, get } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';

const ProdutoDetalhesScreen = ({ route, navigation }) => {
  const { productId, lojaId } = route.params;
  const { user } = useAuthContext();

  const [produto, setProduto] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProdutoDetalhes();
  }, []);

  const fetchProdutoDetalhes = async () => {
    try {
      const db = getDatabase();
      const produtoRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/produtos/${productId}`);
      const snapshot = await get(produtoRef);
      if (!snapshot.exists()) {
        Alert.alert('Erro', 'Produto não encontrado no Firebase.');
        navigation.goBack();
        return;
      }
      const item = snapshot.val();
      setProduto(item);

      const entradasDoProduto = item.entradas ? [...item.entradas] : [];
      // Ordenar por data desc
      entradasDoProduto.sort((a, b) => new Date(b.data) - new Date(a.data));
      setEntradas(entradasDoProduto);

      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar detalhes do produto:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do produto.');
      navigation.goBack();
    }
  };

  const formatDate = (dataISO) => {
    if (!dataISO) return '';
    const date = new Date(dataISO);
    if (isNaN(date.getTime())) return dataISO; // se não for data ISO
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const renderEntrada = ({ item }) => (
    <View style={styles.entradaItem}>
      <Text style={styles.entradaTipo}>Entrada</Text>
      <Text style={styles.entradaDetalhes}>Quantidade: {item.quantidade} {produto.unidade}</Text>
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

  const renderHeader = () => {
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
          value={
            latestEntrada && typeof latestEntrada.valorCompra === 'number'
              ? `R$ ${latestEntrada.valorCompra.toFixed(2)}`
              : 'R$ 0.00'
          }
        />
        <DetailItem
          label="Valor de Venda:"
          value={
            latestEntrada && typeof latestEntrada.valorVenda === 'number'
              ? `R$ ${latestEntrada.valorVenda.toFixed(2)}`
              : 'R$ 0.00'
          }
        />
        <DetailItem
          label="Lucro:"
          value={
            latestEntrada && typeof latestEntrada.lucro === 'number'
              ? `R$ ${latestEntrada.lucro.toFixed(2)}`
              : 'R$ 0.00'
          }
        />
        <DetailItem
          label="Margem de Lucro:"
          value={
            latestEntrada && typeof latestEntrada.porcentagem === 'number'
              ? `${latestEntrada.porcentagem.toFixed(2)}%`
              : '0.00%'
          }
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
