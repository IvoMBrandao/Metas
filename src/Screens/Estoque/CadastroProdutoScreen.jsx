// CadastroProdutoScreen.jsx

import React, { useState, useEffect, useContext } from 'react';
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
import database from '@react-native-firebase/database';

const CadastroProdutoScreen = ({ navigation }) => {
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

  const [categorias, setCategorias] = useState([]);
  const [subCategorias, setSubCategorias] = useState([]);
  const [isCategoriaDropdownVisible, setIsCategoriaDropdownVisible] = useState(false);
  const [isSubCategoriaDropdownVisible, setIsSubCategoriaDropdownVisible] = useState(false);

  useEffect(() => {
    loadCategorias();
    gerarProximoCodigo(); // Gera o próximo código serial ao montar o componente
  }, []);

  /**
   * Carrega as categorias do Realtime Database (RN Firebase)
   */
  const loadCategorias = async () => {
    try {
      // Faz uma leitura única (similar a get() do SDK web)
      const snapshot = await database()
        .ref('/lojas/' + idDaLoja) // caminho do seu nó
        .once('value');

      if (snapshot.exists()) {
        // snapshot.val() contém o objeto/array armazenado
        const data = snapshot.val();

        // Se for um objeto que precise ser convertido em array
        // Ex.: { "id1": {...}, "id2": {...} }
        const parsedCategorias = Object.values(data);

        setCategorias(parsedCategorias);
      } else {
        // Se não existir dados
        setCategorias([]);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  /**
   * Gera o próximo código serial com base nos produtos existentes.
   */
  const gerarProximoCodigo = async () => {
    try {
      const savedData = await AsyncStorage.getItem('estoqueData');
      const produtosExistentes = savedData ? JSON.parse(savedData) : [];

      if (produtosExistentes.length === 0) {
        setCodigo('001'); // Inicia com 001 se não houver produtos
      } else {
        // Extrai os códigos existentes e determina o próximo número
        const codigos = produtosExistentes
          .map((prod) => parseInt(prod.codigo))
          .filter((num) => !isNaN(num));
        const maxCodigo = Math.max(...codigos);
        const proximoCodigo = (maxCodigo + 1).toString().padStart(3, '0');
        setCodigo(proximoCodigo);
      }
    } catch (error) {
      console.error('Erro ao gerar próximo código:', error);
      Alert.alert('Erro', 'Não foi possível gerar o próximo código.');
    }
  };

  /**
   * Seleciona uma categoria e mostra subcategorias
   */
  const handleCategoriaSelect = (selectedCategoria) => {
    setCategoria(selectedCategoria.nome);
    setSubCategorias(selectedCategoria.subCategorias || []);
    setSubCategoria('');
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
   * Calcula valor de venda e lucro, dado valor de compra + % de lucro.
   * Fórmula: valorVenda = valorCompra + (valorCompra * porcentagem / 100)
   */
  const calculateFromCompraAndPorcentagem = () => {
    const compraNumber = parseFloat(valorCompra);
    const porcentNumber = parseFloat(porcentagem);

    if (!isNaN(compraNumber) && !isNaN(porcentNumber)) {
      const vendaCalculada = compraNumber + (compraNumber * porcentNumber) / 100;
      const lucroCalculado = vendaCalculada - compraNumber;

      setValorVenda(vendaCalculada.toFixed(2));
      setLucro(lucroCalculado.toFixed(2));
    }
  };

  /**
   * Calcula porcentagem e lucro, dado valor de compra + valor de venda.
   * Fórmula: porcentagem = ((valorVenda - valorCompra) / valorCompra) * 100
   */
  const calculateFromCompraAndVenda = () => {
    const compraNumber = parseFloat(valorCompra);
    const vendaNumber = parseFloat(valorVenda);

    if (!isNaN(compraNumber) && !isNaN(vendaNumber) && compraNumber !== 0) {
      const porcentagemCalculada = ((vendaNumber - compraNumber) / compraNumber) * 100;
      const lucroCalculado = vendaNumber - compraNumber;

      setPorcentagem(porcentagemCalculada.toFixed(2));
      setLucro(lucroCalculado.toFixed(2));
    }
  };

  /**
   * Se ao editar o valor de compra o usuário já tiver
   * preenchido uma porcentagem, recalculamos com base nela.
   * Se não tiver porcentagem mas tiver valor de venda,
   * recalculamos a porcentagem a partir desse valor de venda.
   */
  const handleValorCompraEndEditing = () => {
    const compraNumber = parseFloat(valorCompra);

    // Se for inválido, não faz nada
    if (isNaN(compraNumber)) return;

    if (!isNaN(parseFloat(porcentagem)) && parseFloat(porcentagem) !== 0) {
      // Se já existir uma porcentagem, recalcula a partir dela
      calculateFromCompraAndPorcentagem();
    } else if (!isNaN(parseFloat(valorVenda)) && parseFloat(valorVenda) !== 0) {
      // Se não há porcentagem, mas há valorVenda, recalcula porcentagem
      calculateFromCompraAndVenda();
    }
    // Senão, não faz nenhum cálculo
  };

  /**
   * Salva o produto no AsyncStorage
   */
  const saveProduct = async () => {
    // Validação dos campos obrigatórios
    if (
      !nome ||
      !codigo ||
      !quantidade ||
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
      const parsedData = savedData ? JSON.parse(savedData) : [];

      // Verificar se o código já existe
      const existe = parsedData.find((prod) => prod.codigo === codigo);
      if (existe) {
        Alert.alert(
          'Erro',
          'Já existe um produto com este código. Por favor, insira um código único.'
        );
        return;
      }

      // Converte data "DD/MM/AAAA" em ISO "AAAA-MM-DDTHH:MM:SSZ"
      let dataFormatada = dataEntrada;
      const [dia, mes, ano] = dataEntrada.split('/');
      if (dia && mes && ano) {
        const dataObj = new Date(+ano, mes - 1, +dia);
        if (isNaN(dataObj)) {
          Alert.alert('Erro', 'Data de entrada inválida.');
          return;
        }
        dataFormatada = dataObj.toISOString();
      }

      // Criação da entrada inicial
      const entradaInicial = {
        id: Date.now().toString(),
        data: dataFormatada,
        quantidade: parseInt(quantidade),
        valorCompra: parseFloat(valorCompra),
        porcentagem: parseFloat(porcentagem),
        valorVenda: parseFloat(valorVenda),
        lucro: parseFloat(lucro),
        valorAnterior: 0, // Nenhum valor anterior na entrada inicial
      };

      const newProduct = {
        id: Date.now().toString(),
        nome,
        codigo,
        quantidade: parseInt(quantidade),
        categoria,
        subCategoria,
        dataEntrada: dataFormatada,
        unidade,
        fornecedor, // Adiciona o novo campo
        entradas: [entradaInicial], // Array de entradas com a entrada inicial
      };

      const updatedData = [...parsedData, newProduct];
      await AsyncStorage.setItem('estoqueData', JSON.stringify(updatedData));

      Alert.alert('Sucesso', 'Produto cadastrado com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o produto.');
      console.error('Erro ao salvar produto:', error);
    }
  };

  /**
   * Formata a data em DD/MM/AAAA enquanto digita
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

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Cadastro de Produto</Text>

        {/* Nome do Produto */}
        <TextInput
          style={styles.input}
          placeholder='Nome do Produto'
          value={nome}
          onChangeText={setNome}
        />

        {/* Código */}
        <TextInput
          style={styles.input}
          placeholder='Código'
          value={codigo}
          onChangeText={setCodigo}
        />

        {/* Quantidade */}
        <TextInput
          style={styles.input}
          placeholder='Quantidade'
          value={quantidade}
          onChangeText={setQuantidade}
          keyboardType='numeric'
        />

        {/* Selecionar Categoria */}
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.dropdown, styles.fullWidthDropdown]}
            onPress={() => setIsCategoriaDropdownVisible(!isCategoriaDropdownVisible)}>
            <Text style={styles.dropdownText}>{categoria || 'Selecionar Categoria'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('GerenciarCategoriasScreen')}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {isCategoriaDropdownVisible && (
          <View style={styles.dropdownContainer}>
            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat.nome}
                style={styles.dropdownItem}
                onPress={() => {
                  handleCategoriaSelect(cat);
                }}>
                <Text style={styles.dropdownItemText}>{cat.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Selecionar SubCategoria */}
        {subCategorias.length > 0 && (
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setIsSubCategoriaDropdownVisible(!isSubCategoriaDropdownVisible)}>
              <Text style={styles.dropdownText}>{subCategoria || 'Selecionar Subcategoria'}</Text>
            </TouchableOpacity>
            {isSubCategoriaDropdownVisible && (
              <View>
                {subCategorias.map((sub, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => handleSubCategoriaSelect(sub)}>
                    <Text style={styles.dropdownItemText}>{sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Fornecedor (Novo Campo) */}
        <TextInput
          style={styles.input}
          placeholder='Fornecedor'
          value={fornecedor}
          onChangeText={setFornecedor}
        />

        {/* Data de Entrada */}
        <TextInput
          style={styles.input}
          placeholder='Data de Entrada (DD/MM/AAAA)'
          value={dataEntrada}
          keyboardType='numeric'
          onChangeText={handleDataChange}
        />

        {/* Unidade de Medida */}
        <TextInput
          style={styles.input}
          placeholder='Unidade de Medida (ex: kg, un)'
          value={unidade}
          onChangeText={setUnidade}
        />

        {/* Valor de Compra */}
        <TextInput
          style={styles.input}
          placeholder='Valor de Compra'
          value={valorCompra}
          onChangeText={(text) => {
            setValorCompra(text.replace(',', '.'));
          }}
          keyboardType='numeric'
          // Quando o usuário sair do campo Valor de Compra
          onEndEditing={handleValorCompraEndEditing}
        />

        <View style={styles.row}>
          {/* Porcentagem */}
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder='% Margem de Lucro'
            value={porcentagem}
            onChangeText={(text) => {
              setPorcentagem(text.replace(',', '.'));
            }}
            keyboardType='numeric'
            onEndEditing={calculateFromCompraAndPorcentagem}
          />

          {/* Valor de Venda */}
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder='Valor de Venda'
            value={valorVenda}
            onChangeText={(text) => {
              setValorVenda(text.replace(',', '.'));
            }}
            keyboardType='numeric'
            onEndEditing={calculateFromCompraAndVenda}
          />
        </View>

        {/* Lucro (somente leitura) */}
        <TextInput
          style={[styles.input, { backgroundColor: '#F0F0F0' }]}
          placeholder='Lucro'
          value={lucro}
          editable={false}
        />

        {/* Botão Salvar */}
        <TouchableOpacity style={styles.button} onPress={saveProduct}>
          <Text style={styles.buttonText}>Salvar Produto</Text>
        </TouchableOpacity>
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

export default CadastroProdutoScreen;

const styles = StyleSheet.create({
  scrollContainer: {
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
  input: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#2D3142',
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
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BDBDBD',
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
  fullWidthDropdown: {
    flex: 1,
  },
});
