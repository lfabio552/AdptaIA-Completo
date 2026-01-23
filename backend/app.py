import os
import io
import json
import re
import google.generativeai as genai
import stripe
import replicate
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from io import BytesIO
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv
from supabase import create_client, Client

# --- FERRAMENTAS EXTRAS ---
from pytube import YouTube
import xml.etree.ElementTree as ET
from docx import Document
from pypdf import PdfReader 

# Carrega variáveis do .env
load_dotenv() 

app = Flask(__name__)
CORS(app) 

# --- VERIFICAÇÃO DE CHAVES ---
stripe_key = os.environ.get("STRIPE_SECRET_KEY")
stripe_price = os.environ.get("STRIPE_PRICE_ID")
frontend_url = os.environ.get("FRONTEND_URL")
endpoint_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')

# Configurações
stripe.api_key = stripe_key

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if url and key:
    supabase: Client = create_client(url, key)
else:
    print("ERRO CRÍTICO: Chaves do Supabase faltando!")
    supabase = None

try:
    genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
    # Ajustado para a versão estável atual. Se tiver acesso ao 2.0, mude aqui.
    model = genai.GenerativeModel('gemini-2.5-flash') 
    print("Modelo Gemini configurado com sucesso!")
except Exception as e:
    print(f"Erro ao configurar o modelo Gemini: {e}")
    model = None

# --- FUNÇÃO DE CRÉDITOS ---
def check_and_deduct_credit(user_id):
    try:
        if not supabase: return False, "Erro de banco de dados."
        response = supabase.table('profiles').select('credits, is_pro').eq('id', user_id).execute()
        
        if not response.data: return False, "Usuário não encontrado."
        
        user_data = response.data[0]
        credits = user_data['credits']
        is_pro = user_data.get('is_pro', False) 
        
        if is_pro: return True, "Sucesso (VIP)"
            
        if credits <= 0: return False, "Sem créditos. Assine o PRO!"
            
        new_credits = credits - 1
        supabase.table('profiles').update({'credits': new_credits}).eq('id', user_id).execute()
        return True, "Sucesso"
    except Exception as e: return False, str(e)

# --- FUNÇÃO AUXILIAR: EMBEDDINGS ---
def get_embedding(text):
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document",
            title="Documento do Usuário"
        )
        return result['embedding']
    except Exception as e:
        print(f"Erro embedding: {e}")
        return None

@app.route('/')
def health_check():
    return jsonify({'status': 'ok', 'service': 'Adapta IA Backend'})

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'}), 200

# --- ROTAS DAS FERRAMENTAS ---

# 1. GERADOR DE PROMPT DE IMAGEM (COM ESTILO)
@app.route('/generate-prompt', methods=['POST'])
def generate_prompt():
    import json
    import google.generativeai as genai

    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)
        
        # ⚠️ CRÉDITOS (Descomente se tiver)
        # user_id = data.get('user_id')
        # if user_id:
        #     s, m = check_and_deduct_credit(user_id)
        #     if not s: return jsonify({'error': m}), 402
        
        idea = data.get('idea')
        # Pega o estilo ou usa o padrão se não vier
        style = data.get('style', 'Cinematográfico (Padrão)')

        if not idea: return jsonify({'error': 'A ideia é obrigatória'}), 400

        # Prompt de Especialista com Estilo Forçado
        prompt = f"""
        Atue como um Engenheiro de Prompts Especialista em Midjourney v6 e DALL-E 3.
        Sua missão: Transformar a ideia do usuário em UM prompt profissional, rico e detalhado (em Inglês).
        
        Ideia do Usuário: "{idea}"
        Estilo Visual Obrigatório: "{style}"
        
        Regras de Ouro:
        1. Escreva APENAS o prompt final em Inglês. Não coloque introduções.
        2. O estilo visual "{style}" deve ser o foco principal da estética.
        3. Estrutura sugerida: [Estilo Artístico: {style}] + [Sujeito Principal] + [Detalhes Visuais/Ação] + [Ambiente] + [Iluminação/Atmosfera] + [Parâmetros Técnicos].
        4. Use palavras-chave técnicas poderosas que combinem com o estilo escolhido (ex: se for 'Fotorealista', use '8k, raw photo'; se for 'Anime', use 'studio ghibli style, vibrant colors').
        
        Gere APENAS O TEXTO DO PROMPT EM INGLÊS.
        """
        
        response = model.generate_content(prompt)
        
        return jsonify({
            'prompt': response.text.strip(),
            'advanced_prompt': response.text.strip()
        })
        
    except Exception as e: 
        print(f"Erro Prompt Imagem: {e}")
        return jsonify({'error': str(e)}), 500

