import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditMetaScreen = ({ route, navigation }) => {
  /**
   * Agora capturamos também "lojaId" se ele vier
   * de onde chamamos: navigation.navigate('EditMetaScreen', { item, index, lojaId })
   */
  const { item, index, lojaId } = route.params || {};

  const [name, setName] = useState(item.name);
  const [value, setValue] = useState(item.value);
  const [days, setDays] = useState(item.salesDays);

  useEffect(() => {
    setName(item.name);
    setValue(item.value);
    setDays(item.salesDays);
  }, [item]);

  const saveChanges = async () => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      const parsedData = savedData ? JSON.parse(savedData) : [];

      // Atualiza o item no array
      parsedData[index] = {
        ...parsedData[index],
        name,
        value,
        salesDays: days
      };

      // Salva de volta no AsyncStorage
      await AsyncStorage.setItem('financeData', JSON.stringify(parsedData));

      // Se a tela "Goal" precisa do "lojaId", repassamos:
      navigation.navigate('Goal', { lojaId });

      // Se a tela "Goal" NÃO precisa de "lojaId", use apenas:
      // navigation.navigate('Goal');
    } catch (error) {
      console.log('Erro ao salvar alterações', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Editar Meta</Text>

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
          keyboardType="numeric"
          onChangeText={setValue}
          placeholderTextColor="#BDBDBD"
        />

        <TextInput
          style={styles.input}
          placeholder="Dias de Venda"
          value={days}
          keyboardType="numeric"
          onChangeText={setDays}
          placeholderTextColor="#BDBDBD"
        />

        <TouchableOpacity style={styles.button} onPress={saveChanges}>
          <Text style={styles.buttonText}>Salvar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditMetaScreen;

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
