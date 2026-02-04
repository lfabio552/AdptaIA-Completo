import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';
import { 
  VideoCameraIcon, 
  FilmIcon, 
  ClipboardDocumentCheckIcon, 
  SparklesIcon,
  EyeIcon
} from '@heroicons/react/24/solid';

// Listas de Opções
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
  'Cinematic Gimbal (Estável)',
  'Drone / Vista Aérea',
  'FPV Drone (Rápido)',
  'Handheld (Câmera na Mão)',
  'Close-Up / Macro',
  'Travelling / Dolly Shot',
  'Low Angle (Imponente)',
  'GoPro / Primeira Pessoa'
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

      setGeneratedPrompt(data.prompt);

      try {
        await fetch(`${config.API_BASE_URL}/save-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            tool_type: 'veo3-prompt',
            input_data: idea,
            output_data: data.prompt,
            metadata: { style: style, camera: camera }
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
      // MUDANÇA: Gradiente Índigo no fundo
      background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, #0f1016 60%)',
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
             background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // Índigo/Roxo
             width: '60px', height: '60px', borderRadius: '15px', marginBottom: '20px',
             boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.5)'
          }}>
            <VideoCameraIcon style={{ width: '32px', color: 'white' }} />
          </div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            marginBottom: '10px',
            // MUDANÇA: Gradiente no texto
            background: 'linear-gradient(to right, #ffffff, #a5b4fc, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Gerador de Prompt para Vídeo
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Crie roteiros técnicos perfeitos para VEO, Sora e Runway Gen-3.
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
              <FilmIcon style={{ width: '16px' }} />
              {showHistory ? 'Ocultar Histórico' : 'Ver Roteiros Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '16px', border: '1px solid #374151' }}>
            <HistoryList user={user} toolType="veo3-prompt" />
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div className="tool-grid">
          
          {/* LADO ESQUERDO: CONFIGURAÇÃO */}
          <div className="tool-card" style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%' }}>
              
              <div style={{ marginBottom: '25px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '1rem', fontWeight: '600', color: '#e5e7eb' }}>
                  Descreva sua Cena:
                </label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Ex: Um astronauta caminhando em Marte durante uma tempestade de areia vermelha, ultra realista..."
                  required
                  style={{
                    width: '100%',
                    flexGrow: 1,
                    minHeight: '150px',
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#9ca3af' }}>Estilo Visual</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    style={{ 
                        width: '100%', padding: '12px', borderRadius: '10px', 
                        backgroundColor: '#111827', color: 'white', border: '1px solid #4b5563',
                        height: '50px', cursor: 'pointer'
                    }}
                  >
                    {videoStyles.map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#9ca3af' }}>Câmera</label>
                  <select
                    value={camera}
                    onChange={(e) => setCamera(e.target.value)}
                    style={{ 
                        width: '100%', padding: '12px', borderRadius: '10px', 
                        backgroundColor: '#111827', color: 'white', border: '1px solid #4b5563',
                        height: '50px', cursor: 'pointer'
                    }}
                  >
                    {cameraAngles.map((c, i) => <option key={i} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: 'auto',
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer',
                  fontSize: '1.1rem',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                  transition: 'transform 0.1s'
                }}
              >
                {isLoading ? '🎥 Renderizando Prompt...' : '🎬 Gerar Prompt VEO'}
              </button>
              
              {errorMessage && (
                <div style={{ marginTop: '20px', color: '#fca5a5', padding: '12px', backgroundColor: '#450a0a', borderRadius: '10px', fontSize: '0.9rem' }}>
                  ⚠️ {errorMessage}
                </div>
              )}
            </form>
          </div>

          {/* LADO DIREITO: RESULTADO */}
          <div className="tool-card" style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #6366f1', // Borda Índigo
            display: 'flex',
            flexDirection: 'column',
            minHeight: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                <SparklesIcon style={{ width: '24px' }} /> Prompt Otimizado:
              </h3>
              {generatedPrompt && (
                <button
                  onClick={() => {navigator.clipboard.writeText(generatedPrompt); alert('Copiado!');}}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#4338ca',
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
              backgroundColor: '#000000', // Fundo preto estilo terminal
              color: '#e5e7eb', 
              padding: '25px', 
              borderRadius: '12px',
              fontFamily: "'Courier New', Courier, monospace", // Fonte Monospace
              fontSize: '1rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              border: '1px solid #374151',
              overflowY: 'auto',
              maxHeight: '500px'
            }}>
              {generatedPrompt || (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280', flexDirection: 'column', gap: '10px' }}>
                  <EyeIcon style={{ width: '48px', opacity: 0.2 }} />
                  <p>Seu prompt cinematográfico aparecerá aqui.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        <ExemplosSection ferramentaId="veo3-prompt" />
      </div>
    </div>
  );
}