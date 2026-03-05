import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // ADICIONADO PARA O POP-UP
import { saveAs } from 'file-saver';
import { supabase } from '../supabaseClient';
import config from '../config';
import HistoryList from '../components/HistoryList';
import ExemplosSection from '../components/ExemplosSection';
import { 
  TableCellsIcon, 
  ArrowDownTrayIcon, 
  DocumentChartBarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';

export default function SpreadsheetGenerator() {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // ESTADO PARA O POP-UP DE CRÉDITOS
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
        setDescription(event.detail.text);
        setIsSuccess(false);
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('loadFromHistory', handleLoadFromHistory);
    return () => window.removeEventListener('loadFromHistory', handleLoadFromHistory);
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!description) return;
    
    setIsLoading(true);
    setError('');
    setIsSuccess(false);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Faça login para continuar.');

      const endpoint = config.ENDPOINTS.GENERATE_SPREADSHEET || `${config.API_BASE_URL}/generate-spreadsheet`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: description,
          user_id: currentUser.id
        }),
      });

      // LÓGICA DE BLOQUEIO DE CRÉDITOS (Erro 402)
      if (response.status === 402) {
        setShowUpgradeModal(true);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao gerar planilha.');
      }

      const blob = await response.blob();
      saveAs(blob, 'Planilha_Inteligente_IA.xlsx');
      setIsSuccess(true);

      try {
        await fetch(`${config.API_BASE_URL}/save-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUser.id,
            tool_type: 'spreadsheet',
            input_data: description,
            output_data: 'Arquivo Excel Gerado (.xlsx)',
            metadata: { downloaded: true, date: new Date().toISOString() }
          })
        });
      } catch (histError) {
        console.error("Erro ao salvar histórico:", histError);
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f1016', // Fundo Dark Sólido e Puro
      backgroundImage: 'none', // FORÇA A REMOÇÃO DO DEGRADÊ ANTIGO
      color: 'white', 
      padding: '40px 20px', 
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* LUZ VERDE CONCENTRADA APENAS NO TOPO */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(15, 16, 22, 0) 70%)', // Verde
        filter: 'blur(50px)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      <style>{`
        .tool-grid {
          display: grid;
          gap: 40px;
          grid-template-columns: 1fr;
        }
        
        /* A MÁGICA DO ALINHAMENTO: */
        @media (min-width: 1024px) {
          .tool-grid {
            grid-template-columns: 1fr 1fr;
            /* Força as colunas a terem a mesma altura */
            grid-auto-rows: 1fr; 
          }
        }

        /* Garante que o card ocupe 100% da altura da célula do grid */
        .tool-card {
          height: 100%;
          display: flex;
          flex-direction: column;
          box-sizing: border-box; /* Importante para o padding não estourar */
          position: relative;
          z-index: 1;
        }
        
        /* Animações */
        .loader { border: 4px solid #374151; border-top: 4px solid #10b981; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* CABEÇALHO */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ 
             display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
             background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', 
             width: '60px', height: '60px', borderRadius: '15px', marginBottom: '20px',
             boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.5)'
          }}>
            <TableCellsIcon style={{ width: '32px', color: 'white' }} />
          </div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            marginBottom: '10px',
            background: 'linear-gradient(to right, #ffffff, #34d399, #059669)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Gerador de Planilhas Excel
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Descreva as colunas e dados que você precisa. A IA estrutura, formata e entrega o arquivo pronto.
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
              <DocumentChartBarIcon style={{ width: '16px' }} />
              {showHistory ? 'Ocultar Histórico' : 'Ver Planilhas Anteriores'}
            </button>
          </div>
        )}

        {showHistory && user && (
          <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '16px', border: '1px solid #374151' }}>
            <HistoryList user={user} toolType="spreadsheet" />
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div className="tool-grid">
          
          {/* LADO ESQUERDO: CONFIGURAÇÃO */}
          <div className="tool-card" style={{ 
            backgroundColor: '#1f2937', 
            padding: '30px', 
            borderRadius: '20px', 
            border: '1px solid #374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%' }}>
              
              <div style={{ marginBottom: '25px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '1rem', fontWeight: '600', color: '#e5e7eb' }}>
                  O que essa planilha deve conter?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Planilha de Controle Financeiro Pessoal. Colunas: Data, Descrição, Categoria (Alimentação, Transporte, Lazer), Valor (R$), Tipo (Receita/Despesa). Inclua 5 exemplos fictícios."
                  required
                  style={{
                    width: '100%',
                    flexGrow: 1, // Faz a caixa de texto crescer para ocupar TODO o espaço disponível
                    minHeight: '300px', // Altura mínima um pouco maior para garantir paridade
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

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer',
                  fontSize: '1.1rem',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  transition: 'transform 0.1s',
                  marginTop: 'auto' // Empurra o botão para o fundo absoluto do card
                }}
              >
                {isLoading ? '🔨 Construindo Células...' : '📥 Gerar e Baixar Excel'}
              </button>
              
              {error && (
                <div style={{ marginTop: '20px', color: '#fca5a5', padding: '12px', backgroundColor: '#450a0a', borderRadius: '10px', fontSize: '0.9rem' }}>
                  ⚠️ {error}
                </div>
              )}
            </form>
          </div>

          {/* LADO DIREITO: PREVIEW / STATUS */}
          <div className="tool-card" style={{ 
            backgroundColor: '#1f2937', 
            borderRadius: '20px', 
            border: '1px solid #10b981', 
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            <div style={{ 
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                opacity: 0.05, 
                backgroundImage: 'linear-gradient(#4b5563 1px, transparent 1px), linear-gradient(90deg, #4b5563 1px, transparent 1px)', 
                backgroundSize: '40px 40px',
                zIndex: 0
            }}></div>

            <div style={{ 
                position: 'relative', 
                zIndex: 1, 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '40px', 
                textAlign: 'center',
                height: '100%' // Garante que o conteúdo ocupe toda a altura
            }}>
                
                {!isSuccess && !isLoading && (
                    <>
                        <div style={{ width: '80px', height: '80px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <TableCellsIcon style={{ width: '40px', color: '#6b7280' }} />
                        </div>
                        <h3 style={{ color: '#9ca3af', fontSize: '1.2rem', marginBottom: '10px' }}>Aguardando Dados</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.9rem', maxWidth: '300px' }}>
                            Preencha os detalhes ao lado e clique em gerar para criar sua planilha automaticamente.
                        </p>
                    </>
                )}

                {isLoading && (
                    <>
                        <div className="loader" style={{ marginBottom: '20px' }}></div>
                        <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '5px' }}>Organizando Colunas...</h3>
                        <p style={{ color: '#10b981', fontSize: '0.9rem' }}>A IA está estruturando seus dados.</p>
                    </>
                )}

                {isSuccess && (
                    <div style={{ animation: 'popIn 0.5s ease', width: '100%' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#064e3b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid #10b981' }}>
                            <CheckCircleIcon style={{ width: '50px', color: '#34d399' }} />
                        </div>
                        <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '10px', fontWeight: 'bold' }}>Planilha Pronta!</h3>
                        <p style={{ color: '#d1d5db', marginBottom: '30px' }}>
                            O download do arquivo <strong>.xlsx</strong> começou automaticamente.
                        </p>
                        
                        <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #059669', display: 'inline-block', minWidth: '250px', width: '80%', maxWidth: '300px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                <div style={{ backgroundColor: '#10b981', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>XLS</div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Planilha_IA.xlsx</div>
                                    <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Excel Spreadsheet</div>
                                </div>
                            </div>
                            <button 
                                onClick={handleGenerate} 
                                style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', border: '1px solid #10b981', color: '#10b981', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                            >
                                <ArrowDownTrayIcon style={{width: '16px', display: 'inline', marginRight: '5px'}}/> Baixar Novamente
                            </button>
                        </div>
                    </div>
                )}

            </div>
          </div>

        </div>

        {/* EXEMPLOS */}
        <ExemplosSection ferramentaId="gerador-planilha" />
      </div>

      {/* MODAL DE CRÉDITOS ESGOTADOS */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            backgroundColor: '#1f2937', padding: '40px', borderRadius: '24px',
            maxWidth: '420px', width: '90%', textAlign: 'center',
            border: '1px solid #10b981', boxShadow: '0 10px 50px rgba(16, 185, 129, 0.3)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🪙</div>
            <h2 style={{ color: 'white', marginBottom: '15px', fontSize: '1.8rem', fontWeight: '800' }}>
              Créditos Esgotados!
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '30px', fontSize: '1.05rem', lineHeight: '1.5' }}>
              Você atingiu o limite do plano gratuito. Assine o <strong>Plano PRO</strong> para criar sem limites e ter acesso a todas as ferramentas premium.
            </p>
            <Link to="/precos" style={{
              display: 'block', width: '100%', padding: '16px', boxSizing: 'border-box',
              background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', color: 'white',
              borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none',
              marginBottom: '15px', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
            }}>
              Ver Planos PRO 🚀
            </Link>
            <button 
              onClick={() => setShowUpgradeModal(false)} 
              style={{
                background: 'transparent', border: 'none', color: '#9ca3af',
                cursor: 'pointer', fontSize: '0.95rem', textDecoration: 'underline'
              }}
            >
              Voltar para a ferramenta
            </button>
          </div>
        </div>
      )}

    </div>
  );
}