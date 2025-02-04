import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Importe seu contexto que contém logout e possivelmente selectedStoreId
import { AuthContext } from '../contexts/auth';

const { width } = Dimensions.get('window');

const SideMenu = ({ navigation, children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  // Animação do menu lateral
  const menuAnimation = useState(new Animated.Value(-width * 0.7))[0];

  // Do contexto
  const { logout, selectedStoreId } = useContext(AuthContext);

  // Função para abrir/fechar menu
  const toggleMenu = (forceClose = false) => {
    const shouldClose = forceClose || isMenuOpen;
    if (!shouldClose) {
      setIsMenuOpen(true);
    }
    Animated.timing(menuAnimation, {
      toValue: shouldClose ? -width * 0.7 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      if (shouldClose) {
        setIsMenuOpen(false);
        setIsReportsOpen(false); // Fecha submenu
      }
    });
  };

  // Abre/fecha submenu de Relatórios
  const toggleReportsMenu = () => {
    setIsReportsOpen(!isReportsOpen);
  };

  // Navegar para qualquer tela
  const handleMenuNavigation = (screen, params = {}) => {
    toggleMenu(true);
    navigation.navigate(screen, params);
  };

  // Lidar com logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Função específica para ir ao Estoque
  const handleEstoquePress = () => {
    if (!selectedStoreId) {
      Alert.alert(
        'Loja não selecionada',
        'Selecione primeiro uma loja antes de acessar o estoque.'
      );
      return;
    }
    // Navega enviando a lojaId
    handleMenuNavigation('Estoque', { lojaId: selectedStoreId });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* MENU LATERAL ANIMADO */}
      <Animated.View style={[styles.sideMenu, { left: menuAnimation }]}>
        {/* BOTÃO FECHAR */}
        <TouchableOpacity style={styles.closeButton} onPress={() => toggleMenu(true)}>
          <Icon name="close" size={24} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.menuTitle}>Menu</Text>

        {/* Exemplo de menu "Relatórios" com submenu */}
        <TouchableOpacity style={styles.menuItem} onPress={toggleReportsMenu}>
          <View style={styles.menuItemRow}>
            <Text style={styles.menuItemText}>Relatórios</Text>
            <Icon
              name={isReportsOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={18}
              color="#FFF"
            />
          </View>
        </TouchableOpacity>

        {isReportsOpen && (
          <View style={styles.subMenu}>
            <TouchableOpacity
              style={styles.subMenuItem}
              onPress={() => handleMenuNavigation('Report')}
            >
              <Text style={styles.subMenuItemText}>Relatórios detalhados</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.subMenuItem}
              onPress={() => handleMenuNavigation('ReportScreen')}
            >
              <Text style={styles.subMenuItemText}>Relatórios de Crediário</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.subMenuItem}
              onPress={() => handleMenuNavigation('SalesReportScreen')}
            >
              <Text style={styles.subMenuItemText}>Relatórios de Vendas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.subMenuItem}
              onPress={() => handleMenuNavigation('ComparativeReportScreen')}
            >
              <Text style={styles.subMenuItemText}>Relatório Comparativo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* OUTRAS OPÇÕES DE MENU */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuNavigation('Customers',{ lojaId: selectedStoreId })}
        >
          <Text style={styles.menuItemText}>Clientes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuNavigation('CreditoScreen',{ lojaId: selectedStoreId })}
        >
          <Text style={styles.menuItemText}>Compras no Crediário</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuNavigation('RankClientesScreen')}
        >
          <Text style={styles.menuItemText}>Ranking de Clientes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuNavigation('CrediarioResumo',{ lojaId: selectedStoreId })}
        >
          <Text style={styles.menuItemText}>Resumo do Crediário</Text>
        </TouchableOpacity>

        {/* AQUI trocamos para usar handleEstoquePress */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleEstoquePress}
        >
          <Text style={styles.menuItemText}>Estoque</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuNavigation('CashRegisterScreen',{ lojaId: selectedStoreId })}
        >
          <Text style={styles.menuItemText}>Caixa</Text>
        </TouchableOpacity>

        {/* BOTÃO DE LOGOUT */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="log-out-outline" size={24} color="#FFF" />
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* FECHAR MENU AO CLICAR FORA */}
      {isMenuOpen && (
        <TouchableWithoutFeedback onPress={() => toggleMenu(true)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* BOTÃO ABRIR MENU */}
      {!isMenuOpen && (
        <TouchableOpacity style={styles.menuButton} onPress={() => toggleMenu()}>
          <Icon name="menu" size={30} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <View style={{ flex: 1, marginTop: 20 }}>{children}</View>
    </View>
  );
};

export default SideMenu;

// ESTILOS
const styles = StyleSheet.create({
  sideMenu: {
    position: 'absolute',
    width: '70%',
    height: '100%',
    backgroundColor: '#2D3142',
    padding: 20,
    zIndex: 2,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 5,
    borderRadius: 15,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  menuItem: {
    marginVertical: 15,
  },
  menuItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 18,
    color: '#FFF',
  },
  subMenu: {
    paddingLeft: 15,
    marginTop: 10,
  },
  subMenuItem: {
    marginVertical: 8,
  },
  subMenuItemText: {
    fontSize: 16,
    color: '#FFF',
  },
  menuButton: {
    position: 'absolute',
    top: 30,
    left: 20,
    backgroundColor: '#3A86FF',
    padding: 10,
    borderRadius: 5,
    zIndex: 3,
  },
  overlay: {
    position: 'absolute',
    top: 0, 
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  logoutContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 5,
  },
  logoutText: {
    fontSize: 16,
    color: '#FFF',
    marginLeft: 10,
  },
});
