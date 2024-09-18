// src/screens/EditMetaScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditMetaScreen = ({ route, navigation }) => {
  const { item, index } = route.params;
  const [name, setName] = useState(item.name);
  const [value, setValue] = useState(item.value);
  const [days, setDays] = useState(item.salesDays); // Corrigido para `salesDays`

  useEffect(() => {
    setName(item.name);
    setValue(item.value);
    setDays(item.salesDays); // Corrigido para `salesDays`
  }, [item]);

  const saveChanges = async () => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      const parsedData = savedData ? JSON.parse(savedData) : [];
      parsedData[index] = { ...parsedData[index], name, value, salesDays: days }; // Corrigido para `salesDays`
      await AsyncStorage.setItem('financeData', JSON.stringify(parsedData));
      navigation.navigate('Meta'); // Voltar para a tela "Meta"
    } catch (error) {
      console.log('Erro ao salvar alterações', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Meta</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Valor"
        value={value}
        keyboardType="numeric"
        onChangeText={setValue}
      />
      <TextInput
        style={styles.input}
        placeholder="Dias de Venda"
        value={days}
        keyboardType="numeric"
        onChangeText={setDays}
      />
      <Button title="Salvar" onPress={saveChanges} />
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

export default EditMetaScreen;
