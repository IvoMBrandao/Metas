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

  /**
   * Função para formatar o texto para o padrão de moeda brasileira
   */
  const formatToReal = (text) => {
    // Remove tudo que não é dígito
    let cleaned = text.replace(/\D/g, '');

    // Converte para número inteiro
    let number = parseInt(cleaned, 10);

    if (isNaN(number)) {
      number = 0;
    }

    // Divide por 100 para obter os centavos
    let reais = (number / 100).toFixed(2);

    // Formata para o padrão brasileiro de moeda
    let formatted = Number(reais).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return formatted;
  };

  /**
   * Função para salvar a meta no AsyncStorage
   */
  const handleSave = async () => {
    // Validação dos campos obrigatórios
    if (!name || !value) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    // Remove caracteres não numéricos e converte para número
    const parsedValue = parseFloat(value.replace(/\D/g, '')) / 100;

    if (isNaN(parsedValue)) {
      Alert.alert('Erro', 'Valor inválido.');
      return;
    }

    try {
      const savedData = await AsyncStorage.getItem('financeData');
      const data = savedData ? JSON.parse(savedData) : [];

      const newId = data.length > 0 ? data[data.length - 1].id + 1 : 1;

      const newMeta = {
        id: newId,
        name,
        value: parsedValue, // Armazena como número
        salesDays,
      };

      data.push(newMeta);
      await AsyncStorage.setItem('financeData', JSON.stringify(data));

      Alert.alert('Sucesso', 'Meta adicionada com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.log('Erro ao salvar dados', error);
      Alert.alert('Erro', 'Não foi possível salvar a meta.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Adicionar Meta</Text>

        {/* Nome */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#BDBDBD"
          />
        </View>

        {/* Valor */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Valor</Text>
          <TextInput
            style={styles.input}
            placeholder="Valor"
            value={value}
            onChangeText={(text) => setValue(formatToReal(text))}
            keyboardType="numeric"
            placeholderTextColor="#BDBDBD"
          />
        </View>

        {/* Dias de Venda */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Dias de Venda</Text>
          <TextInput
            style={styles.input}
            placeholder="Dias de Venda"
            value={salesDays}
            onChangeText={setSalesDays}
            keyboardType="numeric"
            placeholderTextColor="#BDBDBD"
          />
        </View>

        {/* Botão Salvar */}
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
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#2D3142',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 15,
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
