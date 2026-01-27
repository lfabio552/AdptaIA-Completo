import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import { saveToHistory, TOOL_CONFIGS } from '../utils/saveToHistory';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';
import { 
  Bars3BottomLeftIcon, 
  DocumentTextIcon, 
  ClipboardDocumentCheckIcon, 
  SparklesIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/solid';

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

  useEffect(() => {
    const handleLoadFromHistory = (event) => {
      if (event.detail && event.detail.text) {
        setText(event.detail.text); 
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    return () => window.removeEventListener('loadFromHistory', handleLoadFromHistory);
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

      await saveToHistory(
        user,
        TOOL_CONFIGS.TEXT_SUMMARY,
        text, 
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
    <div style={{ minHeight: '100vh', backgroundColor: '#0f1016', color: 'white', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* CABEÇALHO */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ 
             display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
             background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', // Gradiente Azul/Ciano
             width: '60px', height: '60px', borderRadius: '15px', marginBottom: '20px',
             boxShadow: '0 10px 30px -10px rgba(59, 130, 246, 0.5)'
          }}>
            <Bars3BottomLeftIcon style={{ width: '32px', color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>
            Resumidor Inteligente
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Transforme textos longos em insights rápidos. Escolha entre tópicos, parágrafos ou tweets.
          </p>
        </div>

        {/* BOTÃO HISTÓRICO */}
        {user && (
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                padding: '10px 20px',
                backgroundColor: showHistory ? '#374151' : 'rgba(255,255,255,0.05)',
                color: '#d1d5db',
                border: '1px solid #374151',
                borderRadius: '50px',
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                fontSize: '0.9rem', fontWeight: '500'
              }}
            >
              <DocumentTextIcon style={{ width: '16px' }} />
              {showHistory ? 'Ocultar Histórico' : 'Ver Resumos Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '16px', border: '1px solid #374151' }}>
            <HistoryList user={user} toolType="text-summary" />
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1fr 1fr', 
          gap: '40px',
          alignItems: 'stretch'
        }}>
          
          {/* LADO ESQUERDO: INPUT */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <form onSubmit={handleSummarize} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              
              <div style={{ marginBottom: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '1rem', fontWeight: '600', color: '#e5e7eb' }}>
                  <DocumentTextIcon style={{width: '20px', color: '#3b82f6'}}/> Texto Original:
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Cole seu texto aqui para a IA resumir..."
                  required
                  style={{
                    width: '100%',
                    flexGrow: 1,
                    minHeight: '250px',
                    padding: '15px',
                    borderRadius: '12px',
                    backgroundColor: '#111827',
                    color: 'white',
                    border: '1px solid #4b5563',
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ marginTop: '8px', textAlign: 'right', fontSize: '0.85rem', color: '#9ca3af' }}>
                   {text.length} caracteres
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '1rem', fontWeight: '600', color: '#e5e7eb' }}>
                  <AdjustmentsHorizontalIcon style={{width: '20px', color: '#3b82f6'}}/> Formato de Saída:
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '10px', 
                    backgroundColor: '#111827', 
                    color: 'white', 
                    border: '1px solid #4b5563',
                    height: '50px',
                    cursor: 'pointer'
                  }}
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
                  padding: '16px',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer',
                  fontSize: '1.1rem',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                  transition: 'transform 0.1s',
                  marginTop: 'auto'
                }}
              >
                {isLoading ? '🤖 Analisando e Resumindo...' : '✨ Gerar Resumo'}
              </button>
            </form>
            
            {error && (
              <div style={{ marginTop: '20px', color: '#fca5a5', padding: '12px', backgroundColor: '#450a0a', borderRadius: '10px', fontSize: '0.9rem' }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* LADO DIREITO: RESUMO */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #3b82f6', // Borda Azul
            display: 'flex',
            flexDirection: 'column',
            minHeight: '550px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                <SparklesIcon style={{ width: '24px' }} /> Resumo Gerado:
              </h3>
              {summary && (
                <button
                  onClick={() => {navigator.clipboard.writeText(summary); alert('Resumo copiado!');}}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', gap: '5px'
                  }}
                >
                  <ClipboardDocumentCheckIcon style={{width: '18px'}}/> Copiar
                </button>
              )}
            </div>
            
            <div style={{ 
              flexGrow: 1,
              backgroundColor: '#111827', 
              padding: '25px', 
              borderRadius: '12px',
              fontFamily: "'Segoe UI', Roboto, sans-serif", // Fonte limpa para leitura
              fontSize: '1rem',
              color: '#e5e7eb', 
              lineHeight: '1.7',
              whiteSpace: 'pre-wrap',
              border: '1px solid #374151',
              overflowY: 'auto',
              maxHeight: '500px'
            }}>
              {summary || (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280', flexDirection: 'column', gap: '15px' }}>
                  <Bars3BottomLeftIcon style={{ width: '60px', opacity: 0.1 }} />
                  <p>O resumo do seu texto aparecerá aqui.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        <ExemplosSection ferramentaId="text-summary" />
      </div>
    </div>
  );
}