# 2. VEO 3 & SORA 2 (CORRIGIDO)
@app.route('/generate-veo3-prompt', methods=['POST'])
def generate_video_prompt():
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    
    try:
        data = request.get_json(force=True, silent=True)
        if not data and request.data:
            try:
                data = json.loads(request.data.decode('utf-8'))
            except:
                return jsonify({'error': 'Invalid JSON'}), 400
        
        if not data: data = {}

        # ⚠️ CRÉDITOS: Descomente se quiser cobrar créditos aqui
        # user_id = data.get('user_id')
        # if user_id:
        #     s, m = check_and_deduct_credit(user_id)
        #     if not s: return jsonify({'error': m}), 402

        target_model = data.get('model', 'Veo 3')
        
        scene = data.get('scene') or data.get('idea')
        
        if not scene:
            return jsonify({'error': 'A descrição da cena (idea) é obrigatória'}), 400

        style = data.get('style', 'Cinematic')
        camera = data.get('camera', 'Drone')
        lighting = data.get('lighting', 'Natural')
        audio = data.get('audio', '')

        base_instruction = "Crie um prompt OTIMIZADO PARA VÍDEO."
        if target_model == 'Sora 2':
            base_instruction += " Foco em física realista e detalhes visuais (Sora)."
        else:
            base_instruction += " Foco em termos cinematográficos e técnicos (Veo)."

        prompt = f"""
        {base_instruction}
        Cena: {scene}
        Estilo: {style}
        Câmera: {camera}
        Luz: {lighting}
        Som: {audio}
        Gere APENAS o prompt final em Inglês.
        """
        
        response = model.generate_content(prompt)
        
        return jsonify({'prompt': response.text})

    except Exception as e:
        print(f"Erro Veo3: {e}") 
        return jsonify({'error': str(e)}), 500

# 3. RESUMIDOR YOUTUBE
@app.route('/summarize-video', methods=['POST'])
def summarize_video():
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)

        if data.get('user_id'):
            s, m = check_and_deduct_credit(data.get('user_id'))
            if not s: return jsonify({'error': m}), 402

        yt = YouTube(data.get('url'))
        # Tenta pegar legendas em várias línguas
        caption = yt.captions.get_by_language_code('pt')
        if not caption: caption = yt.captions.get_by_language_code('en')
        if not caption: caption = yt.captions.get_by_language_code('a.pt') 
        
        if not caption: return jsonify({'error': 'Sem legendas disponíveis neste vídeo.'}), 400
        
        xml = caption.xml_captions
        root = ET.fromstring(xml)
        text = " ".join([elem.text for elem in root.iter('text') if elem.text])
        
        prompt = f"Resuma: {text[:30000]}"
        response = model.generate_content(prompt)
        return jsonify({'summary': response.text})
    except Exception as e: return jsonify({'error': str(e)}), 500

# 4. ABNT
@app.route('/format-abnt', methods=['POST'])
def format_abnt():
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)

        user_id = data.get('user_id')
        if user_id:
            s, m = check_and_deduct_credit(user_id)
            if not s: return jsonify({'error': m}), 402
        
        prompt = f"Formate ABNT Markdown: {data.get('text')}"
        response = model.generate_content(prompt)
        return jsonify({'formatted_text': response.text})
    except Exception as e: return jsonify({'error': str(e)}), 500

