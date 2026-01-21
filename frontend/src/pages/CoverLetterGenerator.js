import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import { saveToHistory, TOOL_CONFIGS } from '../utils/saveToHistory';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';

export default function CoverLetterGenerator() {
  const [jobDescription, setJobDescription] = useState('');
  const [myResume, setMyResume] = useState('');
  const [generatedLetter, setGeneratedLetter] = useState('');
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

  // --- NOVO: Ouvinte do Histórico ---
  useEffect(() => {
    const handleLoadFromHistory = (event) => {
      if (event.detail && event.detail.text) {
        setJobDescription(event.detail.text); // Preenche a descrição da vaga
        // Nota: O currículo não é salvo no texto principal do histórico por segurança/tamanho,
        // então o usuário precisará preencher ou colar o currículo novamente se necessário.
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
    setError('');
    setGeneratedLetter('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para continuar.');

      const response = await fetch(config.ENDPOINTS.GENERATE_COVER_LETTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description: jobDescription,
          user_resume: myResume,
          user_id: user.id
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar carta.');

      setGeneratedLetter(data.cover_letter);

      // Salvar histórico
      await saveToHistory(
        user,
        TOOL_CONFIGS.COVER_LETTER,
        jobDescription, // Salvamos a descrição da vaga como o "prompt"
        data.cover_letter,
        { resume_preview: myResume.substring(0, 100) + '...' }
      );

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    alert('Carta copiada para a área de transferência!');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '10px' }}>
          📄 Gerador de Carta de Apresentação
        </h1>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
          Cole a descrição da vaga e um resumo do seu perfil para criar uma carta personalizada.
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
            <HistoryList user={user} toolType="cover-letter" />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Coluna Esquerda: Inputs */}
          <div style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '12px', border: '1px solid #374151' }}>
            <form onSubmit={handleGenerate}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>1. Descrição da Vaga</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Cole aqui os requisitos da vaga..."
                  required
                  style={{
                    width: '100%',
                    height: '150px',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#111827',
                    color: 'white',
                    border: '1px solid #4b5563'
                  }}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>2. Seu Resumo/Experiência</label>
                <textarea
                  value={myResume}
                  onChange={(e) => setMyResume(e.target.value)}
                  placeholder="Cole um resumo do seu currículo ou experiências principais..."
                  required
                  style={{
                    width: '100%',
                    height: '150px',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#111827',
                    color: 'white',
                    border: '1px solid #4b5563'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Escrevendo...' : '✍️ Gerar Carta'}
              </button>
            </form>
            
            {error && (
              <div style={{ marginTop: '20px', color: '#fca5a5', padding: '10px', backgroundColor: '#450a0a', borderRadius: '8px' }}>
                {error}
              </div>
            )}
          </div>

          {/* Coluna Direita: Resultado */}
          <div style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '12px', border: '1px solid #374151', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '15px' }}>Resultado:</h3>
            
            <div style={{ 
              flex: 1, 
              backgroundColor: '#111827', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '1px solid #4b5563',
              whiteSpace: 'pre-wrap',
              overflowY: 'auto',
              maxHeight: '500px',
              color: generatedLetter ? '#d1d5db' : '#6b7280'
            }}>
              {generatedLetter || 'A carta gerada aparecerá aqui...'}
            </div>

            {generatedLetter && (
              <button
                onClick={copyToClipboard}
                style={{
                  marginTop: '20px',
                  padding: '12px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📋 Copiar Carta
              </button>
            )}
          </div>
        </div>

        <ExemplosSection ferramentaId="cover-letter" />
      </div>
    </div>
  );
}