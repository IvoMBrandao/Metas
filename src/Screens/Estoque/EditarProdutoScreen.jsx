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
import { getDatabase, ref, get, update } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';

const EditarProdutoScreen = ({ route, navigation }) => {
  const { productId, lojaId } = route.params; // Recebe o ID do produto e ID da loja
  const { user } = useAuthContext();

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
  const [fornecedor, setFornecedor] = useState('');

  // Para exibir dropdown de categorias e subcategorias
  const [categorias, setCategorias] = useState([]);
  const [subCategorias, setSubCategorias] = useState([]);
  const [isCategoriaDropdownVisible, setIsCategoriaDropdownVisible] = useState(false);
  const [isSubCategoriaDropdownVisible, setIsSubCategoriaDropdownVisible] = useState(false);

  useEffect(() => {
    fetchProduto();
    loadCategorias();
  }, []);

  /**
   * Carrega o produto específico do Firebase
   */
  const fetchProduto = async () => {
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

      setNome(item.nome);
      setCodigo(item.codigo);
      setQuantidade(item.quantidade?.toString() || '');
      setCategoria(item.categoria);
      setSubCategoria(item.subCategoria || '');

      // Formatando data "YYYY-MM-DD..." -> "DD/MM/YYYY"
      if (item.dataEntrada && item.dataEntrada.includes('-')) {
        const [ano, mes, diaRest] = item.dataEntrada.split('-');
        const dia = diaRest.slice(0, 2); // se vier com T no final
        setDataEntrada(`${dia}/${mes}/${ano}`);
      } else {
        setDataEntrada('');
      }

      setUnidade(item.unidade || '');
      // Precisamos da última entrada para pegar valorCompra, porcentagem, valorVenda, lucro?
      // Ou iremos usar item.valorCompra etc? O seu code armazena isso no "entradas".
      // Vou supor que item tenha `valorCompra`, `porcentagem`, `valorVenda`, `lucro` no root
      // MAS você estava salvando isso nas "entradas". Ajuste conforme sua estrutura real.
      // Para manter seu layout, vou usar item:
      setValorCompra(''); // Precisaria de nova logica se você quiser...
      setPorcentagem('');
      setValorVenda('');
      setLucro('');
      setFornecedor(item.fornecedor || '');
    } catch (error) {
      console.error('Erro ao buscar produto no Firebase:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao buscar o produto no Firebase.');
    }
  };

  /**
   * Carrega as categorias do Firebase
   */
  const loadCategorias = async () => {
    try {
      const db = getDatabase();
      const catRef = ref(db, `users/${user.uid}/categoriasData`);
      const snapshot = await get(catRef);

      if (snapshot.exists()) {
        let parsed = [];
        const data = snapshot.val();
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
      console.error('Erro ao carregar categorias:', error);
    }
  };

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

  const handleValorCompraEndEditing = () => {
    const compraNumber = parseFloat(valorCompra);
    if (isNaN(compraNumber)) return;

    if (!isNaN(parseFloat(porcentagem)) && parseFloat(porcentagem) !== 0) {
      calculateFromCompraAndPorcentagem();
    } else if (!isNaN(parseFloat(valorVenda)) && parseFloat(valorVenda) !== 0) {
      calculateFromCompraAndVenda();
    }
  };

  /**
   * Atualiza o produto no Firebase
   */
  const handleSave = async () => {
    if (!nome || !codigo || !categoria || !dataEntrada || !unidade || !fornecedor) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios!');
      return;
    }

    try {
      // Converte "DD/MM/AAAA" em "AAAA-MM-DD"
      let dataISO = '';
      const [dia, mes, ano] = dataEntrada.split('/');
      if (dia && mes && ano) {
        const dataObj = new Date(+ano, mes - 1, +dia);
        if (isNaN(dataObj)) {
          Alert.alert('Erro', 'Data de entrada inválida.');
          return;
        }
        dataISO = dataObj.toISOString().split('T')[0];
      }

      // Monta o objeto atualizado
      const produtoAtualizado = {
        ...produto,
        nome,
        codigo,
        categoria,
        subCategoria,
        dataEntrada: dataISO,
        unidade,
        fornecedor,
        // Caso queira salvar no root
        valorCompra: valorCompra ? parseFloat(valorCompra).toFixed(2) : '0.00',
        porcentagem: porcentagem ? parseFloat(porcentagem).toFixed(2) : '0.00',
        valorVenda: valorVenda ? parseFloat(valorVenda).toFixed(2) : '0.00',
        lucro: lucro ? parseFloat(lucro).toFixed(2) : '0.00',
      };

      const db = getDatabase();
      const produtoRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/produtos/${productId}`);
      await update(produtoRef, produtoAtualizado);

      Alert.alert('Sucesso', 'Produto atualizado com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o produto no Firebase.');
      console.error('Erro ao atualizar produto:', error);
    }
  };

  if (!produto) {
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
            editable={false}
            selectTextOnFocus={false}
          />
        </View>

        {/* Categoria */}
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
                onPress={() => handleCategoriaSelect(cat)}
              >
                <Text style={styles.dropdownItemText}>{cat.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Subcategoria (se existir) */}
        {subCategorias.length > 0 && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Subcategoria</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setIsSubCategoriaDropdownVisible(!isSubCategoriaDropdownVisible)}
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
    backgroundColor: '#E0E0E0',
    color: '#7D7D7D',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    maxHeight: 150,
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
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
