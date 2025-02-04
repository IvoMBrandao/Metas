import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database'; // Para Realtime Database
import { getFirestore } from 'firebase/firestore'; // Para Firestore
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyC1N35pp1Xe-1dfdx1LEPZ49hpeMlTzs3Q",
  authDomain: "metas-16508.firebaseapp.com",
  projectId: "metas-16508",
  storageBucket: "metas-16508.appspot.com",
  messagingSenderId: "145338175864",
  appId: "1:145338175864:android:98d543639aae236b93f88d",
};

// Inicializa o app Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Auth com persistência usando AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Inicializa o Realtime Database
const database = getDatabase(app);

// Inicializa o Firestore
const firestore = getFirestore(app);

export { app, auth, database, firestore };
