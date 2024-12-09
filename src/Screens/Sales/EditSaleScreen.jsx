import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditSaleScreen = ({ route, navigation }) => {
  const { sale, metaId } = route.params;
  const [selectedDate, setSelectedDate] = useState(sale.date);
  const [saleValue, setSaleValue] = useState(sale.value.toString());
  const [description, setDescription] = useState(sale.description);
  const [paymentMethod, setPaymentMethod] = useState(sale.paymentMethod);
  const [selectedCustomer, setSelectedCustomer] = useState(sale.customer || '');
  const [installments, setInstallments] = useState(
    sale.installments ? sale.installments.toString() : ''
  );
  const [installmentValue, setInstallmentValue] = useState('');

  useEffect(() => {
    calculateInstallment();
  }, [saleValue, installments]);

  const calculateInstallment = () => {
    if (saleValue && installments) {
      const value = (parseFloat(saleValue) / parseInt(installments)).toFixed(2);
      setInstallmentValue(value);
    } else {
      setInstallmentValue('');
    }
  };

  const updateSale = async () => {
    if (!saleValue || (paymentMethod === 'crediario' && (!selectedCustomer || !installments))) {
      Alert.alert(
        'Erro',
        paymentMethod === 'crediario'
          ? 'Por favor, selecione um cliente e insira o número de parcelas.'
          : 'Por favor, insira o valor da venda.'
      );
      return;
    }

    try {
      const savedData = await AsyncStorage.getItem('financeData');
      const parsedData = savedData ? JSON.parse(savedData) : [];
      const metaIndex = parsedData.findIndex((item) => item.id === metaId);

      if (metaIndex === -1) {
        Alert.alert('Erro', 'Meta não encontrada.');
        return;
      }

      const updatedSales = parsedData[metaIndex].sales.map((s) =>
        s.id === sale.id
          ? {
              ...s,
              date: selectedDate,
              value: parseFloat(saleValue),
              description,
              paymentMethod,
              customer: paymentMethod === 'crediario' ? selectedCustomer : null,
              installments: paymentMethod === 'crediario' ? parseInt(installments) : null,
            }
          : s
      );

      parsedData[metaIndex].sales = updatedSales;

      await AsyncStorage.setItem('financeData', JSON.stringify(parsedData));
      Alert.alert('Sucesso', 'Venda atualizada com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.log('Erro ao atualizar venda', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar a venda.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Editar Venda</Text>
        <TextInput
          style={styles.input}
          placeholder="Data"
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholderTextColor="#BDBDBD"
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputLarge]}
            placeholder="Valor da Venda"
            value={saleValue}
            keyboardType="numeric"
            onChangeText={setSaleValue}
            placeholderTextColor="#BDBDBD"
          />
          {paymentMethod === 'crediario' && (
            <>
              <Text style={styles.textInline}>x</Text>
              <TextInput
                style={[styles.input, styles.inputSmall]}
                placeholder="Parcelas"
                value={installments}
                keyboardType="numeric"
                onChangeText={setInstallments}
                placeholderTextColor="#BDBDBD"
              />
              <Text style={styles.textInline}>
                = {installments && installmentValue ? `${installments}x R$ ${installmentValue}` : ''}
              </Text>
            </>
          )}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Descrição"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor="#BDBDBD"
        />
        <Text style={styles.label}>Forma de Pagamento:</Text>
        <View style={styles.optionsContainer}>
          {['dinheiro', 'pix', 'crediario'].map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.optionButton,
                paymentMethod === method && styles.selectedOption,
              ]}
              onPress={() => setPaymentMethod(method)}
            >
              <Text
                style={[
                  styles.optionText,
                  paymentMethod === method && styles.selectedOptionText,
                ]}
              >
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {paymentMethod === 'crediario' && (
          <TextInput
            style={styles.input}
            placeholder="Cliente"
            value={selectedCustomer}
            onChangeText={setSelectedCustomer}
            placeholderTextColor="#BDBDBD"
          />
        )}
        <TouchableOpacity style={styles.button} onPress={updateSale}>
          <Text style={styles.buttonText}>Atualizar Venda</Text>
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
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2D3142',
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#2D3142',
  },
  inputLarge: {
    flex: 2,
  },
  inputSmall: {
    flex: 1,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInline: {
    marginHorizontal: 5,
    fontSize: 16,
    color: '#2D3142',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    color: '#2D3142',
  },
  optionsContainer: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  optionButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#3A86FF',
    borderColor: '#3A86FF',
  },
  optionText: {
    fontSize: 14,
    color: '#2D3142',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EditSaleScreen;
