import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditarCategoriaScreen = ({ route, navigation }) => {
  const { categoria } = route.params;
  const [novoNome, setNovoNome] = useState(categoria.nome);

  const salvarEdicao = async () => {
    if (!novoNome.trim()) {
      Alert.alert('Erro', 'O nome da categoria não pode ser vazio.');
      return;
    }

    try {
      const savedCategorias = await AsyncStorage.getItem('categoriasData');
      const categorias = savedCategorias ? JSON.parse(savedCategorias) : [];

      const categoriaIndex = categorias.findIndex(
        (cat) => cat.nome === categoria.nome
      );
      if (categoriaIndex > -1) {
        categorias[categoriaIndex].nome = novoNome;
      }

      await AsyncStorage.setItem(
        'categoriasData',
        JSON.stringify(categorias)
      );
      Alert.alert('Sucesso', 'Categoria atualizada.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a categoria.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Categoria</Text>
      <TextInput
        style={styles.input}
        value={novoNome}
        onChangeText={setNovoNome}
        placeholder="Novo Nome da Categoria"
      />
      <TouchableOpacity style={styles.button} onPress={salvarEdicao}>
        <Text style={styles.buttonText}>Salvar Alterações</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7F9FC' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
});

export default EditarCategoriaScreen;
