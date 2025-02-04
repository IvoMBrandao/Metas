import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet
} from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase, ref, get, push, update } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';

const CadastroProdutoScreen = ({ navigation, route }) => {
  // Recebe lojaId via route
  const { lojaId } = route.params || {};
  const { user } = useAuthContext();

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
  const [fornecedor, setFornecedor] = useState('');

  // Carrega categorias do estoque (array com { nome, subCategorias: [...] })
  const [categorias, setCategorias] = useState([]);
  const [subCategorias, setSubCategorias] = useState([]);
  const [isCategoriaDropdownVisible, setIsCategoriaDropdownVisible] = useState(false);
  const [isSubCategoriaDropdownVisible, setIsSubCategoriaDropdownVisible] = useState(false);

  // Ao montar o componente, gerar código do produto
  useEffect(() => {
    gerarProximoCodigo();
  }, []);

  // Carrega as categorias quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      loadCategoriasDoEstoque();
    }, [])
  );

  /**
   * Lê categorias em:
   *    users/{uid}/lojas/{lojaId}/estoque/categoriasData
   */
  const loadCategoriasDoEstoque = async () => {
    try {
      // Se lojaId ou user.uid inválidos, sai
      if (!user || !user.uid) {
        Alert.alert('Erro', 'Usuário não autenticado.');
        return;
      }
      if (!lojaId || typeof lojaId !== 'string' || lojaId.trim() === '') {
        Alert.alert('Erro', 'lojaId não foi especificado corretamente (categorias).');
        return;
      }

      const db = getDatabase();
      const catRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/categoriasData`);
      const snapshot = await get(catRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        let parsed = [];
        if (Array.isArray(data)) {
          parsed = data.filter(Boolean);
        } else {
          parsed = Object.values(data);
        }
        setCategorias(parsed);
      } else {
        setCategorias([]);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias do estoque:', error);
      Alert.alert('Erro', 'Não foi possível carregar categorias do estoque.');
    }
  };

  /**
   * Gera próximo código de produto lendo em:
   *   users/{uid}/lojas/{lojaId}/estoque/produtos
   */
  const gerarProximoCodigo = async () => {
    try {
      // Checa se user ou lojaId são válidos
      if (!user || !user.uid) {
        return;
      }
      if (!lojaId || typeof lojaId !== 'string' || lojaId.trim() === '') {
        return;
      }

      const db = getDatabase();
      const produtosRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/produtos`);
      const snapshot = await get(produtosRef);

      if (!snapshot.exists()) {
        // Se não há produtos, começa em '001'
        setCodigo('001');
      } else {
        // converte objeto -> array
        const data = snapshot.val();
        const produtosExistentes = Object.keys(data).map((k) => data[k]);
        const codigos = produtosExistentes.map((p) => parseInt(p.codigo)).filter((n) => !isNaN(n));
        if (codigos.length === 0) {
          setCodigo('001');
        } else {
          const maxCodigo = Math.max(...codigos);
          const proximoCodigo = (maxCodigo + 1).toString().padStart(3, '0');
          setCodigo(proximoCodigo);
        }
      }
    } catch (error) {
      console.error('Erro ao gerar próximo código:', error);
      Alert.alert('Erro', 'Não foi possível gerar o próximo código.');
    }
  };

  // Seleciona categoria e exibe subCategorias
  const handleCategoriaSelect = (selectedCategoria) => {
    setCategoria(selectedCategoria.nome);
    setSubCategorias(selectedCategoria.subCategorias || []);
    setSubCategoria('');
    setIsCategoriaDropdownVisible(false);
  };

  const handleSubCategoriaSelect = (selectedSubCategoria) => {
    setSubCategoria(selectedSubCategoria);
    setIsSubCategoriaDropdownVisible(false);
  };

  // ========== Lógica de cálculo =============
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

  const handleValorCompraEndEditing = () => {
    const compraNumber = parseFloat(valorCompra);
    if (isNaN(compraNumber)) return;

    if (!isNaN(parseFloat(porcentagem)) && parseFloat(porcentagem) !== 0) {
      calculateFromCompraAndPorcentagem();
    } else if (!isNaN(parseFloat(valorVenda)) && parseFloat(valorVenda) !== 0) {
      calculateFromCompraAndVenda();
    }
  };

  // Máscara de data "DD/MM/AAAA"
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

  // Salva produto
  const saveProduct = async () => {
    // Checa se user ou lojaId são válidos
    if (!user || !user.uid) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }
    if (!lojaId || typeof lojaId !== 'string' || lojaId.trim() === '') {
      Alert.alert('Erro', 'lojaId não foi especificado corretamente (salvar produto).');
      return;
    }

    if (
      !nome ||
      !codigo ||
      !quantidade ||
      !categoria ||
      !dataEntrada ||
      !unidade ||
      !valorCompra ||
      !valorVenda ||
      !fornecedor
    ) {
      Alert.alert('Erro', 'Preencha todos os campos!');
      return;
    }

    // Converte "DD/MM/AAAA" -> ISO
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

    const quantidadeInt = parseInt(quantidade, 10);
    const compraFloat = parseFloat(valorCompra);
    const pctFloat = parseFloat(porcentagem);
    const vendaFloat = parseFloat(valorVenda);
    const lucroFloat = parseFloat(lucro);
    const dataAtual = new Date().toISOString();

    // Primeira entrada do produto
    const entradaInicial = {
      id: Date.now().toString(),
      data: dataAtual,
      quantidade: quantidadeInt,
      valorCompra: compraFloat,
      porcentagem: pctFloat,
      valorVenda: vendaFloat,
      lucro: lucroFloat,
      valorAnterior: 0,
    };

    const newProduct = {
      nome,
      codigo,
      quantidade: quantidadeInt,
      categoria,
      subCategoria,
      dataEntrada: dataFormatada,
      unidade,
      fornecedor,
      entradas: [entradaInicial],
    };

    try {
      const db = getDatabase();
      const produtosRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/produtos`);
      // Cria pushId
      const newProdRef = push(produtosRef);
      // Seta a key no objeto
      newProduct.id = newProdRef.key;

      // Salva no DB
      await update(newProdRef, newProduct);

      Alert.alert('Sucesso', 'Produto cadastrado com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o produto no estoque.');
      console.error('Erro ao salvar produto:', error);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Cadastro de Produto</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome do Produto"
          value={nome}
          onChangeText={setNome}
        />

        <TextInput
          style={styles.input}
          placeholder="Código"
          value={codigo}
          onChangeText={setCodigo}
        />

        <TextInput
          style={styles.input}
          placeholder="Quantidade"
          value={quantidade}
          onChangeText={setQuantidade}
          keyboardType="numeric"
        />

        {/* Categoria */}
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
            onPress={() => navigation.navigate('GerenciarCategoriasScreen', { lojaId })}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {isCategoriaDropdownVisible && (
          <View style={styles.dropdownContainer}>
            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat.nome}
                style={styles.dropdownItem}
                onPress={() => handleCategoriaSelect(cat)}
              >
                <Text style={styles.dropdownItemText}>{cat.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Subcategoria */}
        {subCategorias.length > 0 && (
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setIsSubCategoriaDropdownVisible(!isSubCategoriaDropdownVisible)}
            >
              <Text style={styles.dropdownText}>
                {subCategoria || 'Selecionar Subcategoria'}
              </Text>
            </TouchableOpacity>
            {isSubCategoriaDropdownVisible && (
              <View>
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

        <TextInput
          style={styles.input}
          placeholder="Fornecedor"
          value={fornecedor}
          onChangeText={setFornecedor}
        />

        <TextInput
          style={styles.input}
          placeholder="Data de Entrada (DD/MM/AAAA)"
          value={dataEntrada}
          keyboardType="numeric"
          onChangeText={handleDataChange}
        />

        <TextInput
          style={styles.input}
          placeholder="Unidade de Medida (ex: kg, un)"
          value={unidade}
          onChangeText={setUnidade}
        />

        <TextInput
          style={styles.input}
          placeholder="Valor de Compra"
          value={valorCompra}
          onChangeText={(text) => setValorCompra(text.replace(',', '.'))}
          keyboardType="numeric"
          onEndEditing={handleValorCompraEndEditing}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="% Margem de Lucro"
            value={porcentagem}
            onChangeText={(text) => setPorcentagem(text.replace(',', '.'))}
            keyboardType="numeric"
            onEndEditing={calculateFromCompraAndPorcentagem}
          />
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Valor de Venda"
            value={valorVenda}
            onChangeText={(text) => setValorVenda(text.replace(',', '.'))}
            keyboardType="numeric"
            onEndEditing={calculateFromCompraAndVenda}
          />
        </View>

        <TextInput
          style={[styles.input, { backgroundColor: '#F0F0F0' }]}
          placeholder="Lucro"
          value={lucro}
          editable={false}
        />

        <TouchableOpacity style={styles.button} onPress={saveProduct}>
          <Text style={styles.buttonText}>Salvar Produto</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

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
  fullWidthDropdown: {
    width: '100%',
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
    marginTop: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
