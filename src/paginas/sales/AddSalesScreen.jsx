// src/screens/AddSalesScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddSalesScreen = ({ route, navigation }) => {
  const { metaId } = route.params;
  const [saleValue, setSaleValue] = useState('');

  const handleAddSale = async () => {
    if (!saleValue) {
      Alert.alert('Erro', 'O valor da venda é obrigatório.');
      return;
    }

    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData) {
        const data = JSON.parse(savedData);
        const metaIndex = data.findIndex(item => item.id === metaId);
        if (metaIndex > -1) {
          const newSale = {
            id: Date.now().toString(),
            value: parseFloat(saleValue),
          };
          data[metaIndex].sales = data[metaIndex].sales ? [...data[metaIndex].sales, newSale] : [newSale];
          await AsyncStorage.setItem('financeData', JSON.stringify(data));
          Alert.alert('Sucesso', 'Venda adicionada com sucesso.');
          setSaleValue('');
        }
      }
    } catch (error) {
      console.log('Erro ao adicionar venda', error);
    }
  };

  const navigateToSalesDetail = () => {
    navigation.navigate('SalesDetailScreen', { metaId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adicionar Venda</Text>
      <TextInput
        style={styles.input}
        placeholder="Valor da Venda"
        keyboardType="numeric"
        value={saleValue}
        onChangeText={setSaleValue}
      />
      <View style={styles.buttonContainer}>
        <Button title="Adicionar Venda" onPress={handleAddSale} />
        <Button
          title="Ver Detalhes das Vendas"
          onPress={navigateToSalesDetail}
          color="#3498DB"
        />
      </View>
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
    borderColor: '#BDC3C7',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 15,
  },
});

export default AddSalesScreen;
