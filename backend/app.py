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

# --- CONFIGURAÇÃO DE CHAVES ---
stripe_key = os.environ.get("STRIPE_SECRET_KEY")
stripe_price = os.environ.get("STRIPE_PRICE_ID")
frontend_url = os.environ.get("FRONTEND_URL")
endpoint_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')

stripe.api_key = stripe_key

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if url and key:
    supabase: Client = create_client(url, key)
else:
    print("ERRO CRÍTICO: Chaves do Supabase faltando!")
    supabase = None

# --- CONFIGURAÇÃO GEMINI ---
try:
    genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
    
    # ATENÇÃO: É OBRIGATÓRIO atualizar o 'google-generativeai' no requirements.txt para funcionar
    model = genai.GenerativeModel('gemini-2.0-flash-lite-001') 
    
    print("Modelo Gemini 1.5 Flash configurado com sucesso!")
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
        
        # Lógica: Se for PRO, não desconta créditos (uso ilimitado)
        # Se quiser limitar PRO também, remova este if.
        if is_pro: 
             return True, "Sucesso (VIP)"
            
        if credits <= 0: 
            return False, "Sem créditos. Assine o PRO!"
            
        # Deduz 1 crédito
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

# ============================================
# ROTAS DAS FERRAMENTAS IA
# ============================================

# 1. GERADOR DE PROMPT DE IMAGEM
@app.route('/generate-prompt', methods=['POST'])
def generate_prompt():
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)
        
        # CRÉDITOS (Opcional - Ative se quiser cobrar créditos aqui)
        # user_id = data.get('user_id')
        # if user_id:
        #     s, m = check_and_deduct_credit(user_id)
        #     if not s: return jsonify({'error': m}), 402

        idea = data.get('idea')
        style = data.get('style', 'Cinematográfico (Padrão)')

        if not idea: return jsonify({'error': 'A ideia é obrigatória'}), 400

        prompt = f"""
        Atue como um Engenheiro de Prompts Especialista em Midjourney v6 e DALL-E 3.
        Sua missão: Transformar a ideia do usuário em UM prompt profissional em Inglês.
        Ideia: "{idea}"
        Estilo Visual Obrigatório: "{style}"
        
        Regras:
        1. Escreva APENAS o prompt final em Inglês. Não coloque introduções.
        2. Use palavras-chave técnicas poderosas (ex: 8k, photorealistic, cinematic lighting).
        """
        
        response = model.generate_content(prompt)
        return jsonify({
            'prompt': response.text.strip(),
            'advanced_prompt': response.text.strip()
        })
        
    except Exception as e: 
        print(f"Erro Prompt Imagem: {e}")
        return jsonify({'error': str(e)}), 500

# 2. GERADOR DE PROMPT DE VÍDEO
@app.route('/generate-veo3-prompt', methods=['POST'])
def generate_veo3_prompt():
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)

        idea = data.get('idea')
        style = data.get('style', 'Cinematográfico')
        camera = data.get('camera', 'Cinematic Gimbal')

        if not idea: return jsonify({'error': 'Descreva a cena do vídeo.'}), 400

        ai_prompt = f"""
        Atue como um Diretor de Cinematografia. Crie um prompt para IA de vídeo (Sora/Veo).
        Ideia: "{idea}" | Estilo: "{style}" | Câmera: "{camera}"
        Saída: APENAS o prompt em Inglês detalhado, focado em movimento e fluidez.
        """
        
        response = model.generate_content(ai_prompt)
        return jsonify({'prompt': response.text.strip()})
        
    except Exception as e: 
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
        # Tenta pegar legendas
        caption = yt.captions.get_by_language_code('pt')
        if not caption: caption = yt.captions.get_by_language_code('en')
        if not caption: caption = yt.captions.get_by_language_code('a.pt') 
        
        if not caption: return jsonify({'error': 'Sem legendas disponíveis neste vídeo.'}), 400
        
        xml = caption.xml_captions
        root = ET.fromstring(xml)
        text = " ".join([elem.text for elem in root.iter('text') if elem.text])
        
        prompt = f"Resuma o seguinte vídeo: {text[:30000]}"
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
        
        prompt = f"Formate o texto abaixo seguindo as normas da ABNT (use Markdown): {data.get('text')}"
        response = model.generate_content(prompt)
        return jsonify({'formatted_text': response.text})
    except Exception as e: return jsonify({'error': str(e)}), 500

