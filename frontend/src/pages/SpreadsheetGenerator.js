import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import { saveToHistory, TOOL_CONFIGS } from '../utils/saveToHistory';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';

export default function SpreadsheetGenerator() {
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
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
        setDescription(event.detail.text); // Preenche a descrição
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
    setFileUrl('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para continuar.');

      const response = await fetch(config.ENDPOINTS.GENERATE_SPREADSHEET, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          user_id: user.id
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar planilha.');

      setFileUrl(data.file_url);

      // Salvar histórico
      await saveToHistory(
        user,
        TOOL_CONFIGS.SPREADSHEET,
        description,
        'Planilha Excel Gerada',
        { file_url: data.file_url }
      );

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '10px' }}>
          📊 Gerador de Planilhas Excel
        </h1>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
          Descreva o que você precisa e a IA cria o arquivo Excel pronto para baixar.
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
            <HistoryList user={user} toolType="spreadsheet" />
          </div>
        )}

        <div style={{ backgroundColor: '#1f2937', padding: '30px', borderRadius: '12px', border: '1px solid #374151' }}>
          <form onSubmit={handleGenerate}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                O que essa planilha deve conter?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Uma planilha de controle financeiro pessoal com colunas para data, descrição, categoria, valor entrada e valor saída, com fórmulas de saldo..."
                required
                style={{
                  width: '100%',
                  height: '150px',
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
                background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: isLoading ? 'wait' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                fontSize: '1.1rem'
              }}
            >
              {isLoading ? 'Criando Arquivo...' : '📥 Gerar Excel (.xlsx)'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '20px', color: '#fca5a5', padding: '10px', backgroundColor: '#450a0a', borderRadius: '8px' }}>
              {error}
            </div>
          )}
        </div>

        {fileUrl && (
          <div style={{ 
            marginTop: '30px', 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '12px', 
            border: '1px solid #059669',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#34d399' }}>✅ Planilha Criada com Sucesso!</h3>
            <p style={{ color: '#d1d5db', marginBottom: '25px' }}>Seu arquivo está pronto para download.</p>
            
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '15px 30px',
                backgroundColor: '#059669',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}
            >
              ⬇️ Baixar Arquivo Excel
            </a>
          </div>
        )}

        <ExemplosSection ferramentaId="planilhas" />
      </div>
    </div>
  );
}