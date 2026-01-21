import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import { saveToHistory, TOOL_CONFIGS } from '../utils/saveToHistory';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';

export default function ImagePromptGenerator() {
  const [idea, setIdea] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Removi o 'error' daqui para não dar erro de unused vars
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
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    return () => {
      window.removeEventListener('loadFromHistory', handleLoadFromHistory);
    };
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setGeneratedPrompt('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para continuar.');

      // Aqui usamos o nome genérico para evitar erro de backend
      const response = await fetch(config.ENDPOINTS.GENERATE_PROMPT || 'http://localhost:5000/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: idea,
          user_id: user.id
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar prompt.');

      setGeneratedPrompt(data.prompt || data.advanced_prompt);

      await saveToHistory(
        user,
        TOOL_CONFIGS.IMAGE_PROMPT,
        idea,
        data.prompt || data.advanced_prompt,
        { length: (data.prompt || '').length }
      );

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
          🎨 Criador de Prompts (Midjourney/DALL-E)
        </h1>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
          Transforme uma ideia simples em um prompt profissional e detalhado.
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
              {showHistory ? '▲ Ocultar Histórico' : '📚 Ver Ideias Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '10px' }}>
            <HistoryList user={user} toolType="image-prompt" />
          </div>
        )}

        <div style={{ backgroundColor: '#1f2937', padding: '30px', borderRadius: '12px', border: '1px solid #374151' }}>
          <form onSubmit={handleGenerate}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '1.2rem' }}>
                Sua Ideia (em português):
              </label>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Ex: Um gato astronauta flutuando no espaço com planetas coloridos ao fundo..."
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

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '15px',
                background: 'linear-gradient(90deg, #ec4899 0%, #db2777 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: isLoading ? 'wait' : 'pointer',
                fontSize: '1.1rem'
              }}
            >
              {isLoading ? 'Criando Prompt...' : '✨ Gerar Prompt Mágico'}
            </button>
          </form>

          {errorMessage && (
            <div style={{ marginTop: '20px', color: '#fca5a5', padding: '10px', backgroundColor: '#450a0a', borderRadius: '8px' }}>
              {errorMessage}
            </div>
          )}

          {generatedPrompt && (
            <div style={{ marginTop: '30px', backgroundColor: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #ec4899' }}>
              <h3 style={{ color: '#fbcfe8', marginBottom: '10px' }}>Prompt Gerado (Inglês):</h3>
              <p style={{ color: '#d1d5db', lineHeight: '1.6', marginBottom: '15px' }}>{generatedPrompt}</p>
              <button
                onClick={() => {navigator.clipboard.writeText(generatedPrompt); alert('Copiado!');}}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#be185d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📋 Copiar
              </button>
            </div>
          )}
        </div>

        <ExemplosSection ferramentaId="image-prompt" />
      </div>
    </div>
  );
}