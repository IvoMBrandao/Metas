import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';

// Configuração do calendário para português do Brasil
LocaleConfig.locales['pt-BR'] = {
  monthNames: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ],
  monthNamesShort: [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ],
  dayNames: [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado',
  ],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-BR';

const AddSaleScreen = ({ route, navigation }) => {
  const { metaId } = route.params;
  const [selectedDate, setSelectedDate] = useState('');
  const [saleValue, setSaleValue] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [installments, setInstallments] = useState('');
  const [installmentValue, setInstallmentValue] = useState('');
  const [isCustomerModalVisible, setCustomerModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDebit, setIsDebit] = useState(false);

  useEffect(() => {
    // Listener para recarregar os clientes quando a tela ganha foco
    const unsubscribe = navigation.addListener('focus', () => {
      loadCustomers();
    });
    return unsubscribe;
  }, [navigation]);
  



  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const savedCustomers = await AsyncStorage.getItem('customersData');
      const parsedCustomers = savedCustomers ? JSON.parse(savedCustomers) : [];
      setCustomers(parsedCustomers);
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao carregar os clientes.');
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
  };

  const calculateInstallment = () => {
    if (saleValue && installments) {
      const value = (parseFloat(saleValue) / parseInt(installments)).toFixed(2);
      setInstallmentValue(value);
    } else {
      setInstallmentValue('');
    }
  };

  useEffect(() => {
    calculateInstallment();
  }, [saleValue, installments]);

  const addSale = async () => {
    if (!selectedDate || !saleValue || (paymentMethod === 'crediario' && !selectedCustomer)) {
      Alert.alert(
        'Erro',
        paymentMethod === 'crediario'
          ? 'Por favor, selecione um cliente e insira o valor e parcelas.'
          : 'Por favor, selecione uma data e insira o valor da venda.'
      );
      return;
    }

    try {
      const savedData = await AsyncStorage.getItem('financeData');
      const parsedData = savedData ? JSON.parse(savedData) : [];
      const metaIndex = parsedData.findIndex((item) => item.id === metaId);

      if (metaIndex === -1) {
        Alert.alert('Erro', 'Meta não encontrada.');
        return;
      }

      let parcels = [];
      if (paymentMethod === 'crediario' || (paymentMethod === 'cartao' && !isDebit)) {
        const parcelValue = parseFloat(saleValue) / parseInt(installments);
        const initialDate = new Date(selectedDate);
        initialDate.setMonth(initialDate.getMonth() + 1);

        for (let i = 0; i < parseInt(installments); i++) {
          const parcelDate = new Date(initialDate);
          parcelDate.setMonth(initialDate.getMonth() + i);
          parcels.push({
            number: i + 1,
            value: parcelValue.toFixed(2),
            date: parcelDate.toISOString().split('T')[0],
            paid: false,
          });
        }
      }

      const newSale = {
        id: Date.now().toString(),
        date: selectedDate,
        value: parseFloat(saleValue),
        description,
        paymentMethod: isDebit
          ? 'cartao-debito'
          : paymentMethod === 'cartao' && installments === '1'
          ? 'cartao-credito-a-vista'
          : paymentMethod === 'cartao' && parseInt(installments) > 1
          ? 'cartao-credito-parcelado'
          : paymentMethod,
        customer: selectedCustomer || null,
        installments: paymentMethod === 'crediario' ? parseInt(installments) : null,
        parcels: paymentMethod === 'crediario' ? parcels : [],
      };
      parsedData[metaIndex].sales = parsedData[metaIndex].sales || [];
      parsedData[metaIndex].sales.push(newSale);

      await AsyncStorage.setItem('financeData', JSON.stringify(parsedData));
      Alert.alert('Sucesso', 'Venda adicionada com sucesso!');
      setSaleValue('');
      setSelectedCustomer('');
      setInstallments('');
      setDescription('');
      setIsDebit(false);
    } catch (error) {
      console.error('Erro ao adicionar venda', error);
      Alert.alert('Erro', 'Ocorreu um erro ao adicionar a venda.');
    }
  };

  const goToSalesDetail = () => {
    if (!selectedDate) {
      Alert.alert('Erro', 'Por favor, selecione uma data.');
      return;
    }
    navigation.navigate('SalesDetailScreen', { metaId, date: selectedDate });
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderCustomerItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.customerItem,
        selectedCustomer === item.name && styles.selectedCustomerItem,
      ]}
      onPress={() => {
        setSelectedCustomer(item.name);
        setCustomerModalVisible(false);
      }}
    >
      <Text style={styles.customerName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Adicionar Venda</Text>
        <Calendar
          onDayPress={handleDateSelect}
          markedDates={{
            [selectedDate]: { selected: true, marked: true, selectedColor: '#3A86FF' },
          }}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#2D3142',
            selectedDayBackgroundColor: '#3A86FF',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#3A86FF',
            dayTextColor: '#2D3142',
            textDisabledColor: '#d9e1e8',
            dotColor: '#3A86FF',
            selectedDotColor: '#ffffff',
            arrowColor: '#3A86FF',
            monthTextColor: '#3A86FF',
          }}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputLarge]}
            placeholder="Valor da Venda"
            value={saleValue}
            keyboardType="numeric"
            onChangeText={setSaleValue}
            placeholderTextColor="#BDBDBD"
          />
          {(paymentMethod === 'crediario' || (paymentMethod === 'cartao' && !isDebit)) && (
            <>
              <Text style={styles.textInline}>x</Text>
              <TextInput
                style={[styles.input, styles.inputSmall]}
                placeholder="Parcelas"
                value={installments}
                keyboardType="numeric"
                onChangeText={setInstallments}
                placeholderTextColor="#BDBDBD"
                editable={!isDebit}
              />
              <Text style={styles.textInline}>
                = {installments && installmentValue ? `${installments}x R$ ${installmentValue}` : ''}
              </Text>
            </>
          )}
        </View>
      
        <TextInput
          style={styles.input}
          placeholder="Descrição"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor="#BDBDBD"
        />
  <Text style={styles.label}>Cliente:</Text>
        <TouchableOpacity
          style={[styles.input, styles.customerSelector]}
          onPress={() => setCustomerModalVisible(true)}
        >
          <Text style={styles.customerText}>
            {selectedCustomer || 'Selecionar Cliente'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Forma de Pagamento:</Text>
        <View style={styles.optionsContainer}>
          {['dinheiro', 'pix', 'crediario', 'cartao'].map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.optionButton,
                paymentMethod === method && styles.selectedOption,
              ]}
              onPress={() => setPaymentMethod(method)}
            >
              <Text
                style={[
                  styles.optionText,
                  paymentMethod === method && styles.selectedOptionText,
                ]}
              >
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {paymentMethod === 'cartao' && (
        <View style={styles.raw}>
        <View style={styles.checkboxContainer}>
          <Checkbox
            value={isDebit}
            onValueChange={(checked) => {
              setIsDebit(checked);
              if (checked) setInstallments('');
            }}
          />
          <Text style={styles.label}>Débito</Text>
        </View>
      </View>
      
        )}
        <TouchableOpacity style={styles.button} onPress={addSale}>
          <Text style={styles.buttonText}>Adicionar Venda</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={goToSalesDetail}
        >
          <Text style={styles.buttonText}>Ver Vendas do Dia</Text>
        </TouchableOpacity>
      </ScrollView>

      
      <Modal visible={isCustomerModalVisible} animationType="slide">
  <View style={styles.modalContainer}>
    <TextInput
      style={styles.searchInput}
      placeholder="Buscar cliente"
      value={searchTerm}
      onChangeText={setSearchTerm}
      placeholderTextColor="#BDBDBD"
    />
    <FlatList
      data={filteredCustomers}
      keyExtractor={(item, index) => index.toString()}
      renderItem={renderCustomerItem}
    />
    <TouchableOpacity
      style={styles.modalCloseButton}
      onPress={() => setCustomerModalVisible(false)}
    >
      <Text style={styles.modalCloseButtonText}>Fechar</Text>
    </TouchableOpacity>



    {/* Botão flutuante para adicionar cliente */}
    <TouchableOpacity
  style={styles.floatingAddButton}
  onPress={() => {
    setCustomerModalVisible(false);
    navigation.navigate('AddCustomers');
  }}
