// src/utils/saveToHistory.js
import { saveHistoryItem } from './history';

export const saveToHistory = async (user, toolConfig, input, output, metadata = {}) => {
  try {
    if (!user) {
      console.warn('⚠️ Usuário não autenticado, histórico não salvo');
      return false;
    }

    const saved = await saveHistoryItem(
      user,
      toolConfig.type,
      toolConfig.name,
      input,
      output,
      {
        ...metadata,
        credits_used: toolConfig.credits || 1,
        timestamp: new Date().toISOString()
      }
    );

    if (saved) {
      console.log(`✅ Histórico salvo: ${toolConfig.name}`);
      // Dispara evento para atualizar UI
      window.dispatchEvent(new CustomEvent('historyUpdated', {
        detail: { toolType: toolConfig.type }
      }));
    }

    return saved;
  } catch (error) {
    console.error('❌ Erro ao salvar histórico:', error);
    return false;
  }
};

// Configurações pré-definidas para cada ferramenta
export const TOOL_CONFIGS = {
  // Imagens
  IMAGE_PROMPT: { type: 'image', name: 'Gerador de Prompt para Imagens', credits: 1 },
  IMAGE_GENERATE: { type: 'image', name: 'Gerador de Imagens (SDXL)', credits: 2 },
  VEO3_PROMPT: { type: 'video-prompt', name: 'Gerador de Prompts para Vídeo', credits: 1 },
  
  // Texto
  TEXT_SUMMARY: { type: 'text-summary', name: 'Resumidor de Textos', credits: 1 },
  VIDEO_SUMMARY: { type: 'video-summary', name: 'Resumidor de Vídeos', credits: 1 },
  ABNT_FORMAT: { type: 'abnt', name: 'Formatador ABNT', credits: 1 },
  CORPORATE_TRANSLATE: { type: 'translation', name: 'Tradutor Corporativo', credits: 1 },
  COVER_LETTER: { type: 'cover-letter', name: 'Gerador de Carta de Apresentação', credits: 1 },
  
  // Produtividade
  SPREADSHEET: { type: 'spreadsheet', name: 'Gerador de Planilhas', credits: 1 },
  SOCIAL_MEDIA: { type: 'social', name: 'Gerador de Social Media', credits: 1 },
  
  // Educacional
  ESSAY_CORRECT: { type: 'essay', name: 'Corretor de Redação', credits: 1 },
  INTERVIEW_SIM: { type: 'interview', name: 'Simulador de Entrevista', credits: 1 },
  STUDY_MATERIAL: { type: 'study', name: 'Gerador de Material de Estudo', credits: 1 },
  
  // RAG
  CHAT_PDF: { type: 'chat-pdf', name: 'Chat com PDF', credits: 0 } // Primeira pergunta grátis
};