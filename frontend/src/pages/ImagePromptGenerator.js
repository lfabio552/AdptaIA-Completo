import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // ADICIONADO PARA O POP-UP
import { supabase } from '../supabaseClient';
import config from '../config';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';
import { SparklesIcon, PaintBrushIcon } from '@heroicons/react/24/solid';

const stylesList = [
  'Cinematográfico (Padrão)',
  'Fotorealista / Realista',
  'Anime / Mangá',
  'Cyberpunk / Futurista',
  'Fantasia Medieval / RPG',
  'Render 3D (Pixar/Disney)',
  'Pintura a Óleo (Clássico)',
  'Aquarela',
  'Terror / Dark',
  'Retrowave / Anos 80',
  'Minimalista'
];

export default function ImagePromptGenerator() {
  const [idea, setIdea] = useState('');
  const [style, setStyle] = useState(stylesList[0]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); 
  const [user, setUser] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // ESTADO PARA O POP-UP DE CRÉDITOS
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
        setIdea(event.detail.text);
        if (event.detail.metadata?.style) {
            setStyle(event.detail.metadata.style);
        }
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    return () => window.removeEventListener('loadFromHistory', handleLoadFromHistory);
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setGeneratedPrompt('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para continuar.');

      const endpoint = config.ENDPOINTS.GENERATE_PROMPT || `${config.API_BASE_URL}/generate-prompt`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: idea,
          style: style,
          user_id: user.id
        }),
      });

      // LÓGICA DE BLOQUEIO (ERRO 402 - SEM CRÉDITOS)
      if (response.status === 402) {
        setShowUpgradeModal(true);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar prompt.');

      const finalPrompt = data.prompt || data.advanced_prompt;
      setGeneratedPrompt(finalPrompt);

      try {
        await fetch(`${config.API_BASE_URL}/save-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            tool_type: 'image-prompt',
            input_data: idea,
            output_data: finalPrompt,
            metadata: { 
                length: finalPrompt.length,
                style: style 
            }
          })
        });
      } catch (histError) {
        console.error("Erro ao salvar histórico:", histError);
      }

    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f1016', // Fundo completamente escuro
      color: 'white', 
      padding: '40px 20px', 
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden' // Garante que a luz não crie barra de rolagem
    }}>
      
      {/* LUZ DE FUNDO (GLOW SUTIL ATRÁS DO TÍTULO) */}
      <div style={{
        position: 'absolute',
        top: '-150px', // Sobe um pouco para pegar só a parte de cima
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, rgba(15, 16, 22, 0) 70%)', // Rosa da ferramenta
        filter: 'blur(40px)', // Deixa a luz bem difusa e elegante
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* CABEÇALHO */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ 
             display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
             background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)', 
             width: '60px', height: '60px', borderRadius: '15px', marginBottom: '20px',
             boxShadow: '0 10px 30px -10px rgba(236, 72, 153, 0.5)'
          }}>
            <PaintBrushIcon style={{ width: '32px', color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>
            Prompt de Imagem IA
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Transforme ideias simples em descrições técnicas perfeitas para Midjourney, DALL-E e Stable Diffusion.
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
              <SparklesIcon style={{ width: '16px' }} />
              {showHistory ? 'Ocultar Histórico' : 'Ver Meus Prompts Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '16px', border: '1px solid #374151' }}>
            <HistoryList user={user} toolType="image-prompt" />
          </div>
        )}

        {/* CSS RESPONSIVO PARA O GRID */}
        <style>{`
          .tool-grid { display: grid; gap: 40px; align-items: stretch; grid-template-columns: 1fr; }
          @media (min-width: 768px) { .tool-grid { grid-template-columns: 1fr 1fr; } }
        `}</style>

        {/* GRID PRINCIPAL */}
        <div className="tool-grid">
          
          {/* LADO ESQUERDO: CONTROLES */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex', 
            flexDirection: 'column',
            height: '100%'
          }}>
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '1rem', fontWeight: '600', color: '#e5e7eb' }}>
                  Descreva sua Ideia:
                </label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Ex: Um gato astronauta flutuando no espaço com planetas coloridos ao fundo..."
                  required
                  style={{
                    width: '100%',
                    height: '140px',
                    padding: '15px',
                    borderRadius: '12px',
                    backgroundColor: '#111827',
                    color: 'white',
                    border: '1px solid #4b5563',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '1rem', fontWeight: '600', color: '#e5e7eb' }}>
                  Estilo Visual:
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      backgroundColor: '#111827',
                      color: 'white',
                      border: '1px solid #ec4899', 
                      fontSize: '1rem',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                  }}
                >
                  {stylesList.map((s, index) => (
                      <option key={index} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'linear-gradient(90deg, #ec4899 0%, #db2777 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    cursor: isLoading ? 'wait' : 'pointer',
                    fontSize: '1.1rem',
                    boxShadow: '0 10px 20px -5px rgba(236, 72, 153, 0.4)',
                    transition: 'transform 0.1s'
                  }}
                >
                  {isLoading ? '✨ Criando Mágica...' : 'Gerar Prompt'}
                </button>
              </div>
            </form>
            
            {errorMessage && (
              <div style={{ marginTop: '20px', color: '#fca5a5', padding: '12px', backgroundColor: '#450a0a', borderRadius: '10px', fontSize: '0.9rem' }}>
                ⚠️ {errorMessage}
              </div>
            )}
          </div>

          {/* LADO DIREITO: RESULTADO */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #ec4899',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}>
            <h3 style={{ color: '#fbcfe8', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <SparklesIcon style={{ width: '24px' }} /> Resultado:
            </h3>
            
            <div style={{ 
              flexGrow: 1,
              backgroundColor: '#000', 
              padding: '20px', 
              borderRadius: '12px',
              fontFamily: 'monospace',
              fontSize: '0.95rem',
              color: '#d1d5db',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              border: '1px solid #374151',
              marginBottom: '20px',
              minHeight: '200px'
            }}>
              {generatedPrompt || <span style={{color: '#4b5563'}}>O prompt otimizado aparecerá aqui...</span>}
            </div>

            {generatedPrompt && (
              <button
                onClick={() => {navigator.clipboard.writeText(generatedPrompt); alert('Copiado!');}}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#be185d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                📋 Copiar Texto
              </button>
            )}
          </div>

        </div>

        {/* Seção de Exemplos */}
        <ExemplosSection ferramentaId="gerar-imagem" />
      </div>

      {/* MODAL DE CRÉDITOS ESGOTADOS */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            backgroundColor: '#1f2937', padding: '40px', borderRadius: '24px',
            maxWidth: '420px', width: '90%', textAlign: 'center',
            border: '1px solid #ec4899', boxShadow: '0 10px 50px rgba(236, 72, 153, 0.3)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🪙</div>
            <h2 style={{ color: 'white', marginBottom: '15px', fontSize: '1.8rem', fontWeight: '800' }}>
              Créditos Esgotados!
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '30px', fontSize: '1.05rem', lineHeight: '1.5' }}>
              Você atingiu o limite do plano gratuito. Assine o <strong>Plano PRO</strong> para criar sem limites e ter acesso a todas as ferramentas premium.
            </p>
            <Link to="/precos" style={{
              display: 'block', width: '100%', padding: '16px', boxSizing: 'border-box',
              background: 'linear-gradient(90deg, #ec4899 0%, #db2777 100%)', color: 'white',
              borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none',
              marginBottom: '15px', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(236, 72, 153, 0.4)'
            }}>
              Ver Planos PRO 🚀
            </Link>
            <button 
              onClick={() => setShowUpgradeModal(false)} 
              style={{
                background: 'transparent', border: 'none', color: '#9ca3af',
                cursor: 'pointer', fontSize: '0.95rem', textDecoration: 'underline'
              }}
            >
              Voltar para a ferramenta
            </button>
          </div>
        </div>
      )}

    </div>
  );
}