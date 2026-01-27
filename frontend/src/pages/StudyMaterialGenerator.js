import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import config from '../config';
import { saveToHistory, TOOL_CONFIGS } from '../utils/saveToHistory';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';
import { 
  BookOpenIcon, 
  AcademicCapIcon, 
  ClipboardDocumentCheckIcon,
  LightBulbIcon,
  ListBulletIcon
} from '@heroicons/react/24/solid';

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

  useEffect(() => {
    const handleLoadFromHistory = (event) => {
      if (event.detail && event.detail.text) {
        setTopic(event.detail.text); 
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
    setMaterial('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login para gerar materiais.');

      const response = await fetch(config.ENDPOINTS.GENERATE_STUDY_MATERIAL, {
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

      try {
        await fetch(`${config.API_BASE_URL}/save-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            tool_type: 'study',
            input_data: topic,
            title: topic,
            output_data: data.material,
            metadata: { level: level }
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
    <div style={{ minHeight: '100vh', backgroundColor: '#0f1016', color: 'white', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* CABEÇALHO */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ 
             display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
             background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)', // Gradiente Teal
             width: '60px', height: '60px', borderRadius: '15px', marginBottom: '20px',
             boxShadow: '0 10px 30px -10px rgba(20, 184, 166, 0.5)'
          }}>
            <BookOpenIcon style={{ width: '32px', color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>
            Gerador de Material de Estudo
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Crie resumos, planos de estudo e questionários personalizados para qualquer nível de ensino.
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
              <ListBulletIcon style={{ width: '16px' }} />
              {showHistory ? 'Ocultar Histórico' : 'Ver Materiais Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '16px', border: '1px solid #374151' }}>
            <HistoryList user={user} toolType="study" />
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1fr 1fr', 
          gap: '40px',
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
            flexDirection: 'column'
          }}>
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '1rem', fontWeight: '600', color: '#e5e7eb' }}>
                  <LightBulbIcon style={{width: '20px', color: '#2dd4bf'}}/> Tópico de Estudo:
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Revolução Francesa, Fotossíntese..."
                  required
                  style={{
                    width: '100%',
                    height: '50px',
                    padding: '0 15px',
                    borderRadius: '10px',
                    backgroundColor: '#111827',
                    color: 'white',
                    border: '1px solid #4b5563',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '30px', flexGrow: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '1rem', fontWeight: '600', color: '#e5e7eb' }}>
                  <AcademicCapIcon style={{width: '20px', color: '#2dd4bf'}}/> Nível de Ensino:
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  style={{ 
                    width: '100%', 
                    height: '50px',
                    padding: '0 15px', 
                    borderRadius: '10px', 
                    backgroundColor: '#111827', 
                    color: 'white', 
                    border: '1px solid #4b5563',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
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
                  marginTop: 'auto',
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(90deg, #14b8a6 0%, #0f766e 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer',
                  fontSize: '1.1rem',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(20, 184, 166, 0.4)',
                  transition: 'transform 0.1s'
                }}
              >
                {isLoading ? '📖 Gerando Material...' : '✨ Criar Guia de Estudo'}
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
            border: '1px solid #14b8a6', // Borda Teal
            display: 'flex',
            flexDirection: 'column',
            minHeight: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#5eead4', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                <BookOpenIcon style={{ width: '24px' }} /> Guia Gerado:
              </h3>
              {material && (
                <button
                  onClick={() => {navigator.clipboard.writeText(material); alert('Material copiado!');}}
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
              backgroundColor: '#111827', // Fundo escuro para leitura confortável em tela
              color: '#e2e8f0', 
              padding: '25px', 
              borderRadius: '12px',
              fontFamily: "'Segoe UI', Roboto, sans-serif", 
              fontSize: '1rem',
              lineHeight: '1.7',
              whiteSpace: 'pre-wrap',
              border: '1px solid #374151',
              overflowY: 'auto',
              maxHeight: '500px'
            }}>
              {material || (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280', flexDirection: 'column', gap: '10px' }}>
                  <BookOpenIcon style={{ width: '48px', opacity: 0.2 }} />
                  <p>O material de estudo aparecerá aqui.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        <ExemplosSection ferramentaId="study-material" />
      </div>
    </div>
  );
}