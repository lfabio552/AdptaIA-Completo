import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // ADICIONADO PARA O POP-UP
import { supabase } from '../supabaseClient';
import config from '../config';
import { saveToHistory, TOOL_CONFIGS } from '../utils/saveToHistory';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';
import { 
  DevicePhoneMobileIcon, 
  HashtagIcon, 
  PaperAirplaneIcon, 
  CameraIcon, 
  BriefcaseIcon,
  ChatBubbleOvalLeftIcon,
  HeartIcon,
  ShareIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/solid';

export default function SocialMediaGenerator() {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [tone, setTone] = useState('professional');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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
        setTopic(event.detail.text); 
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
    setError('');
    setGeneratedContent('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para continuar.');

      const response = await fetch(config.ENDPOINTS.GENERATE_SOCIAL_MEDIA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          platform,
          tone,
          user_id: user.id
        }),
      });

      // LÓGICA DE BLOQUEIO DE CRÉDITOS (Erro 402)
      if (response.status === 402) {
        setShowUpgradeModal(true);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar conteúdo.');

      setGeneratedContent(data.content);

      await saveToHistory(
        user,
        TOOL_CONFIGS.SOCIAL_MEDIA,
        topic,
        data.content,
        { platform, tone }
      );

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper para ícone da plataforma
  const getPlatformIcon = () => {
      switch(platform) {
          case 'instagram': return <CameraIcon style={{width: '20px', color: '#ec4899'}} />;
          case 'linkedin': return <BriefcaseIcon style={{width: '20px', color: '#0ea5e9'}} />;
          case 'twitter': return <HashtagIcon style={{width: '20px', color: '#fff'}} />;
          default: return <DevicePhoneMobileIcon style={{width: '20px', color: '#a855f7'}} />;
      }
  };

  const getPlatformName = () => {
      switch(platform) {
          case 'instagram': return 'Instagram';
          case 'linkedin': return 'LinkedIn';
          case 'twitter': return 'Twitter / X';
          case 'facebook': return 'Facebook';
          case 'tiktok': return 'TikTok';
          default: return 'Rede Social';
      }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f1016', // Fundo Dark Sólido e Puro
      backgroundImage: 'none', // FORÇA A REMOÇÃO DO DEGRADÊ ANTIGO
      color: 'white', 
      padding: '40px 20px', 
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* LUZ ROXA/ROSA CONCENTRADA APENAS NO TOPO */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(217, 70, 239, 0.12) 0%, rgba(15, 16, 22, 0) 70%)',
        filter: 'blur(50px)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

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
          position: relative;
          z-index: 1;
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* CABEÇALHO */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ 
             display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
             background: 'linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%)', // Gradiente Roxo/Rosa
             width: '60px', height: '60px', borderRadius: '15px', marginBottom: '20px',
             boxShadow: '0 10px 30px -10px rgba(217, 70, 239, 0.5)'
          }}>
            <DevicePhoneMobileIcon style={{ width: '32px', color: 'white' }} />
          </div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            marginBottom: '10px',
            background: 'linear-gradient(to right, #ffffff, #e879f9, #d946ef)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Social Media Kit
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Crie legendas virais, posts para LinkedIn e threads engajadoras em segundos.
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
              <HashtagIcon style={{ width: '16px' }} />
              {showHistory ? 'Ocultar Histórico' : 'Ver Posts Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '16px', border: '1px solid #374151' }}>
            <HistoryList user={user} toolType="social" />
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
                  Sobre o que é o post?
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Lançamento de uma nova coleção de roupas de verão sustentáveis com desconto de 20%..."
                  required
                  style={{
                    width: '100%',
                    flexGrow: 1,
                    minHeight: '200px', // Altura mínima um pouco maior
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
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#9ca3af' }}>Plataforma</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    style={{ 
                        width: '100%', padding: '12px', borderRadius: '10px', 
                        backgroundColor: '#111827', color: 'white', border: '1px solid #4b5563',
                        height: '50px', cursor: 'pointer' 
                    }}
                  >
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter / X</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok (Roteiro)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#9ca3af' }}>Tom de Voz</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    style={{ 
                        width: '100%', padding: '12px', borderRadius: '10px', 
                        backgroundColor: '#111827', color: 'white', border: '1px solid #4b5563',
                        height: '50px', cursor: 'pointer' 
                    }}
                  >
                    <option value="professional">Profissional</option>
                    <option value="casual">Casual / Descontraído</option>
                    <option value="funny">Engraçado / Meme</option>
                    <option value="persuasive">Vendas (Copy)</option>
                    <option value="inspirational">Inspiracional</option>
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
                  background: 'linear-gradient(90deg, #d946ef 0%, #8b5cf6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer',
                  fontSize: '1.1rem',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(217, 70, 239, 0.4)',
                  transition: 'transform 0.1s'
                }}
              >
                {isLoading ? '✨ Criando Mágica...' : '🚀 Gerar Post'}
              </button>
              
              {error && (
                <div style={{ marginTop: '20px', color: '#fca5a5', padding: '12px', backgroundColor: '#450a0a', borderRadius: '10px', fontSize: '0.9rem' }}>
                  ⚠️ {error}
                </div>
              )}
            </form>
          </div>

          {/* LADO DIREITO: PREVIEW (SIMULAÇÃO DE CELULAR) */}
          <div className="tool-card" style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #d946ef', 
            display: 'flex',
            flexDirection: 'column',
            minHeight: '500px' 
          }}>
            <h3 style={{ color: '#e879f9', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PaperAirplaneIcon style={{ width: '24px' }} /> Preview:
            </h3>
            
            <div style={{ 
                flexGrow: 1, 
                backgroundColor: '#000', 
                borderRadius: '16px',
                border: '1px solid #374151',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                {/* Cabeçalho do "Post" */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getPlatformIcon()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Seu Perfil</div>
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{getPlatformName()} • Agora</div>
                    </div>
                </div>

                {/* Conteúdo do Post */}
                <div style={{ 
                    flexGrow: 1, 
                    color: '#e5e7eb', 
                    fontSize: '0.95rem', 
                    lineHeight: '1.6', 
                    whiteSpace: 'pre-wrap',
                    overflowY: 'auto',
                    maxHeight: '400px'
                }}>
                    {generatedContent || <span style={{color: '#6b7280', fontStyle: 'italic'}}>O conteúdo do seu post aparecerá aqui...</span>}
                </div>

                {/* Rodapé do "Post" */}
                {generatedContent && (
                    <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #333', display: 'flex', gap: '20px', color: '#9ca3af' }}>
                        <HeartIcon style={{ width: '24px', cursor: 'pointer' }} />
                        <ChatBubbleOvalLeftIcon style={{ width: '24px', cursor: 'pointer' }} />
                        <ShareIcon style={{ width: '24px', cursor: 'pointer' }} />
                    </div>
                )}
            </div>

            {generatedContent && (
                <button
                  onClick={() => {navigator.clipboard.writeText(generatedContent); alert('Copiado!');}}
                  style={{
                    marginTop: '20px',
                    padding: '12px',
                    backgroundColor: '#374151',
                    color: 'white',
                    border: '1px solid #4b5563',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                >
                  <ClipboardDocumentCheckIcon style={{width: '20px'}}/> Copiar Texto
                </button>
            )}
          </div>

        </div>

        <ExemplosSection ferramentaId="social-media" />
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
            border: '1px solid #d946ef', boxShadow: '0 10px 50px rgba(217, 70, 239, 0.3)'
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
              background: 'linear-gradient(90deg, #d946ef 0%, #8b5cf6 100%)', color: 'white',
              borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none',
              marginBottom: '15px', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(217, 70, 239, 0.4)'
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