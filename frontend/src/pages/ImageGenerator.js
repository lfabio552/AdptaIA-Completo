import React, { useState, useEffect } from 'react';
import '../App.css';
import { supabase } from '../supabaseClient';
import ExemplosSection from '../components/ExemplosSection';
import config from '../config';
import { saveToHistory, TOOL_CONFIGS } from '../utils/saveToHistory';
import HistoryList from '../components/HistoryList';

export default function ImageGenerator() {
  // Estados principais
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Estilos disponíveis
  const styles = {
    realistic: "Fotorrealista, detalhado, 8K",
    cinematic: "Cinematográfico, iluminação dramática, filme",
    anime: "Anime, estilo japonês, cores vibrantes",
    fantasy: "Arte de fantasia, mágico, épico",
    cyberpunk: "Cyberpunk, neon, futurista",
    painting: "Pintura a óleo, texturizado, artístico"
  };

  // Carregar usuário
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // --- NOVO: Ouvinte do Histórico (Faz o botão "Usar" funcionar) ---
  useEffect(() => {
    const handleLoadFromHistory = (event) => {
      if (event.detail && event.detail.text) {
        setPrompt(event.detail.text); // Preenche o campo de prompt
        setShowHistory(false); // Fecha o painel de histórico
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Sobe a tela
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
    setImageUrl('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para gerar imagens.');
      setUser(user);

      // Combinar prompt com estilo
      const fullPrompt = `${prompt}, ${styles[style]}, masterpiece, best quality`;

      // Chamar API
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

      // SALVAR HISTÓRICO
      await saveToHistory(
        user,
        TOOL_CONFIGS.IMAGE_GENERATE,
        fullPrompt,
        data.image_url,
        { 
          style: style,
          prompt_length: fullPrompt.length,
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
      backgroundColor: '#111827', 
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      
      {/* CONTEÚDO PRINCIPAL */}
      <div style={{ 
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        
        {/* HEADER */}
        <div style={{ 
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            color: '#fff', 
            marginBottom: '10px' 
          }}>
            🎨 Gerador de Imagens com IA
          </h1>
          <p style={{ 
            color: '#9ca3af', 
            fontSize: '1.1rem',
            marginBottom: '10px'
          }}>
            Descreva sua ideia e receba uma imagem única em segundos!
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px',
            fontSize: '0.9rem'
          }}>
            <span style={{ color: '#fbbf24' }}>⚠️ Custa 2 créditos</span>
            <span style={{ color: '#9ca3af' }}>•</span>
            <span style={{ color: '#9ca3af' }}>Stable Diffusion SDXL</span>
          </div>
          
          {/* Botão de histórico */}
          {user && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                marginTop: '20px',
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
              {showHistory ? '▲ Ocultar Histórico' : '📚 Ver Meu Histórico'}
            </button>
          )}
        </div>
        
        {/* Seção de histórico */}
        {showHistory && user && (
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#1f2937',
            borderRadius: '10px',
            border: '1px solid #374151'
          }}>
            <HistoryList user={user} toolType="image" />
          </div>
        )}
        
        {/* FORMULÁRIO E CONTEÚDO */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '30px'
        }}>
          
          {/* FORMULÁRIO */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '12px',
            border: '1px solid #374151'
          }}>
            <form onSubmit={handleSubmit}>
              
              {/* CAMPO DE PROMPT */}
              <div style={{ marginBottom: '30px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#d1d5db', 
                  fontSize: '1.1rem',
                  marginBottom: '15px',
                  fontWeight: '500'
                }}>
                  ✨ Descreva a imagem que quer criar:
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Um dragão de cristal azul sobrevoando uma cidade cyberpunk à noite, com arranha-céus de neon e chuva..."
                  required
                  style={{ 
                    width: '100%',
                    minHeight: '150px',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #4b5563',
                    backgroundColor: '#111827',
                    color: 'white',
                    fontSize: '16px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginTop: '10px'
                }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>
                    {prompt.length}/500 caracteres
                  </span>
                </div>
              </div>

              {/* SELEÇÃO DE ESTILO */}
              <div style={{ marginBottom: '40px' }}>
                <label style={{ 
                  display: 'block', 
                  color: '#d1d5db', 
                  fontSize: '1.1rem',
                  marginBottom: '15px',
                  fontWeight: '500'
                }}>
                  🎭 Estilo da imagem:
                </label>
                <select 
                  value={style} 
                  onChange={(e) => setStyle(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #4b5563',
                    backgroundColor: '#111827',
                    color: 'white',
                    fontSize: '16px',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="realistic">🎯 Realista (Fotorrealista)</option>
                  <option value="cinematic">🎬 Cinematográfico</option>
                  <option value="anime">🇯🇵 Anime</option>
                  <option value="fantasy">🧙‍♂️ Fantasia Épica</option>
                  <option value="cyberpunk">🤖 Cyberpunk</option>
                  <option value="painting">🖼️ Pintura Artística</option>
                </select>
                <p style={{ 
                  marginTop: '10px', 
                  color: '#9ca3af', 
                  fontSize: '14px'
                }}>
                  Estilo selecionado: <span style={{ color: '#d8b4fe' }}>{styles[style]}</span>
                </p>
              </div>

              {/* BOTÃO DE SUBMIT */}
              <button 
                type="submit" 
                disabled={isLoading || prompt.length < 10}
                style={{ 
                  width: '100%',
                  padding: '18px',
                  background: 'linear-gradient(90deg, #7e22ce 0%, #a855f7 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  cursor: (isLoading || prompt.length < 10) ? 'not-allowed' : 'pointer',
                  opacity: (isLoading || prompt.length < 10) ? 0.6 : 1,
                  transition: 'all 0.3s'
                }}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      border: '3px solid white',
                      borderTop: '3px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    🎨 Gerando Imagem (-2 Créditos)...
                  </span>
                ) : '✨ Gerar Imagem Agora'}
              </button>

              {/* ESTILO PARA ANIMAÇÃO DE SPIN */}
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>

              {/* MENSAGEM DE ERRO */}
              {error && (
                <div style={{ 
                  marginTop: '30px',
                  padding: '20px',
                  backgroundColor: '#450a0a',
                  border: '1px solid #dc2626',
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    color: '#fca5a5',
                    marginBottom: '10px',
                    fontWeight: '500'
                  }}>
                    ⚠️ Erro
                  </div>
                  <p style={{ color: '#fecaca', fontSize: '15px' }}>{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* IMAGEM GERADA */}
          {imageUrl && (
            <div style={{ 
              backgroundColor: '#1f2937', 
              padding: '30px', 
              borderRadius: '12px',
              border: '1px solid #374151'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '25px'
              }}>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  ✅ Sua Imagem Pronta!
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={downloadImage}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    ⬇️ Baixar
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(imageUrl)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    📋 Copiar Link
                  </button>
                </div>
              </div>
              
              {/* CONTAINER DA IMAGEM */}
              <div style={{ 
                backgroundColor: '#111827',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid #4b5563',
                marginBottom: '25px'
              }}>
                <img 
                  src={imageUrl} 
                  alt="Imagem gerada por IA"
                  style={{ 
                    width: '100%',
                    maxHeight: '500px',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/600x400/1f2937/9ca3af?text=Imagem+Indisponível';
                  }}
                />
              </div>
              
              {/* PROMPT USADO */}
              <div style={{ 
                padding: '20px',
                backgroundColor: '#111827',
                borderRadius: '10px'
              }}>
                <h4 style={{ 
                  color: '#d1d5db', 
                  marginBottom: '10px',
                  fontSize: '1rem'
                }}>
                  📝 Prompt usado:
                </h4>
                <p style={{ 
                  color: '#9ca3af', 
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {prompt}, {styles[style]}
                </p>
              </div>
            </div>
          )}

          {/* SEÇÃO DE EXEMPLOS */}
          <ExemplosSection ferramentaId="gerar-imagem-completa" />

          {/* INFORMAÇÕES ADICIONAIS */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginTop: '30px'
          }}>
            
            {/* DICAS */}
            <div style={{ 
              backgroundColor: '#1f2937', 
              padding: '25px', 
              borderRadius: '12px',
              border: '1px solid #374151'
            }}>
              <h3 style={{ 
                fontSize: '1.2rem', 
                color: '#fff',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                💡 Dicas para prompts
              </h3>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0,
                margin: 0
              }}>
                {[
                  'Use adjetivos: "épico, detalhado, cinematográfico"',
                  'Especifique estilo: "fotorrealista, anime, pintura a óleo"',
                  'Descreva luz: "luz do pôr do sol, neon, dramática"',
                  'Mencione composição: "close-up, plano aberto, perspectiva"',
                  'Adicione qualidade: "8K, UHD, altamente detalhado"'
                ].map((tip, idx) => (
                  <li key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    gap: '10px',
                    marginBottom: '12px',
                    color: '#d1d5db',
                    fontSize: '14px'
                  }}>
                    <span style={{ color: '#a855f7' }}>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* INFORMAÇÕES TÉCNICAS */}
            <div style={{ 
              backgroundColor: '#1f2937', 
              padding: '25px', 
              borderRadius: '12px',
              border: '1px solid #374151'
            }}>
              <h3 style={{ 
                fontSize: '1.2rem', 
                color: '#fff',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                ⚙️ Informações Técnicas
              </h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                {[
                  { label: 'Modelo:', value: 'Stable Diffusion SDXL' },
                  { label: 'Resolução:', value: '1024×1024 px' },
                  { label: 'Tempo médio:', value: '15-30 segundos' },
                  { label: 'Custo:', value: '2 créditos/imagem' }
                ].map((item, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#9ca3af', fontSize: '14px' }}>{item.label}</span>
                    <span style={{ 
                      color: item.label === 'Custo:' ? '#fbbf24' : '#fff',
                      fontSize: '14px',
                      fontWeight: item.label === 'Custo:' ? '600' : '400'
                    }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}