# 5. RESUMIDOR DE TEXTOS
@app.route('/summarize-text', methods=['POST'])
def summarize_text():
    if not model: return jsonify({'error': 'Modelo Gemini não disponível'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)

        user_id = data.get('user_id')
        if user_id:
            s, m = check_and_deduct_credit(user_id)
            if not s: return jsonify({'error': m}), 402

        text = data.get('text', '')
        if len(text) < 50: return jsonify({'error': 'Texto muito curto.'}), 400
        
        prompt = f"Resuma o texto mantendo os pontos principais (aprox 20% do tamanho): {text[:15000]}"
        response = model.generate_content(prompt)
        return jsonify({'summary': response.text})
    except Exception as e: return jsonify({'error': str(e)}), 500

# 6. DOWNLOAD DOCX
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

# 7. GERADOR DE PLANILHAS
@app.route('/generate-spreadsheet', methods=['POST'])
def generate_spreadsheet():
    import pandas as pd
    import unicodedata

    def remove_acentos(input_str):
        nfkd_form = unicodedata.normalize('NFKD', input_str)
        return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)
        prompt_user = data.get('prompt')
        
        ai_prompt = f"""
        Você é um Gerador de Dados para Excel.
        PEDIDO: "{prompt_user}"
        Gere um JSON com 5 linhas de dados fictícios.
        Responda APENAS o JSON.
        """
        
        response = model.generate_content(ai_prompt)
        txt = response.text
        
        start = txt.find('[')
        end = txt.rfind(']')
        if start != -1 and end != -1:
            json_str = txt[start:end+1]
            dados = json.loads(json_str)
        else:
            dados = [{"Erro": "Falha ao gerar dados"}]

        df = pd.DataFrame(dados)
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='Relatório IA')
            workbook  = writer.book
            worksheet = writer.sheets['Relatório IA']
            
            header_fmt = workbook.add_format({'bold': True, 'fg_color': '#1e3a8a', 'font_color': 'white', 'border': 1})
            
            for i, col in enumerate(df.columns):
                worksheet.write(0, i, col, header_fmt)
                worksheet.set_column(i, i, 20)

        output.seek(0)
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', as_attachment=True, download_name='planilha.xlsx')

    except Exception as e: return jsonify({'error': str(e)}), 500

# 8. UPLOAD PDF (RAG)
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

# 9. CHAT PDF (RAG)
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

# 10. TRADUTOR CORPORATIVO
@app.route('/corporate-translator', methods=['POST'])
def corporate_translator():
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)
        
        # CRÉDITOS (Opcional)
        # user_id = data.get('user_id')
        # if user_id: check_and_deduct_credit(user_id)

        text = data.get('text')
        tone = data.get('tone', 'Profissional')
        target_lang = data.get('target_lang', 'Português')

        prompt = f"Reescreva/Traduza o texto: '{text}' para {target_lang} com tom {tone}. Apenas o texto traduzido."
        resp = model.generate_content(prompt)
        return jsonify({'translated_text': resp.text.strip()})
    except Exception as e: return jsonify({'error': str(e)}), 500

# 11. SOCIAL MEDIA
@app.route('/generate-social-media', methods=['POST', 'OPTIONS'])
@cross_origin()
def generate_social_media():
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True, silent=True) or {}
        if not data and request.data: data = json.loads(request.data.decode('utf-8'))
        
        topic = data.get('topic') or data.get('text')
        platform = data.get('platform', 'Instagram')
        tone = data.get('tone', 'Profissional')
        
        if not topic: return jsonify({'error': 'Tópico obrigatório'}), 400

        prompt = f"Crie um post para {platform} sobre '{topic}' com tom {tone}."
        response = model.generate_content(prompt)
        return jsonify({'content': response.text.strip()})
    except Exception as e: return jsonify({'error': str(e)}), 500

