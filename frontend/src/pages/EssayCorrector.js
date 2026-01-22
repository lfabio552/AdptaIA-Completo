import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';

export default function EssayCorrector() {
  const [theme, setTheme] = useState(''); // NOVO: Campo de Tema
  const [essayText, setEssayText] = useState('');
  const [result, setResult] = useState(null); // Agora guarda o objeto JSON (nota, feedback)
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
        setEssayText(event.detail.text); 
        // Se tiver metadados de tema no histórico, poderia carregar aqui também
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    return () => window.removeEventListener('loadFromHistory', handleLoadFromHistory);
  }, []);

  const handleCorrect = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para corrigir redações.');

      // 1. CHAMADA API (Payload corrigido para essay + theme)
      const response = await fetch(config.ENDPOINTS.CORRECT_ESSAY || `${config.API_BASE_URL}/correct-essay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essay: essayText, // Backend espera 'essay', não 'text'
          theme: theme || 'Tema Livre', // Backend espera 'theme'
          user_id: user.id
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao corrigir redação.');

      // O Backend retorna um JSON { total_score, competencies, feedback }
      setResult(data);

      // 2. SALVAR HISTÓRICO (Manual e formatado)
      try {
        const scoreResumo = `Nota: ${data.total_score} - ${data.feedback ? data.feedback.substring(0, 50) : ''}...`;
        
        await fetch(`${config.API_BASE_URL}/save-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            tool_type: 'essay-corrector', // Backend converte para "Corretor de Redação"
            input_data: `Tema: ${theme}\n\n${essayText.substring(0, 100)}...`,
            output_data: JSON.stringify(data), // Salva o JSON completo para consultas futuras
            metadata: { 
              theme: theme, 
              score: data.total_score,
              word_count: essayText.split(/\s+/).length 
            }
          })
        });
      } catch (histError) {
        console.error("Erro histórico:", histError);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '10px' }}>
          📝 Corretor de Redação IA
        </h1>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
          Avaliação estilo ENEM/Concursos com nota detalhada por competência.
        </p>

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
              {showHistory ? '▲ Ocultar Histórico' : '📚 Ver Correções Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '10px' }}>
            <HistoryList user={user} toolType="essay-corrector" />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          {/* LADO ESQUERDO: INPUTS */}
          <div style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '12px', border: '1px solid #374151' }}>
            <form onSubmit={handleCorrect}>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Tema da Redação:</label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ex: Os desafios da mobilidade urbana no Brasil"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#111827', color: 'white', border: '1px solid #4b5563' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Seu Texto:</label>
                <textarea
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  placeholder="Cole sua redação aqui..."
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
                    lineHeight: '1.5',
                    resize: 'vertical'
                  }}
                />
                <div style={{ marginTop: '5px', textAlign: 'right', fontSize: '0.8rem', color: '#6b7280' }}>
                   {essayText.split(/\s+/).filter(w => w.length > 0).length} palavras
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || essayText.length < 50}
                style={{
                  width: '100%',
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
                {isLoading ? '🤖 Analisando Competências...' : '🔍 Corrigir Agora'}
              </button>
            </form>
            {error && <div style={{ color: '#fca5a5', marginTop: '15px', textAlign: 'center' }}>⚠️ {error}</div>}
          </div>

          {/* LADO DIREITO: RESULTADO (FORMATADO) */}
          <div style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '12px', border: '1px solid #ea580c' }}>
            <h3 style={{ color: '#fdba74', marginBottom: '20px', textAlign: 'center' }}>📊 Resultado da Correção</h3>
            
            {!result ? (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '100px' }}>
                <p>O boletim detalhado aparecerá aqui.</p>
              </div>
            ) : (
              <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '5px' }}>
                
                {/* Nota Total */}
                <div style={{ textAlign: 'center', marginBottom: '30px', padding: '20px', backgroundColor: '#374151', borderRadius: '10px' }}>
                    <span style={{ fontSize: '1rem', color: '#d1d5db' }}>Nota Final</span>
                    <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: result.total_score >= 800 ? '#4ade80' : result.total_score >= 600 ? '#facc15' : '#f87171' }}>
                        {result.total_score}
                    </div>
                </div>

                {/* Feedback Geral */}
                <div style={{ marginBottom: '25px' }}>
                    <h4 style={{ color: '#fff', borderBottom: '1px solid #4b5563', paddingBottom: '5px' }}>📝 Análise Geral</h4>
                    <p style={{ color: '#d1d5db', marginTop: '10px', lineHeight: '1.6' }}>{result.feedback}</p>
                </div>

                {/* Competências (Se houver) */}
                {result.competencies && (
                    <div>
                        <h4 style={{ color: '#fff', borderBottom: '1px solid #4b5563', paddingBottom: '5px', marginBottom: '15px' }}>🎯 Competências</h4>
                        {Object.entries(result.competencies).map(([key, value], idx) => (
                            <div key={idx} style={{ marginBottom: '15px', backgroundColor: '#111827', padding: '10px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <strong style={{ color: '#fdba74', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</strong>
                                    {/* Se o valor for número, mostra nota, se for texto, mostra texto */}
                                    <span style={{ color: '#fff', fontWeight: 'bold' }}>
                                        {typeof value === 'object' ? value.score : value}
                                    </span>
                                </div>
                                {typeof value === 'object' && value.comment && (
                                    <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: 0 }}>{value.comment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
              </div>
            )}
          </div>
        </div>

        <ExemplosSection ferramentaId="essay-corrector" />
      </div>
    </div>
  );
}