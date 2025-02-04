import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { getDatabase, ref, get, set } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';

const EstoqueScreen = ({ navigation, route }) => {
  const { lojaId } = route.params || {};
  const { user } = useAuthContext();

  // 1) Se user ou lojaId for inválido, sai antes de qualquer lógica
  const userInvalido = !user || !user.uid;
  const lojaIdInvalido = !lojaId || typeof lojaId !== 'string' || lojaId.trim() === '';

  if (userInvalido || lojaIdInvalido) {
    // Renderiza apenas uma mensagem de erro e sai
    return (
      <View style={styles.containerCenter}>
        <Text style={styles.errorText}>
          Erro: Usuário não autenticado ou ID da loja não especificado.
        </Text>
      </View>
    );
  }

  const [produtos, setProdutos] = useState([]);
  const [filteredProdutos, setFilteredProdutos] = useState([]);

  const [filterType, setFilterType] = useState('nome');
  const [filterValue, setFilterValue] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [subCategoriaSelecionada, setSubCategoriaSelecionada] = useState([]);

  const [categorias, setCategorias] = useState([]);
  const [subCategoriasDaCategoria, setSubCategoriasDaCategoria] = useState([]);

  const [isCategoriaListVisible, setIsCategoriaListVisible] = useState(false);
  const [isSubCategoriaListVisible, setIsSubCategoriaListVisible] = useState(false);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      verificarOuCriarEstoque();
      fetchProdutos();
      fetchCategorias();
    }
  }, [isFocused, lojaId]);

  const verificarOuCriarEstoque = async () => {
    try {
      const db = getDatabase();
      const estoqueRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque`);

      const estoqueSnapshot = await get(estoqueRef);
      if (!estoqueSnapshot.exists()) {
        await set(estoqueRef, { produtos: {} });
        console.log(`Estoque criado para a loja ${lojaId}`);
      } else {
        console.log(`Estoque já existe para a loja ${lojaId}`);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível verificar ou criar o estoque.');
      console.error(error);
    }
  };

  const fetchProdutos = async () => {
    try {
      const db = getDatabase();
      const produtosRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/produtos`);
      const produtosSnapshot = await get(produtosRef);

      let parsedProdutos = [];
      if (produtosSnapshot.exists()) {
        const data = produtosSnapshot.val();
        parsedProdutos = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      }

      setProdutos(parsedProdutos);
      setFilteredProdutos(parsedProdutos);
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao carregar o estoque.');
      console.error('Erro ao carregar estoque:', error);
    }
  };

  const fetchCategorias = async () => {
    try {
      const db = getDatabase();
      const categoriasRef = ref(db, `users/${user.uid}/categoriasData`);
      const categoriasSnapshot = await get(categoriasRef);

      let parsedCategorias = [];
      if (categoriasSnapshot.exists()) {
        const data = categoriasSnapshot.val();
        if (Array.isArray(data)) {
          parsedCategorias = data.filter(Boolean);
        } else {
          parsedCategorias = Object.values(data);
        }
      }
      setCategorias(parsedCategorias);
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao carregar categorias.');
      console.error('Erro ao carregar categorias:', error);
    }
  };

  useEffect(() => {
    setFilterValue('');
    setCategoriaSelecionada('');
    setSubCategoriaSelecionada('');
    setSubCategoriasDaCategoria([]);
    setIsCategoriaListVisible(false);
    setIsSubCategoriaListVisible(false);

    setFilteredProdutos(produtos);
  }, [filterType, produtos]);

  const filtrarProdutos = () => {
    let filtrados = [...produtos];

    if (filterType === 'nome') {
      if (!filterValue.trim()) {
        setFilteredProdutos(produtos);
        return;
      }
      filtrados = filtrados.filter((item) =>
        item.nome?.toLowerCase().includes(filterValue.toLowerCase())
      );
    } else if (filterType === 'codigo') {
      if (!filterValue.trim()) {
        setFilteredProdutos(produtos);
        return;
      }
      filtrados = filtrados.filter((item) =>
        item.codigo?.toLowerCase().includes(filterValue.toLowerCase())
      );
    } else if (filterType === 'categoria') {
      if (!categoriaSelecionada) {
        setFilteredProdutos(produtos);
        return;
      }
      filtrados = filtrados.filter(
        (item) =>
          item.categoria?.toLowerCase() === categoriaSelecionada.toLowerCase()
      );

      if (subCategoriaSelecionada) {
        filtrados = filtrados.filter(
          (item) =>
            (item.subCategoria || '').toLowerCase() ===
            subCategoriaSelecionada.toLowerCase()
        );
      }
    }

    setFilteredProdutos(filtrados);
  };

  useEffect(() => {
    filtrarProdutos();
  }, [
    filterValue,
    categoriaSelecionada,
    subCategoriaSelecionada,
    filterType,
    produtos,
  ]);

  const handleSelectCategoria = (cat) => {
    setCategoriaSelecionada(cat.nome);
    setSubCategoriaSelecionada('');
    setSubCategoriasDaCategoria(cat.subCategorias || []);
    setIsCategoriaListVisible(false);
  };

  // Exemplo de formatar data "AAAA-MM-DD" -> "DD/MM/AAAA"
  const formatDateDMY = (dataISO) => {
    if (!dataISO || !dataISO.includes('-')) return dataISO || '';
    const [ano, mes, diaRest] = dataISO.split('-');
    const dia = diaRest.slice(0, 2);
    return `${dia}/${mes}/${ano}`;
  };

  const confirmDelete = (productId) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Você tem certeza que deseja excluir este produto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => handleDelete(productId),
        },
      ]
    );
  };

  const handleDelete = async (productId) => {
    try {
      const db = getDatabase();
      const produtoRef = ref(
        db,
        `users/${user.uid}/lojas/${lojaId}/estoque/produtos/${productId}`
      );
      await set(produtoRef, null);

      const updatedData = produtos.filter((item) => item.id !== productId);
      setProdutos(updatedData);
      setFilteredProdutos(updatedData);

      Alert.alert('Sucesso', 'Produto excluído com sucesso.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir o produto.');
      console.error(error);
    }
  };

  const renderProduto = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() =>
        navigation.navigate('ProdutoDetalhesScreen', {
          productId: item.id,
          lojaId,
        })
      }
    >
      <View>
        <Text style={styles.productName}>{item.nome}</Text>
        <Text style={styles.productDetails}>Código: {item.codigo}</Text>
        <Text style={styles.productDetails}>
          Quantidade: {item.quantidade} {item.unidade}
        </Text>
        <Text style={styles.productDetails}>
          Categoria: {item.categoria}
        </Text>
        {item.subCategoria ? (
          <Text style={styles.productDetails}>
            Subcat: {item.subCategoria}
          </Text>
        ) : null}
        <Text style={styles.productDetails}>
          Entrada: {formatDateDMY(item.dataEntrada)}
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            navigation.navigate('EditarProduto', { productId: item.id, lojaId })
          }
        >
          <Feather name="edit" size={24} color="#3A86FF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => confirmDelete(item.id)}
        >
          <Feather name="trash-2" size={24} color="#E74C3C" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estoque</Text>

      {/* Filtro */}
      <View style={styles.filterContainer}>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'nome' && styles.filterButtonSelected,
            ]}
            onPress={() => setFilterType('nome')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterType === 'nome' && styles.filterButtonTextSelected,
              ]}
            >
              Nome
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'codigo' && styles.filterButtonSelected,
            ]}
            onPress={() => setFilterType('codigo')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterType === 'codigo' && styles.filterButtonTextSelected,
              ]}
            >
              Código
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'categoria' && styles.filterButtonSelected,
            ]}
            onPress={() => setFilterType('categoria')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterType === 'categoria' &&
                  styles.filterButtonTextSelected,
              ]}
            >
              Categoria
            </Text>
          </TouchableOpacity>
        </View>

        {(filterType === 'nome' || filterType === 'codigo') && (
          <TextInput
            style={styles.searchInput}
            placeholder={
              filterType === 'nome' ? 'Buscar por Nome' : 'Buscar por Código'
            }
            value={filterValue}
            onChangeText={setFilterValue}
          />
        )}

        {filterType === 'categoria' && (
          <View>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                setIsCategoriaListVisible(!isCategoriaListVisible);
                setIsSubCategoriaListVisible(false);
              }}
            >
              <Text style={styles.dropdownButtonText}>
                {categoriaSelecionada || 'Selecionar Categoria'}
              </Text>
            </TouchableOpacity>

            {/* Lista de categorias */}
            {isCategoriaListVisible && (
              <FlatList
                style={styles.listaCategoria}
                data={categorias}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCategoriaSelecionada(item.nome);
                      setSubCategoriaSelecionada('');
                      setSubCategoriasDaCategoria(item.subCategorias || []);
                      setIsCategoriaListVisible(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item.nome}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            {categoriaSelecionada ? (
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() =>
                  setIsSubCategoriaListVisible(!isSubCategoriaListVisible)
                }
              >
                <Text style={styles.dropdownButtonText}>
                  {subCategoriaSelecionada || 'Selecionar Subcategoria'}
                </Text>
              </TouchableOpacity>
            ) : null}

            {isSubCategoriaListVisible && (
              <FlatList
                style={styles.listaCategoria}
                data={subCategoriasDaCategoria}
                keyExtractor={(sub, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSubCategoriaSelecionada(item);
                      setIsSubCategoriaListVisible(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}
      </View>

      {/* Lista de produtos filtrados */}
      <FlatList
        data={filteredProdutos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduto}
        ListEmptyComponent={
          <Text style={styles.emptyMessage}>Nenhum produto encontrado.</Text>
        }
      />

      {/* Botões de Entrada e Saída */}
      <View style={styles.shortcutContainer}>
        <TouchableOpacity
          style={styles.shortcutButton}
          onPress={() => navigation.navigate('EntradaScreen', { lojaId })}
        >
          <AntDesign name="download" size={20} color="#FFF" />
          <Text style={styles.shortcutText}>Entrada</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shortcutButton, { backgroundColor: '#E74C3C' }]}
          onPress={() => navigation.navigate('SaidaManualScreen', { lojaId })}
        >
          <AntDesign name="upload" size={20} color="#FFF" />
          <Text style={styles.shortcutText}>Saída</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EstoqueScreen;

const styles = StyleSheet.create({
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F3F9',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1F2D3D',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  filterButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#E0E0E0',
  },
  filterButtonSelected: {
    backgroundColor: '#3A86FF',
  },
  filterButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextSelected: {
    color: '#FFF',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#C5CCD0',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FAFAFA',
    fontSize: 16,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#C5CCD0',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#2D3142',
  },
  listaCategoria: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C5CCD0',
    marginBottom: 10,
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#2D3142',
  },
  productItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2D3D',
    marginBottom: 2,
  },
  productDetails: {
    fontSize: 14,
    color: '#455A64',
    marginBottom: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 10,
  },
  emptyMessage: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#7D8797',
  },
  shortcutContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 15,
  },
  shortcutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A86FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  shortcutText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
