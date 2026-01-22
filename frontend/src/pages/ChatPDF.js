import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';

export default function ChatPDF() {
  const [question, setQuestion] = useState('');
  const [file, setFile] = useState(null);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(''); // Para mostrar "Lendo PDF..." ou "Gerando resposta..."
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
      setStatus('Arquivo selecionado. Envie a pergunta para processar.');
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

      // 1. SE TIVER ARQUIVO NOVO, FAZ UPLOAD PRIMEIRO
      if (file) {
        setStatus('⏳ Lendo e processando o PDF... (Isso pode levar alguns segundos)');
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', user.id);

        // Rota de Upload (Verifique se existe no config, senão usa a url base)
        const uploadUrl = config.ENDPOINTS.UPLOAD_DOCUMENT || `${config.API_BASE_URL}/upload-document`;
        
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: formData, // Sem header Content-Type (automático)
        });

        if (!uploadResponse.ok) {
           const errData = await uploadResponse.json();
           throw new Error(errData.error || 'Erro ao ler o PDF.');
        }
        
        // Se deu certo, limpamos o file para não reenviar na próxima pergunta (agora já está no banco)
        // Mas mantemos visualmente para o usuário saber o contexto
        setStatus('✅ PDF processado! Analisando sua pergunta...');
      }

      // 2. FAZ A PERGUNTA AO DOCUMENTO (RAG)
      setStatus('🤔 A IA está pensando...');
      
      const askUrl = config.ENDPOINTS.ASK_DOCUMENT || `${config.API_BASE_URL}/ask-document`;
      
      const response = await fetch(askUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          question: question
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar resposta.');

      setAnswer(data.answer);
      setStatus('');

      // 3. SALVAR HISTÓRICO
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
      // Opcional: Limpar o file input se quiser obrigar re-upload
      // setFile(null); 
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '10px' }}>
          📑 Chat com PDF Inteligente
        </h1>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
          A IA lê seu documento e responde qualquer pergunta sobre ele.
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
              {showHistory ? '▲ Ocultar Histórico' : '📚 Ver Perguntas Anteriores'}
            </button>
          </div>
        )}

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
              <div style={{ marginBottom: '25px', padding: '20px', border: '2px dashed #4b5563', borderRadius: '8px', textAlign: 'center', backgroundColor: file ? '#064e3b' : 'transparent' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#d1d5db', cursor: 'pointer', fontWeight: 'bold' }}>
                  {file ? `📄 ${file.name} (Pronto para envio)` : '📂 Clique aqui para selecionar seu PDF'}
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
                  {file ? 'Trocar Arquivo' : 'Selecionar Arquivo'}
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
                  placeholder="Ex: Qual é a conclusão principal? Quais são os valores mencionados?"
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

              {status && <p style={{ color: '#fbbf24', textAlign: 'center', marginBottom: '15px' }}>{status}</p>}

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
                {isLoading ? 'Processando...' : '🚀 Enviar Pergunta'}
              </button>
            </form>

            {error && (
              <div style={{ marginTop: '20px', color: '#fca5a5', padding: '10px', backgroundColor: '#450a0a', borderRadius: '8px', textAlign: 'center' }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Área de Resposta */}
          {answer && (
            <div style={{ backgroundColor: '#1f2937', padding: '30px', borderRadius: '12px', border: '1px solid #ef4444' }}>
              <h3 style={{ marginBottom: '20px', color: '#fca5a5' }}>🤖 Resposta da IA:</h3>
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