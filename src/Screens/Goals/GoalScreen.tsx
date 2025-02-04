import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import { getDatabase, ref, onValue, off, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import SideMenu from '../../componentes/SideMenu ';

const { width } = Dimensions.get('window');

const MetaScreen = ({ navigation, route }) => {
  // Recebemos lojaId via route.params
  const { lojaId } = route.params || {};
  
  // Pegamos o userId diretamente do objeto de autenticação
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  // Estados do componente
  const [data, setData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Exemplo de modal de aniversariantes (opcional)
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [birthdaysToday, setBirthdaysToday] = useState([]);
  const [doNotRemindToday, setDoNotRemindToday] = useState(false);

  // Caso userId ou lojaId não venham corretamente
  if (!userId || !lojaId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Erro: Usuário não autenticado ou lojaId não fornecido.
        </Text>
      </View>
    );
  }

  /**
   * Montamos um listener em tempo real (onValue) para /metas.
   * Sempre que alterar no DB, 'data' será atualizado.
   */
  useEffect(() => {
    const db = getDatabase();
    const metasRef = ref(db, `users/${userId}/lojas/${lojaId}/metas`);
    
    // Listener em tempo real
    const unsubscribe = onValue(metasRef, (snapshot) => {
      if (snapshot.exists()) {
        const metasObj = snapshot.val() || {};
        // Converte de objeto -> array
        const metasArray = Object.entries(metasObj).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        setData(metasArray);
      } else {
        // Se não tiver nada em "/metas", array vazio
        setData([]);
      }
    }, (error) => {
      console.error('Erro ao ler metas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as metas do Firebase.');
    });

    // Cleanup: remove o listener quando desmontar
    return () => {
      off(metasRef, 'value', unsubscribe);
    };
  }, [userId, lojaId]);

  /**
   * "Pull to refresh": Podemos apenas simular,
   * pois onValue() já mantém dados em tempo real.
   */
  const onRefresh = () => {
    setIsRefreshing(true);
    // Espera um pouquinho e desliga o indicador
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  /**
   * Ao excluir meta
   */
  const handleDelete = (metaId) => {
    Alert.alert(
      'Excluir Meta',
      'Tem certeza de que deseja excluir esta meta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getDatabase();
              const metaRef = ref(db, `users/${userId}/lojas/${lojaId}/metas/${metaId}`);
              await remove(metaRef);
              // Não precisa chamar nada: onValue() atualiza sozinho
            } catch (error) {
              console.error('Erro ao excluir meta:', error);
              Alert.alert('Erro', 'Não foi possível excluir a meta.');
            }
          },
        },
      ]
    );
  };

  /**
   * Ao editar meta
   */
  const handleEdit = (item, index) => {
    // Navega para EditGoal, passando item / index se precisar
    navigation.navigate('EditGoal', { item, index, lojaId, userId });
  };

  /**
   * Formata um valor (número) em Reais
   */
  const formatToReal = (num) => {
    return Number(num || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  /**
   * Render de cada meta na lista
   */
  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.listItem}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate('AddSalesScreen', { metaId: item.id, lojaId, userId })
      }
    >
      <View style={styles.listTextContainer}>
        <Text style={styles.listName}>{item.nome || item.name}</Text>
        <Text style={styles.listValue}>{formatToReal(item.valor || item.value)}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => handleEdit(item, index)}
        >
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.buttonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  /**
   * Se estiver tudo certo, renderiza a tela
   */
  return (
    <SideMenu navigation={navigation}>
      <View style={styles.container}>
        <View style={styles.background}>
          <View style={styles.halfMoon} />
        </View>

        <View style={styles.titleWrapper}>
          <Text style={styles.title}>Metas</Text>
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => (item.id ? item.id.toString() : '0')}
          renderItem={renderItem}
          // Pull to refresh
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma meta adicionada ainda.</Text>
            </View>
          }
        />

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddGoal', { lojaId })}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>Adicionar Meta</Text>
        </TouchableOpacity>

        {/* Exemplo de Modal de Aniversariantes (opcional) */}
        <Modal
          visible={showBirthdayModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBirthdayModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Aniversariantes do Dia</Text>
              {birthdaysToday.length > 0 ? (
                birthdaysToday.map((customer) => (
                  <View key={customer.id} style={styles.birthdayItem}>
                    <Text style={styles.birthdayName}>{customer.name}</Text>
                    <Text style={styles.birthdayPhone}>
                      {customer.phone || 'Sem telefone'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noBirthdays}>Nenhum aniversariante hoje!</Text>
              )}

              <View style={styles.checkboxContainer}>
                <Checkbox
                  value={doNotRemindToday}
                  onValueChange={setDoNotRemindToday}
                  color={doNotRemindToday ? '#27AE60' : undefined}
                />
                <Text style={styles.checkboxText}>Não lembrar mais hoje</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowBirthdayModal(false)}
                >
                  <Text style={styles.modalButtonText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SideMenu>
  );
};

export default MetaScreen;

// Estilos
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F7F9FC',
  },
  background: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 0.75,
    top: -width * 0.35,
    left: -width * 0.25,
    backgroundColor: '#3A86FF',
    borderBottomLeftRadius: width * 0.75,
    borderBottomRightRadius: width * 0.75,
    zIndex: 0,
  },
  halfMoon: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 0.75,
    backgroundColor: '#3A86FF',
    borderBottomLeftRadius: width * 0.75,
    borderBottomRightRadius: width * 0.75,
    top: -width * 0.25,
    left: -width * 0.25,
  },
  titleWrapper: {
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFF',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    // sombra leve
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  listTextContainer: {
    flex: 1,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3142',
  },
  listValue: {
    fontSize: 16,
    color: '#27AE60',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 5,
  },
  editButton: {
    backgroundColor: '#3498DB',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#BDBDBD',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3142',
    marginBottom: 15,
  },
  birthdayItem: {
    marginBottom: 10,
    alignItems: 'center',
  },
  birthdayName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A86FF',
  },
  birthdayPhone: {
    fontSize: 16,
    color: '#6B7280',
  },
  noBirthdays: {
    fontSize: 16,
    color: '#BDBDBD',
    marginTop: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  checkboxText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#2D3142',
  },
  modalActions: {
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: '#27AE60',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    width: 150,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