# 4.1. RESUMIDOR DE TEXTOS LONGOS
@app.route('/summarize-text', methods=['POST'])
def summarize_text():
    if not model:
        return jsonify({'error': 'Modelo Gemini não disponível'}), 500
    
    try:
        data = request.get_json(force=True)
        if isinstance(data, str):
            data = json.loads(data)

        user_id = data.get('user_id')
        if user_id:
            success, message = check_and_deduct_credit(user_id)
            if not success:
                return jsonify({'error': message}), 402

        text = data.get('text', '')
        if len(text) < 50:
            return jsonify({'error': 'Texto muito curto. Mínimo 50 caracteres.'}), 400
        
        text_limitado = text[:15000] 
        
        prompt = f"""
        Resuma o seguinte texto de forma clara e concisa.
        Mantenha os pontos principais e informações essenciais.
        Tamanho do resumo: Aproximadamente 20% do original.
        
        TEXTO PARA RESUMIR:
        {text_limitado}
        
        RESPOSTA: Apenas o resumo, sem introduções.
        """
        
        response = model.generate_content(prompt)
        return jsonify({'summary': response.text})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 5. DOWNLOAD DOCX
@app.route('/download-docx', methods=['POST'])
def download_docx():
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)

        doc = Document()
        doc.add_paragraph(data.get('markdown_text'))
        f = io.BytesIO()
        doc.save(f)
        f.seek(0)
        return send_file(f, as_attachment=True, download_name='doc.docx', mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    except Exception as e: return jsonify({'error': str(e)}), 500

# 7. GERADOR DE PLANILHAS (VERSÃO BLINDADA V2)
@app.route('/generate-spreadsheet', methods=['POST'])
def generate_spreadsheet():
    # Imports locais para garantir que funcionem
    import pandas as pd
    import io
    import json
    # O send_file precisa estar importado lá no topo do arquivo: from flask import send_file

    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        prompt_user = data.get('prompt')
        
        print(f"📊 Gerando planilha para: {prompt_user}")

        # Prompt Reforçado para JSON Limpo
        ai_prompt = f"""
        Você é um Gerador de Dados para Excel (JSON Generator).
        
        PEDIDO: "{prompt_user}"
        
        REGRAS:
        1. Responda APENAS com um JSON válido. Sem Markdown (```json), sem explicações.
        2. O JSON deve ser uma LISTA de objetos, onde cada objeto é uma linha da planilha.
        3. Use chaves como nomes das colunas.
        4. Gere 5 linhas de dados de exemplo.
        
        Exemplo de Saída:
        [
            {{"Data": "01/01/2024", "Item": "Bolo", "Valor": 50}},
            {{"Data": "02/01/2024", "Item": "Doce", "Valor": 10}}
        ]
        """
        
        response = model.generate_content(ai_prompt)
        txt = response.text
        
        # Limpeza agressiva do JSON
        start = txt.find('[')
        end = txt.rfind(']')
        
        if start == -1 or end == -1:
            print("❌ Erro: IA não gerou JSON válido (colchetes não encontrados).")
            # Fallback: Tenta criar um dado simples para não dar erro 500
            dados = [{"Erro": "A IA não entendeu o pedido. Tente ser mais específico."}]
        else:
            json_str = txt[start:end+1]
            try:
                dados = json.loads(json_str)
            except:
                print("❌ Erro ao fazer parse do JSON. Tentando corrigir...")
                # Tenta corrigir aspas simples para duplas (erro comum da IA)
                try:
                    import ast
                    dados = ast.literal_eval(json_str)
                except:
                     dados = [{"Erro": "Formato de dados inválido gerado pela IA."}]

        # Criar DataFrame
        df = pd.DataFrame(dados)
        
        # Buffer para salvar o arquivo na memória RAM
        output = io.BytesIO()
        
        # Tenta salvar usando xlsxwriter (mais bonito), se falhar usa openpyxl (padrão)
        try:
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df.to_excel(writer, index=False, sheet_name='Dados')
                # Ajuste de colunas
                worksheet = writer.sheets['Dados']
                for i, col in enumerate(df.columns):
                    width = max(df[col].astype(str).map(len).max(), len(col)) + 2
                    worksheet.set_column(i, i, width)
        except Exception as e_excel:
            print(f"⚠️ Erro no XlsxWriter: {e_excel}. Tentando motor padrão...")
            # Fallback para o motor padrão (requer openpyxl instalado)
            df.to_excel(output, index=False)
                
        output.seek(0)
        
        return send_file(
            output, 
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True, 
            download_name='planilha_gerada.xlsx'
        )

    except Exception as e:
        print(f"❌ ERRO CRÍTICO NO SERVIDOR: {str(e)}")
        # Retorna o erro exato para o Frontend mostrar no alerta
        return jsonify({'error': f"Erro interno: {str(e)}"}), 500


# 7. UPLOAD PDF (RAG)
@app.route('/upload-document', methods=['POST'])
def upload_document():
    try:
        user_id = request.form.get('user_id')
        file = request.files.get('file')
        if not user_id or not file: return jsonify({'error': 'Dados faltando'}), 400
        
        s, m = check_and_deduct_credit(user_id)
        if not s: return jsonify({'error': m}), 402

        reader = PdfReader(file)
        text = ""
        for page in reader.pages: text += page.extract_text() + "\n"
        
        doc = supabase.table('documents').insert({'user_id': user_id, 'filename': file.filename}).execute()
        doc_id = doc.data[0]['id']

        chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
        items = []
        for c in chunks:
            emb = get_embedding(c)
            if emb: items.append({'document_id': doc_id, 'content': c, 'embedding': emb})
        
        if items: supabase.table('document_chunks').insert(items).execute()
        return jsonify({'message': 'OK', 'document_id': doc_id})
    except Exception as e: return jsonify({'error': str(e)}), 500

# 8. CHAT PDF (RAG)
@app.route('/ask-document', methods=['POST'])
def ask_document():
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)

        user_id = data.get('user_id')
        question = data.get('question')
        
        q_emb = get_embedding(question)
        params = {'query_embedding': q_emb, 'match_threshold': 0.5, 'match_count': 5, 'user_id_filter': user_id}
        matches = supabase.rpc('match_documents', params).execute().data
        
        context = "\n".join([m['content'] for m in matches])
        prompt = f"Contexto: {context}\nPergunta: {question}"
        resp = model.generate_content(prompt)
        
        return jsonify({'answer': resp.text})
    except Exception as e: return jsonify({'error': str(e)}), 500

