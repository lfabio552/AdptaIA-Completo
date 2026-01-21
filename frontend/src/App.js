import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// --- IMPORTAÇÕES DE CSS ---
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

// --- IMPORTANDO O SEGURANÇA (CATRACA) ---
import ProtectedRoute from './components/ProtectedRoute'; 

// --- IMPORTANDO AS PÁGINAS ---
import Home from './pages/HomePage';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';
import TermsAndPrivacy from './pages/TermsAndPrivacy'; // <--- IMPORT NOVO
import PricingPage from './pages/PricingPage';

// Ferramentas
import ImagePromptGenerator from './pages/ImagePromptGenerator';
import Veo3PromptGenerator from './pages/Veo3PromptGenerator';
import VideoSummarizer from './pages/VideoSummarizer';
import AgenteABNT from './pages/AgenteABNT';
import SpreadsheetGenerator from './pages/SpreadsheetGenerator';
import ChatPDF from './pages/ChatPDF';
import CorporateTranslator from './pages/CorporateTranslator'; 
import SocialMediaGenerator from './pages/SocialMediaGenerator';
import EssayCorrector from './pages/EssayCorrector';
import InterviewSimulator from './pages/InterviewSimulator';
import StudyMaterialGenerator from './pages/StudyMaterialGenerator';
import CoverLetterGenerator from './pages/CoverLetterGenerator';
import TextSummarizer from './pages/TextSummarizer';
import ImageGenerator from './pages/ImageGenerator';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        
        <main className="flex-grow">
          <Routes>
            
            {/* --- ROTAS PÚBLICAS --- */}
            <Route path="/" element={<Home />} /> 
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
	    <Route path="/precos" element={<PricingPage />} />
            
            {/* NOVA ROTA DE TERMOS */}
            <Route path="/termos" element={<TermsAndPrivacy />} />

            {/* --- ROTAS PROTEGIDAS (Ferramentas) --- */}
            
            <Route path="/gerar-imagem" element={<ProtectedRoute><ImagePromptGenerator /></ProtectedRoute>} />
            <Route path="/gerar-veo3-prompt" element={<ProtectedRoute><Veo3PromptGenerator /></ProtectedRoute>} />
            <Route path="/resumir-video" element={<ProtectedRoute><VideoSummarizer /></ProtectedRoute>} />
            <Route path="/agente-abnt" element={<ProtectedRoute><AgenteABNT /></ProtectedRoute>} />
            <Route path="/gerador-planilha" element={<ProtectedRoute><SpreadsheetGenerator /></ProtectedRoute>} />
            <Route path="/chat-pdf" element={<ProtectedRoute><ChatPDF /></ProtectedRoute>} />
            <Route path="/tradutor-corporativo" element={<ProtectedRoute><CorporateTranslator /></ProtectedRoute>} />
            <Route path="/social-media" element={<ProtectedRoute><SocialMediaGenerator /></ProtectedRoute>} />
            <Route path="/corretor-redacao" element={<ProtectedRoute><EssayCorrector /></ProtectedRoute>} />
            <Route path="/simulador-entrevista" element={<ProtectedRoute><InterviewSimulator /></ProtectedRoute>} />
            <Route path="/gerador-estudos" element={<ProtectedRoute><StudyMaterialGenerator /></ProtectedRoute>} />
            <Route path="/gerador-carta" element={<ProtectedRoute><CoverLetterGenerator /></ProtectedRoute>} />
	    <Route path="/resumir-texto" element={<ProtectedRoute><TextSummarizer /></ProtectedRoute>} />
	    <Route path="/gerar-imagem-completa" element={<ProtectedRoute><ImageGenerator /></ProtectedRoute>} />
            
            {/* Rotas de placeholder */}
            <Route path="/chat" element={<div>Página de Chat em breve!</div>} />

          </Routes>
        </main>

        <footer className="bg-gray-800 p-4 text-center text-gray-400 mt-8">
          <p>&copy; {new Date().getFullYear()} Meu App de IA. Todos os direitos reservados.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;