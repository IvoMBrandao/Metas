import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../contexts/auth';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(0);
  const { login, resendVerificationEmail } = useContext(AuthContext);

  // Atualiza o timer a cada segundo
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleLogin = async () => {
    try {
      setError(null);
      setSuccessMessage(null);
      await login(email, password);
      setSuccessMessage('Login realizado com sucesso!');
    } catch (error) {
      setError(error.message);

      // Exibir mensagem para reenviar o e-mail de verificação
      if (error.message.includes('não foi verificado')) {
        setError('Seu e-mail ainda não foi verificado.');
      }
    }
  };

  const handleResendVerification = async () => {
    if (!canResend) return;

    try {
      setError(null);
      setSuccessMessage(null);
      await resendVerificationEmail();
      setSuccessMessage('E-mail de verificação reenviado. Verifique sua caixa de entrada.');

      setCanResend(false);
      setTimer(60);
    } catch (err) {
      if (err.code === 'auth/too-many-requests') {
        setError(
          'Muitas solicitações detectadas. Por favor, aguarde alguns minutos antes de tentar novamente.'
        );
      } else {
        setError('Erro ao reenviar e-mail de verificação. Tente novamente mais tarde.');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Por favor, insira seu e-mail para redefinir a senha.');
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('E-mail de redefinição de senha enviado. Verifique sua caixa de entrada.');
    } catch (err) {
      let errorMessage = 'Erro ao solicitar redefinição de senha.';

      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = 'O e-mail inserido é inválido.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado. Verifique o e-mail informado.';
          break;
        default:
          errorMessage = err.message || 'Erro desconhecido. Tente novamente.';
      }

      setError(errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {successMessage && <Text style={styles.successText}>{successMessage}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Entrar" onPress={handleLogin} />
      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.link}>Esqueci minha senha</Text>
      </TouchableOpacity>
      {error?.includes('não foi verificado') && (
        <TouchableOpacity onPress={handleResendVerification} disabled={!canResend}>
          <Text style={[styles.link, !canResend && styles.disabledLink]}>
            {canResend ? 'Reenviar e-mail de verificação' : `Aguarde ${timer}s para reenviar`}
          </Text>
        </TouchableOpacity>
      )}
      <Text style={styles.redirectText}>
        Não tem uma conta?{' '}
        <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
          Criar conta
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    color: 'green',
    marginBottom: 10,
    textAlign: 'center',
  },
  link: {
    color: '#007BFF',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 10,
  },
  disabledLink: {
    color: '#888',
  },
  redirectText: {
    marginTop: 20,
    textAlign: 'center',
  },
});