# 9. TRADUTOR CORPORATIVO (COM IDIOMAS)
@app.route('/corporate-translator', methods=['POST'])
def corporate_translator():
    import json
    import google.generativeai as genai

    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)

        # ⚠️ CRÉDITOS (Descomente se tiver)
        # user_id = data.get('user_id')
        # if user_id:
        #     s, m = check_and_deduct_credit(user_id)
        #     if not s: return jsonify({'error': m}), 402
        
        text = data.get('text')
        tone = data.get('tone', 'Profissional')
        # Pega o idioma ou assume Português se não vier
        target_lang = data.get('target_lang', 'Português')

        prompt = f"""
        Atue como um Especialista em Comunicação Corporativa Global.
        
        Sua tarefa: Reescrever e Traduzir o texto abaixo.
        1. Tom de voz: {tone}
        2. Idioma de Saída: {target_lang}
        
        Texto Original: "{text}"
        
        Saída: Apenas o texto reescrito/traduzido, sem aspas e sem explicações.
        """
        
        resp = model.generate_content(prompt)
        return jsonify({'translated_text': resp.text.strip()})
        
    except Exception as e: return jsonify({'error': str(e)}), 500

# 10. SOCIAL MEDIA GENERATOR (BLINDADO)
@app.route('/generate-social-media', methods=['POST', 'OPTIONS'])
@cross_origin() # <--- Força a permissão do CORS nesta rota
def generate_social_media():
    import json
    import google.generativeai as genai 

    if not model: return jsonify({'error': 'Erro modelo'}), 500
    
    try:
        data = request.get_json(force=True, silent=True)
        if not data and request.data:
            try:
                data = json.loads(request.data.decode('utf-8'))
            except:
                pass
        
        if not data: data = {}

        # Pega os dados
        topic = data.get('topic') or data.get('text')
        platform = data.get('platform', 'Instagram')
        tone = data.get('tone', 'Profissional')

        if not topic:
            return jsonify({'error': 'O tópico do post é obrigatório'}), 400

        prompt = f"""
        Atue como um Especialista em Social Media.
        Crie UM post para a rede social: {platform}.
        
        Assunto: "{topic}"
        Tom de voz: {tone}
        
        Regras:
        - Use formatação adequada (quebra de linha, emojis).
        - Se for Instagram, use hashtags.
        - Se for LinkedIn, seja mais corporativo.
        - Se for Twitter, seja breve.
        
        Gere APENAS o texto do conteúdo.
        """
        
        response = model.generate_content(prompt)
        
        return jsonify({'content': response.text.strip()})

    except Exception as e:
        print(f"❌ ERRO SOCIAL MEDIA: {e}") 
        return jsonify({'error': str(e)}), 500

