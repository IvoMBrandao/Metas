// src/screens/AddSaleScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddSaleScreen = ({ route, navigation }) => {
  const { metaId } = route.params;
  const [selectedDate, setSelectedDate] = useState('');
  const [saleValue, setSaleValue] = useState('');

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
  };

  const addSale = async () => {
    if (!selectedDate || !saleValue) {
      Alert.alert('Erro', 'Por favor, selecione uma data e insira o valor da venda.');
      return;
    }

    try {
      const savedData = await AsyncStorage.getItem('financeData');
      const parsedData = savedData ? JSON.parse(savedData) : [];
      const metaIndex = parsedData.findIndex(item => item.id === metaId);

      if (metaIndex === -1) {
        Alert.alert('Erro', 'Meta não encontrada.');
        return;
      }

      // Adiciona a venda ao item selecionado
      parsedData[metaIndex].sales = parsedData[metaIndex].sales || [];
      parsedData[metaIndex].sales.push({
        id: Date.now().toString(), // Gerar um ID único para a venda
        date: selectedDate,
        value: parseFloat(saleValue),
      });

      await AsyncStorage.setItem('financeData', JSON.stringify(parsedData));
      Alert.alert('Sucesso', 'Venda adicionada com sucesso!');
     
    } catch (error) {
      console.log('Erro ao adicionar venda', error);
      Alert.alert('Erro', 'Ocorreu um erro ao adicionar a venda.');
    }
  };

  const goToSalesDetail = () => {
    if (!selectedDate) {
      Alert.alert('Erro', 'Por favor, selecione uma data.');
      return;
    }

    navigation.navigate('SalesDetailScreen', { metaId, date: selectedDate });
  };

  const goToMonthSales = () => {
    navigation.navigate('MonthSalesScreen', { metaId, monthYear: selectedDate.substr(0, 7) });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adicionar Venda</Text>
      <Calendar
        onDayPress={handleDateSelect}
        markedDates={{ [selectedDate]: { selected: true, marked: true, selectedColor: 'blue' } }}
      />
      <TextInput
        style={styles.input}
        placeholder="Valor da Venda"
        value={saleValue}
        keyboardType="numeric"
        onChangeText={setSaleValue}
      />
      <Button title="Adicionar Venda" onPress={addSale} />
      <Button title="Ver Vendas do Dia" onPress={goToSalesDetail} />
      <Button title="Ver Meta do Mês" onPress={goToMonthSales} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#7F8C8D',
    marginBottom: 20,
    padding: 5,
  },
});

export default AddSaleScreen;
