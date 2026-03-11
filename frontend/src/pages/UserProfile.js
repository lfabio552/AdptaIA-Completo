const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);

      // 1. Busca status PRO e Créditos
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_pro, credits')
        .eq('id', user.id)
        .single();
        
      if (profileData) {
          setIsPro(profileData.is_pro);
          setCredits(profileData.credits);
      }

      // 2. Busca a CONTAGEM na tabela correta (user_history)
      const { count, error } = await supabase
        .from('user_history') // <--- A MÁGICA ESTÁ AQUI!
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      console.log("🔍 DEBUG HISTÓRICO - Contagem:", count, "Erro:", error);

      if (!error && count !== null) {
        const totalUses = count;
        
        // MATEMÁTICA DAS CONQUISTAS:
        const timeSaved = totalUses * 0.5; // 0.5 horas (30 min) por uso
        const valueGenerated = totalUses * 35; // R$ 35,00 economizados por uso
        
        setStats({ totalUses, timeSaved, valueGenerated });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };