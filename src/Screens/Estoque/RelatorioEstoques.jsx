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
import { getDatabase, ref, get } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';

const RelatorioEstoqueScreen = ({ route }) => {
  // Se precisar de lojaId, receba em route.params. Se não, remova.
  const { lojaId } = route.params || {};
  const { user } = useAuthContext();

  const [relatorio, setRelatorio] = useState([]);
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [filtroAtual, setFiltroAtual] = useState('cod');
  const [valorFiltro, setValorFiltro] = useState('');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [mediaTaxa, setMediaTaxa] = useState(0);
  const [mediaDiferenca, setMediaDiferenca] = useState(0);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      const db = getDatabase();
      // Carregamos todos produtos (se for uma loja específica, use /lojaId/estoque/produtos).
      const produtosRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/produtos`);
      const snap = await get(produtosRef);
      if (snap.exists()) {
        const data = snap.val();
        const arr = Object.keys(data).map((key) => data[key]);
        setProdutos(arr);
      } else {
        setProdutos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos do Firebase.');
    }
  };

  const formatarData = (texto) => {
    let formatado = texto.replace(/\D/g, '').slice(0, 8);
    if (formatado.length >= 5) {
      formatado = `${formatado.slice(0, 2)}/${formatado.slice(2, 4)}/${formatado.slice(4)}`;
    } else if (formatado.length >= 3) {
      formatado = `${formatado.slice(0, 2)}/${formatado.slice(2)}`;
    }
    return formatado;
  };

  const calcularMedia = (dados) => {
    const taxas = dados
      .filter((item) => item.taxaAumento !== 'N/A')
      .map((item) => parseFloat(item.taxaAumento.replace('%', '')));
    const aumentosReais = dados
      .filter((item) => item.diferenca !== 'N/A')
      .map((item) =>
        parseFloat(
          item.diferenca.replace(/[^\d,-]/g, '').replace(',', '.')
        )
      );

    const mediaT = taxas.length
      ? (taxas.reduce((acc, val) => acc + val, 0) / taxas.length).toFixed(2)
      : 0;
    const mediaA = aumentosReais.length
      ? (aumentosReais.reduce((acc, val) => acc + val, 0) / aumentosReais.length).toFixed(2)
      : 0;

    setMediaTaxa(mediaT);
    setMediaDiferenca(mediaA);
  };

  const gerarRelatorio = async () => {
    setLoading(true);
    try {
      const db = getDatabase();
      const movRef = ref(db, `users/${user.uid}/movimentacoesData`);
      const movSnap = await get(movRef);
      if (!movSnap.exists()) {
        Alert.alert('Atenção', 'Não há movimentações registradas.');
        setRelatorio([]);
        setLoading(false);
        return;
      }
      const movimentacoes = Object.keys(movSnap.val()).map((key) => movSnap.val()[key]);

      // criar um mapa de produtoId -> produto
      const produtoMap = {};
      produtos.forEach((prod) => {
        produtoMap[prod.id] = prod;
      });

      // Filtramos somente entradas com data e valorCompra
      let entradasValidas = movimentacoes.filter(
        (mov) => mov.tipoMovimento === 'entrada' && mov.data && mov.valorCompra !== undefined
      );

      // Aplica filtros
      if (filtroAtual === 'cod' && valorFiltro) {
        entradasValidas = entradasValidas.filter((mov) => {
          const prod = produtoMap[mov.produtoId];
          return prod?.codigo?.toLowerCase().includes(valorFiltro.toLowerCase());
        });
      } else if (filtroAtual === 'nome' && valorFiltro) {
        entradasValidas = entradasValidas.filter((mov) => {
          const prod = produtoMap[mov.produtoId];
          return prod?.nome?.toLowerCase().includes(valorFiltro.toLowerCase());
        });
      } else if (filtroAtual === 'categoria' && valorFiltro) {
        entradasValidas = entradasValidas.filter((mov) => {
          const prod = produtoMap[mov.produtoId];
          return prod?.categoria === valorFiltro;
        });
      } else if (filtroAtual === 'data' && dataInicial && dataFinal) {
        const [diaI, mesI, anoI] = dataInicial.split('/');
        const [diaF, mesF, anoF] = dataFinal.split('/');
        const dataIni = new Date(+anoI, mesI - 1, +diaI);
        const dataFim = new Date(+anoF, mesF - 1, +diaF);
        dataFim.setHours(23, 59, 59, 999);

        entradasValidas = entradasValidas.filter((mov) => {
          const dataMov = new Date(mov.data);
          return dataMov >= dataIni && dataMov <= dataFim;
        });
      }

      const entradas = entradasValidas.map((mov) => {
        return {
          data: new Date(mov.data),
          valorInicial: parseFloat(mov.valorCompra),
          produtoNome: produtoMap[mov.produtoId]?.nome || 'Produto Desconhecido',
        };
      });

      // Ordena
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
          diferenca: diferenca.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
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
              filtroAtual === 'cod'
                ? 'Código'
                : filtroAtual === 'nome'
                ? 'Nome'
                : 'Categoria'
            }`}
            value={valorFiltro}
            onChangeText={setValorFiltro}
            style={styles.filterInput}
          />
        )}
        <TouchableOpacity style={styles.filterButton} onPress={alternarFiltro}>
          <Text style={styles.filterButtonText}>
            {filtroAtual === 'cod'
              ? 'Código'
              : filtroAtual === 'nome'
              ? 'Nome'
              : filtroAtual === 'categoria'
              ? 'Categoria'
              : 'Data'}
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
            keyExtractor={(_item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.cell}>{item.data || 'N/A'}</Text>
                <Text style={styles.cell}>{item.produtoNome || 'N/A'}</Text>
                <Text style={styles.cell}>
                  {item.valorInicial !== undefined
                    ? item.valorInicial.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
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
            <Text style={styles.footerText}>
              Média da Taxa de Aumento: {mediaTaxa}%
            </Text>
            <Text style={styles.footerText}>
              Média do Aumento em Reais: R${' '}
              {Number(mediaDiferenca).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

export default RelatorioEstoqueScreen;

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
