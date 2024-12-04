// src/screens/AddMetaScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Adsbanner from '../../componentes/Adsbanner';

const AddMetaScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [salesDays, setSalesDays] = useState('');

  const handleSave = async () => {
    if (!name || !value) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      const savedData = await AsyncStorage.getItem('financeData');
      const data = savedData ? JSON.parse(savedData) : [];

      // Gerar um ID manualmente
      const newId = data.length > 0 ? data[data.length - 1].id + 1 : 1;

      const newMeta = {
        id: newId, // Gerando um ID único manualmente
        name,
        value,
        salesDays, // Incluindo o campo salesDays
      };

      data.push(newMeta);
      await AsyncStorage.setItem('financeData', JSON.stringify(data));
      navigation.goBack();
    } catch (error) {
      console.log('Erro ao salvar dados', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adicionar Meta</Text>
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
        onChangeText={setValue}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Dias de Venda"
        value={salesDays}
        onChangeText={setSalesDays}
        keyboardType="numeric"
      />
      <Button title="Salvar" onPress={handleSave} />
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
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#CCCCCC',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
});

export default AddMetaScreen;
