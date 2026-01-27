import React, { useState, useEffect } from 'react';
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
    <div style={{ minHeight: '100vh', backgroundColor: '#0f1016', color: 'white', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
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
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>
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
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1fr 1fr', 
          gap: '40px',
          alignItems: 'start'
        }}>
          
          {/* LADO ESQUERDO: INPUT */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <form onSubmit={handleTranslate}>
              <div style={{ marginBottom: '25px' }}>
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
                    height: '200px',
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
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#111827', color: 'white', border: '1px solid #0ea5e9' }}
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
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#111827', color: 'white', border: '1px solid #3b82f6' }}
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
              
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

              {error && (
                <div style={{ marginTop: '20px', color: '#fca5a5', padding: '12px', backgroundColor: '#450a0a', borderRadius: '10px', fontSize: '0.9rem' }}>
                  ⚠️ {error}
                </div>
              )}
            </form>
          </div>

          {/* LADO DIREITO: OUTPUT */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #0ea5e9', // Borda Azul
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
              color: '#1f2937', // Texto escuro para contraste
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              border: '1px solid #d1d5db',
              overflowY: 'auto',
              maxHeight: '400px'
            }}>
              {translatedText || <span style={{color: '#9ca3af', fontFamily: 'sans-serif'}}>O texto refinado aparecerá aqui...</span>}
            </div>
          </div>

        </div>

        <ExemplosSection ferramentaId="corporate-translator" />
      </div>
    </div>
  );
}