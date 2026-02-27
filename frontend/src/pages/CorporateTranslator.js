import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // ADICIONADO PARA O POP-UP
import { supabase } from '../supabaseClient';
import config from '../config';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';
import { 
  BriefcaseIcon, 
  LanguageIcon, 
  ClipboardDocumentCheckIcon, 
  SparklesIcon, 
  ArrowPathIcon
} from '@heroicons/react/24/solid';

export default function CorporateTranslator() {
  const [text, setText] = useState('');
  const [tone, setTone] = useState('Profissional / Formal');
  const [targetLang, setTargetLang] = useState('Português (Melhorar Texto)');
  const [translatedText, setTranslatedText] = useState('');
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
        setText(event.detail.text);
        if (event.detail.metadata) {
            if (event.detail.metadata.tone) setTone(event.detail.metadata.tone);
            if (event.detail.metadata.lang) setTargetLang(event.detail.metadata.lang);
        }
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    return () => window.removeEventListener('loadFromHistory', handleLoadFromHistory);
  }, []);

  const handleTranslate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTranslatedText('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para utilizar o tradutor.');

      const endpoint = config.ENDPOINTS.CORPORATE_TRANSLATOR || `${config.API_BASE_URL}/corporate-translator`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          tone,
          target_lang: targetLang,
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
      if (!response.ok) throw new Error(data.error || 'Erro ao traduzir.');

      setTranslatedText(data.translated_text || data.translation);

      try {
        await fetch(`${config.API_BASE_URL}/save-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            tool_type: 'translator',
            input_data: text,
            output_data: data.translated_text || data.translation,
            metadata: { tone: tone, lang: targetLang }
          })
        });
      } catch (histError) {
        console.error("Erro ao salvar histórico:", histError);
      }

    } catch (err) {
      setError(err.message);
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
      
      {/* LUZ AZUL EXECUTIVO DE FUNDO */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(15, 16, 22, 0) 70%)', // Azul claro
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

        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* CABEÇALHO */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ 
             display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
             background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', // Azul Executivo
             width: '60px', height: '60px', borderRadius: '15px', marginBottom: '20px',
             boxShadow: '0 10px 30px -10px rgba(14, 165, 233, 0.5)'
          }}>
            <BriefcaseIcon style={{ width: '32px', color: 'white' }} />
          </div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            marginBottom: '10px',
            background: 'linear-gradient(to right, #ffffff, #7dd3fc, #0ea5e9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Tradutor & Refinador Corporativo
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Transforme rascunhos informais em e-mails e comunicados executivos de alto nível.
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
              {showHistory ? 'Ocultar Histórico' : 'Ver Traduções Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '16px', border: '1px solid #374151' }}>
            <HistoryList user={user} toolType="translator" />
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div className="tool-grid">
          
          {/* LADO ESQUERDO: INPUT */}
          <div className="tool-card" style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <form onSubmit={handleTranslate} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%' }}>
              
              <div style={{ marginBottom: '25px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '1rem', fontWeight: '600', color: '#e5e7eb' }}>
                  📝 Seu Rascunho (Informal):
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ex: Preciso cancelar a reunião de amanhã porque estou doente. Vamos remarcar para terça?"
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
                    lineHeight: '1.6',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#9ca3af' }}>Tom de Voz</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    style={{ 
                        width: '100%', padding: '12px', borderRadius: '10px', 
                        backgroundColor: '#111827', color: 'white', border: '1px solid #0ea5e9', cursor: 'pointer'
                    }}
                  >
                    <option>Profissional / Formal</option>
                    <option>Liderança / Executivo</option>
                    <option>Diplomático / Polido</option>
                    <option>Persuasivo / Vendas</option>
                    <option>Direto / Objetivo</option>
                    <option>Amigável / Colaborativo</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#9ca3af' }}>Idioma Final</label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    style={{ 
                        width: '100%', padding: '12px', borderRadius: '10px', 
                        backgroundColor: '#111827', color: 'white', border: '1px solid #0ea5e9', cursor: 'pointer'
                    }}
                  >
                    <option>Português (Melhorar)</option>
                    <option>Inglês (Business)</option>
                    <option>Espanhol (Corporativo)</option>
                    <option>Francês</option>
                    <option>Mandarim</option>
                    <option>Alemão</option>
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
                  background: 'linear-gradient(90deg, #0ea5e9 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer',
                  fontSize: '1.1rem',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)',
                  transition: 'transform 0.1s'
                }}
              >
                {isLoading ? (
                    <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                        <ArrowPathIcon style={{width: '20px', animation: 'spin 1s linear infinite'}}/> Refinando...
                    </span>
                ) : '✨ Transformar Texto'}
              </button>
            </form>
          </div>

          {/* LADO DIREITO: OUTPUT */}
          <div className="tool-card" style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #0ea5e9', 
            display: 'flex',
            flexDirection: 'column',
            minHeight: '450px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#7dd3fc', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                <LanguageIcon style={{ width: '24px' }} /> Resultado Profissional:
              </h3>
              {translatedText && (
                <button
                  onClick={() => {navigator.clipboard.writeText(translatedText); alert('Copiado!');}}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#059669',
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
              backgroundColor: '#ffffff', // Fundo branco estilo documento
              padding: '25px', 
              borderRadius: '12px',
              fontFamily: "'Georgia', serif", // Fonte de documento
              fontSize: '1.05rem',
              color: '#1f2937', // Texto escuro
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              border: '1px solid #d1d5db',
              overflowY: 'auto',
              maxHeight: '450px'
            }}>
              {translatedText || <span style={{color: '#9ca3af', fontFamily: 'sans-serif'}}>O texto refinado aparecerá aqui...</span>}
            </div>
          </div>

        </div>

        <ExemplosSection ferramentaId="corporate-translator" />
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
            border: '1px solid #0ea5e9', boxShadow: '0 10px 50px rgba(14, 165, 233, 0.3)'
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
              background: 'linear-gradient(90deg, #0ea5e9 0%, #2563eb 100%)', color: 'white',
              borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none',
              marginBottom: '15px', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)'
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