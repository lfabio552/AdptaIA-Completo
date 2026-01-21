import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

export default function PricingPage() {
  const [user, setUser] = React.useState(null);
  
  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
  
  const handleSubscribe = async () => {
    if (!user) {
      alert('Faça login para assinar o PRO!');
      return;
    }
    
    try {
      const response = await fetch('https://meu-gerador-backend.onrender.com/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, email: user.email }),
      });
      
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else alert('Erro: ' + data.error);
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#111827',
      color: 'white',
      padding: '40px 20px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            color: '#fbbf24',
            marginBottom: '20px'
          }}>
            Escolha seu Plano
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#9ca3af',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Acesso ilimitado a todas as ferramentas de IA. Cancele quando quiser.
          </p>
        </div>
        
        {/* PLANOS */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '30px',
          justifyContent: 'center',
          marginBottom: '60px'
        }}>
          
          {/* PLANO GRÁTIS */}
          <div style={{
            flex: '1',
            minWidth: '300px',
            maxWidth: '400px',
            backgroundColor: '#1f2937',
            padding: '40px',
            borderRadius: '20px',
            border: '1px solid #374151',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '10px', color: '#fff' }}>
              🆓 Grátis
            </h3>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#fff' }}>
                R$ 0
              </span>
              <span style={{ color: '#9ca3af', marginLeft: '10px' }}>/ para sempre</span>
            </div>
            
            <ul style={{ flexGrow: 1, marginBottom: '30px', padding: 0, listStyle: 'none' }}>
              {['✓ 3 créditos iniciais', '✓ 1 crédito por uso', '✓ 10+ ferramentas', '✓ Suporte básico'].map((item, idx) => (
                <li key={idx} style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                  <CheckIcon style={{ width: '20px', height: '20px', color: '#10b981', marginRight: '10px' }} />
                  <span style={{ color: '#d1d5db' }}>{item}</span>
                </li>
              ))}
            </ul>
            
            <Link to={user ? '/' : '/login'}>
              <button style={{
                width: '100%',
                padding: '15px',
                backgroundColor: 'transparent',
                border: '2px solid #374151',
                color: '#d1d5db',
                borderRadius: '10px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                {user ? 'Continuar Grátis' : 'Começar Grátis'}
              </button>
            </Link>
          </div>
          
          {/* PLANO PRO (DESTAQUE) */}
          <div style={{
            flex: '1',
            minWidth: '300px',
            maxWidth: '400px',
            backgroundColor: '#1f2937',
            padding: '40px',
            borderRadius: '20px',
            border: '2px solid #fbbf24',
            boxShadow: '0 0 30px rgba(251, 191, 36, 0.2)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* BADGE "MAIS POPULAR" */}
            <div style={{
              position: 'absolute',
              top: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#fbbf24',
              color: '#111827',
              padding: '8px 20px',
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}>
              ⭐ MAIS POPULAR
            </div>
            
            <h3 style={{ fontSize: '1.8rem', marginBottom: '10px', color: '#fbbf24' }}>
              👑 PRO
            </h3>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#fff' }}>
                R$ 19,99
              </span>
              <span style={{ color: '#9ca3af', marginLeft: '10px' }}>/ mês</span>
            </div>
            
            <ul style={{ flexGrow: 1, marginBottom: '30px', padding: 0, listStyle: 'none' }}>
              {[
                '✓ Créditos ILIMITADOS',
                '✓ Todas as ferramentas',
                '✓ Gerador de Imagens incluído',
                '✓ Suporte prioritário',
                '✓ Novas ferramentas primeiro',
                '✓ Sem anúncios'
              ].map((item, idx) => (
                <li key={idx} style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                  <CheckIcon style={{ width: '20px', height: '20px', color: '#fbbf24', marginRight: '10px' }} />
                  <span style={{ color: '#d1d5db' }}>{item}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={handleSubscribe}
              style={{
                width: '100%',
                padding: '15px',
                background: 'linear-gradient(90deg, #fbbf24 0%, #d97706 100%)',
                border: 'none',
                color: '#111827',
                borderRadius: '10px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 5px 15px rgba(251, 191, 36, 0.3)'
              }}
            >
              {user ? 'Virar PRO Agora' : 'Fazer Login para Assinar'}
            </button>
          </div>
          
          {/* PLANO ENTERPRISE */}
          <div style={{
            flex: '1',
            minWidth: '300px',
            maxWidth: '400px',
            backgroundColor: '#1f2937',
            padding: '40px',
            borderRadius: '20px',
            border: '1px solid #7e22ce',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '10px', color: '#a855f7' }}>
              🏢 Empresas
            </h3>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#fff' }}>
                Personalizado
              </span>
            </div>
            
            <ul style={{ flexGrow: 1, marginBottom: '30px', padding: 0, listStyle: 'none' }}>
              {[
                '✓ Múltiplos usuários',
                '✓ API dedicada',
                '✓ Treinamento personalizado',
                '✓ Suporte 24/7',
                '✓ Faturamento consolidado',
                '✓ SLA garantido'
              ].map((item, idx) => (
                <li key={idx} style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                  <CheckIcon style={{ width: '20px', height: '20px', color: '#a855f7', marginRight: '10px' }} />
                  <span style={{ color: '#d1d5db' }}>{item}</span>
                </li>
              ))}
            </ul>
            
            <a href="mailto:comercial@adaptaia.com.br">
              <button style={{
                width: '100%',
                padding: '15px',
                backgroundColor: 'transparent',
                border: '2px solid #7e22ce',
                color: '#d8b4fe',
                borderRadius: '10px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                Falar com Comercial
              </button>
            </a>
          </div>
        </div>
        
        {/* FAQ */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: '#1f2937',
          padding: '40px',
          borderRadius: '20px'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#fbbf24' }}>
            ❓ Perguntas Frequentes
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              {
                q: 'Como funcionam os créditos?',
                a: 'Usuários grátis ganham 3 créditos iniciais. Cada uso de ferramenta consome 1 crédito. Usuários PRO têm créditos ilimitados.'
              },
              {
                q: 'Posso cancelar a qualquer momento?',
                a: 'Sim! O cancelamento é imediato e você mantém o acesso até o fim do ciclo pago.'
              },
              {
                q: 'O que inclui o gerador de imagens?',
                a: 'O PRO inclui geração ilimitada de imagens com Stable Diffusion (cada imagem custaria 2 créditos no plano grátis).'
              },
              {
                q: 'Há cobrança adicional por uso?',
                a: 'Não! O PRO é R$ 19,99/mês fixo, sem surpresas. Use o quanto precisar.'
              }
            ].map((item, idx) => (
              <div key={idx} style={{
                padding: '20px',
                backgroundColor: '#111827',
                borderRadius: '10px'
              }}>
                <h4 style={{ color: '#fff', marginBottom: '10px' }}>{item.q}</h4>
                <p style={{ color: '#9ca3af', margin: 0 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* CTA FINAL */}
        <div style={{
          textAlign: 'center',
          marginTop: '60px',
          padding: '40px',
          backgroundColor: '#4c1d95',
          borderRadius: '20px'
        }}>
          <h3 style={{ color: '#e9d5ff', marginBottom: '20px', fontSize: '1.5rem' }}>
            🚀 Pronto para turbinar sua produtividade?
          </h3>
          <p style={{ color: '#d8b4fe', marginBottom: '30px', maxWidth: '600px', margin: '0 auto' }}>
            Junte-se a mais de 1.000 profissionais que já usam o Adapta IA diariamente.
          </p>
          <button 
            onClick={handleSubscribe}
            style={{
              padding: '15px 40px',
              background: 'linear-gradient(90deg, #7e22ce 0%, #a855f7 100%)',
              border: 'none',
              color: 'white',
              borderRadius: '50px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 5px 20px rgba(126, 34, 206, 0.4)'
            }}
          >
            Começar Agora - 7 dias de garantia
          </button>
        </div>
      </div>
    </div>
  );
}