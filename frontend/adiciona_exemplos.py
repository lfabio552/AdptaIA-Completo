import os
import re

print("🚀 INICIANDO ADIÇÃO AUTOMÁTICA DE EXEMPLOS EM TODAS AS FERRAMENTAS")
print("=" * 60)

# Mapeamento de arquivos para IDs (baseado nos seus arquivos)
ferramentas = {
    'ImagePromptGenerator.js': 'gerar-imagem',
    'InterviewSimulator.js': 'simulador-entrevista',
    'StudyMaterialGenerator.js': 'gerador-estudos',
    'CoverLetterGenerator.js': 'gerador-carta',
    'Veo3PromptGenerator.js': 'gerar-veo3-prompt',
    'ChatPDF.js': 'chat-pdf',
    'TextSummarizer.js': 'resumir-texto',
    'CorporateTranslator.js': 'tradutor-corporativo',
    'EssayCorrector.js': 'corretor-redacao',
    'ImageGenerator.js': 'gerar-imagem-completa',
    'SocialMediaGenerator.js': 'social-media',
    'AgenteABNT.js': 'agente-abnt',
    'SpreadsheetGenerator.js': 'gerador-planilha',
}

# Contadores para estatísticas
total_processados = 0
total_alterados = 0
erros = []

for arquivo, ferramenta_id in ferramentas.items():
    caminho = f'src/pages/{arquivo}'
    
    if not os.path.exists(caminho):
        print(f"⚠️  Arquivo não encontrado: {arquivo}")
        erros.append(f"Arquivo não encontrado: {arquivo}")
        continue
    
    total_processados += 1
    
    try:
        with open(caminho, 'r', encoding='utf-8') as f:
            conteudo = f.read()
        
        conteudo_original = conteudo
        alteracoes = []
        
        # 1. VERIFICAR SE JÁ TEM EXEMPLOS (para não duplicar)
        if f'ferramentaId="{ferramenta_id}"' in conteudo or f"ferramentaId='{ferramenta_id}'" in conteudo:
            print(f"⏭️  {arquivo}: Já tem ExemplosSection. Pulando...")
            continue
        
        # 2. ADICIONAR IMPORT DO COMPONENTE
        if 'ExemplosSection' not in conteudo:
            # Encontrar a última linha de import
            linhas = conteudo.split('\n')
            ultimo_import_index = -1
            
            for i, linha in enumerate(linhas):
                if ('import' in linha and 'from' in linha) or ('import' in linha and 'require' in linha):
                    ultimo_import_index = i
            
            if ultimo_import_index != -1:
                # Adicionar nosso import após o último import existente
                linhas.insert(ultimo_import_index + 1, "import ExemplosSection from '../components/ExemplosSection';")
                conteudo = '\n'.join(linhas)
                alteracoes.append("✓ Import adicionado")
        
        # 3. ADICIONAR COMPONENTE ANTES DO FECHAMENTO DO CONTAINER
        # Procurar por padrões comuns de fechamento
        padroes_fechamento = [
            r'(\s*</div>\s*</div>\s*)$',  # Dois </div> no final
            r'(\s*</div>\s*)$',           # Um </div> no final
            r'(\s*</div>\s*\n\s*</div>)', # </div> seguido de </div>
        ]
        
        componente_adicionado = False
        for padrao in padroes_fechamento:
            match = re.search(padrao, conteudo)
            if match:
                # Encontrou um fechamento, adicionar antes
                antes = conteudo[:match.start()]
                depois = conteudo[match.start():]
                
                # Adicionar nosso componente
                novo_conteudo = antes + f'\n      <ExemplosSection ferramentaId="{ferramenta_id}" />\n' + depois
                conteudo = novo_conteudo
                alteracoes.append("✓ Componente adicionado")
                componente_adicionado = True
                break
        
        # 4. SE NÃO ENCONTROU PADRÃO, ADICIONAR ANTES DO ÚLTIMO </div>
        if not componente_adicionado:
            # Contar quantos </div> existem
            divs_fechados = conteudo.count('</div>')
            if divs_fechados > 0:
                # Encontrar o último </div>
                partes = conteudo.rsplit('</div>', 1)
                conteudo = partes[0] + f'\n      <ExemplosSection ferramentaId="{ferramenta_id}" />\n</div>' + partes[1]
                alteracoes.append("✓ Componente adicionado (fallback)")
                componente_adicionado = True
        
        # 5. SALVAR SE HOUVE ALTERAÇÕES
        if conteudo != conteudo_original:
            with open(caminho, 'w', encoding='utf-8') as f:
                f.write(conteudo)
            
            total_alterados += 1
            print(f"✅ {arquivo}: {', '.join(alteracoes)}")
        else:
            print(f"ℹ️  {arquivo}: Nenhuma alteração necessária")
            
    except Exception as e:
        print(f"❌ ERRO em {arquivo}: {str(e)}")
        erros.append(f"{arquivo}: {str(e)}")

print("\n" + "=" * 60)
print("📊 RELATÓRIO FINAL:")
print(f"   • Total de ferramentas processadas: {total_processados}")
print(f"   • Arquivos modificados: {total_alterados}")
print(f"   • Erros encontrados: {len(erros)}")

if erros:
    print("\n⚠️  ERROS DETECTADOS:")
    for erro in erros:
        print(f"   • {erro}")

if total_alterados > 0:
    print("\n🎉 PRÓXIMOS PASSOS:")
    print("   1. Execute 'npm start' para testar localmente")
    print("   2. Verifique se os exemplos aparecem em cada ferramenta")
    print("   3. Faça commit e push: git add . && git commit -m 'add exemplos todas ferramentas' && git push")
else:
    print("\nℹ️  Nenhuma alteração foi necessária - talvez já esteja tudo configurado!")

print("\n✅ Script concluído!")