import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ExemplosSection from '../components/ExemplosSection';
import config from '../config';
import { saveToHistory, TOOL_CONFIGS } from '../utils/saveToHistory';
import HistoryList from '../components/HistoryList';
import { 
  PhotoIcon, 
  ArrowDownTrayIcon, 
  ClipboardIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const styles = {
    realistic: "Fotorrealista, detalhado, 8K",
    cinematic: "Cinematográfico, iluminação dramática, filme",
    anime: "Anime, estilo japonês, cores vibrantes",
    fantasy: "Arte de fantasia, mágico, épico",
    cyberpunk: "Cyberpunk, neon, futurista",
    painting: "Pintura a óleo, texturizado, artístico"
  };

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
        setPrompt(event.detail.text);
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    return () => window.removeEventListener('loadFromHistory', handleLoadFromHistory);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setImageUrl('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para gerar imagens.');
      setUser(user);

      const fullPrompt = `${prompt}, ${styles[style]}, masterpiece, best quality`;

      const response = await fetch(config.ENDPOINTS.GENERATE_IMAGE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: fullPrompt,
          user_id: user.id 
        }),
      });

      const data = await response.json();
      if (response.status === 402) throw new Error(data.error);
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar imagem.');

      setImageUrl(data.image_url);

      await saveToHistory(
        user,
        TOOL_CONFIGS.IMAGE_GENERATE,
        fullPrompt,
        data.image_url,
        { 
          style: style,
          image_url: data.image_url,
          credits_used: 2
        }
      );

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagem_ia_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro ao baixar imagem: ' + err.message);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      // MUDANÇA: Gradiente Dourado (Gold/Amber)
      background: 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.15) 0%, #0f1016 60%)',
      color: 'white', 
      padding: '40px 20px', 
      fontFamily: "'Inter', sans-serif" 
    }}>
      
      {/* CSS RESPONSIVO PARA ALINHAMENTO */}
      <style>{`
        .tool-grid {
          display: grid;
          gap: 40px;
          grid-template-columns: 1fr;
        }
        
        @media (min-width: 1024px) {
          .tool-grid {
            grid-template-columns: 1fr 1fr;
            grid-auto-rows: 1fr;
          }
        }

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
             background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Gradiente Dourado
             width: '60px', height: '60px', borderRadius: '15px', marginBottom: '20px',
             boxShadow: '0 10px 30px -10px rgba(245, 158, 11, 0.5)'
          }}>
            <PhotoIcon style={{ width: '32px', color: 'white' }} />
          </div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            marginBottom: '10px',
            // Texto Dourado
            background: 'linear-gradient(to right, #ffffff, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Gerador de Imagens (Stable Diffusion)
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Transforme suas ideias em arte digital de alta resolução em segundos.
          </p>
          <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#fbbf24', fontWeight: 'bold', border: '1px solid #fbbf24', display: 'inline-block', padding: '5px 15px', borderRadius: '20px' }}>
            ⚠️ Custa 2 créditos por geração
          </div>
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
              {showHistory ? 'Ocultar Histórico' : 'Ver Minhas Criações'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '16px', border: '1px solid #374151' }}>
            <HistoryList user={user} toolType="image" />
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div className="tool-grid">
          
          {/* LADO ESQUERDO: CONTROLES */}
          <div className="tool-card" style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%' }}>
              <div style={{ marginBottom: '25px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '1rem', fontWeight: '600', color: '#e5e7eb' }}>
                  Descreva sua Imagem:
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Um astronauta andando em Marte com estilo cyberpunk..."
                  required
                  style={{
                    width: '100%',
                    flexGrow: 1, // Preenche espaço vertical
                    minHeight: '200px',
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
                      border: '1px solid #f59e0b', // Borda Dourada
                      fontSize: '1rem',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                  }}
                >
                  <option value="realistic">🎯 Realista (Fotorrealista)</option>
                  <option value="cinematic">🎬 Cinematográfico</option>
                  <option value="anime">🇯🇵 Anime</option>
                  <option value="fantasy">🧙‍♂️ Fantasia Épica</option>
                  <option value="cyberpunk">🤖 Cyberpunk</option>
                  <option value="painting">🖼️ Pintura Artística</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: 'auto',
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)', // Botão Dourado
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer',
                  fontSize: '1.1rem',
                  boxShadow: '0 10px 20px -5px rgba(245, 158, 11, 0.4)',
                  transition: 'transform 0.1s'
                }}
              >
                {isLoading ? '🎨 Pintando Pixels...' : '✨ Gerar Imagem'}
              </button>
              
              {error && (
                <div style={{ marginTop: '20px', color: '#fca5a5', padding: '15px', backgroundColor: '#450a0a', borderRadius: '10px', border: '1px solid #ef4444' }}>
                  ⚠️ {error}
                </div>
              )}
            </form>
          </div>

          {/* LADO DIREITO: RESULTADO VISUAL */}
          <div className="tool-card" style={{ 
            backgroundColor: '#1f2937', 
            padding: '20px', 
            borderRadius: '20px', 
            border: '1px solid #f59e0b', // Borda Dourada
            display: 'flex',
            flexDirection: 'column',
            minHeight: '500px', 
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {imageUrl ? (
                <>
                    <img 
                        src={imageUrl} 
                        alt="Gerada por IA" 
                        style={{ width: '100%', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
                    />
                    <div style={{ display: 'flex', gap: '15px', marginTop: '20px', width: '100%' }}>
                        <button 
                            onClick={downloadImage}
                            style={{ 
                                flex: 1, padding: '12px', backgroundColor: '#059669', color: 'white', 
                                border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <ArrowDownTrayIcon style={{width: '20px'}}/> Baixar
                        </button>
                        <button 
                            onClick={() => {navigator.clipboard.writeText(imageUrl); alert('Link copiado!');}}
                            style={{ 
                                flex: 1, padding: '12px', backgroundColor: '#374151', color: 'white', 
                                border: '1px solid #4b5563', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <ClipboardIcon style={{width: '20px'}}/> Copiar Link
                        </button>
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', color: '#6b7280' }}>
                    <div style={{ fontSize: '60px', marginBottom: '20px', opacity: 0.3 }}>🖼️</div>
                    <p style={{ fontSize: '1.1rem' }}>Sua arte aparecerá aqui.</p>
                    <p style={{ fontSize: '0.9rem' }}>Preencha o prompt e clique em gerar.</p>
                </div>
            )}
          </div>

        </div>

        {/* SEÇÃO INFERIOR: DICAS E EXEMPLOS */}
        <div style={{ marginTop: '60px' }}>
            <ExemplosSection ferramentaId="gerar-imagem-completa" />
            
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '20px', 
                marginTop: '40px' 
            }}>
                <div style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '16px', border: '1px solid #374151' }}>
                    <h3 style={{ color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        💡 Dicas de Ouro
                    </h3>
                    <ul style={{ paddingLeft: '20px', color: '#d1d5db', lineHeight: '1.8' }}>
                        <li>Use adjetivos fortes: "épico, detalhado, cinematográfico".</li>
                        <li>Especifique a luz: "luz de neon, pôr do sol, dramática".</li>
                        <li>Peça qualidade: "8k, masterpiece, alta resolução".</li>
                    </ul>
                </div>
                <div style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '16px', border: '1px solid #374151' }}>
                    <h3 style={{ color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        ⚙️ Info Técnica
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#d1d5db' }}>
                        <span>Modelo:</span> <span style={{fontWeight: 'bold'}}>Stable Diffusion XL</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#d1d5db' }}>
                        <span>Resolução:</span> <span style={{fontWeight: 'bold'}}>1024x1024</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24' }}>
                        <span>Custo:</span> <span style={{fontWeight: 'bold'}}>2 Créditos</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}