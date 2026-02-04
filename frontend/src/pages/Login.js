import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { UserCircleIcon, LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { FcGoogle } from 'react-icons/fc'; // Ícone do Google

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // --- NOVA FUNÇÃO: LOGIN COM GOOGLE ---
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redireciona para a página de perfil após o login
          redirectTo: `${window.location.origin}/meu-perfil`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let error;
      if (isSignUp) {
        // Criar Conta com E-mail
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        error = signUpError;
        if (!error) setMessage('✅ Verifique seu e-mail para confirmar o cadastro!');
      } else {
        // Fazer Login com E-mail
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        error = signInError;
        if (!error) navigate('/'); 
      }
      if (error) throw error;
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f1016', 
      fontFamily: "'Inter', sans-serif",
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(126,34,206,0.15) 0%, rgba(0,0,0,0) 70%)',
        top: '-100px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      <div style={{
        backgroundColor: '#1f2937',
        padding: '40px',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid #374151',
        zIndex: 1,
        position: 'relative'
      }}>
        
        {/* LOGO E TÍTULO */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #22d3ee 0%, #7e22ce 100%)', 
            width: '48px', height: '48px', borderRadius: '12px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '24px', margin: '0 auto 15px auto',
            boxShadow: '0 0 20px rgba(126, 34, 206, 0.5)'
          }}>
            ⚡
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', marginBottom: '5px' }}>
            {isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>
            {isSignUp ? 'Comece a usar IA agora mesmo' : 'Acesse suas ferramentas favoritas'}
          </p>
        </div>
        
        {/* --- BOTÃO DO GOOGLE (NOVO) --- */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'white',
            color: '#1f2937',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '20px',
            transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
        >
          <FcGoogle size={24} />
          Entrar com Google
        </button>

        {/* --- SEPARADOR --- */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', color: '#6b7280' }}>
           <div style={{ flex: 1, height: '1px', backgroundColor: '#374151' }}></div>
           <span style={{ padding: '0 10px', fontSize: '0.85rem' }}>OU</span>
           <div style={{ flex: 1, height: '1px', backgroundColor: '#374151' }}></div>
        </div>

        <form onSubmit={handleAuth}>
          
          {/* INPUT EMAIL */}
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <label style={{ display: 'block', color: '#d1d5db', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
              E-mail
            </label>
            <div style={{ position: 'relative' }}>
              <EnvelopeIcon style={{ width: '20px', color: '#9ca3af', position: 'absolute', left: '12px', top: '12px', pointerEvents: 'none' }} />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px', // Espaço para o ícone
                  borderRadius: '10px',
                  border: '1px solid #4b5563',
                  backgroundColor: '#111827',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#a855f7'}
                onBlur={(e) => e.target.style.borderColor = '#4b5563'}
              />
            </div>
          </div>

          {/* INPUT SENHA */}
          <div style={{ marginBottom: '25px', position: 'relative' }}>
            <label style={{ display: 'block', color: '#d1d5db', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <LockClosedIcon style={{ width: '20px', color: '#9ca3af', position: 'absolute', left: '12px', top: '12px', pointerEvents: 'none' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  borderRadius: '10px',
                  border: '1px solid #4b5563',
                  backgroundColor: '#111827',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#a855f7'}
                onBlur={(e) => e.target.style.borderColor = '#4b5563'}
              />
            </div>
            
            {/* Link Esqueci a Senha */}
            {!isSignUp && (
              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <Link to="/forgot-password" style={{ color: '#a855f7', fontSize: '0.85rem', textDecoration: 'none' }}>
                  Esqueceu a senha?
                </Link>
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(90deg, #7e22ce 0%, #6b21a8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 15px rgba(126, 34, 206, 0.4)',
              transition: 'transform 0.1s',
              boxSizing: 'border-box'
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta' : 'Entrar com E-mail')}
          </button>

        </form>

        {message && (
          <div style={{ 
            marginTop: '20px', 
            padding: '12px', 
            backgroundColor: message.includes('❌') ? '#450a0a' : '#064e3b', 
            color: message.includes('❌') ? '#fca5a5' : '#6ee7b7', 
            borderRadius: '8px', 
            textAlign: 'center', 
            fontSize: '0.9rem',
            border: message.includes('❌') ? '1px solid #7f1d1d' : '1px solid #065f46'
          }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #374151', paddingTop: '20px' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
            {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
          </span>
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#22d3ee', // Ciano para destaque
              fontWeight: 'bold',
              cursor: 'pointer',
              marginLeft: '8px',
              fontSize: '0.9rem'
            }}
          >
            {isSignUp ? 'Fazer Login' : 'Cadastre-se grátis'}
          </button>
        </div>
        
        {/* Link para voltar a Home */}
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <Link to="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.85rem' }}>
                ← Voltar para Home
            </Link>
        </div>

      </div>
    </div>
  );
}