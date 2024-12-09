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

      const newId = data.length > 0 ? data[data.length - 1].id + 1 : 1;

      const newMeta = {
        id: newId,
        name,
        value,
        salesDays,
      };

      data.push(newMeta);
      await AsyncStorage.setItem('financeData', JSON.stringify(data));

      navigation.goBack();
    } catch (error) {
      console.log('Erro ao salvar dados', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Adicionar Meta</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#BDBDBD"
        />
        <TextInput
          style={styles.input}
          placeholder="Valor"
          value={value}
          onChangeText={setValue}
          keyboardType="numeric"
          placeholderTextColor="#BDBDBD"
        />
        <TextInput
          style={styles.input}
          placeholder="Dias de Venda"
          value={salesDays}
          onChangeText={setSalesDays}
          keyboardType="numeric"
          placeholderTextColor="#BDBDBD"
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Salvar</Text>
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

export default AddMetaScreen;
