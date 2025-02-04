import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getDatabase, ref, update } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';

const EditCustomerScreen = ({ route, navigation }) => {
  const { customer, lojaId } = route.params;
  const { user } = useAuthContext();

  if (!lojaId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Erro: Loja não especificada.</Text>
      </View>
    );
  }

  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [dob, setDob] = useState(customer?.dob || '');

  // Funções auxiliares para data
  const isLeapYear = (year) =>
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

  const getDaysInMonth = (month, year) => {
    if (month === 2) return isLeapYear(year) ? 29 : 28;
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
    return day <= maxDays;
  };

  const formatDob = (text) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  };

  const saveChanges = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O campo Nome é obrigatório.');
      return;
    }
    if (dob && !validateDob(dob)) {
      Alert.alert('Erro', 'A data de nascimento é inválida. Use o formato DD/MM/AAAA.');
      return;
    }
    if (!user || !user.uid) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }
    try {
      const db = getDatabase();
      const customerRef = ref(db, `users/${user.uid}/lojas/${lojaId}/clientes/${customer.id}`);
      const updatedCustomer = { name, phone, dob };
      await update(customerRef, updatedCustomer);
      Alert.alert('Sucesso', 'Dados atualizados com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar os dados.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Cliente (Loja {lojaId})</Text>
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
        maxLength={10}
      />
      <TouchableOpacity style={styles.saveButton} onPress={saveChanges}>
        <Text style={styles.saveButtonText}>Salvar Alterações</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7F9FC' },
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
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: 'red', textAlign: 'center', padding: 20 },
});

export default EditCustomerScreen;
