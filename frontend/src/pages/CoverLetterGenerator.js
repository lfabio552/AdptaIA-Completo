import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import { saveToHistory, TOOL_CONFIGS } from '../utils/saveToHistory';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';
import { 
  PencilSquareIcon, 
  DocumentTextIcon, 
  ClipboardDocumentCheckIcon,
  BriefcaseIcon,
  UserCircleIcon
} from '@heroicons/react/24/solid';

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

  useEffect(() => {
    const handleLoadFromHistory = (event) => {
      if (event.detail && event.detail.text) {
        setJobDescription(event.detail.text); 
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

      await saveToHistory(
        user,
        TOOL_CONFIGS.COVER_LETTER,
        jobDescription, 
        data.cover_letter,
        { resume_preview: myResume.substring(0, 100) + '...' }
      );

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
             background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', // Verde-Azulado (Teal)
             width: '60px', height: '60px', borderRadius: '15px', marginBottom: '20px',
             boxShadow: '0 10px 30px -10px rgba(13, 148, 136, 0.5)'
          }}>
            <PencilSquareIcon style={{ width: '32px', color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>
            Gerador de Carta de Apresentação
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Cole a vaga e seu currículo. A IA escreve uma carta persuasiva que conecta seus pontos fortes aos requisitos.
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
              <DocumentTextIcon style={{ width: '16px' }} />
              {showHistory ? 'Ocultar Histórico' : 'Ver Cartas Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '16px', border: '1px solid #374151' }}>
            <HistoryList user={user} toolType="cover-letter" />
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1fr 1fr', 
          gap: '40px',
          alignItems: 'stretch' // <--- AQUI ESTÁ A CORREÇÃO: Força altura igual nos dois lados
        }}>
          
          {/* LADO ESQUERDO: INPUTS */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',        // Flex para controlar o layout interno
            flexDirection: 'column' // Organiza em coluna
          }}>
            {/* O formulário cresce (flexGrow) para ocupar todo o espaço do cartão */}
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '1rem', fontWeight: '600', color: '#e5e7eb' }}>
                  <BriefcaseIcon style={{width: '20px', color: '#2dd4bf'}}/> 1. Descrição da Vaga:
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Cole aqui os requisitos da vaga (Job Description)..."
                  required
                  style={{
                    width: '100%',
                    height: '180px', // Aumentei um pouco para ficar mais proporcional
                    padding: '15px',
                    borderRadius: '12px',
                    backgroundColor: '#111827',
                    color: 'white',
                    border: '1px solid #4b5563',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '30px', flexGrow: 1 }}> {/* flexGrow aqui ajuda a empurrar se sobrar espaço */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '1rem', fontWeight: '600', color: '#e5e7eb' }}>
                  <UserCircleIcon style={{width: '20px', color: '#2dd4bf'}}/> 2. Seu Resumo Profissional:
                </label>
                <textarea
                  value={myResume}
                  onChange={(e) => setMyResume(e.target.value)}
                  placeholder="Cole um resumo do seu currículo ou experiências principais..."
                  required
                  style={{
                    width: '100%',
                    height: '180px',
                    padding: '15px',
                    borderRadius: '12px',
                    backgroundColor: '#111827',
                    color: 'white',
                    border: '1px solid #4b5563',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Botão com marginTop: auto para ir para o rodapé do cartão */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: 'auto', // <--- Isso empurra o botão para baixo
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(90deg, #0d9488 0%, #0f766e 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer',
                  fontSize: '1.1rem',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(13, 148, 136, 0.4)',
                  transition: 'transform 0.1s'
                }}
              >
                {isLoading ? '✍️ Escrevendo Carta...' : '✨ Gerar Carta Personalizada'}
              </button>
              
              {error && (
                <div style={{ marginTop: '20px', color: '#fca5a5', padding: '12px', backgroundColor: '#450a0a', borderRadius: '10px', fontSize: '0.9rem' }}>
                  ⚠️ {error}
                </div>
              )}
            </form>
          </div>

          {/* LADO DIREITO: RESULTADO */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #0d9488', 
            display: 'flex',
            flexDirection: 'column',
            minHeight: '650px' // Altura mínima garantida para o papel ficar bonito
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#5eead4', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                <DocumentTextIcon style={{ width: '24px' }} /> Carta Gerada:
              </h3>
              {generatedLetter && (
                <button
                  onClick={() => {navigator.clipboard.writeText(generatedLetter); alert('Copiada!');}}
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
              backgroundColor: '#ffffff', 
              color: '#1f2937', 
              padding: '40px', // Mais padding para parecer papel A4
              borderRadius: '12px',
              fontFamily: "'Times New Roman', serif", 
              fontSize: '1.05rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              border: '1px solid #d1d5db',
              overflowY: 'auto',
              maxHeight: '600px', // Altura máxima interna com scroll
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)'
            }}>
              {generatedLetter || (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontFamily: 'sans-serif', flexDirection: 'column', gap: '10px' }}>
                  <DocumentTextIcon style={{ width: '48px', opacity: 0.2 }} />
                  <p>Sua carta aparecerá aqui, pronta para imprimir.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        <ExemplosSection ferramentaId="cover-letter" />
      </div>
    </div>
  );
}