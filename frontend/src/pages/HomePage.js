import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import { 
  UserCircleIcon, 
  ClockIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/solid';
import { supabase } from '../supabaseClient'; 

// --- ESTILOS GLOBAIS ---
const globalStyles = `
  .tool-card {
    transition: all 0.3s ease;
    border: 1px solid #374151;
  }
  .tool-card:hover {
    transform: translateY(-5px);
    border-color: #a855f7;
    box-shadow: 0 10px 30px -10px rgba(168, 85, 247, 0.3);
  }
  .gradient-text {
    background: linear-gradient(to right, #c084fc, #22d3ee);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .bg-glow {
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(126,34,206,0.15) 0%, rgba(0,0,0,0) 70%);
    top: -200px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 0;
    pointer-events: none;
  }
  /* Garante que o slider não corte a sombra ou o padding */
  .slick-list {
    margin: 0 -15px; /* Compensa o padding dos itens */
    padding: 20px 0 !important; /* Espaço para a sombra do hover não cortar */
  }
  .slick-slide > div {
    padding: 0 15px; /* O ESPAÇAMENTO ENTRE CARDS ACONTECE AQUI */
  }
`;

// --- SETAS DO CARROSSEL ---
function SampleNextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ 
        ...style, 
        display: "flex", 
        background: "#1f2937", 
        border: "1px solid #4b5563",
        borderRadius: '50%', 
        width: '45px', 
        height: '45px', 
        right: '-10px', // Ajustado
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 50, 
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)', 
        cursor: 'pointer' 
      }}
      onClick={onClick}
    />
  );
}

function SamplePrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ 
        ...style, 
        display: "flex", 
        background: "#1f2937", 
        border: "1px solid #4b5563",
        borderRadius: '50%', 
        width: '45px', 
        height: '45px', 
        left: '-10px', // Ajustado
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 50, 
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)', 
        cursor: 'pointer' 
      }}
      onClick={onClick}
    />
  );
}

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(null);
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
        const { data } = await supabase.from('profiles').select('credits, is_pro').eq('id', user.id).single();
        if (data) {
            setCredits(data.credits);
            setIsPro(data.is_pro);
        }
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
    try {
      const response = await fetch('https://meu-gerador-backend.onrender.com/create-checkout-session', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, email: user.email }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else alert("Erro: " + data.error);
    } catch (error) { alert("Erro: " + error.message); }
  };

  // --- DADOS DAS FERRAMENTAS ---
  const featuredTools = [
    { id: 7, title: "Social Media Kit", description: "Posts virais para Insta, LinkedIn e Twitter.", imageUrl: "/img/social-media.jpg", link: "/social-media" },
    { id: 9, title: "Simulador Entrevista", description: "Treine com perguntas reais do RH.", imageUrl: "/img/interview.jpg", link: "/simulador-entrevista" },
    { id: 11, title: "Carta de Apresentação", description: "Cartas persuasivas para seu currículo.", imageUrl: "/img/cover-letter.jpg", link: "/gerador-carta" },
    { id: 5, title: "Chat com PDF (RAG)", description: "Converse com seus documentos.", imageUrl: "/img/chat-pdf.jpg", link: "/chat-pdf" },
  ];

  const academicTools = [
    { id: 10, title: "Gerador de Estudos", description: "Quizzes e Flashcards automáticos.", imageUrl: "/img/study.jpg", link: "/gerador-estudos" },
    { id: 2, title: "Formatador ABNT", description: "Formate trabalhos nas normas ABNT.", imageUrl: "/img/abnt.jpg", link: "/agente-abnt" },
    { id: 8, title: "Corretor ENEM", description: "Nota e correção detalhada.", imageUrl: "/img/essay.jpg", link: "/corretor-redacao" },
  ];

  const creativeTools = [
    { id: 1, title: "Prompt de Imagem", description: "Crie prompts para Midjourney e DALL-E.", imageUrl: "/img/image-prompt.jpg", link: "/gerar-imagem" },
    { id: 4, title: "Prompt de Vídeo", description: "Roteiros técnicos para VEO 3 e Sora.", imageUrl: "/img/video-prompt.jpg", link: "/gerar-veo3-prompt" },
    { id: 13, title: "Resumidor de Textos", description: "Resuma artigos e documentos longos.", imageUrl: "/img/summary.jpg", link: "/resumir-texto" },
    { id: 14, title: "Gerador de Imagens", description: "Crie imagens com Stable Diffusion.", imageUrl: "/img/image-generator.jpg", link: "/gerar-imagem-completa" },
  ];

  const productivityTools = [
    { id: 6, title: "Tradutor Corporativo", description: "Transforme informal em e-mail executivo.", imageUrl: "/img/translator.jpg", link: "/tradutor-corporativo" },
    { id: 3, title: "Gerador de Planilhas", description: "Crie Excel (.xlsx) via chat.", imageUrl: "/img/excel.jpg", link: "/gerador-planilha" },
  ];
  
  // CONFIGURAÇÃO DO CARROSSEL
  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: windowWidth < 480 ? 1 : windowWidth < 768 ? 2 : windowWidth < 1200 ? 3 : 4,
    slidesToScroll: 1,
    nextArrow: windowWidth < 768 ? <></> : <SampleNextArrow />,
    prevArrow: windowWidth < 768 ? <></> : <SamplePrevArrow />,
  };

  // Componente de Seção
  const ToolSection = ({ title, tools, icon, color }) => (
    <div style={{ marginBottom: '60px', position: 'relative', zIndex: 1 }}>
      <h3 style={{ 
        fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '25px', 
        display: 'flex', alignItems: 'center', gap: '12px', color: '#fff'
      }}>
        <span style={{ color: color }}>{icon}</span> {title}
      </h3>
      
      <Slider {...settings}>
        {tools.map((tool) => (
          // O padding aqui é crucial, mas o CSS global .slick-slide > div reforça isso
          <div key={tool.id}> 
            
            {/* O CARD */}
            <div className="tool-card" style={{ 
              backgroundColor: '#1f2937', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              height: '400px', 
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative'
            }}>
              
              {/* Imagem (Altura Fixa) */}
              <div style={{ height: '160px', overflow: 'hidden', backgroundColor: '#000' }}>
                <img 
                  src={tool.imageUrl} 
                  alt={tool.title} 
                  onError={(e) => { e.target.src = 'https://placehold.co/600x400/111827/4b5563?text=Ferramenta'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: '0.85', transition: 'opacity 0.3s' }} 
                  onMouseOver={(e) => e.target.style.opacity = '1'}
                  onMouseOut={(e) => e.target.style.opacity = '0.85'}
                />
              </div>
              
              {/* Conteúdo */}
              <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px', color: '#fff' }}>
                  {tool.title}
                </h4>
                <p style={{ 
                  color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '20px',
                  display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {tool.description}
                </p>
                
                {/* Botão sempre embaixo */}
                <div style={{ marginTop: 'auto' }}>
                  <Link 
                    to={tool.link} 
                    style={{ 
                      display: 'block', width: '100%', 
                      background: 'linear-gradient(90deg, #7e22ce 0%, #6b21a8 100%)', 
                      color: 'white', fontWeight: 'bold', padding: '10px', 
                      borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontSize: '0.9rem',
                      border: '1px solid #9333ea'
                    }}
                  >
                    Acessar
                  </Link>
                </div>
              </div>

            </div>
          </div>
        ))}
      </Slider>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f1016', color: 'white', fontFamily: "'Inter', sans-serif", overflowX: 'hidden', position: 'relative' }}>
      <style>{globalStyles}</style>
      
      {/* Background Blob */}
      <div className="bg-glow"></div>

      {/* NAVBAR */}
      <div style={{ 
        padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(15, 16, 22, 0.8)', 
        backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100
      }}>
        
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #22d3ee 0%, #7e22ce 100%)', 
              width: '38px', height: '38px', borderRadius: '10px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
            }}>⚡</div>
            <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>Adapta IA</span>
        </Link>
        
        {windowWidth > 768 && (
          <div style={{ display: 'flex', gap: '25px' }}>
            <Link to="/precos" style={{ color: '#d1d5db', textDecoration: 'none', fontWeight: '500', fontSize: '0.95rem' }}>
              Planos e Preços
            </Link>
            <Link to="/exemplos" style={{ color: '#d1d5db', textDecoration: 'none', fontWeight: '500', fontSize: '0.95rem' }}>
              Exemplos
            </Link>
            <a href="https://wa.me/" target="_blank" rel="noreferrer" style={{ color: '#d1d5db', textDecoration: 'none', fontWeight: '500', fontSize: '0.95rem' }}>
              Suporte
            </a>
          </div>
        )}

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
                  }}>
                    Assinar PRO
                  </button>
               ) : (
                  <span style={{ background: '#3b0764', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', color: '#d8b4fe', border: '1px solid #a855f7' }}>
                    MEMBRO PRO
                  </span>
               )}
               <button onClick={handleLogout} title="Sair" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <UserCircleIcon style={{ width: '36px', color: '#6b7280', transition: 'color 0.2s' }} />
               </button>
            </div>
          ) : (
            <Link to="/login" style={{ 
              background: '#fff', color: '#000', padding: '8px 24px', borderRadius: '50px', 
              textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem'
            }}>
              Login
            </Link>
          )}
        </div>
      </div>

      {/* HERO SECTION */}
      <div style={{ textAlign: 'center', padding: windowWidth < 768 ? '60px 20px' : '100px 20px', position: 'relative', zIndex: 1 }}>
        <span style={{ 
           backgroundColor: 'rgba(34, 211, 238, 0.1)', color: '#22d3ee', padding: '5px 15px', 
           borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid rgba(34, 211, 238, 0.2)', marginBottom: '20px', display: 'inline-block'
        }}>
           ✨ Novo Gerador de Imagens Disponível
        </span>
        <h1 style={{ 
          fontSize: windowWidth < 768 ? '2.5rem' : '4.5rem', fontWeight: '800', marginBottom: '25px', lineHeight: '1.1', color: '#fff'
        }}>
          Sua Produtividade <br/> 
          <span className="gradient-text">No Próximo Nível</span>
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '1.2rem', maxWidth: '650px', margin: '0 auto 40px', lineHeight: '1.6' }}>
          De estudantes a CEOs. Use nossa inteligência artificial para escrever, criar imagens, vídeos e planilhas em segundos.
        </p>
        
        {!user && (
           <Link to="/login" style={{ 
             background: 'linear-gradient(90deg, #7e22ce 0%, #22d3ee 100%)', 
             padding: '15px 40px', borderRadius: '50px', color: 'white', fontWeight: 'bold', 
             textDecoration: 'none', fontSize: '1.1rem', boxShadow: '0 10px 30px -5px rgba(126, 34, 206, 0.5)',
             display: 'inline-block'
           }}>
             Começar Gratuitamente
           </Link>
        )}
      </div>
      
      {/* SEÇÕES DE FERRAMENTAS */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px 80px' }}>
        
        <ToolSection 
          title="Destaques da Semana" 
          tools={featuredTools} 
          icon={<SparklesIcon style={{ width: '28px' }} />}
          color="#facc15" 
        />

        <ToolSection 
          title="Estúdio Criativo" 
          tools={creativeTools} 
          icon={<span style={{fontSize: '24px'}}>🎨</span>}
          color="#22d3ee" 
        />

        <ToolSection 
          title="Produtividade & Business" 
          tools={productivityTools} 
          icon={<CurrencyDollarIcon style={{ width: '28px' }} />}
          color="#4ade80" 
        />

        <ToolSection 
          title="Área Acadêmica" 
          tools={academicTools} 
          icon={<DocumentTextIcon style={{ width: '28px' }} />}
          color="#f472b6" 
        />

      </div>
      
      {/* FOOTER */}
      <footer style={{ 
        textAlign: 'center', color: '#6b7280', padding: '60px 20px', 
        borderTop: '1px solid #1f2937', backgroundColor: '#0f1016'
      }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
           <Link to="/termos" style={{ color: '#9ca3af', textDecoration: 'none' }}>Termos</Link>
           <Link to="/privacidade" style={{ color: '#9ca3af', textDecoration: 'none' }}>Privacidade</Link>
           <Link to="/precos" style={{ color: '#9ca3af', textDecoration: 'none' }}>Preços</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Adapta IA. A tecnologia do futuro, hoje.</p>
      </footer>
    </div>
  );
}