# 11. CORRETOR DE REDAÇÃO
@app.route('/correct-essay', methods=['POST'])
def correct_essay():
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)

        user_id = data.get('user_id')
        if user_id:
            s, m = check_and_deduct_credit(user_id)
            if not s: return jsonify({'error': m}), 402

        prompt = f"""
        Corrija a redação sobre "{data.get('theme')}". Texto: "{data.get('essay')}"
        SAÍDA JSON: {{ "total_score": 0, "competencies": {{...}}, "feedback": "..." }}
        """
        response = model.generate_content(prompt)
        json_text = response.text.replace("```json", "").replace("```", "").strip()
        if "{" in json_text: json_text = json_text[json_text.find("{"):json_text.rfind("}")+1]
        return jsonify(json.loads(json_text))
    except Exception as e: return jsonify({'error': str(e)}), 500

# 12. SIMULADOR DE ENTREVISTA (ATUALIZADO)
@app.route('/mock-interview', methods=['POST'])
def mock_interview():
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)

        # ⚠️ CRÉDITOS (Descomente se tiver)
        # user_id = data.get('user_id')
        # if user_id:
        #    s, m = check_and_deduct_credit(user_id)
        #    if not s: return jsonify({'error': m}), 402

        role = data.get('role')
        company = data.get('company', 'Empresa Confidencial')
        experience = data.get('experience', 'junior')
        description = data.get('description', '')

        prompt = f"""
        Você é um Recrutador Sênior na empresa {company}.
        
        Objetivo: Criar um roteiro de entrevista técnica e comportamental para a vaga: {role} (Nível {experience}).
        Descrição da vaga fornecida: "{description}"
        
        Gere um JSON com:
        1. "questions": Uma lista de 5 perguntas (campo "q") e uma breve dica de como responder bem (campo "a").
        2. "tips": Uma lista de 3 dicas gerais para passar nessa entrevista específica.

        SAÍDA JSON OBRIGATÓRIA: {{ "questions": [{{ "q": "...", "a": "..." }}], "tips": ["..."] }}
        """
        
        response = model.generate_content(prompt)
        
        # Limpeza do JSON (às vezes a IA manda ```json no começo)
        json_text = response.text.replace("```json", "").replace("```", "").strip()
        if "{" in json_text: 
            json_text = json_text[json_text.find("{"):json_text.rfind("}")+1]
            
        return jsonify(json.loads(json_text))
        
    except Exception as e: 
        print(f"Erro Interview: {e}")
        return jsonify({'error': str(e)}), 500

# 13. GERADOR DE QUIZ E FLASHCARDS
@app.route('/generate-study-material', methods=['POST'])
@cross_origin()
def generate_study_material():
    # Imports de segurança
    import google.generativeai as genai 
    
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    
    try:
        data = request.get_json(force=True, silent=True)
        if not data and request.data:
            try:
                data = json.loads(request.data.decode('utf-8'))
            except:
                pass
        
        if not data: data = {}

        # ⚠️ CRÉDITOS (Descomente se tiver a função)
        user_id = data.get('user_id')
        # if user_id:
        #     s, m = check_and_deduct_credit(user_id)
        #     if not s: return jsonify({'error': m}), 402

        topic = data.get('topic')
        level = data.get('level', 'ensino_medio')

        if not topic:
            return jsonify({'error': 'O tópico é obrigatório'}), 400

        # Prompt Educacional
        prompt = f"""
        Atue como um Professor Especialista.
        Crie um Guia de Estudos sobre: "{topic}".
        Nível de ensino: {level}.
        
        Estrutura Obrigatória:
        1. Resumo do Conceito (O que é?).
        2. Principais Pontos Chave (Bullet points).
        3. Exemplo Prático ou Analogia.
        4. Sugestão de 3 questões para praticar (com gabarito no final).
        
        Use formatação Markdown (negrito, títulos) para ficar bonito.
        """
        
        response = model.generate_content(prompt)
        
        # Retorna 'material' como o frontend espera
        return jsonify({'material': response.text.strip()})

    except Exception as e:
        print(f"❌ ERRO STUDY MATERIAL: {e}")
        return jsonify({'error': str(e)}), 500