# 12. CORRETOR REDAÇÃO
@app.route('/correct-essay', methods=['POST'])
def correct_essay():
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)
        
        user_id = data.get('user_id')
        if user_id: check_and_deduct_credit(user_id)
        
        prompt = f"""Corrija a redação sobre '{data.get('theme')}': '{data.get('essay')}'. 
        SAÍDA JSON: {{ "total_score": 0, "competencies": {{...}}, "feedback": "..." }}"""
        
        response = model.generate_content(prompt)
        json_text = response.text.replace("```json", "").replace("```", "").strip()
        if "{" in json_text: json_text = json_text[json_text.find("{"):json_text.rfind("}")+1]
        return jsonify(json.loads(json_text))
    except Exception as e: return jsonify({'error': str(e)}), 500

# 13. MOCK INTERVIEW
@app.route('/mock-interview', methods=['POST'])
def mock_interview():
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)

        prompt = f"""Crie 5 perguntas de entrevista para vaga {data.get('role')} na empresa {data.get('company')}.
        SAÍDA JSON: {{ "questions": [{{ "q": "...", "a": "..." }}], "tips": ["..."] }}"""
        
        response = model.generate_content(prompt)
        json_text = response.text.replace("```json", "").replace("```", "").strip()
        if "{" in json_text: json_text = json_text[json_text.find("{"):json_text.rfind("}")+1]
        return jsonify(json.loads(json_text))
    except Exception as e: return jsonify({'error': str(e)}), 500

# 14. MATERIAL DE ESTUDO
@app.route('/generate-study-material', methods=['POST'])
@cross_origin()
def generate_study_material():
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True, silent=True) or {}
        topic = data.get('topic')
        if not topic: return jsonify({'error': 'Tópico obrigatório'}), 400

        prompt = f"Crie um guia de estudos Markdown sobre: {topic}. Nível: {data.get('level')}."
        response = model.generate_content(prompt)
        return jsonify({'material': response.text.strip()})
    except Exception as e: return jsonify({'error': str(e)}), 500

# 15. CARTA APRESENTAÇÃO
@app.route('/generate-cover-letter', methods=['POST'])
def generate_cover_letter():
    if not model: return jsonify({'error': 'Erro modelo'}), 500
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)
        
        user_id = data.get('user_id')
        if user_id: check_and_deduct_credit(user_id)
        
        prompt = f"Escreva Cover Letter para vaga '{data.get('job_desc')}' baseada no CV '{data.get('cv_text')}'."
        response = model.generate_content(prompt)
        return jsonify({'cover_letter': response.text})
    except Exception as e: return jsonify({'error': str(e)}), 500

# ============================================
# GERADOR DE IMAGENS (REPLICATE)
# ============================================
@app.route('/generate-image', methods=['POST'])
def generate_image():
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)

        user_id = data.get('user_id')
        if user_id:
            success, message = check_and_deduct_credit(user_id)
            if not success: return jsonify({'error': message}), 402

        prompt = data.get('prompt', '')
        if len(prompt) < 5: return jsonify({'error': 'Prompt muito curto.'}), 400

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
        
        # Salva histórico
        if supabase and user_id:
            try:
                supabase.table('image_history').insert({
                    'user_id': user_id,
                    'prompt': prompt[:500],
                    'image_url': image_url
                }).execute()
            except Exception as e: print(f"Erro histórico img: {e}")

        return jsonify({'success': True, 'image_url': image_url, 'prompt': prompt})

    except Exception as e: return jsonify({'error': f'Erro interno: {str(e)}'}), 500

