import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';

// Listas de Opções Profissionais para Vídeo
const videoStyles = [
  'Cinematográfico (Padrão)',
  'Fotorealista / Live Action',
  'Animação Pixar / Disney',
  'Anime Japonês',
  'Cyberpunk / Futurista',
  'Documentário (Nat Geo)',
  'Vintage / Filme 35mm',
  'Terror / Dark Atmosphere',
  'Publicidade de Produto (Clean)'
];

const cameraAngles = [
  'Cinematic Gimbal (Estável e Suave)',
  'Drone / Vista Aérea (Establishing Shot)',
  'FPV Drone (Rápido e Dinâmico)',
  'Handheld (Câmera na Mão / Realista)',
  'Close-Up / Macro (Detalhes)',
  'Travelling / Dolly Shot (Seguindo o sujeito)',
  'Low Angle (De baixo para cima / Imponente)',
  'GoPro / Body Cam (Primeira Pessoa)'
];

export default function Veo3PromptGenerator() {
  const [idea, setIdea] = useState('');
  const [style, setStyle] = useState(videoStyles[0]);
  const [camera, setCamera] = useState(cameraAngles[0]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); 
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
        setIdea(event.detail.text);
        if (event.detail.metadata) {
            if (event.detail.metadata.style) setStyle(event.detail.metadata.style);
            if (event.detail.metadata.camera) setCamera(event.detail.metadata.camera);
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

      // 1. CHAMADA API (Usando a rota correta do VEO3)
      const endpoint = config.ENDPOINTS.GENERATE_VEO3_PROMPT || `${config.API_BASE_URL}/generate-veo3-prompt`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: idea,
          style: style,
          camera: camera, 
          user_id: user.id
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar prompt.');

      const finalPrompt = data.prompt;
      setGeneratedPrompt(finalPrompt);

      // 2. SALVAR HISTÓRICO
      try {
        await fetch(`${config.API_BASE_URL}/save-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            tool_type: 'veo3-prompt', // Identificador consistente
            input_data: idea,
            output_data: finalPrompt,
            metadata: { 
                style: style,
                camera: camera
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
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '10px' }}>
          🎬 Gerador de Prompt Veo/Sora
        </h1>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
          Crie vídeos de nível cinematográfico definindo estilo e movimento de câmera.
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
              {showHistory ? '▲ Ocultar Histórico' : '📚 Ver Roteiros Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '10px' }}>
            <HistoryList user={user} toolType="veo3-prompt" />
          </div>
        )}

        <div style={{ backgroundColor: '#1f2937', padding: '30px', borderRadius: '12px', border: '1px solid #374151' }}>
          <form onSubmit={handleGenerate}>
            
            {/* Ideia */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '1.2rem' }}>
                Descreva sua Cena:
              </label>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Ex: Um astronauta caminhando em Marte durante uma tempestade de areia..."
                required
                style={{
                  width: '100%',
                  height: '100px',
                  padding: '15px',
                  borderRadius: '8px',
                  backgroundColor: '#111827',
                  color: 'white',
                  border: '1px solid #4b5563',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* Seletores Lado a Lado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '10px' }}>Estilo Visual:</label>
                    <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#111827', color: 'white', border: '1px solid #6366f1' }}
                    >
                        {videoStyles.map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '10px' }}>Movimento de Câmera:</label>
                    <select
                        value={camera}
                        onChange={(e) => setCamera(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#111827', color: 'white', border: '1px solid #10b981' }}
                    >
                        {cameraAngles.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '15px',
                background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: isLoading ? 'wait' : 'pointer',
                fontSize: '1.1rem'
              }}
            >
              {isLoading ? '🎥 Renderizando Prompt...' : '🎬 Gerar Prompt Veo3'}
            </button>
          </form>

          {errorMessage && (
            <div style={{ marginTop: '20px', color: '#fca5a5', padding: '10px', backgroundColor: '#450a0a', borderRadius: '8px' }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {generatedPrompt && (
            <div style={{ marginTop: '30px', backgroundColor: '#111827', padding: '25px', borderRadius: '8px', border: '1px solid #6366f1' }}>
              <h3 style={{ color: '#a5b4fc', marginBottom: '15px' }}>
                🚀 Prompt Otimizado:
              </h3>
              <div style={{ 
                color: '#d1d5db', 
                lineHeight: '1.6', 
                marginBottom: '20px', 
                backgroundColor: '#000', 
                padding: '15px', 
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.95rem'
              }}>
                {generatedPrompt}
              </div>
              <button
                onClick={() => {navigator.clipboard.writeText(generatedPrompt); alert('Copiado!');}}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#4338ca',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📋 Copiar Prompt
              </button>
            </div>
          )}
        </div>

        <ExemplosSection ferramentaId="veo3-prompt" />
      </div>
    </div>
  );
}