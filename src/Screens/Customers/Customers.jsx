import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function CustomersScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);

  // Função para carregar os clientes salvos
  const loadCustomers = useCallback(async () => {
    try {
      const savedCustomers = await AsyncStorage.getItem('customersData');
      const parsedCustomers = savedCustomers ? JSON.parse(savedCustomers) : [];
      setCustomers(parsedCustomers);
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao carregar os clientes.');
      console.error('Erro ao carregar clientes:', error);
    }
  }, []);

  // Recarregar os clientes ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [loadCustomers])
  );

  // Excluir cliente
  const deleteCustomer = async (index) => {
    try {
      const updatedCustomers = [...customers];
      updatedCustomers.splice(index, 1);
      await AsyncStorage.setItem('customersData', JSON.stringify(updatedCustomers));
      setCustomers(updatedCustomers);
      Alert.alert('Sucesso', 'Cliente excluído com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao excluir o cliente.');
      console.error('Erro ao excluir cliente:', error);
    }
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.customerItem}>
      <Text style={styles.customerName}>{item.name}</Text>
      {item.phone && <Text style={styles.customerDetails}>Telefone: {item.phone}</Text>}
      {item.dob && <Text style={styles.customerDetails}>Data de Nascimento: {item.dob}</Text>}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => navigation.navigate('EditCustomer', { customer: item, index })}
        >
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() =>
            Alert.alert(
              'Excluir Cliente',
              'Você tem certeza que deseja excluir este cliente?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Excluir', onPress: () => deleteCustomer(index) },
              ]
            )
          }
        >
          <Text style={styles.buttonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clientes</Text>
      {customers.length > 0 ? (
        <FlatList
          data={customers}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
        />
      ) : (
        <Text style={styles.noCustomers}>Nenhum cliente encontrado.</Text>
      )}
      {/* Botão flutuante */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('AddCustomers')}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

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
  customerItem: {
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3a86ff',
  },
  customerDetails: {
    fontSize: 16,
    color: '#2d3142',
  },
  noCustomers: {
    textAlign: 'center',
    fontSize: 16,
    color: '#bdbdbd',
    marginTop: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3A86FF',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3A86FF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
});
