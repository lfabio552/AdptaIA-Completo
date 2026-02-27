import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // ADICIONADO PARA O POP-UP
import { supabase } from '../supabaseClient';
import ExemplosSection from '../components/ExemplosSection';
import { saveHistoryItem } from '../utils/history'; 
import HistoryList from '../components/HistoryList';
import config from '../config';
import { 
  AcademicCapIcon, 
  ArrowDownTrayIcon, 
  ClipboardIcon, 
  SparklesIcon, 
  DocumentTextIcon 
} from '@heroicons/react/24/solid';

export default function AgenteABNT() {
  // Estados
  const [rawText, setRawText] = useState('');
  const [formattedText, setFormattedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [user, setUser] = useState(null);

  // ESTADO PARA O POP-UP DE CRÉDITOS
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Obter usuário
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Ouvir histórico
  useEffect(() => {
    const handleLoadFromHistory = (event) => {
      if (event.detail && event.detail.text) {
        setRawText(event.detail.text);
        setFormattedText(''); // Limpa o output anterior para evitar confusão
        setError('');
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
    setFormattedText('');

    try {
      if (!user) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) throw new Error('Login necessário.');
        setUser(currentUser);
      }

      const response = await fetch(config.ENDPOINTS.FORMAT_ABNT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            text: rawText,
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
      if (!response.ok) throw new Error(data.error || 'Erro ao formatar.');

      setFormattedText(data.formatted_text);

      // Salvar histórico
      try {
        await saveHistoryItem(
          user,
          'abnt',
          'Formatador ABNT',
          rawText,
          data.formatted_text,
          { 
            credits_used: 1,
            original_length: rawText.length,
            formatted_length: data.formatted_text.length
          }
        );
      } catch (historyError) {
        console.error('❌ Erro ao salvar histórico:', historyError);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!formattedText) return alert("Primeiro gere o texto formatado.");
    setIsDownloading(true);
    setError('');

    try {
      const response = await fetch(config.ENDPOINTS.DOWNLOAD_DOCX, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown_text: formattedText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar o arquivo.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Trabalho_ABNT.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f1016', // Fundo Totalmente Escuro
      color: 'white', 
      padding: '40px 20px', 
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* LUZ AZUL DE FUNDO SUTIL */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(15, 16, 22, 0) 70%)', // Azul Acadêmico
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

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* CABEÇALHO */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ 
             display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
             background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', // Azul Acadêmico
             width: '60px', height: '60px', borderRadius: '15px', marginBottom: '20px',
             boxShadow: '0 10px 30px -10px rgba(37, 99, 235, 0.5)'
          }}>
            <AcademicCapIcon style={{ width: '32px', color: 'white' }} />
          </div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            marginBottom: '10px',
            background: 'linear-gradient(to right, #ffffff, #60a5fa, #2563eb)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Formatador ABNT Inteligente
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Cole seu texto bruto e nossa IA organiza citações, referências e margens automaticamente.
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
              {showHistory ? 'Ocultar Histórico' : 'Ver Trabalhos Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '16px', border: '1px solid #374151' }}>
            <HistoryList user={user} toolType="abnt" />
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div className="tool-grid">
          
          {/* LADO ESQUERDO: INPUT */}
          <div className="tool-card" style={{ 
            backgroundColor: '#1f2937', 
            padding: '25px', 
            borderRadius: '20px', 
            border: '1px solid #374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '1rem', fontWeight: '600', color: '#e5e7eb' }}>
                📝 Texto Original (Bagunçado):
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Cole seu texto aqui... Ex: 'Segundo autor x (2020) a tecnologia é boa...'"
                required
                style={{
                  width: '100%',
                  flexGrow: 1, // Preenche espaço vertical
                  minHeight: '300px', // Altura mínima
                  padding: '15px',
                  borderRadius: '12px',
                  backgroundColor: '#111827',
                  color: 'white',
                  border: '1px solid #4b5563',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
              
              <div style={{ marginTop: 'auto', paddingTop: '20px' }}> {/* Empurra para baixo */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)', // Azul
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    cursor: isLoading ? 'wait' : 'pointer',
                    fontSize: '1.1rem',
                    boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
                    transition: 'transform 0.1s',
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  {isLoading ? '🔄 Analisando Normas...' : '✨ Formatar nas Normas ABNT'}
                </button>
                <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.85rem', color: '#6b7280' }}>
                  Custa 1 crédito por uso.
                </p>
              </div>

              {error && (
                <div style={{ marginTop: '20px', color: '#fca5a5', padding: '15px', backgroundColor: '#450a0a', borderRadius: '10px', border: '1px solid #ef4444' }}>
                  ⚠️ {error}
                </div>
              )}
            </form>
          </div>

          {/* LADO DIREITO: PREVIEW E DOWNLOAD */}
          <div className="tool-card" style={{ 
            backgroundColor: '#1f2937', 
            padding: '25px', 
            borderRadius: '20px', 
            border: formattedText ? '1px solid #10b981' : '1px solid #374151', // Borda verde se tiver sucesso
            display: 'flex',
            flexDirection: 'column',
            minHeight: '560px' // Altura mínima garantida
          }}>
            <h3 style={{ color: formattedText ? '#6ee7b7' : '#9ca3af', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <DocumentTextIcon style={{ width: '24px' }} /> 
              {formattedText ? 'Resultado Formatado:' : 'Pré-visualização'}
            </h3>
            
            <div style={{ 
              flexGrow: 1, 
              backgroundColor: '#ffffff', // Fundo branco para simular papel
              color: '#000000', // Texto preto
              padding: '30px', // Margens de papel
              borderRadius: '8px',
              fontFamily: "'Times New Roman', serif", // Fonte acadêmica
              fontSize: '14px',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              border: '1px solid #d1d5db',
              marginBottom: '20px',
              overflowY: 'auto',
              maxHeight: '400px',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)'
            }}>
              {formattedText || (
                <span style={{ color: '#9ca3af', fontFamily: 'sans-serif' }}>
                  O texto formatado aparecerá aqui com recuos, citações e referências organizadas...
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  onClick={() => {navigator.clipboard.writeText(formattedText); alert('Texto copiado!');}}
                  disabled={!formattedText}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#374151',
                    color: 'white',
                    border: '1px solid #4b5563',
                    borderRadius: '10px',
                    cursor: formattedText ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: formattedText ? 1 : 0.5
                  }}
                >
                  <ClipboardIcon style={{ width: '20px' }} /> Copiar
                </button>

                <button
                  onClick={handleDownload}
                  disabled={!formattedText || isDownloading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#10b981', // Verde Word
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: (formattedText && !isDownloading) ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: (formattedText && !isDownloading) ? 1 : 0.5,
                    boxShadow: formattedText ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                  }}
                >
                  <ArrowDownTrayIcon style={{ width: '20px' }} /> 
                  {isDownloading ? 'Gerando .docx...' : 'Baixar Word'}
                </button>
            </div>
          </div>

        </div>

        <ExemplosSection ferramentaId="agente-abnt" />
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
            border: '1px solid #2563eb', boxShadow: '0 10px 50px rgba(37, 99, 235, 0.3)'
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
              background: 'linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)', color: 'white',
              borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none',
              marginBottom: '15px', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
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