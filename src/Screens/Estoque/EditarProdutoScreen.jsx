import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditarProdutoScreen = ({ route, navigation }) => {
  const { productId } = route.params; // Recebe o ID do produto a ser editado

  // Dados do produto que será editado
  const [produto, setProduto] = useState(null);

  // Estados do formulário
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [categoria, setCategoria] = useState('');
  const [subCategoria, setSubCategoria] = useState('');
  const [dataEntrada, setDataEntrada] = useState('');
  const [unidade, setUnidade] = useState('');
  const [valorCompra, setValorCompra] = useState('');
  const [porcentagem, setPorcentagem] = useState('');
  const [valorVenda, setValorVenda] = useState('');
  const [lucro, setLucro] = useState('');
  const [fornecedor, setFornecedor] = useState(''); // Novo Campo

  // Para exibir dropdown de categorias e subcategorias
  const [categorias, setCategorias] = useState([]);
  const [subCategorias, setSubCategorias] = useState([]);
  const [isCategoriaDropdownVisible, setIsCategoriaDropdownVisible] = useState(false);
  const [isSubCategoriaDropdownVisible, setIsSubCategoriaDropdownVisible] = useState(false);

  useEffect(() => {
    // 1. Carregar dados do produto
    fetchProduto();

    // 2. Carregar categorias do AsyncStorage
    loadCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Carrega o produto específico do AsyncStorage pelo ID (productId).
   */
  const fetchProduto = async () => {
    try {
      const savedData = await AsyncStorage.getItem('estoqueData');
      const produtos = savedData ? JSON.parse(savedData) : [];
      const item = produtos.find((p) => p.id === productId);

      if (item) {
        setProduto(item);
        // Preenche os states do formulário
        setNome(item.nome);
        setCodigo(item.codigo);
        setQuantidade(item.quantidade?.toString() || '');
        setCategoria(item.categoria);
        setSubCategoria(item.subCategoria || '');
        setDataEntrada(formatarDataParaInput(item.dataEntrada)); // "AAAA-MM-DD" -> "DD/MM/AAAA"
        setUnidade(item.unidade);
        setValorCompra(item.valorCompra);
        setPorcentagem(item.porcentagem);
        setValorVenda(item.valorVenda);
        setLucro(item.lucro);
        setFornecedor(item.fornecedor || ''); // Preenche o fornecedor se existir
      } else {
        Alert.alert('Erro', 'Produto não encontrado.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao buscar o produto.');
    }
  };

  /**
   * Carrega as categorias (e subcategorias) do AsyncStorage
   */
  const loadCategorias = async () => {
    try {
      const savedCategorias = await AsyncStorage.getItem('categoriasData');
      const parsedCategorias = savedCategorias ? JSON.parse(savedCategorias) : [];
      setCategorias(parsedCategorias);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  /**
   * Seleciona uma categoria e mostra subcategorias
   */
  const handleCategoriaSelect = (selectedCategoria) => {
    setCategoria(selectedCategoria.nome);
    setSubCategorias(selectedCategoria.subCategorias || []);
    setSubCategoria(''); // Limpar subcategoria ao trocar de categoria
    setIsCategoriaDropdownVisible(false);
  };

  /**
   * Seleciona uma subcategoria
   */
  const handleSubCategoriaSelect = (selectedSubCategoria) => {
    setSubCategoria(selectedSubCategoria);
    setIsSubCategoriaDropdownVisible(false);
  };

  /**
   * Formatar data "AAAA-MM-DD" -> "DD/MM/AAAA" para exibir no input
   */
  const formatarDataParaInput = (data) => {
    if (data && data.includes('-')) {
      const [ano, mes, dia] = data.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    return data || '';
  };

  /**
   * Formatar data "DD/MM/AAAA" -> "AAAA-MM-DD" para salvar
   */
  const formatarDataParaSalvar = (data) => {
    const [dia, mes, ano] = data.split('/');
    if (dia && mes && ano) {
      return `${ano}-${mes}-${dia}`;
    }
    return data;
  };

  /**
   * Máscara de data em tempo real: DD/MM/AAAA
   */
  const handleDataChange = (text) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 2) {
      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length > 5) {
      cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
    }
    if (cleaned.length > 10) {
      cleaned = cleaned.slice(0, 10);
    }
    setDataEntrada(cleaned);
  };

  /**
   * Formata para número com 2 casas decimais
   */
  const formatNumber = (value) => {
    if (!isNaN(parseFloat(value))) {
      return parseFloat(value).toFixed(2);
    }
    return '';
  };

  /**
   * Cálculo: valorVenda = valorCompra + (valorCompra * porcentagem / 100)
   */
  const calculateFromCompraAndPorcentagem = () => {
    const compraNumber = parseFloat(valorCompra);
    const porcentNumber = parseFloat(porcentagem);

    if (!isNaN(compraNumber) && !isNaN(porcentNumber)) {
      const vendaCalculada = compraNumber + (compraNumber * porcentNumber) / 100;
      setValorVenda(vendaCalculada.toFixed(2));

      const lucroCalculado = vendaCalculada - compraNumber;
      setLucro(lucroCalculado.toFixed(2));
    }
  };

  /**
   * Cálculo: porcentagem = ((valorVenda - valorCompra)/valorCompra) * 100
   */
  const calculateFromCompraAndVenda = () => {
    const compraNumber = parseFloat(valorCompra);
    const vendaNumber = parseFloat(valorVenda);

    if (!isNaN(compraNumber) && !isNaN(vendaNumber) && compraNumber !== 0) {
      const porcentagemCalculada = ((vendaNumber - compraNumber) / compraNumber) * 100;
      setPorcentagem(porcentagemCalculada.toFixed(2));

      const lucroCalculado = vendaNumber - compraNumber;
      setLucro(lucroCalculado.toFixed(2));
    }
  };

  /**
   * Se o usuário sai do campo Valor de Compra, mantemos a mesma % se ela existir;
   * caso não haja %, mas tenha Valor de Venda, recalculamos a %; caso contrário, nada.
   */
  const handleValorCompraEndEditing = () => {
    const compraNumber = parseFloat(valorCompra);
    if (isNaN(compraNumber)) return; // se o usuário digitou nada ou algo inválido

    if (!isNaN(parseFloat(porcentagem)) && parseFloat(porcentagem) !== 0) {
      // Se já houver uma porcentagem
      calculateFromCompraAndPorcentagem();
    } else if (!isNaN(parseFloat(valorVenda)) && parseFloat(valorVenda) !== 0) {
      // Se não houver porcentagem mas houver valor de venda
      calculateFromCompraAndVenda();
    }
    // Caso contrário, não faz nada
  };

  /**
   * Salva as alterações no AsyncStorage
   */
  const handleSave = async () => {
    // Validação dos campos obrigatórios
    if (
      !nome ||
      !codigo ||
      !categoria ||
      !dataEntrada ||
      !unidade ||
      !valorCompra ||
      !valorVenda ||
      !fornecedor // Verifica também o novo campo
    ) {
      Alert.alert('Erro', 'Preencha todos os campos!');
      return;
    }

    try {
      const savedData = await AsyncStorage.getItem('estoqueData');
      const produtos = savedData ? JSON.parse(savedData) : [];

      // Verificar se o código já existe em outro produto
      const existe = produtos.find((prod) => prod.codigo === codigo && prod.id !== productId);
      if (existe) {
        Alert.alert('Erro', 'Já existe um produto com este código. Por favor, insira um código único.');
        return;
      }

      // Converte data "DD/MM/AAAA" em "AAAA-MM-DD" (opcional)
      let dataFormatada = dataEntrada;
      const [dia, mes, ano] = dataEntrada.split('/');
      if (dia && mes && ano) {
        const dataObj = new Date(+ano, mes - 1, +dia);
        if (isNaN(dataObj)) {
          Alert.alert('Erro', 'Data de entrada inválida.');
          return;
        }
        dataFormatada = dataObj.toISOString().split('T')[0];
      }

      const produtoAtualizado = {
        id: produto.id,
        nome,
        codigo,
        quantidade: produto.quantidade, // Manter a quantidade original
        categoria,
        subCategoria,
        dataEntrada: dataFormatada,
        unidade,
        valorCompra: parseFloat(valorCompra).toFixed(2),
        porcentagem: parseFloat(porcentagem).toFixed(2),
        valorVenda: parseFloat(valorVenda).toFixed(2),
        lucro: parseFloat(lucro).toFixed(2),
        fornecedor, // Adiciona o novo campo
      };

      // Substitui o produto no array
      const updatedProdutos = produtos.map((p) =>
        p.id === produto.id ? produtoAtualizado : p
      );

      // Persiste no AsyncStorage
      await AsyncStorage.setItem('estoqueData', JSON.stringify(updatedProdutos));

      Alert.alert('Sucesso', 'Produto atualizado com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o produto.');
      console.error('Erro ao atualizar produto:', error);
    }
  };

  if (!produto) {
    // Enquanto o produto não estiver carregado, pode exibir algo como:
    return (
      <View style={styles.container}>
        <Text>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.title}>Editar Produto</Text>

        {/* Nome */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Nome do Produto</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do Produto"
            value={nome}
            onChangeText={setNome}
          />
        </View>

        {/* Código */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Código</Text>
          <TextInput
            style={styles.input}
            placeholder="Código"
            value={codigo}
            onChangeText={setCodigo}
          />
        </View>

        {/* Quantidade (Desativado) */}
        <View style={styles.disabledInputContainer}>
          <Text style={styles.label}>Quantidade</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="Quantidade"
            value={quantidade}
            editable={false} // Desativa a edição
            selectTextOnFocus={false} // Não permite seleção de texto
          />
        </View>

        {/* Selecionar Categoria */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.dropdown, styles.fullWidthDropdown]}
              onPress={() => setIsCategoriaDropdownVisible(!isCategoriaDropdownVisible)}
            >
              <Text style={styles.dropdownText}>
                {categoria || 'Selecionar Categoria'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('GerenciarCategoriasScreen')}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isCategoriaDropdownVisible && (
          <View style={styles.dropdownContainer}>
            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat.nome}
                style={styles.dropdownItem}
                onPress={() => {
                  handleCategoriaSelect(cat);
                }}
              >
                <Text style={styles.dropdownItemText}>{cat.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Se a categoria tem subcategorias, exibe dropdown */}
        {subCategorias.length > 0 && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Subcategoria</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() =>
                setIsSubCategoriaDropdownVisible(!isSubCategoriaDropdownVisible)
              }
            >
              <Text style={styles.dropdownText}>
                {subCategoria || 'Selecionar Subcategoria'}
              </Text>
            </TouchableOpacity>
            {isSubCategoriaDropdownVisible && (
              <View style={styles.dropdownContainer}>
                {subCategorias.map((sub, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => handleSubCategoriaSelect(sub)}
                  >
                    <Text style={styles.dropdownItemText}>{sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Data de Entrada (DD/MM/AAAA) */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Data de Entrada</Text>
          <TextInput
            style={styles.input}
            placeholder="Data de Entrada (DD/MM/AAAA)"
            value={dataEntrada}
            keyboardType="numeric"
            maxLength={10}
            onChangeText={handleDataChange}
          />
        </View>

        {/* Unidade */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Unidade de Medida</Text>
          <TextInput
            style={styles.input}
            placeholder="Unidade de Medida"
            value={unidade}
            onChangeText={setUnidade}
          />
        </View>

        {/* Valor de Compra */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Valor de Compra</Text>
          <TextInput
            style={styles.input}
            placeholder="Valor de Compra"
            value={valorCompra}
            onChangeText={(text) => setValorCompra(text.replace(',', '.'))}
            keyboardType="numeric"
            onEndEditing={handleValorCompraEndEditing}
          />
        </View>

        {/* % Margem de Lucro */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>% Margem de Lucro</Text>
          <TextInput
            style={styles.input}
            placeholder="% Margem de Lucro"
            value={porcentagem}
            onChangeText={(text) => setPorcentagem(text.replace(',', '.'))}
            keyboardType="numeric"
            onEndEditing={calculateFromCompraAndPorcentagem}
          />
        </View>

        {/* Valor de Venda */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Valor de Venda</Text>
          <TextInput
            style={styles.input}
            placeholder="Valor de Venda"
            value={valorVenda}
            onChangeText={(text) => setValorVenda(text.replace(',', '.'))}
            keyboardType="numeric"
            onEndEditing={calculateFromCompraAndVenda}
          />
        </View>

        {/* Lucro */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Lucro</Text>
          <TextInput
            style={styles.input}
            placeholder="Lucro"
            value={lucro}
            editable={false}
          />
        </View>

        {/* Fornecedor */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Fornecedor</Text>
          <TextInput
            style={styles.input}
            placeholder="Fornecedor"
            value={fornecedor}
            onChangeText={setFornecedor}
          />
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Salvar Alterações</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default EditarProdutoScreen;

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  container: {
    padding: 20,
    backgroundColor: '#F7F9FC',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: '#2D3142',
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#2D3142',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#2D3142',
  },
  disabledInputContainer: {
    marginBottom: 15,
  },
  disabledInput: {
    backgroundColor: '#E0E0E0', // Cor para indicar que está desativado
    color: '#7D7D7D', // Cor do texto para indicar desativação
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputHalf: {
    width: '48%',
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    maxHeight: 150, // Limita a altura do dropdown
    marginBottom: 10,
  },
  fullWidthDropdown: {
    width: '100%',
  },
  dropdown: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
    color: '#2D3142',
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
  addButton: {
    marginLeft: 10,
    backgroundColor: '#3A86FF',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20, // Ajuste para separar do campo anterior
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
