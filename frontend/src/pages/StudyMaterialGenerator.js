import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import { saveToHistory, TOOL_CONFIGS } from '../utils/saveToHistory';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';

export default function StudyMaterialGenerator() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('ensino_medio');
  const [material, setMaterial] = useState('');
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
        setTopic(event.detail.text); // Preenche o tópico
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
    setMaterial('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para gerar materiais.');

      const response = await fetch(config.ENDPOINTS.GENERATE_STUDY_MATERIAL || 'http://localhost:5000/generate-study-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          level,
          user_id: user.id
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar material.');

      setMaterial(data.material);

      // Salvar no Histórico (Assumindo que você criou a config 'STUDY_MATERIAL', senão usamos um genérico)
      await saveToHistory(
        user,
        TOOL_CONFIGS.STUDY_MATERIAL || { type: 'study', name: 'Material de Estudo', credits: 1 },
        topic,
        data.material,
        { level }
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
          📚 Gerador de Material de Estudo
        </h1>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
          Crie resumos, questionários e planos de estudo sobre qualquer tema.
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
            <HistoryList user={user} toolType="study" />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Lado Esquerdo */}
          <div style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '12px', border: '1px solid #374151' }}>
            <form onSubmit={handleGenerate}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px' }}>Tópico de Estudo:</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Revolução Francesa, Fotossíntese, Equações de 2º Grau..."
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

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px' }}>Nível de Ensino:</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#111827', color: 'white', border: '1px solid #4b5563' }}
                >
                  <option value="fundamental">Ensino Fundamental</option>
                  <option value="ensino_medio">Ensino Médio</option>
                  <option value="superior">Ensino Superior / Acadêmico</option>
                  <option value="concurso">Concursos Públicos</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: 'linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer'
                }}
              >
                {isLoading ? 'Gerando Material...' : '📖 Criar Guia de Estudo'}
              </button>
            </form>
            {error && <div style={{ color: '#fca5a5', marginTop: '15px' }}>{error}</div>}
          </div>

          {/* Lado Direito */}
          <div style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '12px', border: '1px solid #374151' }}>
            <h3 style={{ marginBottom: '15px' }}>Material Gerado:</h3>
            <div style={{ 
              backgroundColor: '#111827', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '1px solid #4b5563',
              height: '400px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              color: material ? '#d1d5db' : '#6b7280',
              lineHeight: '1.6'
            }}>
              {material || 'Seu guia de estudos aparecerá aqui...'}
            </div>
          </div>
        </div>

        <ExemplosSection ferramentaId="study-material" />
      </div>
    </div>
  );
}