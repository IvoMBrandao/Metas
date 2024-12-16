import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';



const { width } = Dimensions.get('window');

const SideMenu = ({ navigation, children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false); 
  const menuAnimation = useState(new Animated.Value(-width * 0.7))[0];

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
        setIsReportsOpen(false); // Fecha o submenu quando o menu principal fecha
      }
    });
  };

  const toggleReportsMenu = () => {
    setIsReportsOpen(!isReportsOpen);
  };

  const handleMenuNavigation = (screen) => {
    toggleMenu(true); 
    navigation.navigate(screen);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Menu lateral */}
      <Animated.View style={[styles.sideMenu, { left: menuAnimation }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => toggleMenu(true)}>
          <Icon name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.menuTitle}>Menu</Text>

        {/* Relatórios com submenu */}
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
              <Text style={styles.subMenuItemText}>Relatorios detalhado</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.subMenuItem}
              onPress={() => handleMenuNavigation('ReportScreen')}
            >
              <Text style={styles.subMenuItemText}>Relatorios de Crediário</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.subMenuItem}
              onPress={() => handleMenuNavigation('SalesReportScreen')}
            >
              <Text style={styles.subMenuItemText}>Relatorios</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.subMenuItem}
              onPress={() => handleMenuNavigation('ComparativeReportScreen')}
            >
              <Text style={styles.subMenuItemText}>Relatorio Comparatio</Text>
            </TouchableOpacity>
            
          </View>
        )}

        {/* Outras opções */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuNavigation('Customers')}
        >
          <Text style={styles.menuItemText}>Clientes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuNavigation('CreditoScreen')}
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
          onPress={() => handleMenuNavigation('CashRegisterScreen',)}
        >
         
          <Text style={styles.menuItemText}>Caixa</Text>
        </TouchableOpacity>
       
      </Animated.View>

      {/* Área clicável para fechar o menu */}
      {isMenuOpen && (
        <TouchableWithoutFeedback onPress={() => toggleMenu(true)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Botão para abrir o menu */}
      {!isMenuOpen && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => toggleMenu()}
        >
          <Icon name="menu" size={30} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Conteúdo da tela */}
      <View style={{ flex: 1, marginTop: 20 }}>{children}</View>
    </View>
  );
};

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
});

export default SideMenu;
