import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom'; // Adicionei o Link aqui

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let error;
      if (isSignUp) {
        // Criar Conta
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        error = signUpError;
        if (!error) setMessage('Verifique seu e-mail para confirmar o cadastro!');
      } else {
        // Fazer Login
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        error = signInError;
        if (!error) navigate('/'); // Vai para a Home
      }
      if (error) throw error;
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Estilos
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#111827',
      color: 'white',
      fontFamily: 'sans-serif'
    },
    card: {
      backgroundColor: '#1f2937',
      padding: '40px',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      width: '100%',
      maxWidth: '400px',
      border: '1px solid #374151'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#a855f7',
      marginBottom: '20px',
      textAlign: 'center'
    },
    input: {
      width: '92%',
      padding: '12px',
      marginBottom: '15px',
      borderRadius: '8px',
      border: '1px solid #4b5563',
      backgroundColor: '#374151',
      color: 'white',
      fontSize: '16px'
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#7e22ce',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.7 : 1,
      marginTop: '10px'
    },
    message: {
      marginTop: '15px',
      padding: '10px',
      backgroundColor: '#374151',
      color: '#d8b4fe',
      borderRadius: '8px',
      textAlign: 'center',
      fontSize: '14px'
    },
    switchText: {
      marginTop: '20px',
      textAlign: 'center',
      fontSize: '14px',
      color: '#9ca3af'
    },
    switchButton: {
      background: 'none',
      border: 'none',
      color: '#a855f7',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginLeft: '5px'
    },
    forgotLink: {
      display: 'block',
      textAlign: 'right',
      marginTop: '10px',
      color: '#9ca3af',
      fontSize: '13px',
      textDecoration: 'none'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          {isSignUp ? 'Criar Conta' : 'Bem-vindo'}
        </h1>
        
        <form onSubmit={handleAuth}>
          <input
            style={styles.input}
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button style={styles.button} disabled={loading}>
            {loading ? 'Carregando...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>

        {/* LINK ESQUICI MINHA SENHA (SÓ MOSTRA NO LOGIN) */}
        {!isSignUp && (
          <Link to="/forgot-password" style={styles.forgotLink}>
            Esqueci minha senha
          </Link>
        )}

        {message && <div style={styles.message}>{message}</div>}

        <div style={styles.switchText}>
          {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
          <button
            style={styles.switchButton}
            onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
          >
            {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}