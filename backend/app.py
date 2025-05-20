from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from werkzeug.utils import secure_filename
import json
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuración
RASA_URL = os.environ.get("RASA_URL", "http://rasa:5005")
UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "/app/data/documents")
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Asegurar que el directorio de subida existe
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint para verificar el estado del servicio"""
    try:
        # Verificar conexión con Rasa
        rasa_status = requests.get(f"{RASA_URL}/status").json()
        
        return jsonify({
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "rasa_status": rasa_status
        })
    except Exception as e:
        logger.error(f"Error en health check: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Endpoint para enviar mensajes al asistente Rasa"""
    try:
        data = request.json
        message = data.get('message', '')
        user_id = data.get('user_id', 'default')
        
        if not message:
            return jsonify({"error": "No message provided"}), 400
        
        # Enviar mensaje a Rasa
        rasa_response = requests.post(
            f"{RASA_URL}/webhooks/rest/webhook",
            json={"sender": user_id, "message": message}
        )
        
        if not rasa_response.ok:
            return jsonify({"error": f"Rasa error: {rasa_response.status_code}"}), 500
        
        responses = rasa_response.json()
        
        # Si no hay respuestas, proporcionar una respuesta por defecto
        if not responses:
            return jsonify([{"text": "Lo siento, no pude procesar tu mensaje. ¿Podrías intentarlo de nuevo?"}])
        
        return jsonify(responses)
    
    except Exception as e:
        logger.error(f"Error en chat: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Endpoint para subir documentos"""
    try:
        # Verificar si hay un archivo en la solicitud
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        
        # Verificar si se seleccionó un archivo
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        # Verificar si el archivo tiene una extensión permitida
        if not allowed_file(file.filename):
            return jsonify({"error": f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
        
        # Guardar el archivo
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Extraer metadatos del archivo
        file_size = os.path.getsize(filepath)
        file_type = filename.rsplit('.', 1)[1].lower()
        
        return jsonify({
            "message": "File uploaded successfully",
            "filename": filename,
            "filepath": filepath,
            "size": file_size,
            "type": file_type,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error en upload_file: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/documents', methods=['GET'])
def list_documents():
    """Endpoint para listar documentos subidos"""
    try:
        documents = []
        
        # Recorrer el directorio de documentos
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            # Verificar si es un archivo y tiene una extensión permitida
            if os.path.isfile(filepath) and allowed_file(filename):
                # Obtener metadatos del archivo
                file_size = os.path.getsize(filepath)
                file_type = filename.rsplit('.', 1)[1].lower()
                modified_time = os.path.getmtime(filepath)
                modified_date = datetime.fromtimestamp(modified_time).isoformat()
                
                documents.append({
                    "filename": filename,
                    "filepath": filepath,
                    "size": file_size,
                    "type": file_type,
                    "modified": modified_date
                })
        
        return jsonify(documents)
    
    except Exception as e:
        logger.error(f"Error en list_documents: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/train', methods=['POST'])
def train_model():
    """Endpoint para entrenar el modelo de Rasa"""
    try:
        # Iniciar entrenamiento
        rasa_response = requests.post(f"{RASA_URL}/model/train")
        
        if not rasa_response.ok:
            return jsonify({"error": f"Rasa training error: {rasa_response.status_code}"}), 500
        
        return jsonify({
            "message": "Training started successfully",
            "status": rasa_response.json()
        })
    
    except Exception as e:
        logger.error(f"Error en train_model: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
