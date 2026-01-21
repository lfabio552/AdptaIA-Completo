import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import { saveToHistory, TOOL_CONFIGS } from '../utils/saveToHistory';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';

export default function TextSummarizer() {
  const [text, setText] = useState('');
  const [format, setFormat] = useState('bulletpoints');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // --- OUVINTE DO HISTÓRICO ---
  useEffect(() => {
    const handleLoadFromHistory = (event) => {
      if (event.detail && event.detail.text) {
        setText(event.detail.text); // Preenche o texto original
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    return () => {
      window.removeEventListener('loadFromHistory', handleLoadFromHistory);
    };
  }, []);

  const handleSummarize = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para resumir textos.');

      const response = await fetch(config.ENDPOINTS.SUMMARIZE_TEXT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          format,
          user_id: user.id
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao resumir.');

      setSummary(data.summary);

      // Salvar no Histórico
      await saveToHistory(
        user,
        TOOL_CONFIGS.TEXT_SUMMARY,
        text, // Texto original como prompt
        data.summary,
        { format }
      );

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '10px' }}>
          📝 Resumidor de Textos
        </h1>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
          Cole textos longos e obtenha resumos precisos instantaneamente.
        </p>

        {/* Botão Histórico */}
        {user && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                padding: '8px 16px',
                backgroundColor: showHistory ? '#7e22ce' : '#374151',
                color: '#d1d5db',
                border: '1px solid #4b5563',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {showHistory ? '▲ Ocultar Histórico' : '📚 Ver Histórico'}
            </button>
          </div>
        )}

        {/* Lista Histórico */}
        {showHistory && user && (
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '10px' }}>
            <HistoryList user={user} toolType="text-summary" />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Lado Esquerdo */}
          <div style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '12px', border: '1px solid #374151' }}>
            <form onSubmit={handleSummarize}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Texto para Resumir:</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Cole seu texto aqui..."
                  required
                  style={{
                    width: '100%',
                    height: '300px',
                    padding: '15px',
                    borderRadius: '8px',
                    backgroundColor: '#111827',
                    color: 'white',
                    border: '1px solid #4b5563',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px' }}>Formato do Resumo:</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#111827', color: 'white', border: '1px solid #4b5563' }}
                >
                  <option value="bulletpoints">• Tópicos (Bullet Points)</option>
                  <option value="paragraph">¶ Parágrafo Único</option>
                  <option value="concise">⚡ Muito Curto (Tweet)</option>
                  <option value="detailed">📑 Detalhado</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer'
                }}
              >
                {isLoading ? 'Resumindo...' : '🚀 Gerar Resumo'}
              </button>
            </form>
            {error && <div style={{ color: '#fca5a5', marginTop: '10px' }}>{error}</div>}
          </div>

          {/* Lado Direito */}
          <div style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '12px', border: '1px solid #374151' }}>
            <h3 style={{ marginBottom: '20px' }}>Resultado:</h3>
            <div style={{ 
              backgroundColor: '#111827', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '1px solid #4b5563',
              height: '400px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              color: summary ? '#d1d5db' : '#6b7280',
              lineHeight: '1.6'
            }}>
              {summary || 'O resumo aparecerá aqui...'}
            </div>
          </div>
        </div>

        <ExemplosSection ferramentaId="text-summary" />
      </div>
    </div>
  );
}