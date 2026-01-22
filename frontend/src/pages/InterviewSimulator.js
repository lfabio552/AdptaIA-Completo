import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';

export default function InterviewSimulator() {
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState(''); // VOLTOU A DESCRIÇÃO
  const [experience, setExperience] = useState('junior');
  const [simulation, setSimulation] = useState(null); // Agora é um objeto ou null
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
        setRole(event.detail.text); 
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    return () => window.removeEventListener('loadFromHistory', handleLoadFromHistory);
  }, []);

  const handleStartSimulation = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSimulation(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para iniciar a simulação.');

      // 1. CHAMADA DA API (AGORA COM O CONFIG CERTO)
      const response = await fetch(config.ENDPOINTS.MOCK_INTERVIEW, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          company,
          description, // Enviando a descrição de volta
          experience,
          user_id: user.id
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao iniciar simulação.');

      // A API retorna um JSON com { questions: [], tips: [] }
      setSimulation(data);

      // 2. SALVAR HISTÓRICO (MANUAL E SEGURO)
      try {
        await fetch(`${config.API_BASE_URL}/save-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            tool_type: 'interview',
            input_data: `${role} na ${company}`,
            output_data: JSON.stringify(data), // Salva o resultado como texto
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '10px' }}>
          🤝 Simulador de Entrevista
        </h1>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
          Pratique com perguntas reais baseadas na descrição da sua vaga.
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
              {showHistory ? '▲ Ocultar Histórico' : '📚 Ver Simulações Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '10px' }}>
            <HistoryList user={user} toolType="interview" />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* LADO ESQUERDO: FORMULÁRIO */}
            <div style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '12px', border: '1px solid #374151' }}>
                <form onSubmit={handleStartSimulation}>
                    <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Cargo Alvo:</label>
                    <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Ex: Desenvolvedor Front-end"
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#111827', color: 'white', border: '1px solid #4b5563' }}
                    />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Empresa (Opcional):</label>
                    <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Ex: Google, Nubank..."
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#111827', color: 'white', border: '1px solid #4b5563' }}
                    />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Nível:</label>
                    <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#111827', color: 'white', border: '1px solid #4b5563' }}
                    >
                        <option value="intern">Estagiário</option>
                        <option value="junior">Júnior</option>
                        <option value="mid">Pleno</option>
                        <option value="senior">Sênior</option>
                        <option value="lead">Liderança</option>
                    </select>
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Cole a Descrição da Vaga (Importante):</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Cole aqui os requisitos da vaga para a IA gerar perguntas específicas..."
                        style={{ width: '100%', height: '120px', padding: '10px', borderRadius: '8px', backgroundColor: '#111827', color: 'white', border: '1px solid #4b5563' }}
                    />
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
                        cursor: isLoading ? 'wait' : 'pointer'
                    }}
                    >
                    {isLoading ? 'Analisando Vaga...' : '🚀 Gerar Entrevista'}
                    </button>
                </form>
                {error && <div style={{ color: '#fca5a5', marginTop: '15px' }}>{error}</div>}
            </div>

            {/* LADO DIREITO: RESULTADO */}
            <div style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '12px', border: '1px solid #059669' }}>
                <h3 style={{ color: '#34d399', marginBottom: '15px' }}>📋 Roteiro da Entrevista</h3>
                
                {!simulation && !isLoading && (
                    <div style={{ color: '#6b7280', textAlign: 'center', marginTop: '50px' }}>
                        Preencha os dados ao lado para receber as perguntas prováveis e dicas.
                    </div>
                )}

                {simulation && (
                    <div style={{ height: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                        <h4 style={{ color: '#a7f3d0', marginTop: '20px' }}>Perguntas Prováveis:</h4>
                        {simulation.questions && simulation.questions.map((q, idx) => (
                            <div key={idx} style={{ marginBottom: '20px', backgroundColor: '#111827', padding: '15px', borderRadius: '8px' }}>
                                <p style={{ fontWeight: 'bold', color: '#fff' }}>🗣️ {q.q}</p>
                                <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '5px' }}>💡 Dica: {q.a}</p>
                            </div>
                        ))}

                        <h4 style={{ color: '#fcd34d', marginTop: '30px' }}>Dicas Gerais:</h4>
                        <ul style={{ color: '#d1d5db', paddingLeft: '20px' }}>
                            {simulation.tips && simulation.tips.map((tip, idx) => (
                                <li key={idx} style={{ marginBottom: '5px' }}>{tip}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>

        <ExemplosSection ferramentaId="interview-simulator" />
      </div>
    </div>
  );
}