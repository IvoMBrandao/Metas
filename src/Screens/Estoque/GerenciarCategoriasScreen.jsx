import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';

const AddCategoriaScreen = () => {
  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [subCategorias, setSubCategorias] = useState([]);
  const [novaSubCategoria, setNovaSubCategoria] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const savedData = await AsyncStorage.getItem('categoriasData');
      setCategorias(savedData ? JSON.parse(savedData) : []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  /**
   * Adiciona uma nova categoria (com subcategorias) no AsyncStorage.
   */
  const saveCategoria = async () => {
    if (!novaCategoria.trim()) {
      Alert.alert('Erro', 'O nome da categoria não pode estar vazio.');
      return;
    }
    // Cria um novo objeto de categoria
    const updatedCategorias = [
      ...categorias,
      { nome: novaCategoria, subCategorias },
    ];

    await AsyncStorage.setItem('categoriasData', JSON.stringify(updatedCategorias));
    setCategorias(updatedCategorias);

    // Limpa os states
    setNovaCategoria('');
    setSubCategorias([]);

    Alert.alert('Sucesso', 'Categoria adicionada com sucesso!');
  };

  /**
   * Adiciona uma subcategoria ao array atual (em memória).
   */
  const addSubCategoria = () => {
    if (!novaSubCategoria.trim()) {
      Alert.alert('Erro', 'Subcategoria não pode estar vazia.');
      return;
    }
    if (subCategorias.includes(novaSubCategoria)) {
      Alert.alert('Erro', 'Subcategoria já existe.');
      return;
    }
    setSubCategorias([...subCategorias, novaSubCategoria]);
    setNovaSubCategoria('');
  };

  /**
   * Quando clicar em "Editar" em uma categoria existente.
   * - Preenche o modal com o nome da categoria e subcategorias atuais.
   */
  const editCategoria = (categoria) => {
    setSelectedCategoria(categoria);
    setNovaCategoria(categoria.nome);            // Nome atual da categoria
    setSubCategorias([...categoria.subCategorias]); // Copia subcategorias existentes
    setModalVisible(true);
  };

  /**
   * Salva as mudanças feitas no modal (nome e subcategorias).
   */
  const updateCategoria = async () => {
    if (!novaCategoria.trim()) {
      Alert.alert('Erro', 'O nome da categoria não pode estar vazio.');
      return;
    }

    const updatedCategorias = categorias.map((cat) =>
      cat.nome === selectedCategoria.nome
        ? { ...cat, nome: novaCategoria, subCategorias }
        : cat
    );

    await AsyncStorage.setItem('categoriasData', JSON.stringify(updatedCategorias));
    setCategorias(updatedCategorias);

    // Fecha modal e limpa states
    setModalVisible(false);
    setSelectedCategoria(null);
    setNovaCategoria('');
    setSubCategorias([]);

    Alert.alert('Sucesso', 'Categoria atualizada com sucesso!');
  };

  /**
   * Exclui uma categoria inteira.
   */
  const deleteCategoria = async (categoria) => {
    const updatedCategorias = categorias.filter(
      (cat) => cat.nome !== categoria.nome
    );
    await AsyncStorage.setItem('categoriasData', JSON.stringify(updatedCategorias));
    setCategorias(updatedCategorias);

    Alert.alert('Sucesso', 'Categoria excluída com sucesso!');
  };

  /**
   * Remove subcategoria do array local (enquanto estamos editando/criando).
   */
  const handleDeleteSubCategoria = (sub) => {
    const newArray = subCategorias.filter((item) => item !== sub);
    setSubCategorias(newArray);
  };

  /**
   * "Edita" subcategoria - remove a antiga e joga o valor no campo de texto
   * para o usuário poder alterar.
   */
  const handleEditSubCategoria = (sub) => {
    // 1. Remove sub do array
    const newArray = subCategorias.filter((item) => item !== sub);
    setSubCategorias(newArray);

    // 2. Coloca no input
    setNovaSubCategoria(sub);
  };

  /**
   * Renderiza cada categoria na lista principal
   */
  const renderCategoria = ({ item }) => (
    <View style={styles.categoriaContainer}>
      <View style={{ flex: 1 }}>
        <Text style={styles.categoriaText}>{item.nome}</Text>

        {item.subCategorias.map((sub, index) => (
          <Text key={index} style={styles.subCategoriaText}>
            - {sub}
          </Text>
        ))}
      </View>

      <View style={styles.actionsContainer}>
        {/* Botão Editar Categoria */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => editCategoria(item)}
        >
          <Feather name="edit" size={20} color="#3A86FF" />
        </TouchableOpacity>

        {/* Botão Excluir Categoria */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => deleteCategoria(item)}
        >
          <Feather name="trash" size={20} color="#E74C3C" />
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Renderiza cada subcategoria (na parte de criar/editar) com botões de editar e excluir
   */
  const renderSubCategoriaItem = ({ item }) => (
    <View style={styles.subCategoryItem}>
      <Text style={styles.subCategoriaText}>- {item}</Text>

      <View style={{ flexDirection: 'row' }}>
        {/* Editar subcategoria */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleEditSubCategoria(item)}
        >
          <Feather name="edit-2" size={16} color="#3A86FF" />
        </TouchableOpacity>

        {/* Excluir subcategoria */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleDeleteSubCategoria(item)}
        >
          <Feather name="trash-2" size={16} color="#E74C3C" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gerenciar Categorias</Text>

      {/* =========== FORMULÁRIO PARA CRIAR NOVA CATEGORIA ========== */}
      <TextInput
        style={styles.input}
        placeholder="Nova Categoria"
        value={novaCategoria}
        onChangeText={setNovaCategoria}
      />

      {/* Lista de subcategorias adicionadas (na criação) */}
      <FlatList
        data={subCategorias}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderSubCategoriaItem}
      />

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.inputHalf]}
          placeholder="Adicionar Subcategoria"
          value={novaSubCategoria}
          onChangeText={setNovaSubCategoria}
        />
        <TouchableOpacity style={styles.addButton} onPress={addSubCategoria}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={saveCategoria}>
        <Text style={styles.buttonText}>Salvar Categoria</Text>
      </TouchableOpacity>

      {/* =========== LISTA DE CATEGORIAS EXISTENTES ========== */}
      <FlatList
        data={categorias}
        keyExtractor={(item) => item.nome}
        renderItem={renderCategoria}
      />

      {/* =========== MODAL PARA EDITAR UMA CATEGORIA EXISTENTE ========== */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Editar Categoria"
              value={novaCategoria}
              onChangeText={setNovaCategoria}
            />

            {/* Lista de subcategorias (durante edição) */}
            <FlatList
              data={subCategorias}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderSubCategoriaItem}
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="Adicionar Subcategoria"
                value={novaSubCategoria}
                onChangeText={setNovaSubCategoria}
              />
              <TouchableOpacity style={styles.addButton} onPress={addSubCategoria}>
                <Text style={styles.buttonText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Botão para confirmar edição */}
            <TouchableOpacity style={styles.addButton} onPress={updateCategoria}>
              <Text style={styles.buttonText}>Salvar Categoria</Text>
            </TouchableOpacity>

            {/* Botão para cancelar/fechar modal */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setModalVisible(false);
                setSelectedCategoria(null);
                setNovaCategoria('');
                setSubCategorias([]);
              }}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AddCategoriaScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7F9FC' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#3A86FF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#E74C3C',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
  categoriaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    marginVertical: 5,
    borderRadius: 8,
  },
  categoriaText: { fontSize: 16, fontWeight: '600' },
  subCategoriaText: { fontSize: 14, marginLeft: 8, color: '#555' },
  actionsContainer: { flexDirection: 'row' },
  iconButton: { marginLeft: 10 },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  inputHalf: { flex: 1, marginRight: 10 },
  subCategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
});
