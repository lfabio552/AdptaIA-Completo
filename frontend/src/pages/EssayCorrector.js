import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';
import { 
  PencilIcon, 
  AcademicCapIcon, 
  ChartBarIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

export default function EssayCorrector() {
  const [theme, setTheme] = useState('');
  const [essayText, setEssayText] = useState('');
  const [result, setResult] = useState(null); 
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
        setEssayText(event.detail.text); 
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

      const response = await fetch(config.ENDPOINTS.CORRECT_ESSAY || `${config.API_BASE_URL}/correct-essay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essay: essayText,
          theme: theme || 'Tema Livre',
          user_id: user.id
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao corrigir redação.');

      setResult(data);

      try {
        await fetch(`${config.API_BASE_URL}/save-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            tool_type: 'essay-corrector',
            input_data: `Tema: ${theme}\n\n${essayText.substring(0, 100)}...`,
            output_data: JSON.stringify(data),
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

  // Função auxiliar para cor da nota
  const getScoreColor = (score) => {
      if (score >= 900) return '#4ade80'; // Verde
      if (score >= 700) return '#facc15'; // Amarelo
      return '#f87171'; // Vermelho
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      // MUDANÇA: Gradiente Laranja no fundo
      background: 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.15) 0%, #0f1016 60%)',
      color: 'white', 
      padding: '40px 20px', 
      fontFamily: "'Inter', sans-serif" 
    }}>
      
      {/* CSS RESPONSIVO PARA ALINHAMENTO PERFEITO */}
      <style>{`
        .tool-grid {
          display: grid;
          gap: 40px;
          grid-template-columns: 1fr;
        }
        
        @media (min-width: 1024px) {
          .tool-grid {
            grid-template-columns: 1fr 1fr;
            grid-auto-rows: 1fr; /* Garante altura igual */
          }
        }

        /* Card base para garantir altura */
        .tool-card {
          height: 100%;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* CABEÇALHO */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ 
             display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
             background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Laranja
             width: '60px', height: '60px', borderRadius: '15px', marginBottom: '20px',
             boxShadow: '0 10px 30px -10px rgba(245, 158, 11, 0.5)'
          }}>
            <AcademicCapIcon style={{ width: '32px', color: 'white' }} />
          </div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            marginBottom: '10px',
            // MUDANÇA: Gradiente no texto
            background: 'linear-gradient(to right, #ffffff, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Corretor de Redação IA
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Receba uma correção detalhada no estilo ENEM/Concursos, com nota por competência.
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
              <ChartBarIcon style={{ width: '16px' }} />
              {showHistory ? 'Ocultar Histórico' : 'Ver Correções Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '16px', border: '1px solid #374151' }}>
            <HistoryList user={user} toolType="essay-corrector" />
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div className="tool-grid">
          
          {/* LADO ESQUERDO: INPUTS */}
          <div className="tool-card" style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <form onSubmit={handleCorrect} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%' }}>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#e5e7eb' }}>
                  Tema da Redação:
                </label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ex: Os desafios da mobilidade urbana no Brasil"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: '#111827',
                    color: 'white',
                    border: '1px solid #4b5563',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#e5e7eb' }}>
                  Sua Redação:
                </label>
                <textarea
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  placeholder="Cole sua redação aqui para ser avaliada..."
                  required
                  style={{
                    width: '100%',
                    flexGrow: 1, // Ocupa espaço vertical
                    minHeight: '300px',
                    padding: '15px',
                    borderRadius: '10px',
                    backgroundColor: '#111827',
                    color: 'white',
                    border: '1px solid #4b5563',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ marginTop: '8px', textAlign: 'right', fontSize: '0.85rem', color: '#9ca3af' }}>
                   {essayText.split(/\s+/).filter(w => w.length > 0).length} palavras
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || essayText.length < 50}
                style={{
                  marginTop: 'auto',
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: (isLoading || essayText.length < 50) ? 'not-allowed' : 'pointer',
                  fontSize: '1.1rem',
                  opacity: (isLoading || essayText.length < 50) ? 0.6 : 1,
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                  transition: 'transform 0.1s'
                }}
              >
                {isLoading ? '🤖 Corrigindo...' : '🔍 Avaliar Redação'}
              </button>
            </form>
            
            {error && (
              <div style={{ marginTop: '20px', color: '#fca5a5', padding: '12px', backgroundColor: '#450a0a', borderRadius: '10px', fontSize: '0.9rem', textAlign: 'center' }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* LADO DIREITO: BOLETIM (RESULTADO) */}
          <div className="tool-card" style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #f59e0b', // Borda Laranja
            display: 'flex',
            flexDirection: 'column',
            minHeight: '600px'
          }}>
            <h3 style={{ color: '#fbbf24', marginBottom: '25px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
              📊 Boletim de Desempenho
            </h3>
            
            {!result ? (
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', textAlign: 'center' }}>
                <AcademicCapIcon style={{ width: '60px', opacity: 0.2, marginBottom: '15px' }} />
                <p style={{fontSize: '1.1rem'}}>Envie sua redação para ver a nota.</p>
              </div>
            ) : (
              <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '5px' }}>
                
                {/* NOTA PRINCIPAL */}
                <div style={{ 
                    textAlign: 'center', 
                    marginBottom: '30px', 
                    padding: '25px', 
                    backgroundColor: '#111827', 
                    borderRadius: '16px', 
                    border: '1px solid #374151',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ fontSize: '1rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Nota Final</div>
                    <div style={{ fontSize: '4rem', fontWeight: '800', lineHeight: 1, color: getScoreColor(result.total_score) }}>
                        {result.total_score}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '5px' }}>de 1000 pontos</div>
                </div>

                {/* FEEDBACK GERAL */}
                <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📝 Análise Geral
                    </h4>
                    <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '10px', color: '#d1d5db', lineHeight: '1.6', fontSize: '0.95rem' }}>
                        {result.feedback}
                    </div>
                </div>

                {/* COMPETÊNCIAS */}
                {result.competencies && (
                    <div>
                        <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🎯 Detalhamento por Competência
                        </h4>
                        {Object.entries(result.competencies).map(([key, value], idx) => (
                            <div key={idx} style={{ marginBottom: '15px', backgroundColor: '#111827', padding: '15px', borderRadius: '10px', borderLeft: `4px solid ${getScoreColor(typeof value === 'object' ? value.score : 0)}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', alignItems: 'center' }}>
                                    <strong style={{ color: '#fbbf24', textTransform: 'capitalize', fontSize: '0.95rem' }}>
                                        {key.replace(/_/g, ' ')}
                                    </strong>
                                    <span style={{ color: '#fff', fontWeight: 'bold', backgroundColor: '#374151', padding: '2px 8px', borderRadius: '6px', fontSize: '0.9rem' }}>
                                        {typeof value === 'object' ? value.score : value}
                                    </span>
                                </div>
                                {typeof value === 'object' && value.comment && (
                                    <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: 0, lineHeight: '1.4' }}>
                                        {value.comment}
                                    </p>
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