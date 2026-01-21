import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import { saveToHistory, TOOL_CONFIGS } from '../utils/saveToHistory';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';

export default function EssayCorrector() {
  const [essayText, setEssayText] = useState('');
  const [correction, setCorrection] = useState('');
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

  // --- NOVO: Ouvinte do Histórico ---
  useEffect(() => {
    const handleLoadFromHistory = (event) => {
      if (event.detail && event.detail.text) {
        setEssayText(event.detail.text); // Preenche o texto da redação
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    return () => {
      window.removeEventListener('loadFromHistory', handleLoadFromHistory);
    };
  }, []);

  const handleCorrect = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setCorrection('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para corrigir redações.');

      const response = await fetch(config.ENDPOINTS.CORRECT_ESSAY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: essayText,
          user_id: user.id
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao corrigir redação.');

      setCorrection(data.correction);

      // Salvar histórico
      await saveToHistory(
        user,
        TOOL_CONFIGS.ESSAY_CORRECTOR,
        essayText,
        data.correction,
        { word_count: essayText.split(' ').length }
      );

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '10px' }}>
          📝 Corretor de Redação (ENEM/Concursos)
        </h1>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
          Receba uma análise detalhada, nota estimada e sugestões de melhoria.
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
            <HistoryList user={user} toolType="essay-corrector" />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          {/* Lado Esquerdo: Input */}
          <div style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '12px', border: '1px solid #374151' }}>
            <form onSubmit={handleCorrect}>
              <label style={{ display: 'block', marginBottom: '15px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                Sua Redação:
              </label>
              <textarea
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder="Digite ou cole sua redação aqui..."
                required
                style={{
                  width: '100%',
                  height: '400px',
                  padding: '15px',
                  borderRadius: '8px',
                  backgroundColor: '#111827',
                  color: 'white',
                  border: '1px solid #4b5563',
                  fontSize: '16px',
                  lineHeight: '1.5'
                }}
              />
              
              <div style={{ marginTop: '10px', color: '#9ca3af', fontSize: '0.9rem', textAlign: 'right' }}>
                {essayText.split(/\s+/).filter(w => w.length > 0).length} palavras
              </div>

              <button
                type="submit"
                disabled={isLoading || essayText.length < 50}
                style={{
                  width: '100%',
                  marginTop: '20px',
                  padding: '15px',
                  background: 'linear-gradient(90deg, #ea580c 0%, #f97316 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  cursor: (isLoading || essayText.length < 50) ? 'not-allowed' : 'pointer',
                  opacity: (isLoading || essayText.length < 50) ? 0.6 : 1
                }}
              >
                {isLoading ? 'Analisando...' : '🔍 Corrigir Redação'}
              </button>
            </form>
            {error && <div style={{ color: '#fca5a5', marginTop: '10px' }}>{error}</div>}
          </div>

          {/* Lado Direito: Correção */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '25px', 
            borderRadius: '12px', 
            border: '1px solid #374151',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px', borderBottom: '1px solid #374151', paddingBottom: '10px' }}>
              📊 Avaliação da IA
            </h3>
            
            {correction ? (
              <div 
                dangerouslySetInnerHTML={{ __html: correction.replace(/\n/g, '<br/>') }}
                style={{ 
                  color: '#d1d5db', 
                  lineHeight: '1.6',
                  fontSize: '1.05rem' 
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '50px' }}>
                <p>O resultado da correção aparecerá aqui.</p>
                <p style={{ fontSize: '0.9rem' }}>Inclui nota, erros gramaticais e dicas de argumentação.</p>
              </div>
            )}
          </div>
        </div>

        <ExemplosSection ferramentaId="essay-corrector" />
      </div>
    </div>
  );
}