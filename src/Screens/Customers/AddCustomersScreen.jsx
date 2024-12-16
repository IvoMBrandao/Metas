import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddCustomersScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');

  const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };

  const getDaysInMonth = (month, year) => {
    if (month === 2) {
      return isLeapYear(year) ? 29 : 28;
    }
    return [4, 6, 9, 11].includes(month) ? 30 : 31;
  };

  const validateDob = (dob) => {
    const parts = dob.split('/');
    if (parts.length !== 3) return false;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (day < 1 || month < 1 || month > 12) return false;

    const maxDays = getDaysInMonth(month, year);
    if (day > maxDays) return false;

    return true;
  };

  const formatDob = (text) => {
    const cleaned = text.replace(/\D/g, ''); // Remove caracteres não numéricos
    const length = cleaned.length;

    if (length <= 2) return cleaned;
    if (length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  };

  const saveCustomer = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O campo Nome é obrigatório.');
      return;
    }

    if (dob && !validateDob(dob)) {
      Alert.alert(
        'Erro',
        'A data de nascimento é inválida. Verifique o formato (DD/MM/AAAA) e os valores.'
      );
      return;
    }

    try {
      const newCustomer = {
        id: Date.now().toString(),
        name,
        phone,
        dob,
      };

      const existingCustomers = await AsyncStorage.getItem('customersData');
      const customers = existingCustomers ? JSON.parse(existingCustomers) : [];
      customers.push(newCustomer);

      await AsyncStorage.setItem('customersData', JSON.stringify(customers));

      Alert.alert('Sucesso', 'Cliente adicionado com sucesso.');
      navigation.goBack(); // Retorna para a tela anterior
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      Alert.alert('Erro', 'Não foi possível salvar o cliente.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Adicionar Cliente</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome (obrigatório)"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#BDBDBD"
        />

        <TextInput
          style={styles.input}
          placeholder="Telefone"
          value={phone}
          keyboardType="phone-pad"
          onChangeText={setPhone}
          placeholderTextColor="#BDBDBD"
        />

        <TextInput
          style={styles.input}
          placeholder="Data de Nascimento (DD/MM/AAAA)"
          value={dob}
          keyboardType="numeric"
          onChangeText={(text) => setDob(formatDob(text))}
          placeholderTextColor="#BDBDBD"
          maxLength={10} // Limita o campo a 10 caracteres
        />

        <TouchableOpacity style={styles.button} onPress={saveCustomer}>
          <Text style={styles.buttonText}>Salvar Cliente</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2D3142',
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#2D3142',
  },
  button: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddCustomersScreen;