# 14. CARTA DE APRESENTAÇÃO
@app.route('/generate-cover-letter', methods=['POST'])
def generate_cover_letter():
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)

        user_id = data.get('user_id')
        if user_id:
            s, m = check_and_deduct_credit(user_id)
            if not s: return jsonify({'error': m}), 402

        prompt = f"""
        Escreva uma Cover Letter para a vaga: "{data.get('job_desc')}" baseada no CV: "{data.get('cv_text')}". Tom: {data.get('tone')}.
        """
        response = model.generate_content(prompt)
        return jsonify({'cover_letter': response.text})
    except Exception as e: return jsonify({'error': str(e)}), 500

# 15. GERADOR DE IMAGENS (Replicate)
@app.route('/generate-image', methods=['POST'])
def generate_image():
    try:
        data = request.get_json(force=True)
        if isinstance(data, str):
            data = json.loads(data)

        user_id = data.get('user_id')
        if user_id:
            success, message = check_and_deduct_credit(user_id)
            if not success:
                return jsonify({'error': message}), 402

        prompt = data.get('prompt', '')
        if not prompt or len(prompt) < 10:
            return jsonify({'error': 'Prompt muito curto (mínimo 10 caracteres).'}), 400

        model_id = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b"
        
        output = replicate.run(
            model_id,
            input={
                "prompt": prompt,
                "num_outputs": 1,
                "num_inference_steps": 30,
                "guidance_scale": 7.5,
                "width": 1024,
                "height": 1024,
                "scheduler": "DPMSolverMultistep",
                "negative_prompt": "blurry, low quality, distorted, ugly, deformed"
            }
        )

        image_url = output[0] if isinstance(output, list) else output
        
        if supabase and user_id:
            try:
                supabase.table('image_history').insert({
                    'user_id': user_id,
                    'prompt': prompt[:500],
                    'image_url': image_url,
                    'created_at': 'now()'
                }).execute()
            except Exception as e:
                print(f"Erro ao salvar histórico imagem: {e}")

        return jsonify({
            'success': True,
            'image_url': image_url,
            'prompt': prompt
        })

    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

# ============================================
# HISTÓRICO DE ATIVIDADES
# ============================================

# 19. SALVAR ATIVIDADE NO HISTÓRICO (BLINDADO CONTRA ERRO DE COLUNA)
@app.route('/save-history', methods=['POST'])
def save_history():
    try:
        data = request.json
        user_id = data.get('user_id')
        tool_type = data.get('tool_type')
        input_data = data.get('input_data')
        output_data = data.get('output_data')
        metadata = data.get('metadata', {})

        # CORREÇÃO: O banco exige 'tool_name', então vamos garantir que ele exista
        tool_name = data.get('tool_name')
        
        # Se não veio nome, a gente cria um baseado no código (fallback)
        if not tool_name:
            nomes_ferramentas = {
                'study': 'Material de Estudo',
                'social': 'Social Media',
                'video-prompt': 'Prompt de Vídeo',
                'image-prompt': 'Prompt de Imagem',
                'spreadsheet': 'Gerador de Planilhas',
                'translator': 'Tradutor Corporativo'
            }
            # Se não achar na lista, usa "Ferramenta Adapta"
            tool_name = nomes_ferramentas.get(tool_type, 'Ferramenta Adapta')

        # Verificação básica
        if not all([user_id, tool_type, input_data]):
            return jsonify({"error": "Dados incompletos"}), 400

        # Tenta salvar no Supabase (Agora enviando tool_name)
        response = supabase.table('user_history').insert({
            "user_id": user_id,
            "tool_type": tool_type,
            "tool_name": tool_name,  # <--- CAMPO OBRIGATÓRIO ADICIONADO
            "input_data": input_data,
            "output_data": output_data,
            "metadata": metadata
        }).execute()

        return jsonify({"message": "Histórico salvo!", "data": response.data}), 200

    except Exception as e:
        print(f"❌ ERRO AO SALVAR HISTÓRICO: {str(e)}")
        return jsonify({"error": str(e)}), 500

