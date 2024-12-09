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

  const saveCustomer = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O campo Nome é obrigatório.');
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
          onChangeText={setDob}
          placeholderTextColor="#BDBDBD"
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
