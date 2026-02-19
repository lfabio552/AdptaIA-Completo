import React, { useState, useEffect } from 'react';

export default function HistoryList({ user, toolType }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forceReload, setForceReload] = useState(0); // Para forçar recarregamento

  // Carrega histórico automaticamente quando o componente é montado
  useEffect(() => {
    console.log('🔄 HistoryList montado - User:', user?.id, 'Tool:', toolType);
    
    if (user && user.id) {
      loadHistory();
    } else {
      setError('🔒 Faça login para ver seu histórico');
      setLoading(false);
    }
  }, [user, toolType, forceReload]);

  const loadHistory = async () => {
    console.log('📡 Carregando histórico...');
    
    if (!user || !user.id) {
      console.error('❌ Usuário não autenticado');
      setError('Usuário não autenticado');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('📤 Fazendo request para API...');
      
      const requestBody = { 
        user_id: user.id,
        tool_type: toolType,
        limit: 10
      };
      
      console.log('📦 Request Body:', requestBody);
      
      const response = await fetch('https://adptaia-completo.onrender.com/get-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📥 Status da resposta:', response.status);
      
      // Primeiro tentamos ler como texto para debug
      const responseText = await response.text();
      console.log('📥 Resposta bruta:', responseText.substring(0, 200) + '...');
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao parsear JSON:', parseError);
        setError('Resposta inválida do servidor');
        return;
      }
      
      console.log('📊 Dados parseados:', data);
      
      if (data.success) {
        console.log(`✅ Sucesso! ${data.history?.length || 0} itens carregados`);
        setHistory(data.history || []);
      } else {
        console.error('❌ Erro do servidor:', data.error);
        setError(data.error || 'Erro ao carregar histórico');
      }
      
    } catch (err) {
      console.error('💥 Erro completo:', err);
      setError('Falha na conexão com o servidor: ' + err.message);
    } finally {
      setLoading(false);
      console.log('🏁 Carregamento finalizado');
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric'
      }) + ' • ' + date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return 'Data inválida';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('✅ Texto copiado para a área de transferência!');
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Tem certeza que deseja excluir este item do histórico?')) {
      return;
    }
    
    try {
      const response = await fetch('https://meu-gerador-backend.onrender.com/delete-history-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.id,
          item_id: itemId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('🗑️ Item excluído com sucesso!');
        // Força recarregamento do histórico
        setForceReload(prev => prev + 1);
      } else {
        alert('❌ Erro ao excluir: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      alert('❌ Erro de conexão ao tentar excluir');
      console.error('Erro ao excluir:', err);
    }
  };

  // CORREÇÃO AQUI: Renomeado de useItemAgain para handleUseItemAgain
  const handleUseItemAgain = (inputData) => {
    // Dispara evento para o AgenteABNT usar este texto
    const event = new CustomEvent('loadFromHistory', { 
      detail: { text: inputData } 
    });
    window.dispatchEvent(event);
  };

  // ============================================
  // RENDERIZAÇÃO
  // ============================================

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid #7e22ce',
          borderTop: '4px solid transparent',
          borderRadius: '50%',
          margin: '0 auto 20px',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#9ca3af', fontSize: '16px', marginBottom: '10px' }}>
          Carregando seu histórico...
        </p>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          Buscando suas atividades recentes
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '25px', 
        backgroundColor: '#1f2937', 
        borderRadius: '10px',
        border: '1px solid #374151',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '15px' }}>⚠️</div>
        <h4 style={{ color: '#fca5a5', marginBottom: '15px' }}>
          Não foi possível carregar o histórico
        </h4>
        <p style={{ color: '#d1d5db', marginBottom: '20px' }}>
          {error}
        </p>
        <button 
          onClick={loadHistory}
          style={{
            padding: '12px 25px',
            backgroundColor: '#7e22ce',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#6d28d9'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#7e22ce'}
        >
          🔄 Tentar Novamente
        </button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={{ 
        padding: '40px 20px', 
        textAlign: 'center',
        backgroundColor: '#1f2937',
        borderRadius: '10px'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>📭</div>
        <h4 style={{ color: '#e5e7eb', marginBottom: '10px' }}>
          Histórico vazio
        </h4>
        <p style={{ color: '#9ca3af', marginBottom: '5px' }}>
          Você ainda não tem atividades registradas
        </p>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          Use a ferramenta para começar seu histórico!
        </p>
        <button 
          onClick={loadHistory}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#374151',
            color: '#d1d5db',
            border: '1px solid #4b5563',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Verificar Novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* CABEÇALHO */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '1px solid #374151'
      }}>
        <div>
          <h4 style={{ color: '#f3f4f6', margin: 0 }}>
            📚 Seu Histórico
          </h4>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '5px 0 0 0' }}>
            {history.length} atividade(s) encontrada(s)
          </p>
        </div>
        <button
          onClick={loadHistory}
          style={{
            padding: '8px 15px',
            backgroundColor: '#374151',
            color: '#d1d5db',
            border: '1px solid #4b5563',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          title="Recarregar histórico"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* LISTA DE ITENS */}
      <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
        {history.map((item, index) => (
          <div 
            key={item.id || index}
            style={{
              backgroundColor: '#111827',
              borderRadius: '10px',
              padding: '18px',
              marginBottom: '15px',
              borderLeft: '4px solid #7e22ce',
              border: '1px solid #1f2937',
              transition: 'all 0.2s',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1f2937';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* CABEÇALHO DO ITEM */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '15px'
            }}>
              <div>
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: '13px',
                  backgroundColor: '#1f2937',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  display: 'inline-block',
                  marginBottom: '8px'
                }}>
                  {formatDate(item.created_at)}
                </div>
                <div style={{ 
                  color: '#d1d5db', 
                  fontSize: '15px',
                  fontWeight: '600'
                }}>
                  {item.tool_name || 'Atividade'}
                </div>
              </div>
              
              {/* BOTÕES DE AÇÃO */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => copyToClipboard(item.input_data)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s'
                  }}
                  title="Copiar texto original"
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                >
                  📋 Copiar
                </button>
                
                {/* CORREÇÃO AQUI: handleUseItemAgain em vez de useItemAgain */}
                <button
                  onClick={() => handleUseItemAgain(item.input_data)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s'
                  }}
                  title="Usar este texto novamente"
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                >
                  ↻ Usar
                </button>
                
                <button
                  onClick={() => deleteItem(item.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s'
                  }}
                  title="Excluir do histórico"
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                >
                  🗑️
                </button>
              </div>
            </div>
            
            {/* TEXTO ORIGINAL */}
            <div style={{ marginBottom: item.output_data ? '12px' : '0' }}>
              <div style={{ 
                color: '#9ca3af', 
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📝 Texto original:</span>
                <span style={{ 
                  fontSize: '11px', 
                  backgroundColor: '#374151',
                  padding: '2px 6px',
                  borderRadius: '10px'
                }}>
                  {item.input_data?.length || 0} caracteres
                </span>
              </div>
              <div style={{
                color: '#d1d5db',
                fontSize: '14px',
                backgroundColor: '#1f2937',
                padding: '12px',
                borderRadius: '8px',
                maxHeight: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.5',
                border: '1px solid #374151'
              }}>
                {item.input_data || '(Texto não disponível)'}
              </div>
            </div>
            
            {/* TEXTO FORMATADO (se existir) */}
            {item.output_data && (
              <div>
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: '13px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>✅ Resultado:</span>
                  <span style={{ 
                    fontSize: '11px', 
                    backgroundColor: '#065f46',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    color: '#d1fae5'
                  }}>
                    {item.output_data?.length || 0} caracteres
                  </span>
                </div>
                <div style={{
                  color: '#d1d5db',
                  fontSize: '14px',
                  backgroundColor: '#064e3b',
                  padding: '12px',
                  borderRadius: '8px',
                  maxHeight: '80px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '1.5',
                  border: '1px solid #047857'
                }}>
                  {item.output_data.substring(0, 120)}
                  {item.output_data.length > 120 ? '...' : ''}
                </div>
              </div>
            )}
            
            {/* METADADOS (se existirem) */}
            {item.metadata && Object.keys(item.metadata).length > 0 && (
              <div style={{ 
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px dashed #374151',
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap'
              }}>
                {Object.entries(item.metadata).map(([key, value]) => (
                  <span 
                    key={key}
                    style={{
                      fontSize: '11px',
                      backgroundColor: '#1f2937',
                      color: '#9ca3af',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid #374151'
                    }}
                    title={`${key}: ${value}`}
                  >
                    {key}: {value}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* RODAPÉ */}
      <div style={{ 
        marginTop: '20px',
        paddingTop: '15px',
        borderTop: '1px solid #374151',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '13px'
      }}>
        <p style={{ margin: '5px 0' }}>
          Seu histórico é salvo automaticamente a cada uso
        </p>
        <p style={{ margin: '5px 0', fontSize: '12px' }}>
          Os dados são privados e pertencem apenas a você
        </p>
      </div>
    </div>
  );
}