import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  SparklesIcon, TableCellsIcon, DocumentTextIcon, VideoCameraIcon,
  BriefcaseIcon, AcademicCapIcon, PencilSquareIcon, DevicePhoneMobileIcon,
  LanguageIcon, ChatBubbleLeftRightIcon, UserCircleIcon, ClockIcon,
  PhotoIcon, FireIcon
} from '@heroicons/react/24/solid';

// --- DADOS DAS FERRAMENTAS ---
const tools = [
  {
    id: 'image-gen',
    title: 'Gerador de Imagens',
    desc: 'Crie arte digital 8K com IA.',
    path: '/gerar-imagem-completa',
    image: '/img/image-generator.jpg',
    icon: <SparklesIcon style={{ width: '24px', color: 'white' }} />,
    iconBg: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', 
    neonColor: '#fbbf24',
    featured: true 
  },
  {
    id: 'image-prompt', 
    title: 'Prompt de Imagem',
    desc: 'Crie prompts perfeitos.',
    path: '/gerar-imagem',
    image: '/img/image-prompt.jpg',
    icon: <PhotoIcon style={{ width: '24px', color: 'white' }} />,
    iconBg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', 
    neonColor: '#8b5cf6',
  },
  {
    id: 'social-media',
    title: 'Social Media Kit',
    desc: 'Posts virais.',
    path: '/social-media',
    image: '/img/social-media.jpg',
    icon: <DevicePhoneMobileIcon style={{ width: '24px', color: 'white' }} />,
    iconBg: 'linear-gradient(135deg, #ec4899 0%, #be123c 100%)', 
    neonColor: '#ec4899',
  },
  {
    id: 'chat-pdf',
    title: 'Chat com PDF',
    desc: 'Converse com docs.',
    path: '/chat-pdf',
    image: '/img/chat-pdf.jpg',
    icon: <DocumentTextIcon style={{ width: '24px', color: 'white' }} />,
    iconBg: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    neonColor: '#ef4444',
  },
  {
    id: 'spreadsheet',
    title: 'Excel Generator',
    desc: 'Planilhas rápidas.',
    path: '/gerador-planilha',
    image: '/img/excel.jpg',
    icon: <TableCellsIcon style={{ width: '24px', color: 'white' }} />,
    iconBg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    neonColor: '#10b981',
  },
  {
    id: 'translator',
    title: 'Tradutor Corp.',
    desc: 'E-mails formais.',
    path: '/tradutor-corporativo',
    image: '/img/translator.jpg',
    icon: <LanguageIcon style={{ width: '24px', color: 'white' }} />,
    iconBg: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
    neonColor: '#94a3b8',
  },
  {
    id: 'veo',
    title: 'Prompt de Vídeo',
    desc: 'Roteiros VEO/Sora.',
    path: '/gerar-veo3-prompt',
    image: '/img/video-prompt.jpg',
    icon: <VideoCameraIcon style={{ width: '24px', color: 'white' }} />,
    iconBg: 'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)',
    neonColor: '#a78bfa',
  },
  {
    id: 'interview',
    title: 'Simulador Entrevista',
    desc: 'Treine sua vaga.',
    path: '/simulador-entrevista',
    image: '/img/interview.jpg',
    icon: <BriefcaseIcon style={{ width: '24px', color: 'white' }} />,
    iconBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    neonColor: '#3b82f6',
  },
  {
    id: 'study',
    title: 'Guia de Estudo',
    desc: 'Resumos e planos.',
    path: '/gerador-estudos',
    image: '/img/study.jpg',
    icon: <AcademicCapIcon style={{ width: '24px', color: 'white' }} />,
    iconBg: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
    neonColor: '#2dd4bf',
  },
  {
    id: 'cover-letter',
    title: 'Carta Apresentação',
    desc: 'Para currículo.',
    path: '/gerador-carta',
    image: '/img/cover-letter.jpg',
    icon: <PencilSquareIcon style={{ width: '24px', color: 'white' }} />,
    iconBg: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
    neonColor: '#38bdf8',
  },
  {
    id: 'abnt',
    title: 'Formatador ABNT',
    desc: 'Normas automáticas.',
    path: '/agente-abnt',
    image: '/img/abnt.jpg',
    icon: <AcademicCapIcon style={{ width: '24px', color: 'white' }} />,
    iconBg: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    neonColor: '#60a5fa',
  },
  {
    id: 'essay',
    title: 'Corretor Redação',
    desc: 'Nota estilo ENEM.',
    path: '/corretor-redacao',
    image: '/img/essay.jpg',
    icon: <ChatBubbleLeftRightIcon style={{ width: '24px', color: 'white' }} />,
    iconBg: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    neonColor: '#fbbf24',
  },
  {
    id: 'summary',
    title: 'Resumidor Texto',
    desc: 'Resumos precisos.',
    path: '/resumir-texto',
    image: '/img/summary.jpg',
    icon: <DocumentTextIcon style={{ width: '24px', color: 'white' }} />,
    iconBg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    neonColor: '#818cf8',
  }
];

