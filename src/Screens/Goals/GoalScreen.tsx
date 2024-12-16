import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import { useFocusEffect } from '@react-navigation/native';
import SideMenu from '../../componentes/SideMenu ';
const { width } = Dimensions.get('window');

const MetaScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [birthdaysToday, setBirthdaysToday] = useState([]);
  const [doNotRemindToday, setDoNotRemindToday] = useState(false);

  useEffect(() => {
    checkAndLoadBirthdayReminder();
  }, []);

  const checkAndLoadBirthdayReminder = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const skipReminder = await AsyncStorage.getItem('skipBirthdayReminder');

      if (skipReminder !== today) {
        await fetchBirthdaysToday();
        setShowBirthdayModal(true);
      }
    } catch (error) {
      console.error('Erro ao verificar lembrete de aniversários:', error);
    }
  };

  const fetchBirthdaysToday = async () => {
    try {
      const savedCustomers = await AsyncStorage.getItem('customersData');
      const customers = savedCustomers ? JSON.parse(savedCustomers) : [];
      const today = new Date();
      const todayFormatted = today.toISOString().slice(5, 10); // MM-DD

      const birthdays = customers.filter((customer) => {
        const customerDOB = customer.dob?.split('/').reverse().join('-'); // DD/MM/YYYY para YYYY-MM-DD
        return customerDOB?.slice(5, 10) === todayFormatted;
      });

      setBirthdaysToday(birthdays);
    } catch (error) {
      console.error('Erro ao carregar aniversariantes:', error);
    }
  };

  const saveSkipReminder = async () => {
    try {
      if (doNotRemindToday) {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        await AsyncStorage.setItem('skipBirthdayReminder', today);
      }
      setShowBirthdayModal(false);
    } catch (error) {
      console.error('Erro ao salvar preferência de lembrete:', error);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData !== null) {
        setData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleDelete = async (id) => {
    Alert.alert('Excluir Meta', 'Tem certeza de que deseja excluir esta meta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        onPress: async () => {
          try {
            const updatedData = data.filter((item) => item.id !== id);
            await AsyncStorage.setItem('financeData', JSON.stringify(updatedData));
            setData(updatedData);
          } catch (error) {
            console.error('Erro ao excluir dados:', error);
          }
        },
      },
    ]);
  };

  const handleEdit = (item, index) => {
    navigation.navigate('EditGoal', { item, index });
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.listItem}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('AddSalesScreen', { metaId: item.id })} // Corrigido para navegar
    >
      <View style={styles.listTextContainer}>
        <Text style={styles.listName}>{item.name}</Text>
        <Text style={styles.listValue}>R$ {parseFloat(item.value).toFixed(2)}</Text>
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
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddGoal')}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>Adicionar Meta</Text>
        </TouchableOpacity>

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
                  onPress={saveSkipReminder}
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

const styles = StyleSheet.create({
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

export default MetaScreen;
