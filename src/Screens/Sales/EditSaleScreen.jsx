// src/screens/EditSaleScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditSaleScreen = ({ route, navigation }) => {
  const { sale, metaId } = route.params;
  const [newValue, setNewValue] = useState(sale.value.toString());

  const handleSave = async () => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData) {
        const data = JSON.parse(savedData);
        const metaData = data.find(item => item.id === metaId);
        
        const updatedSales = metaData.sales.map(s => 
          s.id === sale.id ? { ...s, value: parseFloat(newValue) } : s
        );
        const updatedMeta = { ...metaData, sales: updatedSales };
        const updatedData = data.map(item => item.id === metaId ? updatedMeta : item);

        await AsyncStorage.setItem('financeData', JSON.stringify(updatedData));
        Alert.alert('Sucesso', 'Venda atualizada com sucesso!');
        navigation.goBack();
      }
    } catch (error) {
      console.log('Erro ao salvar dados', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Venda</Text>
      <TextInput
        style={styles.input}
        value={newValue}
        onChangeText={setNewValue}
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
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#CCCCCC',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});

export default EditSaleScreen;
