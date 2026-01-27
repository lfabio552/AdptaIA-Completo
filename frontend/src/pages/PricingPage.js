import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { CheckIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/solid';

export default function PricingPage() {
  const [user, setUser] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' ou 'yearly'

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleSubscribe = async (planType) => {
    if (!user) {
      // Redireciona para login se não estiver logado
      window.location.href = '/login';
      return;
    }
    
    // Se for plano anual, você pode mudar o endpoint ou passar um parâmetro extra
    // Por enquanto, vamos manter o padrão, mas a lógica está pronta para expansão
    const endpoint = 'https://meu-gerador-backend.onrender.com/create-checkout-session';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            user_id: user.id, 
            email: user.email,
            cycle: billingCycle // Envia para o backend saber qual preço cobrar
        }),
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
      backgroundColor: '#0f1016', // Fundo Dark da Home
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(126,34,206,0.1) 0%, rgba(0,0,0,0) 70%)',
        top: '-200px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '800',
            marginBottom: '15px',
            background: 'linear-gradient(90deg, #fff 0%, #9ca3af 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Planos Flexíveis
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#9ca3af', maxWidth: '600px', margin: '0 auto 30px' }}>
            Desbloqueie todo o potencial da IA. Cancele quando quiser.
          </p>

          {/* TOGGLE MENSAL / ANUAL */}
          <div style={{ 
            display: 'inline-flex', 
            backgroundColor: '#1f2937', 
            padding: '5px', 
            borderRadius: '50px',
            border: '1px solid #374151',
            position: 'relative'
          }}>
            <button 
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '10px 25px',
                borderRadius: '50px',
                border: 'none',
                backgroundColor: billingCycle === 'monthly' ? '#374151' : 'transparent',
                color: billingCycle === 'monthly' ? '#fff' : '#9ca3af',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Mensal
            </button>
            <button 
              onClick={() => setBillingCycle('yearly')}
              style={{
                padding: '10px 25px',
                borderRadius: '50px',
                border: 'none',
                backgroundColor: billingCycle === 'yearly' ? '#7e22ce' : 'transparent',
                color: billingCycle === 'yearly' ? '#fff' : '#9ca3af',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              Anual <span style={{ fontSize: '0.7rem', background: '#fbbf24', color: '#000', padding: '2px 6px', borderRadius: '10px' }}>-20%</span>
            </button>
          </div>
        </div>
        
        {/* CARDS DE PREÇO */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '30px',
          justifyContent: 'center',
          alignItems: 'stretch' // Estica para terem mesma altura
        }}>
          
          {/* PLANO GRÁTIS */}
          <div style={{
            flex: '1',
            minWidth: '300px',
            maxWidth: '380px',
            backgroundColor: '#1f2937',
            padding: '40px',
            borderRadius: '24px',
            border: '1px solid #374151',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#fff', fontWeight: 'bold' }}>
              Iniciante
            </h3>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem', fontWeight: '800', color: '#fff' }}>R$ 0</span>
              <span style={{ color: '#9ca3af' }}> / para sempre</span>
            </div>
            <p style={{ color: '#9ca3af', marginBottom: '30px', fontSize: '0.95rem' }}>
              Para quem quer testar e conhecer as ferramentas básicas.
            </p>
            
            <Link to={user ? '/' : '/login'} style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%', padding: '15px', backgroundColor: 'transparent',
                border: '1px solid #4b5563', color: '#fff', borderRadius: '12px',
                fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s'
              }} onMouseOver={e => e.target.style.borderColor = '#fff'} onMouseOut={e => e.target.style.borderColor = '#4b5563'}>
                {user ? 'Plano Atual' : 'Criar Conta Grátis'}
              </button>
            </Link>

            <div style={{ marginTop: '30px' }}>
               <p style={{ color: '#fff', fontWeight: 'bold', marginBottom: '15px' }}>Inclui:</p>
               <ul style={{ padding: 0, listStyle: 'none' }}>
                 {['3 Créditos Iniciais', 'Acesso às ferramentas de texto', 'Suporte Básico', 'Exportação com marca d\'água'].map((item, i) => (
                   <li key={i} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', color: '#d1d5db', fontSize: '0.95rem' }}>
                     <CheckIcon style={{ width: '18px', color: '#9ca3af', marginRight: '10px' }} /> {item}
                   </li>
                 ))}
               </ul>
            </div>
          </div>
          
          {/* PLANO PRO (DESTAQUE) */}
          <div style={{
            flex: '1',
            minWidth: '300px',
            maxWidth: '380px',
            backgroundColor: '#1f2937', // Fundo escuro
            padding: '40px',
            borderRadius: '24px',
            border: '2px solid #a855f7', // Borda Roxa
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.15)',
            transform: 'scale(1.02)' // Levemente maior
          }}>
            <div style={{
              position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)', color: '#fff',
              padding: '6px 20px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <SparklesIcon style={{ width: '16px' }} /> RECOMENDADO
            </div>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#a855f7', fontWeight: 'bold' }}>
              PRO
            </h3>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem', fontWeight: '800', color: '#fff' }}>
                {billingCycle === 'monthly' ? 'R$ 19,90' : 'R$ 15,90'}
              </span>
              <span style={{ color: '#9ca3af' }}> / mês</span>
              {billingCycle === 'yearly' && <div style={{ fontSize: '0.9rem', color: '#fbbf24', marginTop: '5px' }}>Cobrado R$ 190,80 anualmente</div>}
            </div>
            <p style={{ color: '#d1d5db', marginBottom: '30px', fontSize: '0.95rem' }}>
              Para profissionais e estudantes que precisam de poder total.
            </p>
            
            <button 
              onClick={() => handleSubscribe('pro')}
              style={{
                width: '100%', padding: '15px', 
                background: 'linear-gradient(90deg, #7e22ce 0%, #a855f7 100%)',
                border: 'none', color: '#fff', borderRadius: '12px',
                fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', 
                boxShadow: '0 4px 15px rgba(126, 34, 206, 0.4)',
                transition: 'transform 0.2s'
              }}
              onMouseDown={e => e.target.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.target.style.transform = 'scale(1)'}
            >
              {billingCycle === 'monthly' ? 'Assinar Mensal' : 'Assinar Anual (Economize)'}
            </button>

            <div style={{ marginTop: '30px' }}>
               <p style={{ color: '#fff', fontWeight: 'bold', marginBottom: '15px' }}>Tudo do Grátis, mais:</p>
               <ul style={{ padding: 0, listStyle: 'none' }}>
                 {[
                   'Créditos ILIMITADOS', 
                   'Geração de Imagens HD', 
                   'Acesso ao VEO 3 (Vídeo)', 
                   'Suporte Prioritário',
                   'Sem anúncios',
                   'Acesso antecipado a novidades'
                 ].map((item, i) => (
                   <li key={i} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', color: '#fff', fontSize: '0.95rem' }}>
                     <CheckIcon style={{ width: '20px', color: '#a855f7', marginRight: '10px' }} /> {item}
                   </li>
                 ))}
               </ul>
            </div>
          </div>

        </div>
        
        {/* GARANTIA */}
        <div style={{ textAlign: 'center', marginTop: '60px', color: '#9ca3af' }}>
           <p style={{ fontSize: '0.9rem' }}>
             🔒 Pagamento seguro via Stripe. Cancele quando quiser diretamente no seu painel.
           </p>
        </div>

      </div>
    </div>
  );
}