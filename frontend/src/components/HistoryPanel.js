import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  TrashIcon, 
  EyeIcon,
  ClockIcon,
  XMarkIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/solid';

export default function HistoryPanel({ toolType, isOpen = true, onClose = null }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user && toolType) {
        loadHistory(user.id);
      }
    };
    
    getUserData();
  }, [toolType]);

  const loadHistory = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch('https://meu-gerador-backend.onrender.com/get-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId,
          tool_type: toolType,
          limit: 10
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryItem = async (itemId) => {
    if (!window.confirm('Excluir do histórico?')) return;
    
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
        setHistory(prev => prev.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Erro ao excluir item:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getToolIcon = () => {
    const icons = {
      'image': '🖼️',
      'spreadsheet': '📊',
      'social': '📱',
      'abnt': '📝',
      'translation': '👔',
      'essay': '📚',
      'interview': '💼',
      'study': '🧠',
      'cover-letter': '✉️',
      'video-prompt': '🎬',
      'text-summary': '📋',
      'chat-pdf': '📄'
    };
    return icons[toolType] || '📝';
  };

  const handleUseHistory = (inputData) => {
    // Dispara evento customizado para a página principal usar
    const event = new CustomEvent('useHistoryItem', { 
      detail: { text: inputData } 
    });
    window.dispatchEvent(event);
    
    // Fecha o item expandido
    setExpandedItem(null);
  };

  if (!isOpen || !toolType) return null;

  if (!user) {
    return (
      <div className="w-80 bg-gray-800 border-l border-gray-700 h-full overflow-y-auto">
        <div className="p-4 text-center">
          <p className="text-gray-400 text-sm">Faça login para ver histórico</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 h-full overflow-y-auto flex flex-col">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-purple-400" />
          <h3 className="font-semibold text-white text-sm">
            Histórico • {getToolIcon()} 
            <span className="ml-2 text-gray-400">
              {toolType === 'image' ? 'Imagens' :
               toolType === 'spreadsheet' ? 'Planilhas' :
               toolType === 'social' ? 'Social' :
               toolType.charAt(0).toUpperCase() + toolType.slice(1)}
            </span>
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
            title="Fechar histórico"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* LISTA */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-3 text-gray-400 text-sm">Carregando...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-gray-400 text-sm">Nenhuma atividade</p>
            <p className="text-gray-500 text-xs mt-1">Use a ferramenta para começar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {history.map((item, index) => {
              const isExpanded = expandedItem === item.id;
              const isToday = formatDate(item.created_at) === 'Hoje';
              
              return (
                <div key={item.id} className="hover:bg-gray-750 transition-colors">
                  {/* CABEÇALHO DO ITEM */}
                  <div 
                    className="p-3 cursor-pointer"
                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                            {isToday ? 'Hoje' : formatDate(item.created_at)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTime(item.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm truncate">
                          {item.input_data.length > 60 
                            ? `${item.input_data.substring(0, 60)}...` 
                            : item.input_data}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {!isExpanded && (
                          <ArrowsPointingOutIcon className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CONTEÚDO EXPANDIDO */}
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-gray-700 pt-3">
                      <div className="mb-3">
                        <div className="text-gray-500 text-xs mb-1">Entrada:</div>
                        <div className="bg-gray-900 p-3 rounded border border-gray-700">
                          <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">
                            {item.input_data}
                          </p>
                        </div>
                      </div>

                      {item.output_data && (
                        <div className="mb-3">
                          <div className="text-green-500 text-xs mb-1">Resultado:</div>
                          <div className="bg-gray-900 p-3 rounded border border-gray-700">
                            <div className="text-gray-300 text-sm break-words">
                              {item.output_data.length > 150 
                                ? `${item.output_data.substring(0, 150)}...` 
                                : item.output_data}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AÇÕES */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUseHistory(item.input_data)}
                          className="flex-1 px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium rounded transition-colors"
                        >
                          Usar Novamente
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(item.id)}
                          className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700 text-red-300 text-sm font-medium rounded transition-colors"
                          title="Excluir"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-gray-700 bg-gray-900">
        <div className="text-center text-xs text-gray-500">
          {history.length} itens no histórico
        </div>
        <button
          onClick={() => loadHistory(user.id)}
          className="w-full mt-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded transition-colors"
        >
          ↻ Atualizar
        </button>
      </div>
    </div>
  );
}

// Função auxiliar para salvar histórico (usar nas ferramentas)
export const saveHistoryItem = async (user, toolType, toolName, input, output = '', metadata = {}) => {
  if (!user || !toolType) return false;
  
  const historyData = {
    user_id: user.id,
    tool_type: toolType,
    tool_name: toolName,
    input_data: input.substring(0, 1000),
    output_data: output.substring(0, 2000),
    metadata: metadata
  };
  
  try {
    const response = await fetch('https://meu-gerador-backend.onrender.com/save-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(historyData)
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Erro ao salvar histórico:', error);
    return false;
  }
};