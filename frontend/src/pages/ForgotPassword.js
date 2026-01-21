import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // O truque aqui: window.location.origin pega automaticamente 
      // se é localhost ou o site oficial, e adiciona /update-password no final
      const redirectUrl = window.location.origin + '/update-password';

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
      setMessage('Verifique seu e-mail! Enviamos um link de recuperação.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#1f2937', padding: '40px', borderRadius: '16px', border: '1px solid #374151', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#a855f7', marginBottom: '20px' }}>Recuperar Senha</h1>
        
        <form onSubmit={handleReset}>
          <input
            style={{ width: '92%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #4b5563', backgroundColor: '#374151', color: 'white', fontSize: '16px' }}
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <button style={{ width: '100%', padding: '12px', backgroundColor: '#7e22ce', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Link'}
          </button>
        </form>

        {message && <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#374151', color: '#d8b4fe', borderRadius: '8px', fontSize: '14px' }}>{message}</div>}

        <div style={{ marginTop: '20px', fontSize: '14px' }}>
          <Link to="/login" style={{ color: '#9ca3af', textDecoration: 'none' }}>Voltar para Login</Link>
        </div>
      </div>
    </div>
  );
}