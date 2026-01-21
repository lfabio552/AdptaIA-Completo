import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;
      
      alert("Senha atualizada com sucesso!");
      navigate('/'); // Manda para a Home logado
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#1f2937', padding: '40px', borderRadius: '16px', border: '1px solid #374151', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#a855f7', marginBottom: '20px' }}>Nova Senha</h1>
        <p style={{ marginBottom: '20px', color: '#9ca3af' }}>Digite sua nova senha abaixo.</p>
        
        <form onSubmit={handleUpdate}>
          <input
            style={{ width: '92%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #4b5563', backgroundColor: '#374151', color: 'white', fontSize: '16px' }}
            type="password"
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button style={{ width: '100%', padding: '12px', backgroundColor: '#7e22ce', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Senha'}
          </button>
        </form>

        {message && <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#ef4444', color: 'white', borderRadius: '8px', fontSize: '14px' }}>{message}</div>}
      </div>
    </div>
  );
}