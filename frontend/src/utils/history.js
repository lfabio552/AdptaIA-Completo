// src/utils/history.js
export const saveHistoryItem = async (user, toolType, toolName, input, output = '', metadata = {}) => {
  if (!user || !user.id) {
    console.error('❌ saveHistoryItem: Usuário não encontrado');
    return false;
  }

  try {
    const historyData = {
      user_id: user.id,
      tool_type: toolType,
      tool_name: toolName,
      input_data: typeof input === 'string' ? input.substring(0, 1000) : JSON.stringify(input).substring(0, 1000),
      output_data: typeof output === 'string' ? output.substring(0, 2000) : JSON.stringify(output).substring(0, 2000),
      metadata: metadata
    };

    console.log('📤 Salvando histórico:', { 
      user_id: user.id, 
      tool_type: toolType,
      input_length: historyData.input_data.length 
    });

    const response = await fetch('https://meu-gerador-backend.onrender.com/save-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(historyData)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Histórico salvo! ID: ${data.history_id}`);
      return true;
    } else {
      console.error('❌ Erro do servidor:', data.error);
      return false;
    }

  } catch (error) {
    console.error('❌ Erro ao salvar histórico:', error);
    return false;
  }
};