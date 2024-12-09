import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddCrediarioScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amount, setAmount] = useState('');
  const [installments, setInstallments] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const savedCustomers = await AsyncStorage.getItem('customersData');
        const parsedCustomers = savedCustomers ? JSON.parse(savedCustomers) : [];
        setCustomers(parsedCustomers);
      } catch (error) {
        Alert.alert('Erro', 'Ocorreu um erro ao carregar os clientes.');
      }
    };

    loadCustomers();
  }, []);

  const handleAddCrediario = async () => {
    if (!selectedCustomer || !amount || !installments) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios.');
      return;
    }

    const newCrediario = {
      id: Date.now(),
      customer: selectedCustomer,
      amount: parseFloat(amount),
      installments: parseInt(installments),
      purchaseDate: purchaseDate.toISOString(),
      parcels: Array.from({ length: installments }, (_, index) => ({
        id: index + 1,
        dueDate: new Date(
          purchaseDate.getFullYear(),
          purchaseDate.getMonth() + index,
          purchaseDate.getDate()
        ).toISOString(),
        amount: parseFloat(amount) / parseInt(installments),
        paid: false,
      })),
    };

    try {
      const savedCrediarios = await AsyncStorage.getItem('crediarioData');
      const parsedCrediarios = savedCrediarios ? JSON.parse(savedCrediarios) : [];
      parsedCrediarios.push(newCrediario);
      await AsyncStorage.setItem('crediarioData', JSON.stringify(parsedCrediarios));
      Alert.alert('Sucesso', 'Crediário adicionado com sucesso.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o crediário.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adicionar Crediário</Text>
      <Picker
        selectedValue={selectedCustomer}
        onValueChange={(itemValue) => setSelectedCustomer(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Selecione um cliente" value={null} />
        {customers.map((customer) => (
          <Picker.Item key={customer.name} label={customer.name} value={customer.name} />
        ))}
      </Picker>

      <TextInput
        style={styles.input}
        placeholder="Valor Total"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <TextInput
        style={styles.input}
        placeholder="Quantidade de Parcelas"
        keyboardType="numeric"
        value={installments}
        onChangeText={setInstallments}
      />
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePicker}>
        <Text style={styles.datePickerText}>
          {purchaseDate ? purchaseDate.toDateString() : 'Selecionar Data'}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={purchaseDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setPurchaseDate(date);
          }}
        />
      )}
      <TouchableOpacity style={styles.button} onPress={handleAddCrediario}>
        <Text style={styles.buttonText}>Salvar Crediário</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f9fc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2d3142',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 15,
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
  datePicker: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#BDBDBD',
    marginBottom: 15,
  },
  datePickerText: {
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
