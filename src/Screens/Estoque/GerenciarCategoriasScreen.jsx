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
import { Feather } from '@expo/vector-icons';
import { getDatabase, ref, get, set } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';
import { useRoute } from '@react-navigation/native';

const AddCategoriaScreen = () => {
  const route = useRoute();
  const { lojaId } = route.params || {};
  const { user } = useAuthContext();

  // LOG para depuração: ver se lojaId chegou de fato
  console.log('AddCategoriaScreen -- lojaId recebido:', lojaId);

  // Verifica se user ou lojaId são inválidos
  const userInvalido = !user || !user.uid;
  const lojaIdInvalido = !lojaId || typeof lojaId !== 'string' || lojaId.trim() === '';

  // Se for inválido, só renderiza mensagem de erro e não faz nada no DB
  if (userInvalido || lojaIdInvalido) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Erro: usuário não autenticado ou lojaId inválido para gerenciar categorias.
        </Text>
      </View>
    );
  }

  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [subCategorias, setSubCategorias] = useState([]);
  const [novaSubCategoria, setNovaSubCategoria] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Ao montar ou quando lojaId mudar, carrega as categorias existentes
  useEffect(() => {
    loadCategorias();
  }, [lojaId]);

  /**
   * Carrega array de categorias em 
   *   users/{user.uid}/lojas/{lojaId}/estoque/categoriasData
   */
  const loadCategorias = async () => {
    try {
      const db = getDatabase();
      const catRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/categoriasData`);
      const snapshot = await get(catRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        let parsed = [];
        if (Array.isArray(data)) {
          // Se for array, filtra falsy
          parsed = data.filter(Boolean);
        } else {
          // Se for objeto, converte para array de objetos
          parsed = Object.values(data);
        }
        setCategorias(parsed);
      } else {
        // Se não existir, começa com um array vazio
        setCategorias([]);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      Alert.alert('Erro', 'Não foi possível carregar as categorias do estoque.');
    }
  };

  /**
   * Adiciona nova categoria ao array local e salva no DB
   */
  const saveCategoria = async () => {
    if (!novaCategoria.trim()) {
      Alert.alert('Erro', 'O nome da categoria não pode estar vazio.');
      return;
    }

    // Monta objeto
    const nova = { nome: novaCategoria, subCategorias };
    // Atualiza array local
    const updatedCategorias = [...categorias, nova];

    try {
      const db = getDatabase();
      const catRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/categoriasData`);

      // Salva array completo
      await set(catRef, updatedCategorias);

      // Atualiza estado local
      setCategorias(updatedCategorias);
      setNovaCategoria('');
      setSubCategorias([]);
      Alert.alert('Sucesso', 'Categoria adicionada no estoque da loja!');
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      Alert.alert('Erro', 'Não foi possível salvar a categoria no estoque.');
    }
  };

  /**
   * Adiciona nova subcategoria ao array local subCategorias
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
   * Quando clica em 'Editar' de uma categoria existente,
   * abrimos modal e pré-preenchemos os campos
   */
  const editCategoria = (categoria) => {
    setSelectedCategoria(categoria);
    setNovaCategoria(categoria.nome);
    // Copia subCategorias
    setSubCategorias([...categoria.subCategorias]);
    setModalVisible(true);
  };

  /**
   * Salva a edição da categoria no array + DB
   */
  const updateCategoria = async () => {
    if (!novaCategoria.trim()) {
      Alert.alert('Erro', 'O nome da categoria não pode estar vazio.');
      return;
    }

    // Substitui a categoria antiga pela nova
    const updatedCategorias = categorias.map((cat) =>
      cat.nome === selectedCategoria.nome
        ? { ...cat, nome: novaCategoria, subCategorias }
        : cat
    );

    try {
      const db = getDatabase();
      const catRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/categoriasData`);

      // Salva array completo
      await set(catRef, updatedCategorias);

      // Atualiza estado local
      setCategorias(updatedCategorias);
      // Fecha modal, limpa states
      setModalVisible(false);
      setSelectedCategoria(null);
      setNovaCategoria('');
      setSubCategorias([]);
      Alert.alert('Sucesso', 'Categoria atualizada no estoque!');
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a categoria no estoque.');
    }
  };

  /**
   * Exclui categoria inteira do array + DB
   */
  const deleteCategoria = async (categoria) => {
    const updatedCategorias = categorias.filter((cat) => cat.nome !== categoria.nome);
    try {
      const db = getDatabase();
      const catRef = ref(db, `users/${user.uid}/lojas/${lojaId}/estoque/categoriasData`);
      await set(catRef, updatedCategorias);

      setCategorias(updatedCategorias);
      Alert.alert('Sucesso', 'Categoria excluída do estoque!');
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      Alert.alert('Erro', 'Não foi possível excluir a categoria do estoque.');
    }
  };

  /**
   * Exclui subcategoria do array local (enquanto estamos criando/editando)
   */
  const handleDeleteSubCategoria = (sub) => {
    const newArray = subCategorias.filter((item) => item !== sub);
    setSubCategorias(newArray);
  };

  /**
   * "Edita" subcategoria
   * - remove do array
   * - joga valor no campo input (novaSubCategoria)
   */
  const handleEditSubCategoria = (sub) => {
    const newArray = subCategorias.filter((item) => item !== sub);
    setSubCategorias(newArray);
    setNovaSubCategoria(sub);
  };

  /**
   * Renderiza item de categoria
   */
  const renderCategoria = ({ item }) => (
    <View style={styles.categoriaContainer}>
      <View style={{ flex: 1 }}>
        <Text style={styles.categoriaText}>{item.nome}</Text>
        {item.subCategorias && item.subCategorias.map((sub, index) => (
          <Text key={index} style={styles.subCategoriaText}>
            - {sub}
          </Text>
        ))}
      </View>
      <View style={styles.actionsContainer}>
        {/* Botão Editar */}
        <TouchableOpacity style={styles.iconButton} onPress={() => editCategoria(item)}>
          <Feather name="edit" size={20} color="#3A86FF" />
        </TouchableOpacity>
        {/* Botão Excluir */}
        <TouchableOpacity style={styles.iconButton} onPress={() => deleteCategoria(item)}>
          <Feather name="trash" size={20} color="#E74C3C" />
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Renderiza item de subcategoria
   */
  const renderSubCategoriaItem = ({ item }) => (
    <View style={styles.subCategoryItem}>
      <Text style={styles.subCategoriaText}>- {item}</Text>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleEditSubCategoria(item)}>
          <Feather name="edit-2" size={16} color="#3A86FF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleDeleteSubCategoria(item)}>
          <Feather name="trash-2" size={16} color="#E74C3C" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gerenciar Categorias (Loja: {lojaId})</Text>

      {/* Campo pra nova categoria */}
      <TextInput
        style={styles.input}
        placeholder="Nova Categoria"
        value={novaCategoria}
        onChangeText={setNovaCategoria}
      />

      {/* Lista local de subCategorias que estamos criando */}
      <FlatList
        data={subCategorias}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderSubCategoriaItem}
      />

      {/* Adiciona subcategoria */}
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

      {/* Botão que salva a nova categoria */}
      <TouchableOpacity style={styles.addButton} onPress={saveCategoria}>
        <Text style={styles.buttonText}>Salvar Categoria</Text>
      </TouchableOpacity>

      {/* Lista de categorias do DB */}
      <FlatList
        data={categorias}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderCategoria}
        style={{ marginTop: 10 }}
      />

      {/* Modal p/ Editar Categoria Existente */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Campo pra editar nome */}
            <TextInput
              style={styles.input}
              placeholder="Editar Categoria"
              value={novaCategoria}
              onChangeText={setNovaCategoria}
            />

            {/* Lista de subcategorias da categoria em edição */}
            <FlatList
              data={subCategorias}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderSubCategoriaItem}
            />

            {/* Adiciona subcategoria no modo edição */}
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

            <TouchableOpacity style={styles.addButton} onPress={updateCategoria}>
              <Text style={styles.buttonText}>Salvar Categoria</Text>
            </TouchableOpacity>

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
  centered: {
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    padding:20
  },
  errorText: {
    fontSize:16,
    color:'red',
    textAlign:'center'
  },
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#F7F9FC' 
  },
  title: { 
    fontSize: 22, 
    fontWeight: '600', 
    marginBottom: 12 
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#FFF',
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
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputHalf: {
    flex: 1,
    marginRight: 10,
  },
  categoriaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  categoriaText: {
    fontSize: 16,
    fontWeight: '600',
  },
  subCategoriaText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#555',
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 10,
  },
  subCategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    margin: 20,
  },
});
