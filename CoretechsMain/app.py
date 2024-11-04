from flask import Flask, request, jsonify, render_template
import pdfkit
import io
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from pylatex import Document, NoEscape
import subprocess

GOOGLE_API_KEY = "YOUR_API_KEY1"
GOOGLE_API_KEY2 = "YOUR_API_KEY2"


#2 farklı llm kullandık bunun sebebi hem soruyu oluşturan llm e düzelttirmek istemedik hem de bir llm'e art arda girdi verince sorun çıkartması.
llm = ChatGoogleGenerativeAI(
    #Fotoğraf ve  yazı girdisiyle soruyu oluşturan llm
    model="gemini-1.5-pro",
    google_api_key=GOOGLE_API_KEY,
    temperature=0.2,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)
llm2 = ChatGoogleGenerativeAI(
    #Oluşturulan sorunun tasarımını geliştiren, içerigini detaylandıran llm
    model="gemini-1.5-pro",
    google_api_key=GOOGLE_API_KEY2,
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

def process_question(image_url: str, text_prompt: str):
    #Fotoğraf ve yazı girdisiyle ile soruyu oluşturan fonksiyon
    message_text = text_prompt
    message = [
        SystemMessage(content="You are a helpful assistant that generates questions.The questions should be of similar length and difficulty and on the same topic as the question in the photo. Write the questions carefully to avoid any mistakes, and use LaTeX code to format them in an original way.Write the questions in the language desired by the user. If the user does not specify a language, write in the language the question is in.  Make sure the question design is clear and well-structured..Avoid writing characters that are incompatible with utf 8. sure to include spaces between the answer choices and label each choice with 'a)', 'b)', 'c)', etc. At the end, include an answer key in the format like 1) A 2) B and provide only the LaTeX code.If there is no question in the photo, just write 'none' ."),
        HumanMessage(content=[{"type": "text", "text": message_text}, {"type": "image_url", "image_url": image_url}])
    ]
    response = llm.invoke(message)
    return response.content

def process_text_question(text_prompt: str):
    #yazı girdisiyle soruyu oluşturan fonksiyon
    message_text = text_prompt
    message = [
        SystemMessage(content="You are a helpful assistant that generates questions. Write questions carefully, in clear and well-structured LaTeX format compatible with UTF-8. Label each choice with 'a)', 'b)', 'c)', etc.Write the questions in the language desired by the user. If the user does not specify a language, write in the language the question is in, and provide an answer key in like 1) A 2) B format. Avoid non-UTF-8 characters and output only LaTeX code."),
        HumanMessage(content=[{"type": "text", "text": message_text}])
    ]
    
    response = llm.invoke(message)
    return response.content
def question_duzelt(question: str):
    #Oluşturulan sorunun tasarımını geliştiren, içerigini detaylandıran fonksiyon
    message = [
        SystemMessage(content="You are an assistant specialized in enhancing questions presented in LaTeX code format. Your task is to improve the design and quality of each question. Make them more accurate, challenging and detailed.Write the questions in the language desired by the user. If the user does not specify a language, write in the language the question is in. Ensure that the LaTeX code is well-formatted.Avoid writing characters that are incompatible with utf 8. Always output only the modified question in LaTeX code format.sure to include spaces between the answer choices beetwen answers and label each choice with 'a)', 'b)', 'c)', etc. At the end, include an answer key in the format like 1) A 2) B and provide only the LaTeX code."),
        HumanMessage(content=question)
    ]
    
    response = llm2.invoke(message)
    return response.content

def GeneratePdf(latex_body_code: str):
    #llm in olusturdugu lateX kodunu pdf e ceviren fonksiyon
    doc = Document()
    doc.append(NoEscape(latex_body_code))
    
    try:
        doc.generate_pdf('static/output', compiler='pdflatex', clean_tex=False)
    except subprocess.CalledProcessError as e:
        print("Error during PDF generation:", e)
    except UnicodeDecodeError as e:
        print("Character encoding error:", e)
    except Exception as e:
        print("Unexpected error:", e)
        
flag = 0
feedback = 0
app = Flask(__name__)
temp_text = ""
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
result = ""
stored_file_path = None  

@app.route('/process', methods=['POST'])
@app.route('/', methods=['GET', 'POST'])
def index():
    global flag
    global feedback, stored_file_path,temp_text
    if request.method == 'POST':
        text_Data = request.form.get("textInput")
        file_Data = request.files.get("fileInput")
        if(file_Data):
            flag = 0
        print(f"Gelen girdi: {text_Data}")
        print(feedback)
        
        if flag == 1:
            #yanıtlama butonuna tıklayınca flag 1 olur kullanıcı soru hakkında geri bildirimde bulunur
            print("Soruyu revize et")
            print(text_Data)
            #kullanıcı soruyu begenmeyip tekrar promt girerse eski promtla yeni promtu model ile birlestirip yeni promt olusturuyoruz 
            refined_prompt = llm2.invoke([
                SystemMessage(content="Using both the initial text and user feedback prompts, please create a refined prompt that fully incorporates the user’s feedback while preserving the main points and tone of the initial prompt."),
                HumanMessage(content=f"Initial Prompt: {temp_text} User Feedback: {text_Data}.")
            ]).content
            temp_text = refined_prompt
            question = process_question("/uploads/uploaded_image.png", refined_prompt)
            result = question_duzelt(question)
            GeneratePdf(result)                 
        else:
            print("Yeni soru")
            flag = 0
            temp_text = text_Data 
            if file_Data:
                temp_text = text_Data
                feedback = 0  
                fixed_filename = 'uploaded_image'
                file_path = os.path.join(UPLOAD_FOLDER, fixed_filename)
                for ext in ['.png', '.jpg', '.jpeg', '.gif']:
                    existing_file_path = f"{file_path}{ext}"
                    if os.path.exists(existing_file_path):
                        os.remove(existing_file_path)

                file_extension = os.path.splitext(file_Data.filename)[1]
                new_file_path = f"{file_path}{file_extension}"
                file_Data.save(new_file_path)
                stored_file_path = new_file_path  
                question = process_question(new_file_path, text_Data)
                result = question_duzelt(question)
                GeneratePdf(result)
                print(stored_file_path)
            else:
                temp_text = text_Data
                question = process_text_question(text_Data)
                result = question_duzelt(question)
                GeneratePdf(result)
                print(stored_file_path)
            
        
        return jsonify({'message': 'Başarıyla alındı', 'data': text_Data})
    
    return render_template('index.html')

@app.route('/get_metin', methods=['GET'])
def get_metin():
    return jsonify({"message": "Bu soruyu beğendiniz mi?"})

@app.route('/get_pdf', methods=['GET'])
def get_pdf():
    
    
    html_content = f"""
    <h1>Yapay Zeka Cevabı</h1>
    """
    pdf = pdfkit.from_string(html_content, False)
    return send_file(
        io.BytesIO(pdf),
        mimetype='application/pdf',
        as_attachment=True,
        download_name='output.pdf'
    )

@app.route('/run_function', methods=['POST'])
def run_function():
    global flag
    abx = "İşlem başarılı!" 

    flag = 1
    
    
    return jsonify({'result': abx})


if __name__ == '__main__':
    app.run(debug=True)
