import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitora o estado do usuário
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

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;

      if (!currentUser.emailVerified) {
        throw new Error('Seu e-mail ainda não foi verificado. Por favor, verifique sua caixa de entrada.');
      }

      setUser(currentUser);
    } catch (error) {
      let errorMessage = 'Ocorreu um erro. Tente novamente.';

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'O e-mail inserido é inválido.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Falha de conexão com a internet. Verifique sua conexão.';
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

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }

    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      console.error('Erro ao reenviar e-mail de verificação:', error);
      throw new Error('Não foi possível reenviar o e-mail. Tente novamente mais tarde.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, resendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
};
