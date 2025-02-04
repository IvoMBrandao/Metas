import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { getDatabase, ref, push } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';

const AddCustomersScreen = ({ route, navigation }) => {
  // Recebe o lojaId via route.params (ao navegar, passe: navigation.navigate('AddCustomers', { lojaId: 'ID_DA_LOJA' }))
  const { lojaId } = route.params || {};
  const { user } = useAuthContext();

  if (!lojaId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Erro: Loja não especificada.</Text>
      </View>
    );
  }

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');

  // Funções auxiliares para validação e formatação de data (DD/MM/AAAA)
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
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  };

  const saveCustomer = async () => {
    if (!user || !user.uid) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }
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

    const newCustomer = {
      name,
      phone,
      dob,
    };

    try {
      const db = getDatabase();
      // Salva o cliente no caminho: /users/{user.uid}/lojas/{lojaId}/clientes/
      const customersRef = ref(db, `users/${user.uid}/lojas/${lojaId}/clientes`);
      await push(customersRef, newCustomer);
      Alert.alert('Sucesso', 'Cliente adicionado com sucesso.');
      navigation.goBack();
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
          maxLength={10}
        />
        <TouchableOpacity style={styles.button} onPress={saveCustomer}>
          <Text style={styles.buttonText}>Salvar Cliente</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  scrollContainer: { padding: 20 },
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
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: 'red', textAlign: 'center', padding: 20 },
});

export default AddCustomersScreen;
