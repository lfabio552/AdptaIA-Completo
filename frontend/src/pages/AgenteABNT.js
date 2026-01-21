import React, { useState, useEffect } from 'react';
import '../App.css';
import { supabase } from '../supabaseClient';
import ExemplosSection from '../components/ExemplosSection';
import { saveHistoryItem } from '../utils/history';
import HistoryList from '../components/HistoryList';

export default function AgenteABNT() {
  // Estados
  const [rawText, setRawText] = useState('');
  const [formattedText, setFormattedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [user, setUser] = useState(null); // ✅ Estado para o usuário

  // ✅ Obter usuário ao carregar componente
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // ✅ Ouvir eventos do histórico
  useEffect(() => {
    const handleLoadFromHistory = (event) => {
      if (event.detail && event.detail.text) {
        setRawText(event.detail.text);
        setFormattedText('');
        setError('');
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    
    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    
    return () => {
      window.removeEventListener('loadFromHistory', handleLoadFromHistory);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFormattedText('');

    try {
      // ✅ Agora user já está no estado, mas confirmamos
      if (!user) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) throw new Error('Login necessário.');
        setUser(currentUser); // Atualiza estado se necessário
      }

      const currentUser = user; // Usar do estado

      const response = await fetch('https://meu-gerador-backend.onrender.com/format-abnt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            text: rawText,
            user_id: currentUser.id 
        }),
      });

      const data = await response.json();

      if (response.status === 402) throw new Error(data.error);
      if (!response.ok) throw new Error(data.error || 'Erro ao formatar.');

      setFormattedText(data.formatted_text);

      // Salvar histórico
      try {
        const historySaved = await saveHistoryItem(
          currentUser,
          'abnt',
          'Formatador ABNT',
          rawText,
          data.formatted_text,
          { 
            credits_used: 1,
            original_length: rawText.length,
            formatted_length: data.formatted_text.length
          }
        );

        if (historySaved) {
          console.log('✅ Histórico do ABNT salvo com sucesso!');
        } else {
          console.warn('⚠️ Histórico não foi salvo');
        }
      } catch (historyError) {
        console.error('❌ Erro ao salvar histórico:', historyError);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!formattedText) {
      alert("Primeiro gere o texto formatado.");
      return;
    }
    setIsDownloading(true);
    setError('');

    try {
      const response = await fetch('https://meu-gerador-backend.onrender.com/download-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown_text: formattedText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar o arquivo.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trabalho_formatado.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Agente de Formatação ABNT 🎓</h1>
        <p>Cole seu trabalho abaixo e deixe a IA formatar para você.</p>
        
        {/* ✅ Agora user está definido */}
        {user && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: showHistory ? '#7e22ce' : '#374151',
              color: '#d1d5db',
              border: '1px solid #4b5563',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            {showHistory ? '▲ Ocultar Histórico' : '📚 Ver Meu Histórico ABNT'}
          </button>
        )}
      </header>
      
      {/* ✅ Agora user está definido */}
      {showHistory && user && (
        <div style={{
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#1f2937',
          borderRadius: '10px',
          border: '1px solid #374151'
        }}>
          <HistoryList user={user} toolType="abnt" />
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ textAlign: 'left' }}>
          <label>Seu texto:</label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Cole seu texto aqui..."
            required
            style={{ 
              minHeight: '250px',
              width: '95%',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #4b5563',
              backgroundColor: '#374151',
              color: 'white',
              fontFamily: 'sans-serif',
              fontSize: '16px'
            }}
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            padding: '15px 30px',
            backgroundColor: isLoading ? '#4c1d95' : '#7e22ce',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.8 : 1
          }}
        >
          {isLoading ? '📝 Formatando (-1 Crédito)...' : '✨ Formatar Texto'}
        </button>
      </form>

      {error && (
        <div className="error-message" style={{
          color: '#ff6b6b', 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#450a0a',
          borderRadius: '8px',
          border: '1px solid #dc2626'
        }}>
          <strong>⚠️ Erro:</strong> {error}
        </div>
      )}

      {formattedText && (
        <div className="result-container" style={{textAlign: 'left', marginTop: '40px'}}>
          <h2 style={{color: '#9D4EDD'}}>Seu Texto Formatado:</h2>
          <div className="prompt-box" style={{
            whiteSpace: 'pre-wrap',
            backgroundColor: '#1f2937',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #374151',
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            <p style={{ lineHeight: '1.6', margin: 0 }}>{formattedText}</p>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => navigator.clipboard.writeText(formattedText)} 
              className="copy-button"
              style={{
                padding: '12px 25px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginRight: '10px',
                fontWeight: 'bold'
              }}
            >
              📋 Copiar Texto
            </button>
            
            <button 
              onClick={handleDownload} 
              disabled={isDownloading}
              style={{
                padding: '12px 25px',
                backgroundColor: isDownloading ? '#5A189A' : '#7e22ce',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                opacity: isDownloading ? 0.7 : 1,
                fontWeight: 'bold'
              }}
            >
              {isDownloading ? '📥 Gerando .docx...' : '📥 Baixar como Word (.docx)'}
            </button>
          </div>
        </div>
      )}
    
      <ExemplosSection ferramentaId="agente-abnt" />
    </div>
  );
}