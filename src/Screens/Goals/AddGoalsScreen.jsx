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
import { getDatabase, ref, push } from 'firebase/database';
import { useAuthContext } from '../../contexts/auth'; // Ajuste se for diferente no seu projeto

const AddMetaScreen = ({ navigation, route }) => {
  // Recebe o ID da loja via parâmetro
  const { lojaId } = route.params; 

  // Estados dos inputs
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [salesDays, setSalesDays] = useState('');

  // Hook de contexto que retorna "user" (com uid)
  const { user } = useAuthContext();

  // Referência ao DB do Firebase
  const db = getDatabase();

  // Formata texto para o padrão de moeda "R$ ... , ..."
  const formatToReal = (text) => {
    let cleaned = text.replace(/\D/g, '');
    let number = parseInt(cleaned, 10);

    if (isNaN(number)) {
      number = 0;
    }

    let reais = (number / 100).toFixed(2);
    return Number(reais).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Função para salvar a meta
  const handleSave = async () => {
    // Validação básica
    if (!name || !value) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    // Converte valor "R$ 1.000,00" em número
    const parsedValue = parseFloat(value.replace(/\D/g, '')) / 100;
    if (isNaN(parsedValue)) {
      Alert.alert('Erro', 'Valor inválido.');
      return;
    }

    if (!user || !user.uid) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      // Cria referência para /users/UID/lojas/lojaId/metas
      const metasRef = ref(db, `users/${user.uid}/lojas/${lojaId}/metas`);
      
      // push => gera um novo ID automático para a meta
      await push(metasRef, {
        name,
        value: parsedValue,
        salesDays: salesDays || null,
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Sucesso', 'Meta adicionada com sucesso!');
      navigation.goBack(); // Volta para a tela anterior
    } catch (error) {
      console.error('Erro ao salvar a meta:', error);
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

        {/* Nome da meta */}
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

        {/* Valor da meta (formatado em moeda) */}
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

        {/* Dias de venda (opcional) */}
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

export default AddMetaScreen;

// Estilos básicos
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
    backgroundColor: '#fff',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
