import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import SideMenu from '../../componentes/SideMenu ';

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
    Alert.alert('Excluir Meta', 'Tem certeza de que deseja excluir esta meta?', [
      { text: 'Cancelar', style: 'cancel' },
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
    ]);
  };

  const handleEdit = (item, index) => {
    navigation.navigate('EditGoal', { item, index });
  };

  const handlePress = (item) => {
    navigation.navigate('AddSalesScreen', { metaId: item.id });
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handlePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.listTextContainer}>
        <Text style={styles.listName}>{item.name}</Text>
        <Text style={styles.listValue}>R$ {parseFloat(item.value).toFixed(2)}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => handleEdit(item, index)}
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
    <SideMenu navigation={navigation}>
      <View style={styles.container}>
        <Text style={styles.title}>Metas</Text>
        <FlatList
          data={data}
          keyExtractor={(item) => (item.id ? item.id.toString() : '0')}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        />

      

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddGoal')}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>Adicionar Meta</Text>
        </TouchableOpacity>
      </View>
    </SideMenu>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F7F9FC',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2D3142',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  listTextContainer: {
    flex: 1,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3142',
  },
  listValue: {
    fontSize: 16,
    color: '#27AE60',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonC: {
    backgroundColor: '#3a86ff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
});

export default MetaScreen;
