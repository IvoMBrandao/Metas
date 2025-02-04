import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth';
import { Ionicons } from '@expo/vector-icons';

const CustomersScreen = ({ route, navigation }) => {
  const { lojaId } = route.params || {};
  const { user } = useAuthContext();
  const [customers, setCustomers] = useState([]);

  if (!lojaId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Erro: Loja não especificada.</Text>
      </View>
    );
  }

  // Função para carregar os clientes do Firebase
  const loadCustomers = useCallback(() => {
    if (!user || !user.uid) return;
    const db = getDatabase();
    const customersRef = ref(db, `users/${user.uid}/lojas/${lojaId}/clientes`);
    const unsubscribe = onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Converte o objeto em array
        const arr = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setCustomers(arr);
      } else {
        setCustomers([]);
      }
    }, (error) => {
      Alert.alert('Erro', 'Não foi possível carregar os clientes.');
      console.error('Erro ao carregar clientes:', error);
    });
    return unsubscribe;
  }, [user, lojaId]);

  useEffect(() => {
    const unsubscribe = loadCustomers();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadCustomers]);

  const renderItem = ({ item }) => (
    <View style={styles.customerItem}>
      <Text style={styles.customerName}>{item.name}</Text>
      {item.phone && <Text style={styles.customerDetails}>Telefone: {item.phone}</Text>}
      {item.dob && <Text style={styles.customerDetails}>Data de Nascimento: {item.dob}</Text>}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() =>
            navigation.navigate('EditCustomer', { customer: item, lojaId })
          }
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
                { text: 'Excluir', onPress: () => {/* Implementar exclusão se necessário */} },
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
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      ) : (
        <Text style={styles.noCustomers}>Nenhum cliente encontrado.</Text>
      )}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('AddCustomers', { lojaId })}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f7f9fc' },
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
  customerName: { fontSize: 18, fontWeight: 'bold', color: '#3a86ff' },
  customerDetails: { fontSize: 16, color: '#2d3142' },
  noCustomers: { textAlign: 'center', fontSize: 16, color: '#bdbdbd', marginTop: 20 },
  actionButtons: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' },
  button: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: { backgroundColor: '#3A86FF' },
  deleteButton: { backgroundColor: '#E74C3C' },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: 'red', textAlign: 'center', padding: 20 },
});

export default CustomersScreen;
