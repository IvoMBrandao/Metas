import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BirthdayModal = ({ visible, onClose }) => {
  const [birthdaysToday, setBirthdaysToday] = useState([]);

  useEffect(() => {
    if (visible) {
      checkBirthdaysToday();
    }
  }, [visible]);

  const checkBirthdaysToday = async () => {
    try {
      const savedCustomers = await AsyncStorage.getItem('customersData');
      const customers = savedCustomers ? JSON.parse(savedCustomers) : [];
      const today = new Date();
      const todayFormatted = today.toISOString().slice(5, 10); // Formato MM-DD

      const birthdays = customers.filter((customer) => {
        const customerDOB = customer.dob?.split('/').reverse().join('-'); // Convertendo DD/MM/YYYY para YYYY-MM-DD
        return customerDOB?.slice(5, 10) === todayFormatted;
      });

      setBirthdaysToday(birthdays);
    } catch (error) {
      console.error('Erro ao verificar aniversariantes:', error);
      Alert.alert('Erro', 'Não foi possível carregar os aniversariantes.');
    }
  };

  const handleDontRemindToday = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10); // Formato YYYY-MM-DD
      await AsyncStorage.setItem('skipBirthdayReminder', today);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar preferência de lembrete:', error);
      Alert.alert('Erro', 'Não foi possível salvar a preferência.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Aniversariantes do Dia</Text>
          {birthdaysToday.length > 0 ? (
            <FlatList
              data={birthdaysToday}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.birthdayItem}>
                  <Text style={styles.customerName}>{item.name}</Text>
                  <Text style={styles.customerPhone}>{item.phone || 'Sem telefone'}</Text>
                </View>
              )}
            />
          ) : (
            <Text style={styles.noBirthdays}>Nenhum aniversariante hoje!</Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Fechar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleDontRemindToday}
            >
              <Text style={styles.buttonText}>Não lembrar mais hoje</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2D3142',
  },
  birthdayItem: {
    marginBottom: 10,
    alignItems: 'center',
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A86FF',
  },
  customerPhone: {
    fontSize: 16,
    color: '#6B7280',
  },
  noBirthdays: {
    fontSize: 16,
    color: '#BDBDBD',
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  closeButton: {
    backgroundColor: '#27AE60',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  skipButton: {
    backgroundColor: '#E74C3C',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default BirthdayModal;
