import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RelatorioEstoqueScreen = () => {
  const [relatorio, setRelatorio] = useState([]);
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [filtroAtual, setFiltroAtual] = useState('cod');
  const [valorFiltro, setValorFiltro] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [mediaTaxa, setMediaTaxa] = useState(0);
  const [mediaDiferenca, setMediaDiferenca] = useState(0);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const dataProdutos = await AsyncStorage.getItem('estoqueData');
        const produtos = dataProdutos ? JSON.parse(dataProdutos) : [];
        setProdutos(produtos);

        const categoriasUnicas = [...new Set(produtos.map((produto) => produto.categoria).filter(Boolean))];
        setCategorias(categoriasUnicas);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        Alert.alert('Erro', 'Não foi possível carregar os produtos.');
      }
    };

    carregarDados();
  }, []);

  const formatarData = (texto) => {
    let formatado = texto.replace(/\D/g, '').slice(0, 8);
    if (formatado.length >= 5) formatado = `${formatado.slice(0, 2)}/${formatado.slice(2, 4)}/${formatado.slice(4)}`;
    else if (formatado.length >= 3) formatado = `${formatado.slice(0, 2)}/${formatado.slice(2)}`;
    return formatado;
  };

  const calcularMedia = (relatorio) => {
    const taxas = relatorio.filter((item) => item.taxaAumento !== 'N/A').map((item) => parseFloat(item.taxaAumento.replace('%', '')));
    const aumentosReais = relatorio.filter((item) => item.diferenca !== 'N/A').map((item) => parseFloat(item.diferenca.replace(/[^\d,-]/g, '').replace(',', '.')));

    const mediaTaxa = taxas.length ? (taxas.reduce((acc, val) => acc + val, 0) / taxas.length).toFixed(2) : 0;
    const mediaAumentoReal = aumentosReais.length ? (aumentosReais.reduce((acc, val) => acc + val, 0) / aumentosReais.length).toFixed(2) : 0;

    setMediaTaxa(mediaTaxa);
    setMediaDiferenca(mediaAumentoReal);
  };

  const gerarRelatorio = async () => {
    setLoading(true);
    try {
      const dataMovimentacoes = await AsyncStorage.getItem('movimentacoesData');
      const movimentacoes = dataMovimentacoes ? JSON.parse(dataMovimentacoes) : [];

      const produtoMap = produtos.reduce((acc, produto) => {
        acc[produto.id] = produto;
        return acc;
      }, {});

      const entradasValidas = movimentacoes.filter((mov) => mov.tipoMovimento === 'entrada' && mov.data && mov.valorCompra !== undefined && mov.produtoId);

      let entradasFiltradas = entradasValidas;

      if (filtroAtual === 'cod' && valorFiltro) {
        entradasFiltradas = entradasFiltradas.filter((mov) => produtoMap[mov.produtoId]?.codigo?.toLowerCase().includes(valorFiltro.toLowerCase()));
      } else if (filtroAtual === 'nome' && valorFiltro) {
        entradasFiltradas = entradasFiltradas.filter((mov) => produtoMap[mov.produtoId]?.nome?.toLowerCase().includes(valorFiltro.toLowerCase()));
      } else if (filtroAtual === 'categoria' && valorFiltro) {
        entradasFiltradas = entradasFiltradas.filter((mov) => produtoMap[mov.produtoId]?.categoria === valorFiltro);
      } else if (filtroAtual === 'data' && dataInicial && dataFinal) {
        const dataInicio = new Date(dataInicial.split('/').reverse().join('-'));
        const dataFim = new Date(dataFinal.split('/').reverse().join('-'));
        dataFim.setHours(23, 59, 59, 999);

        entradasFiltradas = entradasFiltradas.filter((mov) => {
          const dataMov = new Date(mov.data);
          return dataMov >= dataInicio && dataMov <= dataFim;
        });
      }

      const entradas = entradasFiltradas.map((mov) => ({
        data: new Date(mov.data),
        valorInicial: parseFloat(mov.valorCompra),
        produtoNome: produtoMap[mov.produtoId]?.nome || 'Produto Desconhecido',
      }));

      entradas.sort((a, b) => a.data - b.data);

      const relatorioGerado = entradas.map((entrada, index) => {
        if (index === 0) {
          return {
            data: entrada.data.toLocaleDateString('pt-BR'),
            valorInicial: entrada.valorInicial,
            produtoNome: entrada.produtoNome,
            diferenca: 'N/A',
            taxaAumento: 'N/A',
          };
        }

        const valorAnterior = entradas[index - 1].valorInicial;
        const diferenca = entrada.valorInicial - valorAnterior;
        const taxaAumento = ((diferenca / valorAnterior) * 100).toFixed(2) + '%';

        return {
          data: entrada.data.toLocaleDateString('pt-BR'),
          valorInicial: entrada.valorInicial,
          produtoNome: entrada.produtoNome,
          diferenca: diferenca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          taxaAumento,
        };
      });

      setRelatorio(relatorioGerado);
      calcularMedia(relatorioGerado);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      Alert.alert('Erro', 'Não foi possível gerar o relatório.');
    }
    setLoading(false);
  };

  const alternarFiltro = () => {
    const filtros = ['cod', 'nome', 'categoria', 'data'];
    const indexAtual = filtros.indexOf(filtroAtual);
    setFiltroAtual(filtros[(indexAtual + 1) % filtros.length]);
    setValorFiltro('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Relatório de Entradas</Text>

      <View style={styles.filterContainer}>
        {filtroAtual === 'data' ? (
          <>
            <TextInput
              placeholder="Data Inicial (DD/MM/AAAA)"
              value={dataInicial}
              onChangeText={(text) => setDataInicial(formatarData(text))}
              style={styles.filterInput}
            />
            <TextInput
              placeholder="Data Final (DD/MM/AAAA)"
              value={dataFinal}
              onChangeText={(text) => setDataFinal(formatarData(text))}
              style={styles.filterInput}
            />
          </>
        ) : (
          <TextInput
            placeholder={`Filtrar por ${
              filtroAtual === 'cod' ? 'Código' : filtroAtual === 'nome' ? 'Nome' : 'Categoria'
            }`}
            value={valorFiltro}
            onChangeText={setValorFiltro}
            style={styles.filterInput}
          />
        )}
        <TouchableOpacity style={styles.filterButton} onPress={alternarFiltro}>
          <Text style={styles.filterButtonText}>
            {filtroAtual === 'cod' ? 'Código' : filtroAtual === 'nome' ? 'Nome' : filtroAtual === 'categoria' ? 'Categoria' : 'Data'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={gerarRelatorio}>
          <Text style={styles.filterButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3A86FF" />
          <Text style={styles.loadingText}>Gerando relatório...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={relatorio}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.cell}>{item.data || 'N/A'}</Text>
                <Text style={styles.cell}>{item.produtoNome || 'N/A'}</Text>
                <Text style={styles.cell}>
                  {item.valorInicial !== undefined
                    ? item.valorInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : 'N/A'}
                </Text>
                <Text style={styles.cell}>{item.diferenca || 'N/A'}</Text>
                <Text style={styles.cell}>{item.taxaAumento || 'N/A'}</Text>
              </View>
            )}
            ListHeaderComponent={() => (
              <View style={styles.header}>
                <Text style={styles.headerCell}>Data</Text>
                <Text style={styles.headerCell}>Produto</Text>
                <Text style={styles.headerCell}>Valor Inicial</Text>
                <Text style={styles.headerCell}>Diferença</Text>
                <Text style={styles.headerCell}>Taxa de Aumento</Text>
              </View>
            )}
          />
          <View style={styles.footer}>
            <Text style={styles.footerText}>Média da Taxa de Aumento: {mediaTaxa}%</Text>
            <Text style={styles.footerText}>
              Média do Aumento em Reais: R$ {mediaDiferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F5F8',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2D3D',
    textAlign: 'center',
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  filterButton: {
    backgroundColor: '#3A86FF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  filterButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingBottom: 5,
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2D3D',
    textAlign: 'center',
  },
  footer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#E5E5E5',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default RelatorioEstoqueScreen;
