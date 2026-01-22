import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';

// Lista de estilos para o usuário escolher
const stylesList = [
  'Cinematográfico (Padrão)',
  'Fotorealista / Realista',
  'Anime / Mangá',
  'Cyberpunk / Futurista',
  'Fantasia Medieval / RPG',
  'Render 3D (Pixar/Disney)',
  'Pintura a Óleo (Clássico)',
  'Aquarela',
  'Terror / Dark',
  'Retrowave / Anos 80',
  'Minimalista'
];

export default function ImagePromptGenerator() {
  const [idea, setIdea] = useState('');
  const [style, setStyle] = useState(stylesList[0]); // NOVO: Estado do estilo
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

  // --- OUVINTE DO HISTÓRICO ---
  useEffect(() => {
    const handleLoadFromHistory = (event) => {
      if (event.detail && event.detail.text) {
        setIdea(event.detail.text);
        // Se o histórico tiver o estilo salvo nos metadados, poderíamos carregar aqui também
        if (event.detail.metadata?.style) {
            setStyle(event.detail.metadata.style);
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

      // 1. CHAMADA API
      const endpoint = config.ENDPOINTS.GENERATE_PROMPT || `${config.API_BASE_URL}/generate-prompt`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: idea,
          style: style, // NOVO: Enviando o estilo escolhido
          user_id: user.id
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar prompt.');

      const finalPrompt = data.prompt || data.advanced_prompt;
      setGeneratedPrompt(finalPrompt);

      // 2. SALVAR HISTÓRICO
      try {
        await fetch(`${config.API_BASE_URL}/save-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            tool_type: 'image-prompt',
            input_data: idea,
            output_data: finalPrompt,
            metadata: { 
                length: finalPrompt.length,
                style: style // NOVO: Salvando o estilo no histórico
            }
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
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '10px' }}>
          🎨 Criador de Prompts (Midjourney/DALL-E)
        </h1>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
          Transforme ideias simples em prompts profissionais com o estilo que você escolher.
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
            
            {/* Input da Ideia */}
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

            {/* NOVO: Seletor de Estilo */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '1.1rem' }}>
                Estilo Artístico:
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#111827',
                    color: 'white',
                    border: '1px solid #ec4899', // Borda rosa para destacar
                    fontSize: '1rem',
                    cursor: 'pointer'
                }}
              >
                {stylesList.map((s, index) => (
                    <option key={index} value={s} style={{ backgroundColor: '#1f2937' }}>
                        {s}
                    </option>
                ))}
              </select>
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
              {isLoading ? '✨ Criando Mágica...' : '✨ Gerar Prompt Profissional'}
            </button>
          </form>

          {errorMessage && (
            <div style={{ marginTop: '20px', color: '#fca5a5', padding: '10px', backgroundColor: '#450a0a', borderRadius: '8px' }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {generatedPrompt && (
            <div style={{ marginTop: '30px', backgroundColor: '#111827', padding: '25px', borderRadius: '8px', border: '1px solid #ec4899' }}>
              <h3 style={{ color: '#fbcfe8', marginBottom: '15px' }}>
                🚀 Prompt Gerado (Estilo: {style.split(' ')[0]}):
              </h3>
              <div style={{ 
                color: '#d1d5db', 
                lineHeight: '1.6', 
                marginBottom: '20px', 
                backgroundColor: '#000', 
                padding: '15px', 
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.95rem'
              }}>
                {generatedPrompt}
              </div>
              <button
                onClick={() => {navigator.clipboard.writeText(generatedPrompt); alert('Copiado!');}}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#be185d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📋 Copiar para Midjourney / DALL-E
              </button>
            </div>
          )}
        </div>

        <ExemplosSection ferramentaId="image-prompt" />
      </div>
    </div>
  );
}