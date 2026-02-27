import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // ADICIONADO PARA O POP-UP
import { supabase } from '../supabaseClient';
import config from '../config';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';
import { 
  DocumentTextIcon, 
  CloudArrowUpIcon, 
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  TrashIcon
} from '@heroicons/react/24/solid';

export default function ChatPDF() {
  const [question, setQuestion] = useState('');
  const [file, setFile] = useState(null);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
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
        setQuestion(event.detail.text); 
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    return () => window.removeEventListener('loadFromHistory', handleLoadFromHistory);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setAnswer('');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para continuar.');
      
      if (!question) throw new Error('Digite uma pergunta.');

      // 1. UPLOAD (SE TIVER ARQUIVO)
      if (file) {
        setStatus('⏳ Lendo PDF... (Isso pode levar alguns segundos)');
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', user.id);

        const uploadUrl = config.ENDPOINTS.UPLOAD_DOCUMENT || `${config.API_BASE_URL}/upload-document`;
        
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        // LÓGICA DE BLOQUEIO DE CRÉDITOS NO UPLOAD
        if (uploadResponse.status === 402) {
            setShowUpgradeModal(true);
            setIsLoading(false);
            setStatus('');
            return;
        }

        if (!uploadResponse.ok) {
           const errData = await uploadResponse.json();
           throw new Error(errData.error || 'Erro ao ler o PDF.');
        }
        
        setStatus('✅ PDF processado! Analisando sua pergunta...');
      }

      setStatus('🤔 A IA está lendo o documento...');
      
      const askUrl = config.ENDPOINTS.ASK_DOCUMENT || `${config.API_BASE_URL}/ask-document`;
      
      const response = await fetch(askUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          question: question
        }),
      });

      // LÓGICA DE BLOQUEIO DE CRÉDITOS NA PERGUNTA
      if (response.status === 402) {
          setShowUpgradeModal(true);
          setIsLoading(false);
          setStatus('');
          return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar resposta.');

      setAnswer(data.answer);
      setStatus('');

      // 3. HISTÓRICO
      try {
        await fetch(`${config.API_BASE_URL}/save-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            tool_type: 'chat-pdf',
            input_data: question,
            output_data: data.answer,
            metadata: { file_name: file ? file.name : 'Documento Carregado' }
          })
        });
      } catch (histError) {
        console.error("Erro histórico:", histError);
      }

    } catch (err) {
      setError(err.message);
      setStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f1016', // Fundo Dark Puro
      color: 'white', 
      padding: '40px 20px', 
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* LUZ VERMELHA DE FUNDO SUTIL */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(15, 16, 22, 0) 70%)', // Vermelho
        filter: 'blur(40px)',
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
            align-items: stretch; /* Garante altura igual */
          }
        }

        /* Card base para garantir altura */
        .tool-card {
          height: 100%;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        
        /* Animação do Loader */
        .loader { width: 16px; height: 16px; border: 2px solid #fbbf24; border-bottom-color: transparent; border-radius: 50%; display: inline-block; animation: rotation 1s linear infinite; }
        @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* CABEÇALHO */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ 
             display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
             background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', // Vermelho PDF
             width: '60px', height: '60px', borderRadius: '15px', marginBottom: '20px',
             boxShadow: '0 10px 30px -10px rgba(239, 68, 68, 0.5)'
          }}>
            <DocumentTextIcon style={{ width: '32px', color: 'white' }} />
          </div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            marginBottom: '10px',
            background: 'linear-gradient(to right, #ffffff, #fca5a5, #ef4444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Chat com PDF (RAG)
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Envie seus documentos e faça perguntas complexas. A IA lê e responde com base no conteúdo.
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
              {showHistory ? 'Ocultar Histórico' : 'Ver Perguntas Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '16px', border: '1px solid #374151' }}>
            <HistoryList user={user} toolType="chat-pdf" />
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div className="tool-grid">
          
          {/* LADO ESQUERDO: UPLOAD E PERGUNTA */}
          <div className="tool-card" style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%' }}>
              
              {/* UPLOAD AREA */}
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '1rem', fontWeight: '600', color: '#e5e7eb' }}>
                  1. Carregue seu PDF:
                </label>
                <div 
                  onClick={() => document.getElementById('pdf-upload').click()}
                  style={{
                    border: '2px dashed #4b5563',
                    borderRadius: '12px',
                    padding: '30px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: file ? 'rgba(6, 78, 59, 0.3)' : 'rgba(255,255,255,0.02)',
                    borderColor: file ? '#10b981' : '#4b5563',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = file ? 'rgba(6, 78, 59, 0.3)' : 'rgba(255,255,255,0.02)'}
                >
                  <CloudArrowUpIcon style={{ width: '40px', color: file ? '#10b981' : '#9ca3af', margin: '0 auto 10px' }} />
                  {file ? (
                    <div>
                      <p style={{ color: '#fff', fontWeight: 'bold' }}>{file.name}</p>
                      <p style={{ color: '#10b981', fontSize: '0.85rem' }}>Pronto para envio</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ color: '#d1d5db' }}>Clique para selecionar</p>
                      <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Suporta arquivos PDF até 10MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="pdf-upload"
                  />
                </div>
                {file && (
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    style={{ marginTop: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <TrashIcon style={{width: '14px'}}/> Remover arquivo
                  </button>
                )}
              </div>

              {/* PERGUNTA */}
              <div style={{ marginBottom: '25px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '1rem', fontWeight: '600', color: '#e5e7eb' }}>
                  2. O que você quer saber?
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ex: Qual é a conclusão principal do autor? Resuma os pontos chave..."
                  required
                  style={{
                    width: '100%',
                    flexGrow: 1, // Faz crescer para preencher espaço
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

              {status && (
                <div style={{ 
                  marginBottom: '20px', 
                  padding: '10px', 
                  backgroundColor: 'rgba(251, 191, 36, 0.1)', 
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: '8px',
                  color: '#fbbf24', 
                  fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <span className="loader"></span> {status}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: 'auto', // Empurra para o fundo
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer',
                  fontSize: '1.1rem',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                  transition: 'transform 0.1s'
                }}
              >
                {isLoading ? '🤖 Analisando Documento...' : 'Enviar Pergunta'}
              </button>
              
              {error && (
                <div style={{ marginTop: '20px', color: '#fca5a5', padding: '12px', backgroundColor: '#450a0a', borderRadius: '10px', fontSize: '0.9rem' }}>
                  ⚠️ {error}
                </div>
              )}
            </form>
          </div>

          {/* LADO DIREITO: RESPOSTA */}
          <div className="tool-card" style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #ef4444', 
            display: 'flex',
            flexDirection: 'column',
            minHeight: '400px' // Altura mínima de segurança
          }}>
            <h3 style={{ color: '#fca5a5', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ChatBubbleLeftRightIcon style={{ width: '24px' }} /> Resposta da IA:
            </h3>
            
            <div style={{ 
              flexGrow: 1, // Preenche todo o espaço vertical disponível
              backgroundColor: '#111827', 
              padding: '20px', 
              borderRadius: '12px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '1rem',
              color: '#d1d5db',
              lineHeight: '1.7',
              whiteSpace: 'pre-wrap',
              border: '1px solid #374151',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {answer ? (
                <span>{answer}</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: '#6b7280' }}>
                   <DocumentTextIcon style={{ width: '48px', opacity: 0.2, marginBottom: '10px' }} />
                   <p>A resposta aparecerá aqui.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        <ExemplosSection ferramentaId="chat-pdf" />
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
            border: '1px solid #ef4444', boxShadow: '0 10px 50px rgba(239, 68, 68, 0.3)'
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
              background: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)', color: 'white',
              borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none',
              marginBottom: '15px', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
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