// --- COMPONENTE DO CARD ---
function BentoCard({ tool }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      to={tool.path}
      className={`bento-item item-${tool.id}`} // Classe única para cada item
      style={{
        position: 'relative',
        backgroundColor: '#1f2937',
        borderRadius: '24px',
        border: tool.featured ? '2px solid #f59e0b' : `1px solid ${isHovered ? tool.neonColor : '#374151'}`,
        overflow: 'hidden',
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '25px',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? `0 15px 35px -10px ${tool.neonColor}66` 
          : (tool.featured ? '0 0 25px rgba(245, 158, 11, 0.15)' : '0 4px 6px -1px rgba(0,0,0,0.1)'),
        zIndex: 1,
        width: '100%',
        height: '100%'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* COROA DE DESTAQUE */}
      {tool.featured && (
        <div style={{
          position: 'absolute', top: '20px', left: '20px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
          borderRadius: '50px', padding: '6px 14px',
          color: 'white', fontSize: '0.85rem', fontWeight: 'bold',
          display: 'flex', alignItems: 'center', gap: '6px', zIndex: 10,
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
          border: '1px solid #fcd34d'
        }}>
          <span>👑</span> Destaque
        </div>
      )}

      {/* IMAGEM DE FUNDO */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `url(${tool.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: isHovered ? 0.8 : 0.6,
        transition: 'all 0.5s ease',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        zIndex: 0
      }} />
      
      {/* GRADIENTE */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(to top, #111827 10%, rgba(17, 24, 39, 0.7) 60%, rgba(17, 24, 39, 0.3) 100%)',
        zIndex: 1
      }} />

      {/* CONTEÚDO */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: tool.iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '15px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
        }}>
          {tool.icon}
        </div>

        <h3 style={{ 
          color: 'white', fontSize: '1.4rem', fontWeight: 'bold', margin: '0 0 5px 0',
          textShadow: '0 2px 10px rgba(0,0,0,0.9)', textDecoration: 'none'
        }}>
          {tool.title}
        </h3>
        
        <p style={{ 
          color: '#e5e7eb', fontSize: '0.95rem', margin: 0, fontWeight: '500', 
          textShadow: '0 2px 5px rgba(0,0,0,0.9)', textDecoration: 'none'
        }}>
          {tool.desc}
        </p>

        <div style={{
          marginTop: '15px',
          color: tool.featured ? '#fbbf24' : tool.neonColor,
          fontWeight: 'bold', fontSize: '0.85rem',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.3s ease',
          display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none'
        }}>
          Acessar Ferramenta <span>→</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
        if (data) setIsPro(data.is_pro);
      }
    };
    getUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleSubscribe = async () => {
    if (!user) return alert("Faça login primeiro!");
    alert("Redirecionando...");
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f1016', color: 'white', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      
      {/* CSS GRID DEFINITIVO - SEM SOBREPOSIÇÃO */}
      <style>{`
        .bento-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px;
          width: 100%;
          box-sizing: border-box;
        }
        
        /* Define altura padrão para cards no mobile */
        .bento-item { 
          min-height: 220px; 
          box-sizing: border-box;
        }

        @media (min-width: 1024px) {
          .bento-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(5, 240px);
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px 40px;
          }

          /* === MAPA DE POSIÇÕES ABSOLUTAS === */
          
          /* Linha 1-2: Big Card (2x2) */
          .item-image-gen { 
            grid-column: 1 / 3; 
            grid-row: 1 / 3; 
          }
          
          /* Linha 1: Wide Card (2x1) - Prompt de Imagem */
          .item-image-prompt { 
            grid-column: 3 / 5; 
            grid-row: 1 / 2; 
          }
          
          /* Linha 2-3: Tall Card (1x2) - Social Media */
          .item-social-media { 
            grid-column: 3 / 4; 
            grid-row: 2 / 4; 
          }
          
          /* Linha 2: Normal Card - Chat PDF */
          .item-chat-pdf { 
            grid-column: 4 / 5; 
            grid-row: 2 / 3; 
          }
          
          /* Linha 3: Wide Card (2x1) - Excel */
          .item-spreadsheet { 
            grid-column: 1 / 3; 
            grid-row: 3 / 4; 
          }
          
          /* Linha 3: Normal Card - Tradutor */
          .item-translator { 
            grid-column: 4 / 5; 
            grid-row: 3 / 4; 
          }
          
          /* Linha 4: Wide Card (2x1) - Vídeo */
          .item-veo { 
            grid-column: 1 / 3; 
            grid-row: 4 / 5; 
          }
          
          /* Linha 4: Normal Card - Entrevista */
          .item-interview { 
            grid-column: 3 / 4; 
            grid-row: 4 / 5; 
          }
          
          /* Linha 4: Normal Card - Estudo */
          .item-study { 
            grid-column: 4 / 5; 
            grid-row: 4 / 5; 
          }
          
          /* Linha 5: 4 Normal Cards */
          .item-cover-letter { 
            grid-column: 1 / 2; 
            grid-row: 5 / 6; 
          }
          
          .item-abnt { 
            grid-column: 2 / 3; 
            grid-row: 5 / 6; 
          }
          
          .item-essay { 
            grid-column: 3 / 4; 
            grid-row: 5 / 6; 
          }
          
          .item-summary { 
            grid-column: 4 / 5; 
            grid-row: 5 / 6; 
          }
          
          /* Garantir que os cards se ajustem ao container */
          .bento-item {
            width: 100%;
            height: 100%;
          }
        }
        
        /* Adiciona media query para telas muito grandes */
        @media (min-width: 1600px) {
          .bento-grid {
            max-width: 1600px;
            grid-template-rows: repeat(5, 260px);
          }
        }
      `}</style>

      {/* NAVBAR */}
      <div style={{ 
        padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(15, 16, 22, 0.95)', 
        backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100, width: '100%', boxSizing: 'border-box'
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #22d3ee 0%, #7e22ce 100%)', 
              width: '38px', height: '38px', borderRadius: '10px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
            }}>⚡</div>
            <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white', textDecoration: 'none' }}>Adapta IA</span>
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user && (
            <Link to="/meu-historico" style={{ 
               color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
               fontSize: '0.9rem', padding: '6px 12px', borderRadius: '50px', backgroundColor: '#1f2937', border: '1px solid #374151'
            }}>
              <ClockIcon style={{ width: '16px', color: '#22d3ee' }} /> 
              <span style={{display: windowWidth < 768 ? 'none' : 'inline'}}>Histórico</span>
            </Link>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               {!isPro ? (
                  <button onClick={handleSubscribe} style={{ 
                    background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)', border: 'none', 
                    padding: '8px 20px', borderRadius: '50px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem',
                    boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)'
                  }}>Assinar PRO</button>
               ) : (
                  <span style={{ background: '#3b0764', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', color: '#d8b4fe', border: '1px solid #a855f7' }}>PRO</span>
               )}
               <button onClick={handleLogout} title="Sair" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <UserCircleIcon style={{ width: '36px', color: '#6b7280' }} />
               </button>
            </div>
          ) : (
            <Link to="/login" style={{ background: '#fff', color: '#000', padding: '8px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 'bold' }}>Login</Link>
          )}
        </div>
      </div>

      {/* HERO SECTION */}
      <div style={{ textAlign: 'center', paddingTop: '60px', paddingBottom: '40px', paddingLeft: '20px', paddingRight: '20px' }}>
        
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '8px 20px', borderRadius: '50px', 
          backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#fbbf24', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '30px', cursor: 'default',
          boxShadow: '0 0 20px rgba(245, 158, 11, 0.1)'
        }}>
          <FireIcon style={{ width: '20px' }} />
          <span>Novo: Crie Imagens Ultra Realistas 8K</span>
        </div>
        
        <h1 style={{ 
          fontSize: windowWidth < 768 ? '2.5rem' : '4.5rem', fontWeight: '800', marginBottom: '20px', lineHeight: '1.1',
          background: 'linear-gradient(to right, #c084fc, #f472b6, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
        }}>
          Sua Criatividade,<br/>Potencializada.
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
          Uma suíte completa de ferramentas de Inteligência Artificial para criadores, estudantes e profissionais.
        </p>
      </div>

      {/* GRID CONTAINER */}
      <div className="bento-grid">
        {tools.map((tool) => (
          <BentoCard key={tool.id} tool={tool} />
        ))}
      </div>

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', color: '#6b7280', padding: '60px 20px', borderTop: '1px solid #1f2937', marginTop: '60px' }}>
        <p>&copy; {new Date().getFullYear()} Adapta IA. Todas as ferramentas em um só lugar.</p>
      </footer>

    </div>
  );
}