// CaptureButton.js
import React, { useRef } from 'react';
import { View, Button, Alert, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';

const CaptureButton = ({ children }) => {
  const viewShotRef = useRef(null);

  const captureAndShareScreenshot = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      const shareOptions = {
        title: 'Compartilhar Captura de Tela',
        url: uri,
        type: 'image/png',
        message: 'Confira esta tela!',
      };
      await Share.open(shareOptions);
    } catch (error) {
      console.error('Erro ao compartilhar a captura de tela:', error);
      Alert.alert('Erro', 'Não foi possível compartilhar a captura de tela.');
    }
  };

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} style={styles.captureContainer}>
        {children}
      </ViewShot>
      <Button title="Compartilhar Captura de Tela" onPress={captureAndShareScreenshot} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CaptureButton;
