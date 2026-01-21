// src/config.js

/**
 * CONFIGURAÇÕES CENTRALIZADAS DO ADAPTA IA
 */

// ==================================================================
// 👇 AQUI É A CHAVE MESTRA: ESCOLHA ONDE O SITE VAI CONECTAR
// ==================================================================

// 🟢 MODO LOCAL (Ativado: Use este para testar no seu PC agora)
// const API_BASE_URL = 'http://localhost:5000';

// ☁️ MODO NUVEM (Desativado: Use este quando for enviar para a Vercel)
const API_BASE_URL = 'https://meu-gerador-backend.onrender.com';

// ==================================================================

// Configurações principais
const CONFIG = {
  // URL base da API (Definida acima)
  API_BASE_URL: API_BASE_URL,
  
  // Nome do projeto
  APP_NAME: 'Adapta IA',
  APP_VERSION: '1.0.0',
  
  // URLs de redirecionamento
  FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',
  
  // Supabase
  SUPABASE: {
    URL: process.env.REACT_APP_SUPABASE_URL || 'https://orxwfidvidpuksdfgeip.supabase.co',
    ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeHdmaWR2aWRwdWtzZGZnZWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTAzNzEsImV4cCI6MjA3OTA2NjM3MX0.GllkQAAIGFNWNq9NPbvZq-9uNA2pBCjOyKD21hcM0wg'
  },
  
  // Todos os endpoints da API
  ENDPOINTS: {
    // Autenticação & Usuário
    CREATE_CHECKOUT_SESSION: `${API_BASE_URL}/create-checkout-session`,
    CREATE_PORTAL_SESSION: `${API_BASE_URL}/create-portal-session`,
    WEBHOOK: `${API_BASE_URL}/webhook`,
    
    // Histórico
    SAVE_HISTORY: `${API_BASE_URL}/save-history`,
    GET_HISTORY: `${API_BASE_URL}/get-history`,
    DELETE_HISTORY_ITEM: `${API_BASE_URL}/delete-history-item`,
    
    // Ferramentas de Imagem
    GENERATE_IMAGE: `${API_BASE_URL}/generate-image`,
    GENERATE_PROMPT: `${API_BASE_URL}/generate-prompt`,
    GENERATE_VEO3_PROMPT: `${API_BASE_URL}/generate-veo3-prompt`,
    
    // Ferramentas de Texto
    SUMMARIZE_TEXT: `${API_BASE_URL}/summarize-text`,
    SUMMARIZE_VIDEO: `${API_BASE_URL}/summarize-video`,
    FORMAT_ABNT: `${API_BASE_URL}/format-abnt`,
    DOWNLOAD_DOCX: `${API_BASE_URL}/download-docx`,
    CORPORATE_TRANSLATOR: `${API_BASE_URL}/corporate-translator`,
    GENERATE_COVER_LETTER: `${API_BASE_URL}/generate-cover-letter`,
    
    // Ferramentas de Produtividade
    GENERATE_SPREADSHEET: `${API_BASE_URL}/generate-spreadsheet`,
    GENERATE_SOCIAL_MEDIA: `${API_BASE_URL}/generate-social-media`,
    
    // Ferramentas Educacionais
    CORRECT_ESSAY: `${API_BASE_URL}/correct-essay`,
    MOCK_INTERVIEW: `${API_BASE_URL}/mock-interview`,
    GENERATE_STUDY_MATERIAL: `${API_BASE_URL}/generate-study-material`,
    
    // RAG (PDF)
    UPLOAD_DOCUMENT: `${API_BASE_URL}/upload-document`,
    ASK_DOCUMENT: `${API_BASE_URL}/ask-document`
  },
  
  // Limites e configurações das ferramentas
  LIMITS: {
    MAX_TEXT_LENGTH: 15000,
    MIN_TEXT_LENGTH: 50,
    MAX_PROMPT_LENGTH: 500,
    MIN_PROMPT_LENGTH: 10,
    MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
    REQUEST_TIMEOUT: 30000 // 30 segundos
  },
  
  // Créditos por ferramenta
  CREDITS_PER_TOOL: {
    IMAGE_GENERATOR: 2,
    IMAGE_PROMPT: 1,
    VEO3_PROMPT: 1,
    TEXT_SUMMARY: 1,
    VIDEO_SUMMARY: 1,
    ABNT_FORMATTER: 1,
    SPREADSHEET: 1,
    SOCIAL_MEDIA: 1,
    CORPORATE_TRANSLATOR: 1,
    ESSAY_CORRECTOR: 1,
    MOCK_INTERVIEW: 1,
    STUDY_MATERIAL: 1,
    COVER_LETTER: 1,
    UPLOAD_DOCUMENT: 1,
    ASK_DOCUMENT: 0
  },
  
  // Preços e planos
  PRICING: {
    PRO_MONTHLY: 19.99,
    PRO_YEARLY: 199.99,
    CREDITS_PACK: {
      10: 9.99,
      50: 39.99,
      100: 69.99
    }
  },
  
  // Configurações de UI
  UI: {
    THEME: 'dark',
    PRIMARY_COLOR: '#7e22ce',
    SECONDARY_COLOR: '#a855f7',
    SUCCESS_COLOR: '#10b981',
    ERROR_COLOR: '#ef4444',
    WARNING_COLOR: '#f59e0b'
  },
  
  IS_DEVELOPMENT: true, // Forçamos development aqui também
  IS_PRODUCTION: false,
  
  LOG_LEVEL: 'warn'
};

// Funções utilitárias
export const getEndpoint = (endpointName) => {
  return CONFIG.ENDPOINTS[endpointName] || `${API_BASE_URL}/${endpointName}`;
};

export const getCreditsForTool = (toolName) => {
  return CONFIG.CREDITS_PER_TOOL[toolName] || 1;
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const validateTextLength = (text, tool) => {
  const maxLength = CONFIG.LIMITS.MAX_TEXT_LENGTH;
  const minLength = CONFIG.LIMITS.MIN_TEXT_LENGTH;
  
  if (text.length < minLength) {
    return { valid: false, message: `Texto muito curto. Mínimo ${minLength} caracteres.` };
  }
  
  if (text.length > maxLength) {
    return { 
      valid: false, 
      message: `Texto muito longo. Máximo ${maxLength} caracteres.` 
    };
  }
  
  return { valid: true, message: '' };
};

// Exports
export const API = CONFIG.ENDPOINTS;
export const LIMITS = CONFIG.LIMITS;
export const CREDITS = CONFIG.CREDITS_PER_TOOL;
export const COLORS = CONFIG.UI;

export default CONFIG;