>
  <Text style={styles.floatingAddButtonText}>+</Text>
</TouchableOpacity>
  </View>
</Modal>


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
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2D3142',
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#2D3142',
  },
  inputLarge: {
    flex: 2,
  },
  inputSmall: {
    flex: 1,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInline: {
    marginHorizontal: 5,
    fontSize: 16,
    color: '#2D3142',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    color: '#2D3142',
  },
  optionsContainer: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  optionButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#3A86FF',
    borderColor: '#3A86FF',
  },
  optionText: {
    fontSize: 14,
    color: '#2D3142',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  customerSelector: {
    justifyContent: 'center',
  },
  customerText: {
    color: '#2D3142',
  },
  button: {
    backgroundColor: '#3A86FF',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FF5733',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#F7F9FC',
    fontSize: 16,
    color: '#2D3142',
  },
  customerItem: {
    padding: 15,
    backgroundColor: '#F7F9FC',
    borderBottomWidth: 1,
    borderBottomColor: '#BDBDBD',
  },
  selectedCustomerItem: {
    backgroundColor: '#3A86FF',
  },
  customerName: {
    fontSize: 16,
    color: '#2D3142',
  },
  modalCloseButton: {
    backgroundColor: '#E74C3C',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  checkbox: {
    marginLeft: 10,
  },
  raw: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 10, 
  },
  checkboxContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginRight: 10, 
  },
  label: {
    fontSize: 16,
    color: '#2D3142',
    marginLeft: 10, 
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  addCustomerButton: {
    backgroundColor: '#3A86FF',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  addCustomerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 80, // Posicionado acima do botão "Fechar"
    right: 20,
    backgroundColor: '#3A86FF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  floatingAddButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  
});

export default AddSaleScreen;
