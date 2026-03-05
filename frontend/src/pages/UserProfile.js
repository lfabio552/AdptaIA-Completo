import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import config from '../config'; 
import { 
  UserCircleIcon, 
  CreditCardIcon, 
  ArrowRightOnRectangleIcon, 
  TrashIcon,
  SparklesIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BoltIcon
} from '@heroicons/react/24/solid';

// COMPONENTE ANIMADO CORRIGIDO (Agora suporta decimais e valores reais!)
const AnimatedNumber = ({ value, duration = 1500, prefix = "", suffix = "", decimals = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (start === end) {
        setCount(end);
        return;
    }

    let totalFrames = Math.round(duration / 16.66);
    let increment = (end - start) / totalFrames;
    
    let current = start;
    let timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(current);
      }
    }, 16.66);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{prefix}{count.toFixed(decimals).replace('.', ',')}{suffix}</span>;
};

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); 
  
  // DADOS REAIS DO BANCO
  const [isPro, setIsPro] = useState(false);
  const [credits, setCredits] = useState(0);
  const [stats, setStats] = useState({
    totalUses: 0,
    timeSaved: 0, 
    valueGenerated: 0
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);

      // 1. Busca status PRO e Créditos na tabela 'profiles'
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_pro, credits')
        .eq('id', user.id)
        .single();
        
      if (profileData) {
          setIsPro(profileData.is_pro);
          setCredits(profileData.credits);
      }

      // 2. Busca o Histórico de uso para calcular as Conquistas
      const { data: history, error } = await supabase
        .from('history')
        .select('id')
        .eq('user_id', user.id);

      if (!error && history) {
        const totalUses = history.length;
        
        // MATEMÁTICA DAS CONQUISTAS:
        // Ex: Cada ferramenta usada salva em média 30 min (0.5 horas)
        const timeSaved = totalUses * 0.5; 
        
        // Ex: O usuário pagaria R$ 35,00 para um humano fazer essa tarefa
        const valueGenerated = totalUses * 35; 
        
        setStats({ totalUses, timeSaved, valueGenerated });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleManageSubscription = async () => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${config.API_BASE_URL}/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({ 
            user_id: user.id,
            email: user.email 
        }) 
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erro: " + (data.error || "Não foi possível abrir o portal. Você tem uma assinatura ativa?"));
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com o servidor de pagamentos.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = prompt("Para confirmar a exclusão, digite 'DELETAR' abaixo. Isso apagará todos os seus dados permanentemente.");
    
    if (confirmText === 'DELETAR') {
      setIsProcessing(true);
      try {
        const { error } = await supabase.rpc('delete_user'); 
        if (error) throw error;

        await supabase.auth.signOut();
        alert("Sua conta foi encerrada com sucesso. Sentiremos sua falta!");
        navigate('/');
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir conta. Entre em contato com o suporte.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f1016', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader" style={{border: '3px solid #374151', borderTop: '3px solid #8b5cf6', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite'}}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f1016', color: 'white', fontFamily: "'Inter', sans-serif", paddingBottom: '60px' }}>
      
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '300px', background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.15) 0%, rgba(15, 16, 22, 0) 100%)', zIndex: 0 }} />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', position: 'relative', zIndex: 1 }}>
        
        {/* CABEÇALHO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, #c084fc 0%, #db2777 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(192, 132, 252, 0.3)'
          }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
              {user.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 5px 0' }}>Meu Perfil</h1>
            <p style={{ color: '#9ca3af', margin: 0 }}>{user.email}</p>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <div style={{ padding: '4px 12px', background: '#3b0764', borderRadius: '20px', fontSize: '0.8rem', color: '#d8b4fe', border: '1px solid #a855f7', fontWeight: 'bold' }}>
                  MEMBRO {isPro ? 'PRO' : 'FREE'}
                </div>
                
                {/* Mostra saldo de créditos só se for FREE */}
                {!isPro && (
                    <div style={{ padding: '4px 12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '20px', fontSize: '0.8rem', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>🪙</span> {credits} Créditos
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* CALL TO ACTION PARA USUÁRIOS FREE */}
        {!isPro && (
            <div style={{ 
                background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)', 
                border: '1px solid rgba(245, 158, 11, 0.3)', 
                padding: '20px', borderRadius: '16px', marginBottom: '40px', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px'
            }}>
                <div>
                    <h3 style={{ color: '#fbbf24', margin: '0 0 5px 0', fontSize: '1.1rem' }}>Faça o Upgrade para o PRO</h3>
                    <p style={{ color: '#d1d5db', margin: 0, fontSize: '0.9rem' }}>Uso ilimitado de todas as ferramentas e suporte prioritário.</p>
                </div>
                <Link to="/precos" style={{ 
                    background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)', 
                    color: 'white', padding: '10px 20px', borderRadius: '50px', 
                    fontWeight: 'bold', textDecoration: 'none', fontSize: '0.9rem',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                }}>
                    Ver Planos
                </Link>
            </div>
        )}

        {/* CONQUISTAS */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BoltIcon style={{ width: '20px', color: '#fbbf24' }} /> Suas Conquistas
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px',
          marginBottom: '50px'
        }}>
          {/* Card 1: Usos */}
          <div style={{ background: 'linear-gradient(145deg, #1f2937 0%, #111827 100%)', padding: '25px', borderRadius: '20px', border: '1px solid #374151', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', background: '#8b5cf6', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.2 }}></div>
            <SparklesIcon style={{ width: '30px', color: '#a78bfa', marginBottom: '10px' }} />
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff' }}>
                <AnimatedNumber value={stats.totalUses} />
            </div>
            <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Ferramentas utilizadas</div>
          </div>

          {/* Card 2: Tempo Poupado (Com decimal) */}
          <div style={{ background: 'linear-gradient(145deg, #1f2937 0%, #111827 100%)', padding: '25px', borderRadius: '20px', border: '1px solid #374151', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', background: '#10b981', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.2 }}></div>
            <ClockIcon style={{ width: '30px', color: '#34d399', marginBottom: '10px' }} />
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff' }}>
                <AnimatedNumber value={stats.timeSaved} suffix="h" decimals={1} />
            </div>
            <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Estimativa de tempo poupado</div>
          </div>

          {/* Card 3: Valor Gerado (Formato Dinheiro) */}
          <div style={{ background: 'linear-gradient(145deg, #1f2937 0%, #111827 100%)', padding: '25px', borderRadius: '20px', border: '1px solid #374151', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', background: '#f59e0b', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.2 }}></div>
            <CurrencyDollarIcon style={{ width: '30px', color: '#fbbf24', marginBottom: '10px' }} />
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff' }}>
                <AnimatedNumber value={stats.valueGenerated} prefix="R$ " decimals={2} />
            </div>
            <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Valor gerado / economizado</div>
          </div>
        </div>

        {/* GERENCIAR CONTA */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCircleIcon style={{ width: '20px', color: '#9ca3af' }} /> Gerenciar Conta
        </h2>

        <div style={{ backgroundColor: '#1f2937', borderRadius: '16px', border: '1px solid #374151', overflow: 'hidden' }}>
          
          {/* Assinatura */}
          <div style={{ padding: '20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '10px' }}>
                <CreditCardIcon style={{ width: '24px', color: '#10b981' }} />
              </div>
              <div>
                <div style={{ fontWeight: '600', color: 'white' }}>Assinatura Stripe</div>
                <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Gerenciar pagamentos, cancelar plano e ver notas fiscais</div>
              </div>
            </div>
            <button 
              onClick={handleManageSubscription}
              disabled={isProcessing}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #4b5563', borderRadius: '8px', color: '#d1d5db', cursor: isProcessing ? 'wait' : 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
              onMouseOver={(e) => !isProcessing && (e.target.style.borderColor = '#fff')}
              onMouseOut={(e) => !isProcessing && (e.target.style.borderColor = '#4b5563')}
            >
              {isProcessing ? 'Carregando...' : 'Abrir Portal Stripe'}
            </button>
          </div>

          {/* Excluir Conta */}
          <div style={{ padding: '20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '10px' }}>
                <TrashIcon style={{ width: '24px', color: '#ef4444' }} />
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#ef4444' }}>Zona de Perigo</div>
                <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Encerrar conta e apagar dados permanentemente</div>
              </div>
            </div>
            <button 
              onClick={handleDeleteAccount}
              disabled={isProcessing}
              style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', cursor: isProcessing ? 'wait' : 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
            >
              Excluir Conta
            </button>
          </div>

          {/* Sair */}
          <div onClick={handleLogout} style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#374151'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <ArrowRightOnRectangleIcon style={{ width: '20px', color: '#9ca3af' }} />
            <span style={{ color: '#d1d5db' }}>Sair da Conta</span>
          </div>

        </div>

      </div>
    </div>
  );
}