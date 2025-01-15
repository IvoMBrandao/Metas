import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyC1N35pp1Xe-1dfdx1LEPZ49hpeMlTzs3Q",
  authDomain: "metas-16508.firebaseapp.com",
  projectId: "metas-16508",
  storageBucket: "metas-16508.appspot.com",
  messagingSenderId: "145338175864",
  appId: "1:145338175864:android:98d543639aae236b93f88d",
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { app, auth };
