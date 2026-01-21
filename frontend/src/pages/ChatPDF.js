import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import { saveToHistory, TOOL_CONFIGS } from '../utils/saveToHistory';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';

export default function ChatPDF() {
  const [question, setQuestion] = useState('');
  const [file, setFile] = useState(null);
  const [answer, setAnswer] = useState('');
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
        setQuestion(event.detail.text); // Preenche a pergunta
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Nota: Não podemos restaurar o arquivo PDF por segurança do navegador
      }
    };

    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    return () => {
      window.removeEventListener('loadFromHistory', handleLoadFromHistory);
    };
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
      
      if (!file && !question) {
        throw new Error('Por favor, envie um PDF ou faça uma pergunta.');
      }

      const formData = new FormData();
      formData.append('question', question);
      if (file) {
        formData.append('file', file);
      }
      formData.append('user_id', user.id);

      // Nota: Certifique-se que o endpoint no app.py aceita POST multipart/form-data
      const response = await fetch(config.ENDPOINTS.CHAT_PDF || 'http://localhost:5000/chat-pdf', {
        method: 'POST',
        body: formData, // Não usamos headers Content-Type aqui, o browser define automatico para multipart
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao processar PDF.');

      setAnswer(data.answer);

      // Salvar no Histórico
      await saveToHistory(
        user,
        TOOL_CONFIGS.CHAT_PDF || { type: 'chat-pdf', name: 'Chat com PDF', credits: 1 },
        question, // Pergunta como prompt
        data.answer,
        { file_name: file ? file.name : 'Arquivo anterior' }
      );

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '10px' }}>
          📑 Chat com PDF Inteligente
        </h1>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
          Envie documentos e tire dúvidas sobre o conteúdo instantaneamente.
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
              {showHistory ? '▲ Ocultar Histórico' : '📚 Ver Histórico de Perguntas'}
            </button>
          </div>
        )}

        {/* Lista Histórico */}
        {showHistory && user && (
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '10px' }}>
            <HistoryList user={user} toolType="chat-pdf" />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
          
          {/* Área de Upload e Pergunta */}
          <div style={{ backgroundColor: '#1f2937', padding: '30px', borderRadius: '12px', border: '1px solid #374151' }}>
            <form onSubmit={handleSubmit}>
              
              {/* Upload de Arquivo */}
              <div style={{ marginBottom: '25px', padding: '20px', border: '2px dashed #4b5563', borderRadius: '8px', textAlign: 'center' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#d1d5db', cursor: 'pointer' }}>
                  📂 {file ? file.name : 'Clique para selecionar seu PDF'}
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="pdf-upload"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('pdf-upload').click()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#374151',
                    color: 'white',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Selecionar Arquivo
                </button>
              </div>

              {/* Campo de Pergunta */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '1.1rem' }}>
                  Sua Pergunta:
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ex: Qual é a conclusão principal deste documento? O que ele diz sobre prazos?"
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
                  background: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  cursor: isLoading ? 'wait' : 'pointer',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Lendo PDF e Analisando...' : '🚀 Enviar Pergunta'}
              </button>
            </form>

            {error && (
              <div style={{ marginTop: '20px', color: '#fca5a5', padding: '10px', backgroundColor: '#450a0a', borderRadius: '8px' }}>
                {error}
              </div>
            )}
          </div>

          {/* Área de Resposta */}
          {answer && (
            <div style={{ backgroundColor: '#1f2937', padding: '30px', borderRadius: '12px', border: '1px solid #374151' }}>
              <h3 style={{ marginBottom: '20px', color: '#fff' }}>🤖 Resposta da IA:</h3>
              <div style={{ 
                whiteSpace: 'pre-wrap', 
                color: '#d1d5db', 
                lineHeight: '1.6', 
                fontSize: '1.05rem',
                backgroundColor: '#111827',
                padding: '20px',
                borderRadius: '8px'
              }}>
                {answer}
              </div>
            </div>
          )}
        </div>

        <ExemplosSection ferramentaId="chat-pdf" />
      </div>
    </div>
  );
}