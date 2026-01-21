import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import { saveToHistory, TOOL_CONFIGS } from '../utils/saveToHistory';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';

export default function CorporateTranslator() {
  const [text, setText] = useState('');
  const [tone, setTone] = useState('formal');
  const [targetLang, setTargetLang] = useState('english');
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

  // --- OUVINTE DO HISTÓRICO ---
  useEffect(() => {
    const handleLoadFromHistory = (event) => {
      if (event.detail && event.detail.text) {
        setText(event.detail.text); // Preenche o texto original
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    return () => {
      window.removeEventListener('loadFromHistory', handleLoadFromHistory);
    };
  }, []);

  const handleTranslate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTranslatedText('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para utilizar o tradutor.');

      const response = await fetch(config.ENDPOINTS.TRANSLATE_CORPORATE, {
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

      setTranslatedText(data.translation);

      // Salvar no Histórico
      await saveToHistory(
        user,
        TOOL_CONFIGS.CORPORATE_TRANSLATE,
        text, // Texto original como prompt
        data.translation,
        { tone, target_lang: targetLang }
      );

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    alert('Texto copiado!');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '10px' }}>
          👔 Tradutor Corporativo & Refinador
        </h1>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
          Transforme rascunhos em e-mails executivos perfeitos ou traduza com terminologia de negócios.
        </p>

        {/* Botão Histórico */}
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
              {showHistory ? '▲ Ocultar Histórico' : '📚 Ver Histórico'}
            </button>
          </div>
        )}

        {/* Lista Histórico */}
        {showHistory && user && (
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '10px' }}>
            <HistoryList user={user} toolType="translation" />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          {/* Lado Esquerdo: Input */}
          <div style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '12px', border: '1px solid #374151' }}>
            <form onSubmit={handleTranslate}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Seu Rascunho:</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ex: Preciso cancelar a reunião de amanhã porque estou doente. Vamos remarcar para terça?"
                  required
                  style={{
                    width: '100%',
                    height: '250px',
                    padding: '15px',
                    borderRadius: '8px',
                    backgroundColor: '#111827',
                    color: 'white',
                    border: '1px solid #4b5563',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Tom de Voz</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#111827', color: 'white', border: '1px solid #4b5563' }}
                  >
                    <option value="formal">Muito Formal (Executivo)</option>
                    <option value="polite">Polido e Amigável</option>
                    <option value="persuasive">Persuasivo (Vendas)</option>
                    <option value="assertive">Assertivo/Direto</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Idioma de Saída</label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#111827', color: 'white', border: '1px solid #4b5563' }}
                  >
                    <option value="portuguese">Português (Melhorar Texto)</option>
                    <option value="english">Inglês (Business English)</option>
                    <option value="spanish">Espanhol</option>
                    <option value="french">Francês</option>
                    <option value="mandarin">Mandarim</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer',
                  fontSize: '1.1rem'
                }}
              >
                {isLoading ? 'Refinando...' : '✨ Transformar Texto'}
              </button>
            </form>
            
            {error && <div style={{ color: '#fca5a5', marginTop: '10px' }}>{error}</div>}
          </div>

          {/* Lado Direito: Output */}
          <div style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '12px', border: '1px solid #374151' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Resultado Profissional:</h3>
              {translatedText && (
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Copiar
                </button>
              )}
            </div>
            
            <div style={{ 
              backgroundColor: '#111827', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '1px solid #4b5563',
              height: '340px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              color: translatedText ? '#d1d5db' : '#6b7280',
              fontFamily: 'Georgia, serif', // Fonte mais "documento"
              lineHeight: '1.6'
            }}>
              {translatedText || 'O texto refinado ou traduzido aparecerá aqui...'}
            </div>
          </div>
        </div>

        <ExemplosSection ferramentaId="corporate-translator" />
      </div>
    </div>
  );
}