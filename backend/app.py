from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
import os
from dotenv import load_dotenv
import logging
from services.ai_service import AIService
from services.speech_service import SpeechService
import json

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variable to track if services are loaded
services_loaded = False

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('mentaura')

# Initialize services
ai_service = AIService()
speech_service = SpeechService()

# Homepage Route - this is a simple health check endpoint
@app.route("/")
def home():
    return "🔥 Mentaura AI Backend is Running!"

# Lazy-load services to prevent circular imports
def load_services():
    global services_loaded
    if services_loaded:
        return
        
    # Import service modules
    try:
        from services.auth_service import init_firebase
        from services.ai_service import setup_ai_models
        from services.speech_service import setup_speech_services

        # Import route modules
        from routes.auth_routes import auth_bp
        from routes.learning_routes import learning_bp
        from routes.ai_routes import ai_bp
        from routes.game_routes import game_bp

        # Initialize Firebase
        try:
            db = init_firebase()
        except Exception as e:
            print(f"Firebase initialization error: {e}")
            
        # Setup AI models
        try:
            ai_models = setup_ai_models()
        except Exception as e:
            print(f"AI model setup error: {e}")
            
        # Setup Speech Services
        try:
            speech_services = setup_speech_services()
        except Exception as e:
            print(f"Speech service setup error: {e}")

        # Register blueprints
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(learning_bp, url_prefix='/api/learning')
        app.register_blueprint(ai_bp, url_prefix='/api/ai')
        app.register_blueprint(game_bp, url_prefix='/api/games')
        
        services_loaded = True
    except Exception as e:
        print(f"Error loading services: {e}")
        
# Health check endpoint
@app.route("/health")
def health_check():
    """
    Health check endpoint to verify server status
    """
    return jsonify({
        "status": "ok", 
        "version": "1.0.0",
        "services_loaded": services_loaded
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "error": "Resource not found",
        "status": 404
    }), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({
        "error": "Internal server error",
        "status": 500
    }), 500

# Socket.IO events for real-time communication
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    # Try to load services when a client connects
    load_services()

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('message')
def handle_message(data):
    # Process message and emit response
    print(f"Received message: {data}")
    # You can call your AI service here and emit the response
    # socketio.emit('response', response_data)

@app.route('/api/ai/process-text', methods=['POST'])
def process_text():
    """Process text input for AI responses"""
    try:
        # Get request data
        data = request.json
        text = data.get('text', '')
        user_id = data.get('userId', 'anonymous')
        learning_type = data.get('learningType', 'General')
        generate_notes = data.get('generateStructuredNotes', False)
        generate_emotion = data.get('generateEmotionalSpeech', True)
        include_images = data.get('includeImages', False)
        
        logger.info(f"Processing text request for user {user_id}: {text[:30]}...")
        
        # Process the text with AI service
        response_text = ai_service.query_gemini(text)
        
        # Prepare response
        response = {
            "text": response_text,
            "isOnline": True
        }
        
        # Add emotion if requested
        if generate_emotion:
            # Determine appropriate emotion
            if "error" in response_text.lower() or "sorry" in response_text.lower():
                response["emotion"] = "concerned"
            elif any(word in text.lower() for word in ["how", "why", "what", "explain"]):
                response["emotion"] = "thoughtful"
            elif any(word in text.lower() for word in ["thanks", "thank", "appreciate"]):
                response["emotion"] = "happy"
            elif any(word in text.lower() for word in ["amazing", "wow", "cool", "awesome"]):
                response["emotion"] = "excited"
            else:
                response["emotion"] = "neutral"
        
        # Generate structured notes if requested
        if generate_notes:
            structured_notes = {
                "title": ai_service._extract_title(response_text),
                "keyPoints": ai_service._extract_key_points(response_text, 3),
                "details": ai_service._extract_details(response_text)
            }
            response["structuredNotes"] = structured_notes
            
            # Add images if requested
            if include_images:
                response["images"] = [
                    {"url": "https://via.placeholder.com/500x300?text=Mentaura+Learning+Visual", 
                     "caption": "Illustrative image for " + structured_notes["title"]}
                ]
        
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error in process_text: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/services', methods=['GET'])
def get_services():
    """Return available services and their status"""
    services = {
        "ai": {
            "gemini": ai_service.gemini_model is not None,
            "openai": bool(os.environ.get("OPENAI_API_KEY"))
        },
        "speech": {
            "googleTTS": speech_service.tts_client is not None,
            "edgeTTS": True,  # Edge TTS is always available as fallback
            "elevenlabs": bool(speech_service.elevenlabs_api_key)
        }
    }
    return jsonify(services)

@app.route('/api/speech-to-text', methods=['POST'])
async def speech_to_text():
    """Convert speech to text"""
    try:
        data = request.json
        audio_data = data.get('audio')
        
        if not audio_data:
            return jsonify({"error": "No audio data provided"}), 400
        
        # Initialize speech service if needed
        if not speech_service.stt_client:
            speech_service.init_google_speech()
        
        # Process speech to text
        transcript = await speech_service.speech_to_text(audio_data)
        
        return jsonify({"text": transcript})
    except Exception as e:
        logger.error(f"Error in speech_to_text: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/text-to-speech', methods=['POST'])
async def text_to_speech():
    """Convert text to speech"""
    try:
        data = request.json
        text = data.get('text')
        voice_settings = data.get('voiceSettings')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        # Initialize TTS service if needed
        if not speech_service.tts_client:
            speech_service.init_google_tts()
        
        # Process text to speech
        audio_base64 = await speech_service.text_to_speech(text, voice_settings)
        
        if not audio_base64:
            return jsonify({"error": "Failed to generate speech"}), 500
        
        return jsonify({"audio": audio_base64})
    except Exception as e:
        logger.error(f"Error in text_to_speech: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Start the Flask app
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # Load services at startup
    load_services()
    socketio.run(app, host="0.0.0.0", port=port, debug=True, allow_unsafe_werkzeug=True) 