# ============================================
# ROTAS DE HISTÓRICO
# ============================================
@app.route('/save-history', methods=['POST'])
def save_history():
    try:
        data = request.json
        user_id = data.get('user_id')
        tool_type = data.get('tool_type')
        input_data = data.get('input_data')
        output_data = data.get('output_data')
        metadata = data.get('metadata', {})
        tool_name = data.get('tool_name', 'Ferramenta Adapta')

        if not all([user_id, tool_type, input_data]):
            return jsonify({"error": "Dados incompletos"}), 400

        response = supabase.table('user_history').insert({
            "user_id": user_id,
            "tool_type": tool_type,
            "tool_name": tool_name,
            "input_data": input_data,
            "output_data": output_data,
            "metadata": metadata
        }).execute()

        return jsonify({"message": "Histórico salvo!", "data": response.data}), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/get-history', methods=['POST'])
def get_history():
    try:
        data = request.get_json(force=True)
        user_id = data.get('user_id')
        if not user_id: return jsonify({'error': 'user_id obrigatório'}), 400
        
        query = supabase.table('user_history').select('*').eq('user_id', user_id)
        if data.get('tool_type'): query = query.eq('tool_type', data['tool_type'])
        
        response = query.order('created_at', desc=True).limit(data.get('limit', 100)).execute()
        return jsonify({'success': True, 'history': response.data})
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/delete-history-item', methods=['POST'])
def delete_history_item():
    try:
        data = request.get_json(force=True)
        user_id = data.get('user_id')
        item_id = data.get('item_id')
        
        check = supabase.table('user_history').select('id').eq('id', item_id).eq('user_id', user_id).execute()
        if not check.data: return jsonify({'error': 'Item não autorizado'}), 404
        
        supabase.table('user_history').delete().eq('id', item_id).execute()
        return jsonify({'success': True})
    except Exception as e: return jsonify({'error': str(e)}), 500

# ============================================
# PAGAMENTOS (STRIPE)
# ============================================

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.get_json(force=True)
        if isinstance(data, str): data = json.loads(data)
        
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{'price': stripe_price, 'quantity': 1}], 
            mode='subscription', 
            success_url=f'{frontend_url}/meu-perfil?success=true',
            cancel_url=f'{frontend_url}/precos?canceled=true',
            metadata={'user_id': data.get('user_id')},
            customer_email=data.get('email')
        )
        return jsonify({'url': checkout_session.url})
    except Exception as e: return jsonify({'error': str(e)}), 500

# ROTA ÚNICA PARA O PORTAL DO CLIENTE
@app.route('/create-portal-session', methods=['POST'])
def create_portal_session():
    try:
        user_id = request.json.get('user_id')
        resp = supabase.table('profiles').select('stripe_customer_id').eq('id', user_id).execute()
        
        if not resp.data or not resp.data[0].get('stripe_customer_id'):
             return jsonify({'error': 'Sem assinatura ativa para gerenciar.'}), 400
        
        session = stripe.billing_portal.Session.create(
            customer=resp.data[0]['stripe_customer_id'],
            return_url=f'{frontend_url}/meu-perfil',
        )
        return jsonify({'url': session.url})
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    
    try: 
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError as e: return 'Invalid payload', 400
    except stripe.error.SignatureVerificationError as e: return 'Invalid signature', 400

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        uid = session.get('metadata', {}).get('user_id')
        if uid: 
            supabase.table('profiles').update({
                'is_pro': True, 
                'stripe_customer_id': session.get('customer'),
                'credits': 100 
            }).eq('id', uid).execute()
            
    elif event['type'] == 'customer.subscription.deleted':
        sub = event['data']['object']
        cus_id = sub.get('customer')
        resp = supabase.table('profiles').select('id').eq('stripe_customer_id', cus_id).execute()
        if resp.data: 
            supabase.table('profiles').update({'is_pro': False}).eq('id', resp.data[0]['id']).execute()
            
    return 'Success', 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)