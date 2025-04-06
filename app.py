from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai
from google.cloud import speech, texttospeech
import openai
import base64
import os
import numpy as np
import cv2
import pytesseract
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, ServiceContext
from config import AIConfig

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# ✅ Initialize Firebase
cred = credentials.Certificate("C:/Users/Keerthi Sridhar/Mentaura/mentaura/mentaura-75fa0-firebase-adminsdk-fbsvc-e0c852c9ad.json")  # Make sure this path is correct!
firebase_admin.initialize_app(cred)
db = firestore.client()

# ✅ Google Gemini API Setup
genai.configure(api_key="AIzaSyAsZSnyUJ2SjppY9GPIhBXE9JRiyiEbLTE")
model = genai.GenerativeModel("gemini-1.5-pro")

# ✅ Speech-to-Text & Text-to-Speech
speech_client = speech.SpeechClient()
tts_client = texttospeech.TextToSpeechClient()

# ✅ OpenAI API Setup
openai.api_key = "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"

# ✅ Homepage Route (Fix 404)
@app.route("/")
def home():
    return "🔥 Mentaura AI Backend is Running!"

# ✅ Function to process user input (text, image, voice)
@app.route("/process_input", methods=["POST"])
def process_input():
    data = request.json
    if "text" in data:
        return handle_text_input(data["text"])
    elif "image" in data:
        return handle_image_input(data["image"])
    elif "voice" in data:
        return handle_voice_input(data["voice"])
    return jsonify({"error": "Invalid input format"})

# ✅ Function to generate AI response (Fixed Gemini API call)
def handle_text_input(user_input):
    response = model.generate_content(user_input)  # 🔥 FIXED GEMINI CALL
    text_response = response.text
    voice_response = generate_speech(text_response)
    
    return jsonify({"text": text_response, "audio": voice_response})

# ✅ Function to extract text from an image
def handle_image_input(image_base64):
    image_data = base64.b64decode(image_base64)
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    extracted_text = pytesseract.image_to_string(img)
    return handle_text_input(extracted_text)

# ✅ Function to process voice input
def handle_voice_input(audio_base64):
    audio_data = base64.b64decode(audio_base64)
    audio_file = "user_audio.wav"
    
    with open(audio_file, "wb") as f:
        f.write(audio_data)

    with open(audio_file, "rb") as f:
        audio = speech.RecognitionAudio(content=f.read())

    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        language_code="en-US"
    )

    response = speech_client.recognize(config=config, audio=audio)
    text_input = response.results[0].alternatives[0].transcript
    return handle_text_input(text_input)

# ✅ Function to generate human-like speech (Emotional tone)
def generate_speech(text):
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US", 
        name="en-US-Standard-C",  # 🔥 More natural AI voice
        ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
    )
    audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)

    response = tts_client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)
    return base64.b64encode(response.audio_content).decode("utf-8")

# ✅ Function to recommend practice questions
@app.route("/practice_questions", methods=["POST"])
def practice_questions():
    data = request.json
    topic = data["topic"]
    
    response = model.generate_content(f"Generate 5 practice questions for {topic}")
    questions = response.text
    
    return jsonify({"questions": questions})

# ✅ Function to recommend a new topic
@app.route("/new_topic", methods=["POST"])
def new_topic():
    data = request.json
    topic = data["topic"]

    response = model.generate_content(f"Suggest a related subtopic for {topic}")
    new_topic = response.text

    return jsonify({"new_topic": new_topic})

# ✅ Function to fetch learning history
@app.route("/learning_history", methods=["POST"])
def learning_history():
    data = request.json
    username = data["username"]

    user_doc = db.collection("users").document(username).get()
    if user_doc.exists:
        return jsonify({"history": user_doc.to_dict()})
    return jsonify({"history": []})

# ✅ Function to track learning progress
@app.route("/save_progress", methods=["POST"])
def save_progress():
    data = request.json
    username = data["username"]
    topic = data["topic"]
    progress = data["progress"]

    db.collection("users").document(username).set({"topic": topic, "progress": progress}, merge=True)
    return jsonify({"message": "Progress saved successfully"})

# ✅ Function to generate images & time-lapse videos
@app.route("/generate_image", methods=["POST"])
def generate_time_lapse():
    data = request.json
    prompt = data["text"]
    
    response = openai.Image.create(
        prompt=prompt, 
        model="dall-e-3",
        n=1, 
        size="1024x1024"
    )
    image_url = response['data'][0]['url']
    return jsonify({"video_url": image_url})

def setup_ai_models():
    print("Setting up AI models...")
    return True

def generate_ai_response(message, user_id=None, context=None):
    # Simple OpenAI implementation
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": message}],
            max_tokens=500
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error generating AI response: {e}")
        return "I'm having trouble processing your request right now."

# ✅ Start the Flask app
if __name__ == "__main__":
    app.run(debug=True)

