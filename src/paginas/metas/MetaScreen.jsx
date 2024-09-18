// src/screens/MetaScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const MetaScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const savedData = await AsyncStorage.getItem('financeData');
      if (savedData !== null) {
        setData(JSON.parse(savedData));
      }
    } catch (error) {
      console.log('Erro ao carregar dados', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Excluir Meta',
      'Tem certeza de que deseja excluir esta meta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          onPress: async () => {
            try {
              const updatedData = data.filter((item) => item.id !== id);
              await AsyncStorage.setItem('financeData', JSON.stringify(updatedData));
              setData(updatedData);
            } catch (error) {
              console.log('Erro ao excluir dados', error);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (item) => {
    navigation.navigate('EditMeta', { item });
  };

  const handlePress = (item) => {
    navigation.navigate('AddSalesScreen', { metaId: item.id });
  };
  

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handlePress(item)}
    >
      <View style={styles.listTextContainer}>
        <Text style={styles.listName}>{item.name}</Text>
        <Text style={styles.listValue}>{item.value}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => handleEdit(item)}
        >
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.buttonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Metas</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id ? item.id.toString() : '0'} // Verificação para null/undefined
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      />
      <Button title="Adicionar" onPress={() => navigation.navigate('AddMeta')} />
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
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  listTextContainer: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listValue: {
    fontSize: 16,
    color: '#27AE60',
    marginTop: 5, // Espaçamento entre o nome e o valor
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  editButton: {
    backgroundColor: '#3498DB',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    color: '#FFFFFF',
  },
});

export default MetaScreen;
