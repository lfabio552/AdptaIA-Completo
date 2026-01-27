import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';
import { 
  UserIcon, 
  BriefcaseIcon, 
  ChatBubbleLeftRightIcon, 
  LightBulbIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';

export default function InterviewSimulator() {
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [experience, setExperience] = useState('junior');
  const [simulation, setSimulation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [visibleTips, setVisibleTips] = useState({});

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
        setRole(event.detail.text); 
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    return () => window.removeEventListener('loadFromHistory', handleLoadFromHistory);
  }, []);

  const toggleTip = (index) => {
    setVisibleTips(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleStartSimulation = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSimulation(null);
    setVisibleTips({});

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para iniciar a simulação.');

      const response = await fetch(config.ENDPOINTS.MOCK_INTERVIEW, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          company,
          description,
          experience,
          user_id: user.id
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao iniciar simulação.');

      setSimulation(data);

      try {
        await fetch(`${config.API_BASE_URL}/save-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            tool_type: 'interview',
            input_data: `${role} na ${company}`,
            output_data: JSON.stringify(data),
            metadata: { experience, description_snippet: description.substring(0, 50) }
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

  // Estilo compartilhado para garantir que Input e Select sejam idênticos
  const inputStyle = {
    width: '100%', 
    height: '50px', // Altura fixa e idêntica
    padding: '0 15px', 
    borderRadius: '10px', 
    backgroundColor: '#111827', 
    color: 'white', 
    border: '1px solid #4b5563',
    boxSizing: 'border-box',
    fontSize: '1rem',
    outline: 'none',
    margin: 0 // Remove margens padrão
  };

  const labelStyle = {
    display: 'block', 
    marginBottom: '8px', 
    fontSize: '0.9rem', 
    color: '#9ca3af', 
    lineHeight: '1.5', // Altura de linha fixa para alinhar os textos
    fontWeight: '600'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f1016', color: 'white', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* CABEÇALHO */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ 
             display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
             background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
             width: '60px', height: '60px', borderRadius: '15px', marginBottom: '20px',
             boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.5)'
          }}>
            <ChatBubbleLeftRightIcon style={{ width: '32px', color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>
            Simulador de Entrevista
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Pratique com um Recrutador IA que cria perguntas baseadas na sua vaga real.
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
              <BriefcaseIcon style={{ width: '16px' }} />
              {showHistory ? 'Ocultar Histórico' : 'Ver Simulações Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '16px', border: '1px solid #374151' }}>
            <HistoryList user={user} toolType="interview" />
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1fr 1fr', 
          gap: '30px',
          alignItems: 'stretch' 
        }}>
          
          {/* LADO ESQUERDO: CONFIGURAÇÃO */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '600px' 
          }}>
            <form onSubmit={handleStartSimulation} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              
              {/* LINHA 1: CARGO */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>
                  Cargo Alvo:
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Ex: Desenvolvedor Front-end"
                  required
                  style={inputStyle}
                />
              </div>

              {/* LINHA 2: EMPRESA E NÍVEL (FLEX PARA ALINHAMENTO PERFEITO) */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>
                      Empresa:
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Ex: Google"
                      style={inputStyle}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>
                      Nível:
                    </label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      style={{ 
                        ...inputStyle,
                        cursor: 'pointer',
                        appearance: 'none', // Remove estilo padrão do sistema
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                        backgroundSize: '16px'
                      }}
                    >
                        <option value="intern">Estagiário</option>
                        <option value="junior">Júnior</option>
                        <option value="mid">Pleno</option>
                        <option value="senior">Sênior</option>
                        <option value="lead">Liderança</option>
                    </select>
                </div>
              </div>

              <div style={{ marginBottom: '25px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>
                  Descrição da Vaga (Cole aqui):
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cole os requisitos da vaga para a IA gerar perguntas ultra-específicas..."
                  style={{ 
                    width: '100%', 
                    flexGrow: 1, 
                    minHeight: '150px',
                    padding: '15px', 
                    borderRadius: '10px', 
                    backgroundColor: '#111827', 
                    color: 'white', 
                    border: '1px solid #4b5563', 
                    boxSizing: 'border-box', 
                    resize: 'none',
                    lineHeight: '1.5',
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: 'auto',
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer',
                  fontSize: '1.1rem',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  transition: 'transform 0.1s'
                }}
              >
                {isLoading ? '🤖 Gerando Entrevista...' : '🚀 Iniciar Simulação'}
              </button>
              
              {error && (
                <div style={{ marginTop: '20px', color: '#fca5a5', padding: '12px', backgroundColor: '#450a0a', borderRadius: '10px', fontSize: '0.9rem' }}>
                  ⚠️ {error}
                </div>
              )}
            </form>
          </div>

          {/* LADO DIREITO: CHAT INTERATIVO */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            borderRadius: '20px', 
            border: '1px solid #10b981', 
            display: 'flex',
            flexDirection: 'column',
            minHeight: '600px', 
            height: '100%',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #374151', backgroundColor: '#111827', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserIcon style={{ width: '26px', color: 'white' }} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Recrutador IA</h3>
                    <span style={{ fontSize: '0.85rem', color: '#10b981' }}>● Online agora</span>
                </div>
            </div>

            <div style={{ flexGrow: 1, padding: '25px', overflowY: 'auto', backgroundColor: '#111827' }}>
                {!simulation && !isLoading && (
                    <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '100px', padding: '0 20px' }}>
                        <ChatBubbleLeftRightIcon style={{ width: '80px', margin: '0 auto 20px', opacity: 0.1 }} />
                        <p style={{fontSize: '1.1rem'}}>Preencha os dados da vaga ao lado e clique em iniciar.</p>
                        <p style={{fontSize: '0.9rem'}}>Eu vou criar um roteiro personalizado para você treinar.</p>
                    </div>
                )}

                {isLoading && (
                    <div style={{ textAlign: 'center', marginTop: '120px' }}>
                        <div className="loader" style={{ margin: '0 auto 20px' }}></div>
                        <p style={{ color: '#10b981' }}>Analisando perfil da vaga...</p>
                    </div>
                )}

                {simulation && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        <div style={{ alignSelf: 'flex-start', maxWidth: '90%' }}>
                            <div style={{ backgroundColor: '#374151', padding: '15px 20px', borderRadius: '20px 20px 20px 5px', color: '#e5e7eb', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                Olá! Sou seu recrutador virtual. Com base na vaga de <strong>{role}</strong>, preparei algumas perguntas que você provavelmente vai enfrentar. Vamos lá?
                            </div>
                        </div>

                        {simulation.questions && simulation.questions.map((q, idx) => (
                            <div key={idx} style={{ alignSelf: 'flex-start', maxWidth: '95%', animation: `fadeIn 0.5s ease forwards ${idx * 0.2}s`, opacity: 0 }}>
                                <div style={{ marginBottom: '5px', fontSize: '0.8rem', color: '#9ca3af', marginLeft: '10px' }}>Pergunta {idx + 1}</div>
                                <div style={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', padding: '15px 20px', borderRadius: '20px 20px 20px 5px', color: '#fff', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                    {q.q}
                                </div>
                                
                                <button 
                                    onClick={() => toggleTip(idx)}
                                    style={{ 
                                        background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', 
                                        fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '10px'
                                    }}
                                >
                                    <LightBulbIcon style={{ width: '16px' }} /> 
                                    {visibleTips[idx] ? 'Ocultar Dica' : 'Ver Resposta Ideal'}
                                </button>

                                {visibleTips[idx] && (
                                    <div style={{ marginTop: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '10px', borderLeft: '3px solid #10b981', color: '#d1d5db', fontSize: '0.9rem', marginLeft: '10px' }}>
                                        <strong>💡 Dica do Especialista:</strong> {q.a}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div style={{ marginTop: '30px', borderTop: '1px solid #374151', paddingTop: '20px' }}>
                            <h4 style={{ color: '#fbbf24', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <SparklesIcon style={{width: '20px'}}/> Feedback Geral & Pontos de Atenção:
                            </h4>
                            <ul style={{ paddingLeft: '20px', color: '#9ca3af', lineHeight: '1.6' }}>
                                {simulation.tips && simulation.tips.map((tip, idx) => (
                                    <li key={idx} style={{ marginBottom: '8px' }}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
          </div>

        </div>
        
        <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .loader { border: 3px solid #374151; border-top: 3px solid #10b981; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>

        <ExemplosSection ferramentaId="interview-simulator" />
      </div>
    </div>
  );
}