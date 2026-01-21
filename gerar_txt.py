import os

# Arquivos e pastas que queremos IGNORAR
IGNORE_DIRS = {'node_modules', '.git', '__pycache__', 'build', 'dist', '.idea', '.vscode', 'public', 'Texto'}
IGNORE_EXTENSIONS = {'.rar', '.zip', '.png', '.jpg', '.ico', '.json', '.svg', '.pyc'}
IGNORE_FILES = {'package-lock.json', 'yarn.lock', 'README.md', 'gerar_txt.py', 'app.rar'}

output_file = 'PROJETO_COMPLETO.txt'

def is_text_file(filename):
    # Extensões de código que queremos ler
    valid_extensions = {'.py', '.js', '.css', '.html', '.txt', '.md', '.env'}
    return any(filename.endswith(ext) for ext in valid_extensions)

with open(output_file, 'w', encoding='utf-8') as outfile:
    for root, dirs, files in os.walk('.'):
        # Remove pastas ignoradas da busca
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            if file in IGNORE_FILES:
                continue
                
            # Pula extensões ignoradas
            if any(file.endswith(ext) for ext in IGNORE_EXTENSIONS):
                continue

            # Verifica se é um arquivo de texto válido (código)
            if is_text_file(file):
                file_path = os.path.join(root, file)
                
                outfile.write(f"\n{'='*50}\n")
                outfile.write(f"CAMINHO DO ARQUIVO: {file_path}\n")
                outfile.write(f"{'='*50}\n\n")
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as infile:
                        outfile.write(infile.read())
                except Exception as e:
                    outfile.write(f"Erro ao ler arquivo: {e}")
                
                outfile.write("\n\n")

print(f"Pronto! Todo o código foi salvo em '{output_file}'. Pode enviar esse arquivo.")