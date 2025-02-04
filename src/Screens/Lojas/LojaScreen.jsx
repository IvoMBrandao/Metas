import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { getDatabase, ref, onValue, push, update, remove } from 'firebase/database';
// Importa seu contexto
import { useAuthContext } from '../../contexts/auth';

const LojaScreen = ({ navigation }) => {
  const [lojas, setLojas] = useState([]);
  const [novaLoja, setNovaLoja] = useState('');

  // Estado para lidar com modal de edição
  const [modalVisible, setModalVisible] = useState(false);
  const [lojaSelecionada, setLojaSelecionada] = useState(null);

  // Do contexto de autenticação, obtemos: user e (opcional) setSelectedStoreId
  const { user, setSelectedStoreId } = useAuthContext();

  // Se não houver user (não autenticado), podemos exibir um aviso
  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Erro: Usuário não autenticado. Faça login novamente.
        </Text>
      </View>
    );
  }

  useEffect(() => {
    // Carrega as lojas do DB
    const db = getDatabase();
    const lojasRef = ref(db, `users/${user.uid}/lojas`);

    // onValue observa mudanças em tempo real
    const unsubscribe = onValue(lojasRef, (snapshot) => {
      const data = snapshot.val() || {};
      // Converte em array
      const listaLojas = Object.keys(data).map((key) => ({
        id: key,
        nome: data[key].nome,
      }));
      setLojas(listaLojas);
    });

    // Cleanup
    return () => unsubscribe();
  }, [user.uid]);

  // Adicionar loja
  const adicionarLoja = async () => {
    if (!novaLoja.trim()) {
      Alert.alert('Erro', 'O nome da loja não pode estar vazio.');
      return;
    }
    try {
      const db = getDatabase();
      const lojasRef = ref(db, `users/${user.uid}/lojas`);
      await push(lojasRef, { nome: novaLoja });
      setNovaLoja('');
      Alert.alert('Sucesso', 'Loja adicionada com sucesso!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível adicionar a loja.');
    }
  };

  // Editar loja
  const editarLoja = async () => {
    if (!lojaSelecionada || !lojaSelecionada.nome.trim()) {
      Alert.alert('Erro', 'O nome da loja não pode estar vazio.');
      return;
    }
    try {
      const db = getDatabase();
      const lojaRef = ref(db, `users/${user.uid}/lojas/${lojaSelecionada.id}`);
      await update(lojaRef, { nome: lojaSelecionada.nome });

      setModalVisible(false);
      Alert.alert('Sucesso', 'Loja editada com sucesso!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível editar a loja.');
    }
  };

  // Excluir loja
  const excluirLoja = (id) => {
    Alert.alert('Confirmação', 'Tem certeza de que deseja excluir esta loja?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const db = getDatabase();
            const lojaRef = ref(db, `users/${user.uid}/lojas/${id}`);
            await remove(lojaRef);
            Alert.alert('Sucesso', 'Loja excluída com sucesso!');
          } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível excluir a loja.');
          }
        },
      },
    ]);
  };

  // Ao clicar numa loja, podemos definir como loja selecionada no contexto
  const handleLojaPress = (item) => {
    // Se quiser usar no app todo, definimos no contexto
    if (setSelectedStoreId) {
      setSelectedStoreId(item.id);
    }
    // Navega para "Goal", por exemplo
    navigation.navigate('Goal', { lojaId: item.id });
  };

  // Renderiza cada item
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.listItem} onPress={() => handleLojaPress(item)}>
      <Text style={styles.listText}>{item.nome}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => {
            setLojaSelecionada(item);
            setModalVisible(true);
          }}
        >
          <Text style={styles.editButton}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => excluirLoja(item.id)}>
          <Text style={styles.deleteButton}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gerenciar Lojas</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome da loja"
        value={novaLoja}
        onChangeText={setNovaLoja}
      />

      <TouchableOpacity style={styles.addButton} onPress={adicionarLoja}>
        <Text style={styles.addButtonText}>Adicionar Loja</Text>
      </TouchableOpacity>

      <FlatList
        data={lojas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma loja cadastrada.</Text>}
      />

      {/* Modal p/ editar loja */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Loja</Text>
            <TextInput
              style={styles.input}
              value={lojaSelecionada?.nome || ''}
              onChangeText={(text) =>
                setLojaSelecionada((prev) => ({ ...prev, nome: text }))
              }
            />
            <TouchableOpacity style={styles.saveButton} onPress={editarLoja}>
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default LojaScreen;

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center'
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  listText: {
    fontSize: 16,
    color: '#333'
  },
  actions: {
    flexDirection: 'row',
  },
  editButton: {
    color: '#3A86FF',
    marginRight: 10,
  },
  deleteButton: {
    color: '#E74C3C',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  saveButton: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
  },
});
