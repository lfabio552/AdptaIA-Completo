import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const redirectUrl = window.location.origin + '/update-password';

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
      setMessage('✅ Verifique seu e-mail! Enviamos o link de recuperação.');
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
      backgroundColor: '#0f1016', // Fundo Dark padrão
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
        background: 'radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, rgba(0,0,0,0) 70%)', // Brilho mais Ciano aqui
        top: '-150px',
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
        
        {/* ÍCONE E TÍTULO */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', // Gradiente Roxo/Rosa
            width: '48px', height: '48px', borderRadius: '12px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '24px', margin: '0 auto 15px auto',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
          }}>
            🔐
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', marginBottom: '5px' }}>
            Recuperar Senha
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>
            Não se preocupe, vamos te ajudar a voltar.
          </p>
        </div>
        
        <form onSubmit={handleReset}>
          
          {/* INPUT EMAIL */}
          <div style={{ marginBottom: '25px', position: 'relative' }}>
            <label style={{ display: 'block', color: '#d1d5db', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
              Qual é o seu e-mail?
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
                  padding: '12px 12px 12px 40px',
                  borderRadius: '10px',
                  border: '1px solid #4b5563',
                  backgroundColor: '#111827',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box' // Correção de layout
                }}
                onFocus={(e) => e.target.style.borderColor = '#a855f7'}
                onBlur={(e) => e.target.style.borderColor = '#4b5563'}
              />
            </div>
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
            {loading ? 'Enviando Link...' : 'Enviar Link de Recuperação'}
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

        {/* Link para voltar ao Login */}
        <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #374151', paddingTop: '20px' }}>
            <Link 
              to="/login" 
              style={{ 
                color: '#9ca3af', textDecoration: 'none', fontSize: '0.9rem', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.color = 'white'}
              onMouseOut={(e) => e.target.style.color = '#9ca3af'}
            >
                <ArrowLeftIcon style={{ width: '16px' }} /> Voltar para Login
            </Link>
        </div>

      </div>
    </div>
  );
}