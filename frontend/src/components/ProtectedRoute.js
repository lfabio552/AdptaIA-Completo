import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Ajuste o caminho se necessário

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verifica se já tem uma sessão ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Fica ouvindo mudanças (se o usuário fizer logout, por exemplo)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    // Enquanto verifica, mostra um carregando simples
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Verificando acesso...</div>;
  }

  if (!session) {
    // SE NÃO TIVER SESSÃO (NÃO LOGADO), MANDA PRO LOGIN
    return <Navigate to="/login" replace />;
  }

  // SE TIVER LOGADO, MOSTRA A FERRAMENTA (FILHO)
  return children;
}