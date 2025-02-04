import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuthContext } from '../../contexts/auth';
// Importar Firebase
import { getDatabase, ref, push, update, get } from 'firebase/database';

export default function AddCrediarioScreen({ route, navigation }) {
  // Recebemos lojaId como parâmetro
  const { lojaId } = route.params || {};
  const { user } = useAuthContext();

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amount, setAmount] = useState('');
  const [installments, setInstallments] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }
    if (!lojaId) {
      Alert.alert('Erro', 'Loja não foi fornecida.');
      return;
    }
    fetchCustomers();
  }, []);

  /**
   * Lê clientes em /users/{uid}/lojas/{lojaId}/clientes
   */
  const fetchCustomers = async () => {
    try {
      const db = getDatabase();
      const customersRef = ref(db, `users/${user.uid}/lojas/${lojaId}/clientes`);
      const snapshot = await get(customersRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsed = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setCustomers(parsed);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao carregar os clientes.');
      console.error(error);
    }
  };

  /**
   * Salva novo crediário em /users/{uid}/lojas/{lojaId}/crediarios
   */
  const handleAddCrediario = async () => {
    try {
      if (!user?.uid) {
        Alert.alert('Erro', 'Usuário não autenticado.');
        return;
      }
      if (!lojaId) {
        Alert.alert('Erro', 'Loja não foi fornecida.');
        return;
      }
      if (!selectedCustomer || !amount || !installments) {
        Alert.alert('Erro', 'Todos os campos são obrigatórios.');
        return;
      }

      const total = parseFloat(amount);
      const numParcelas = parseInt(installments, 10);
      if (isNaN(total) || isNaN(numParcelas) || numParcelas <= 0) {
        Alert.alert('Erro', 'Valores inválidos para valor ou parcelas.');
        return;
      }

      // Gera o array de parcelas
      const newParcels = Array.from({ length: numParcelas }, (_, index) => {
        const idParcela = index + 1;
        // Data de vencimento (mês seguinte a cada parcela)
        const dueDateObj = new Date(
          purchaseDate.getFullYear(),
          purchaseDate.getMonth() + index,
          purchaseDate.getDate()
        );
        return {
          id: idParcela,
          dueDate: dueDateObj.toISOString(),
          amount: total / numParcelas, // <--- Cada parcela terá esse 'amount'
          paid: false,
          paymentDate: null,
        };
      });

      // Monta objeto do crediário
      const newCrediario = {
        id: Date.now().toString(),
        customer: selectedCustomer,   // nome do cliente
        amount: total,               // valor total
        installments: numParcelas,   // nº de parcelas
        purchaseDate: purchaseDate.toISOString(),
        parcels: newParcels,
        closed: false,
        closedDate: null,
        description: `Crediário do cliente ${selectedCustomer}`,
      };

      // Salva no Firebase
      const db = getDatabase();
      const crediariosRef = ref(db, `users/${user.uid}/lojas/${lojaId}/crediarios`);
      const newRef = push(crediariosRef);
      await update(newRef, newCrediario);

      Alert.alert('Sucesso', 'Crediário adicionado com sucesso!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o crediário.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adicionar Crediário</Text>

      <Text style={styles.label}>Cliente:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCustomer}
          onValueChange={(itemValue) => setSelectedCustomer(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Selecione um cliente" value={null} />
          {customers.map((customer) => (
            <Picker.Item
              key={customer.id}
              label={customer.name}
              value={customer.name}
            />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Valor Total:</Text>
      <TextInput
        style={styles.input}
        placeholder="Valor Total"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Parcelas:</Text>
      <TextInput
        style={styles.input}
        placeholder="Quantidade de Parcelas"
        keyboardType="numeric"
        value={installments}
        onChangeText={setInstallments}
      />

      <Text style={styles.label}>Data da Compra:</Text>
      <TouchableOpacity
        style={styles.datePicker}
        onPress={() => setShowDatePicker(true)}
      >
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

// Estilos
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3142',
    marginTop: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
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
