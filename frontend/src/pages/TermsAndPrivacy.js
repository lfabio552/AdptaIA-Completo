import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css'; // Garante que pegue os estilos globais

export default function TermsAndPrivacy() {
  return (
    <div style={{ backgroundColor: '#111827', color: '#d1d5db', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#1f2937', padding: '40px', borderRadius: '16px', border: '1px solid #374151' }}>
        
        <Link to="/" style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 'bold', marginBottom: '20px', display: 'inline-block' }}>
          ← Voltar para a Home
        </Link>

        <h1 style={{ color: '#fff', fontSize: '2rem', marginBottom: '30px', borderBottom: '2px solid #7e22ce', paddingBottom: '10px' }}>Termos de Uso e Privacidade</h1>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#f3f4f6', fontSize: '1.5rem', marginBottom: '15px' }}>1. Termos de Uso</h2>
          <p>Bem-vindo ao <strong>Adapta IA</strong>. Ao acessar nosso site e utilizar nossas ferramentas de Inteligência Artificial, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis.</p>
          
          <h3 style={{ color: '#e5e7eb', marginTop: '20px' }}>1.1. Licença de Uso</h3>
          <p>É concedida permissão para usar nossas ferramentas (geradores de texto, imagem, vídeo, planilhas, etc.) para fins pessoais e comerciais, desde que você tenha uma assinatura ativa ou créditos disponíveis.</p>
          
          <h3 style={{ color: '#e5e7eb', marginTop: '20px' }}>1.2. Limitações</h3>
          <p>O usuário não deve:</p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>Usar as ferramentas para gerar conteúdo ilegal, odioso ou discriminatório.</li>
            <li>Tentar realizar engenharia reversa de qualquer software contido no site.</li>
            <li>Compartilhar sua conta de acesso com terceiros (o acesso é pessoal e intransferível).</li>
          </ul>

          <h3 style={{ color: '#e5e7eb', marginTop: '20px' }}>1.3. Assinatura e Cancelamento</h3>
          <p>O plano PRO é cobrado mensalmente via Stripe. Você pode cancelar a qualquer momento através do botão "Minha Assinatura" no painel. O acesso continuará ativo até o fim do ciclo pago.</p>
        </section>

        <section>
          <h2 style={{ color: '#f3f4f6', fontSize: '1.5rem', marginBottom: '15px' }}>2. Política de Privacidade</h2>
          <p>Sua privacidade é importante para nós. É política do Adapta IA respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar.</p>

          <h3 style={{ color: '#e5e7eb', marginTop: '20px' }}>2.1. Dados que Coletamos</h3>
          <p>Coletamos apenas o necessário para o funcionamento do serviço:</p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            <li><strong>E-mail:</strong> Para login e comunicação importante (via Supabase Auth).</li>
            <li><strong>Dados de Pagamento:</strong> Processados de forma segura e criptografada pelo <strong>Stripe</strong>. Nós NÃO armazenamos números de cartão de crédito em nossos servidores.</li>
            <li><strong>Inputs do Usuário:</strong> Os textos e arquivos enviados para as ferramentas são processados pela IA (Google Gemini) e não são utilizados para treinar modelos públicos.</li>
          </ul>

          <h3 style={{ color: '#e5e7eb', marginTop: '20px' }}>2.2. Segurança</h3>
          <p>Utilizamos protocolos de segurança padrão da indústria (SSL/TLS) para proteger suas informações durante a transmissão. Seus dados de login são protegidos pelo Supabase, uma plataforma líder em segurança de banco de dados.</p>
        </section>

        <div style={{ marginTop: '40px', borderTop: '1px solid #374151', paddingTop: '20px', fontSize: '0.9rem', color: '#9ca3af' }}>
          <p>Última atualização: {new Date().toLocaleDateString()}</p>
          <p>Contato: suporte@adaptaia.com.br</p>
        </div>

      </div>
    </div>
  );
}