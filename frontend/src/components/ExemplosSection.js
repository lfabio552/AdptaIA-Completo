// src/components/ExemplosSection.js
import React from 'react';
import { getExemplos } from '../data/exemplos';

export default function ExemplosSection({ ferramentaId }) {
  const exemplos = getExemplos(ferramentaId);
  
  if (exemplos.length === 0) return null;
  
  return (
    <div style={{ 
      marginTop: '60px', 
      paddingTop: '30px',
      borderTop: '2px solid #374151'
    }}>
      <h2 style={{ 
        color: '#fbbf24', 
        marginBottom: '30px', 
        textAlign: 'center',
        fontSize: '1.8rem'
      }}>
        📚 Exemplos Práticos
      </h2>
      <p style={{ 
        textAlign: 'center', 
        color: '#9ca3af', 
        marginBottom: '40px',
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        Veja como outros usuários estão usando esta ferramenta. Use os exemplos como inspiração!
      </p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '30px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {exemplos.map((exemplo) => (
          <div key={exemplo.id} style={{ 
            backgroundColor: '#1f2937', 
            padding: '25px', 
            borderRadius: '12px',
            border: '1px solid #374151',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
          }}
          >
            {/* TÍTULO DO EXEMPLO */}
            <h3 style={{ 
              color: '#fff', 
              marginBottom: '15px', 
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ 
                backgroundColor: '#7e22ce', 
                width: '30px', 
                height: '30px', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}>
                {exemplo.id}
              </span>
              {exemplo.titulo}
            </h3>
            
            {/* PROMPT USADO */}
            <div style={{ marginBottom: '20px', flexGrow: 1 }}>
              <strong style={{ 
                color: '#9ca3af', 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '0.9rem'
              }}>
                📝 Prompt usado:
              </strong>
              <div style={{ 
                backgroundColor: '#111827', 
                padding: '12px', 
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '14px',
                color: '#d1d5db',
                borderLeft: '3px solid #7e22ce'
              }}>
                "{exemplo.prompt}"
              </div>
            </div>
            
            {/* IMAGEM DO EXEMPLO (se tiver) */}
            {exemplo.imagem && (
              <div style={{ marginBottom: '20px' }}>
                <strong style={{ 
                  color: '#9ca3af', 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '0.9rem'
                }}>
                  🖼️ Resultado visual:
                </strong>
                <div style={{ 
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  border: '1px solid #4b5563'
                }}>
                  <img 
                    src={exemplo.imagem} 
                    alt={exemplo.titulo}
                    style={{ 
                      width: '100%', 
                      height: '180px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    padding: '10px',
                    fontSize: '12px',
                    color: '#fff',
                    textAlign: 'center'
                  }}>
                    Exemplo ilustrativo
                  </div>
                </div>
              </div>
            )}
            
            {/* RESULTADO GERADO */}
<div>
  <strong style={{ 
    color: '#9ca3af', 
    display: 'block', 
    marginBottom: '8px',
    fontSize: '0.9rem'
  }}>
    ✅ O que foi criado:
  </strong>
  
  {/* RESULTADO: STRING SIMPLES */}
  {typeof exemplo.resultado === 'string' ? (
    <p style={{ 
      color: '#d1d5db', 
      margin: 0, 
      fontSize: '14px',
      lineHeight: '1.5',
      backgroundColor: '#111827',
      padding: '12px',
      borderRadius: '8px'
    }}>
      {exemplo.resultado}
    </p>
  ) : 
  
  /* RESULTADO: SOCIAL MEDIA */
  exemplo.resultado && exemplo.resultado.instagram ? (
    <div style={{ 
      backgroundColor: '#111827',
      padding: '12px',
      borderRadius: '8px'
    }}>
      <div style={{ marginBottom: '10px' }}>
        <span style={{ color: '#d946ef', fontWeight: 'bold', fontSize: '12px' }}>Instagram:</span>
        <p style={{ color: '#d1d5db', fontSize: '13px', margin: '5px 0' }}>{exemplo.resultado.instagram.substring(0, 80)}...</p>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <span style={{ color: '#0ea5e9', fontWeight: 'bold', fontSize: '12px' }}>LinkedIn:</span>
        <p style={{ color: '#d1d5db', fontSize: '13px', margin: '5px 0' }}>{exemplo.resultado.linkedin.substring(0, 80)}...</p>
      </div>
      <div>
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>Twitter:</span>
        <p style={{ color: '#d1d5db', fontSize: '13px', margin: '5px 0' }}>{exemplo.resultado.twitter.substring(0, 80)}...</p>
      </div>
    </div>
  ) : 
  
  /* RESULTADO: CORRETOR DE REDAÇÃO */
  exemplo.resultado && exemplo.resultado.total_score ? (
    <div style={{ 
      backgroundColor: '#111827',
      padding: '12px',
      borderRadius: '8px'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '10px'
      }}>
        <span style={{ color: '#10b981', fontWeight: 'bold' }}>Nota: {exemplo.resultado.total_score}/1000</span>
        <span style={{ 
          backgroundColor: exemplo.resultado.total_score >= 900 ? '#10b981' : 
                         exemplo.resultado.total_score >= 700 ? '#f59e0b' : '#ef4444',
          color: 'white',
          padding: '3px 10px',
          borderRadius: '20px',
          fontSize: '12px'
        }}>
          {exemplo.resultado.total_score >= 900 ? 'Excelente' : 
           exemplo.resultado.total_score >= 700 ? 'Bom' : 'Precisa melhorar'}
        </span>
      </div>
      <p style={{ color: '#d1d5db', fontSize: '13px', margin: 0 }}>
        {exemplo.resultado.feedback.substring(0, 100)}...
      </p>
    </div>
  ) : 
  
  /* RESULTADO: SIMULADOR DE ENTREVISTA (NOVO!) */
  exemplo.resultado && exemplo.resultado.questions ? (
    <div style={{ 
      backgroundColor: '#111827',
      padding: '12px',
      borderRadius: '8px'
    }}>
      <div style={{ marginBottom: '10px' }}>
        <span style={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '12px' }}>📋 Perguntas Geradas:</span>
        <p style={{ color: '#d1d5db', fontSize: '13px', margin: '5px 0' }}>
          {exemplo.resultado.questions.length} perguntas com respostas ideais
        </p>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '12px' }}>💡 Dicas do RH:</span>
        <p style={{ color: '#d1d5db', fontSize: '13px', margin: '5px 0' }}>
          {exemplo.resultado.tips.join(', ').substring(0, 80)}...
        </p>
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#9ca3af'
      }}>
        <span>👤 Vaga: Desenvolvedor Full-Stack</span>
        <span>⏱️  Duração: ~30 min</span>
      </div>
    </div>
  ) : 
  
  /* RESULTADO: QUIZ/FLASHCARDS */
  exemplo.resultado && exemplo.resultado.questions && Array.isArray(exemplo.resultado.questions) ? (
    <div style={{ 
      backgroundColor: '#111827',
      padding: '12px',
      borderRadius: '8px'
    }}>
      <div style={{ marginBottom: '10px' }}>
        <span style={{ color: '#06b6d4', fontWeight: 'bold', fontSize: '12px' }}>🧠 Quiz Gerado:</span>
        <p style={{ color: '#d1d5db', fontSize: '13px', margin: '5px 0' }}>
          {exemplo.resultado.questions.length} perguntas de múltipla escolha
        </p>
      </div>
      <div style={{ 
        display: 'inline-block',
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '11px'
      }}>
        Sistema Solar • Ensino Fundamental
      </div>
    </div>
  ) : null}
</div>
            
            {/* BOTÃO DE AÇÃO */}
            <button 
              onClick={() => {
                // Copia o prompt para área de transferência
                navigator.clipboard.writeText(exemplo.prompt);
                alert('✅ Prompt copiado! Agora é só colar no campo acima.');
              }}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '10px',
                backgroundColor: 'transparent',
                border: '1px solid #7e22ce',
                color: '#d8b4fe',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#7e22ce';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#d8b4fe';
              }}
            >
              📋 Usar este exemplo
            </button>
          </div>
        ))}
      </div>
      
      {/* DICA FINAL */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#4c1d95',
        borderRadius: '12px',
        textAlign: 'center',
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        <p style={{ color: '#e9d5ff', margin: 0, fontSize: '15px' }}>
          <strong>💡 Dica:</strong> Use estes exemplos como ponto de partida. Modifique os prompts 
          para atender suas necessidades específicas. Quanto mais detalhado for seu pedido, 
          melhor será o resultado!
        </p>
      </div>
    </div>
  );
}