# 20. BUSCAR HISTÓRICO DO USUÁRIO
@app.route('/get-history', methods=['POST'])
def get_history():
    try:
        data = request.get_json(force=True)
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id obrigatório'}), 400
        
        query = supabase.table('user_history')\
            .select('*')\
            .eq('user_id', user_id)
        
        if data.get('tool_type'):
            query = query.eq('tool_type', data['tool_type'])
        
        if data.get('start_date'):
            query = query.gte('created_at', data['start_date'])
        if data.get('end_date'):
            query = query.lte('created_at', data['end_date'])
        
        response = query.order('created_at', desc=True)\
                        .limit(data.get('limit', 100))\
                        .execute()
        
        return jsonify({
            'success': True,
            'count': len(response.data),
            'history': response.data
        })
        
    except Exception as e:
        print(f"❌ Erro ao buscar histórico: {e}")
        return jsonify({'error': str(e)}), 500

# 21. DELETAR ITEM DO HISTÓRICO
@app.route('/delete-history-item', methods=['POST'])
def delete_history_item():
    try:
        data = request.get_json(force=True)
        user_id = data.get('user_id')
        item_id = data.get('item_id')
        
        if not user_id or not item_id:
            return jsonify({'error': 'user_id e item_id obrigatórios'}), 400
        
        # Verificar se o item pertence ao usuário (segurança extra)
        check = supabase.table('user_history')\
            .select('id')\
            .eq('id', item_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if not check.data:
            return jsonify({'error': 'Item não encontrado ou não autorizado'}), 404
        
        # Deletar o item
        supabase.table('user_history').delete().eq('id', item_id).execute()
        
        return jsonify({'success': True, 'message': 'Item deletado'})
        
    except Exception as e:
        print(f"❌ Erro ao deletar histórico: {e}")
        return jsonify({'error': str(e)}), 500

# --- PAGAMENTOS (STRIPE WEBHOOKS) ---
@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{'price': os.environ.get('STRIPE_PRICE_ID'), 'quantity': 1}],
            mode='subscription', 
            success_url=f'{frontend_url}/?success=true',
            cancel_url=f'{frontend_url}/?canceled=true',
            metadata={'user_id': data.get('user_id')},
            customer_email=data.get('email')
        )
        return jsonify({'url': checkout_session.url})
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/create-portal-session', methods=['POST'])
def create_portal_session():
    try:
        user_id = request.json.get('user_id')
        resp = supabase.table('profiles').select('stripe_customer_id').eq('id', user_id).execute()
        if not resp.data or not resp.data[0]['stripe_customer_id']: return jsonify({'error': 'Sem assinatura.'}), 400
        
        session = stripe.billing_portal.Session.create(
            customer=resp.data[0]['stripe_customer_id'],
            return_url=f'{frontend_url}/',
        )
        return jsonify({'url': session.url})
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    try: event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except: return 'Error', 400
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        uid = session.get('metadata', {}).get('user_id')
        if uid: supabase.table('profiles').update({'is_pro': True, 'stripe_customer_id': session.get('customer')}).eq('id', uid).execute()
    elif event['type'] == 'customer.subscription.deleted':
        sub = event['data']['object']
        cus_id = sub.get('customer')
        resp = supabase.table('profiles').select('id').eq('stripe_customer_id', cus_id).execute()
        if resp.data: supabase.table('profiles').update({'is_pro': False}).eq('id', resp.data[0]['id']).execute()
    return 'Success', 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)