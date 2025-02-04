// contexts/auth.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '../../firebaseConfig';

// Cria o Contexto
export const AuthContext = createContext();

// Cria o Provider (envolve todo o app)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Aqui está o PAR de variáveis para a loja selecionada
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  // Monitora o estado do usuário (login / logout / verificação de email)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Exemplo de login
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;

      if (!currentUser.emailVerified) {
        throw new Error(
          'Seu e-mail ainda não foi verificado. Verifique sua caixa de entrada.'
        );
      }
      setUser(currentUser);

    } catch (error) {
      let errorMessage = 'Ocorreu um erro. Tente novamente.';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'O e-mail inserido é inválido.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas de login. Tente mais tarde.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Falha de conexão com a internet.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'E-mail ou senha inválidos.';
          break;
        default:
          errorMessage = error.message || 'Erro desconhecido. Tente novamente.';
      }
      throw new Error(errorMessage);
    }
  };

  // Reenviar email de verificação
  const resendVerificationEmail = async () => {
    if (!auth.currentUser) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      console.error('Erro ao reenviar e-mail de verificação:', error);
      throw new Error('Não foi possível reenviar o e-mail. Tente mais tarde.');
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setSelectedStoreId(null); // opcional: resetar a loja selecionada
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        resendVerificationEmail,
        // Aqui expomos as variáveis de loja:
        selectedStoreId,
        setSelectedStoreId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook para consumir o contexto mais facilmente
export const useAuthContext = () => {
  return useContext(AuthContext);
};
