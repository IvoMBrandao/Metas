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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { AntDesign, Feather } from '@expo/vector-icons';

 const EstoqueScreen = ({ navigation }) => {
  const [produtos, setProdutos] = useState([]);
  const [filteredProdutos, setFilteredProdutos] = useState([]);

  // Estados do filtro
  const [filterType, setFilterType] = useState('nome'); // "nome", "codigo", "categoria"
  const [filterValue, setFilterValue] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [subCategoriaSelecionada, setSubCategoriaSelecionada] = useState([]);

  // Lista de categorias e subcategorias
  const [categorias, setCategorias] = useState([]);
  const [subCategoriasDaCategoria, setSubCategoriasDaCategoria] = useState([]);

  // Flags de visibilidade das listas
  const [isCategoriaListVisible, setIsCategoriaListVisible] = useState(false);
  const [isSubCategoriaListVisible, setIsSubCategoriaListVisible] = useState(false);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchProdutos();
      fetchCategorias();
    }
  }, [isFocused]);

  /**
   * Carrega os produtos do AsyncStorage
   */
  const fetchProdutos = async () => {
    try {
      const savedData = await AsyncStorage.getItem('estoqueData');
      const parsedData = savedData ? JSON.parse(savedData) : [];
      setProdutos(parsedData);
      setFilteredProdutos(parsedData);
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao carregar o estoque.');
      console.error('Erro ao carregar estoque:', error);
    }
  };

  /**
   * Carrega as categorias
   */
  const fetchCategorias = async () => {
    try {
      const savedCategorias = await AsyncStorage.getItem('categoriasData');
      const parsedCategorias = savedCategorias ? JSON.parse(savedCategorias) : [];
      setCategorias(parsedCategorias);
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao carregar categorias.');
      console.error('Erro ao carregar categorias:', error);
    }
  };

  /**
   * Quando trocar o filterType, limpamos o filtro e resetamos a lista
   */
  useEffect(() => {
    setFilterValue('');
    setCategoriaSelecionada('');
    setSubCategoriaSelecionada('');
    setSubCategoriasDaCategoria([]);
    setIsCategoriaListVisible(false);
    setIsSubCategoriaListVisible(false);

    setFilteredProdutos(produtos); // Volta a lista original
  }, [filterType]);

  /**
   * Filtra a lista de produtos
   */
  const filtrarProdutos = () => {
    let filtrados = [...produtos];

    if (filterType === 'nome') {
      // Filtro por nome
      if (!filterValue.trim()) {
        setFilteredProdutos(produtos);
        return;
      }
      filtrados = filtrados.filter((item) =>
        item.nome?.toLowerCase().includes(filterValue.toLowerCase())
      );
    } else if (filterType === 'codigo') {
      // Filtro por código
      if (!filterValue.trim()) {
        setFilteredProdutos(produtos);
        return;
      }
      filtrados = filtrados.filter((item) =>
        item.codigo?.toLowerCase().includes(filterValue.toLowerCase())
      );
    } else if (filterType === 'categoria') {
      // Filtro por categoria
      if (!categoriaSelecionada) {
        setFilteredProdutos(produtos);
        return;
      }
      filtrados = filtrados.filter(
        (item) =>
          item.categoria?.toLowerCase() === categoriaSelecionada.toLowerCase()
      );

      // Se também tiver subcategoria
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

  // Sempre que algo mudar (filterValue, etc.), chamamos filtrarProdutos
  useEffect(() => {
    filtrarProdutos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filterValue,
    categoriaSelecionada,
    subCategoriaSelecionada,
    filterType,
    produtos,
  ]);

  /**
   * Seleciona a categoria e carrega subcategorias
   */
  const handleSelectCategoria = (cat) => {
    setCategoriaSelecionada(cat.nome);
    setSubCategoriaSelecionada('');
    setSubCategoriasDaCategoria(cat.subCategorias || []);
    setIsCategoriaListVisible(false);
  };

  /**
   * Formata data "AAAA-MM-DD" -> "DD/MM/AAAA"
   */
  const formatDateDMY = (dataISO) => {
    if (!dataISO || !dataISO.includes('-')) return dataISO || '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  /**
   * Pergunta se o usuário realmente quer excluir o produto
   */
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

  /**
   * Exclui um produto do AsyncStorage
   */
  const handleDelete = async (productId) => {
    try {
      const updatedData = produtos.filter((item) => item.id !== productId);
      await AsyncStorage.setItem('estoqueData', JSON.stringify(updatedData));
      setProdutos(updatedData);
      setFilteredProdutos(updatedData);
      Alert.alert('Sucesso', 'Produto excluído com sucesso.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir o produto.');
    }
  };

  /**
   * Renderiza cada produto na lista
   */
  const renderProduto = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      // Ao clicar em qualquer parte do card do produto, vamos à tela de detalhes
      onPress={() => navigation.navigate('ProdutoDetalhesScreen', { productId: item.id })}
    >
      <View>
        <Text style={styles.productName}>{item.nome}</Text>
        <Text style={styles.productDetails}>Código: {item.codigo}</Text>
        <Text style={styles.productDetails}>
          Quantidade: {item.quantidade} {item.unidade}
        </Text>
        <Text style={styles.productDetails}>Categoria: {item.categoria}</Text>
        {item.subCategoria ? (
          <Text style={styles.productDetails}>Subcat: {item.subCategoria}</Text>
        ) : null}

        {/* Converte data no momento de exibir */}
        <Text style={styles.productDetails}>
          Entrada: {formatDateDMY(item.dataEntrada)}
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            navigation.navigate('EditarProduto', { productId: item.id })
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

      {/* Secção de filtros */}
      <View style={styles.filterContainer}>
        {/* Botões de tipo de filtro */}
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
                filterType === 'categoria' && styles.filterButtonTextSelected,
              ]}
            >
              Categoria
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filtro por nome ou código */}
        {(filterType === 'nome' || filterType === 'codigo') && (
          <TextInput
            style={styles.searchInput}
            placeholder={
              filterType === 'nome'
                ? 'Buscar por Nome'
                : 'Buscar por Código'
            }
            value={filterValue}
            onChangeText={setFilterValue}
          />
        )}

        {/* Filtro por Categoria/Subcategoria */}
        {filterType === 'categoria' && (
          <View>
            {/* Selecionar Categoria */}
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

            {isCategoriaListVisible && (
              <FlatList
                style={styles.listaCategoria}
                data={categorias}
                keyExtractor={(item) => item.nome}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleSelectCategoria(item)}
                  >
                    <Text style={styles.dropdownItemText}>{item.nome}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Selecionar Subcategoria */}
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

      {/* Lista de Produtos */}
      <FlatList
        data={filteredProdutos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduto}
        ListEmptyComponent={
          <Text style={styles.emptyMessage}>Nenhum produto encontrado.</Text>
        }
      />

      {/* ---------- ATALHOS PARA ENTRADA E SAÍDA ---------- */}
      <View style={styles.shortcutContainer}>
        <TouchableOpacity
          style={styles.shortcutButton}
          // Ajuste o nome da rota de acordo com seu Navigator
          onPress={() => navigation.navigate('EntradaScreen')}
        >
          <Feather name="download" size={20} color="#FFF" />
          <Text style={styles.shortcutText}>Entrada</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shortcutButton, { backgroundColor: '#E74C3C' }]}
          // Ajuste o nome da rota de acordo com seu Navigator
          onPress={() => navigation.navigate('SaidaManualScreen')}
        >
          <Feather name="upload" size={20} color="#FFF" />
          <Text style={styles.shortcutText}>Saída</Text>
        </TouchableOpacity>
      </View>
    
    </View>
  );
};

export default EstoqueScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F3F9', // um cinza-azulado claro
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
    // Sombra leve
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
    maxHeight: 150, // Limite de altura
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
    // Sombra leve
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
 

  // ------ ESTILOS DOS BOTÕES DE ATALHO (ENTRADA/SAÍDA) ------
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
