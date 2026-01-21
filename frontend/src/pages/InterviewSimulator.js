import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import { saveToHistory, TOOL_CONFIGS } from '../utils/saveToHistory';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';

export default function InterviewSimulator() {
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [experience, setExperience] = useState('junior');
  const [simulation, setSimulation] = useState('');
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
        // O histórico salva algo como "Entrevista para Desenvolvedor na Google"
        // Vamos tentar preencher o cargo com o texto salvo
        setRole(event.detail.text); 
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    return () => {
      window.removeEventListener('loadFromHistory', handleLoadFromHistory);
    };
  }, []);

  const handleStartSimulation = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSimulation('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para iniciar a simulação.');

      const promptContext = `Simulação de entrevista para o cargo de ${role} na empresa ${company}, nível ${experience}.`;

      const response = await fetch(config.ENDPOINTS.INTERVIEW_SIMULATOR || 'http://localhost:5000/interview-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          company,
          experience,
          user_id: user.id
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao iniciar simulação.');

      setSimulation(data.message || data.interview_start);

      // Salvar no Histórico
      await saveToHistory(
        user,
        TOOL_CONFIGS.INTERVIEW_SIMULATOR || { type: 'interview', name: 'Simulador de Entrevista', credits: 2 },
        role, // Salva o cargo como texto principal
        data.message || 'Simulação iniciada...',
        { company, experience }
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
          🤝 Simulador de Entrevista
        </h1>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
          Pratique para sua próxima vaga com uma IA que simula recrutadores reais.
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
              {showHistory ? '▲ Ocultar Histórico' : '📚 Ver Simulações Anteriores'}
            </button>
          </div>
        )}

        {/* Lista Histórico */}
        {showHistory && user && (
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '10px' }}>
            <HistoryList user={user} toolType="interview" />
          </div>
        )}

        <div style={{ backgroundColor: '#1f2937', padding: '30px', borderRadius: '12px', border: '1px solid #374151' }}>
          <form onSubmit={handleStartSimulation}>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px' }}>Cargo Alvo:</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Desenvolvedor Full Stack, Gerente de Vendas..."
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#111827',
                  color: 'white',
                  border: '1px solid #4b5563'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px' }}>Empresa (Opcional):</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ex: Google, Nubank, Startup X..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#111827',
                  color: 'white',
                  border: '1px solid #4b5563'
                }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px' }}>Nível de Experiência:</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#111827',
                  color: 'white',
                  border: '1px solid #4b5563'
                }}
              >
                <option value="intern">Estagiário</option>
                <option value="junior">Júnior</option>
                <option value="mid">Pleno</option>
                <option value="senior">Sênior</option>
                <option value="lead">Tech Lead / Gerente</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '15px',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: isLoading ? 'wait' : 'pointer'
              }}
            >
              {isLoading ? 'Preparando Sala...' : '🎙️ Começar Entrevista'}
            </button>
          </form>

          {error && <div style={{ color: '#fca5a5', marginTop: '15px' }}>{error}</div>}
        </div>

        {/* Área da Simulação (Chat) */}
        {simulation && (
          <div style={{ marginTop: '30px', backgroundColor: '#1f2937', padding: '25px', borderRadius: '12px', border: '1px solid #059669' }}>
            <h3 style={{ color: '#34d399', marginBottom: '15px' }}>🟢 Entrevista Iniciada</h3>
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              color: '#d1d5db', 
              lineHeight: '1.6',
              fontSize: '1.1rem',
              marginBottom: '20px'
            }}>
              {simulation}
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', fontStyle: 'italic' }}>
              (Para responder, integre um campo de chat aqui ou continue mentalmente - este módulo gera apenas a pergunta inicial por enquanto).
            </p>
          </div>
        )}

        <ExemplosSection ferramentaId="interview-simulator" />
      </div>
    </div>
  );
}