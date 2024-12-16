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

export default function EditCustomerScreen({ route, navigation }) {
  const { customer, index } = route.params;
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [dob, setDob] = useState(customer?.dob || '');

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
    let cleaned = text.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (cleaned.length > 2) cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    if (cleaned.length > 5) cleaned = `${cleaned.slice(0, 5)}/${cleaned.slice(5, 9)}`;
    setDob(cleaned);
  };

  const saveChanges = async () => {
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
      const savedCustomers = await AsyncStorage.getItem('customersData');
      const parsedCustomers = savedCustomers ? JSON.parse(savedCustomers) : [];
      parsedCustomers[index] = { ...parsedCustomers[index], name, phone, dob };
      await AsyncStorage.setItem('customersData', JSON.stringify(parsedCustomers));
      Alert.alert('Sucesso', 'Dados atualizados com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao salvar os dados.');
      console.error('Erro ao salvar dados:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Cliente</Text>

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
        onChangeText={formatDob}
        placeholderTextColor="#BDBDBD"
        maxLength={10} // Limita a entrada a 10 caracteres (DD/MM/AAAA)
      />

      <TouchableOpacity style={styles.saveButton} onPress={saveChanges}>
        <Text style={styles.saveButtonText}>Salvar Alterações</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F7F9FC',
  },
  title: {
    fontSize: 24,
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
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#2D3142',
  },
  saveButton: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
