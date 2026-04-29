# Real-Time Speech Emotion Recognition System

An advanced Speech Emotion Recognition (SER) system that acts as a 24/7 vocal bodyguard. By utilizing a hybrid Deep Learning pipeline, it detects emotional distress (fear, anger) in real-time and automatically notifies guardians via Telegram with a voice recording of the incident.

# Problem Statement

Traditional safety systems (apps, helplines) fail when:  

Victim cannot access phone  
User is incapacitated by fear  
No reliable bystander intervention  

This project addresses that gap by automatically detecting emotional distress from speech in real time and sending the alerts to the guardians and authorities.

# Solution Overview

We built a hybrid deep learning pipeline that:  

Captures live audio from microphone (React frontend)  
Streams audio via WebSockets  
Processes audio using advanced feature extraction  
Predicts emotional state using a CNN + BiLSTM model  or a fine-tuned Wav2Vec 2.0 Transformer model.
Dispatches automated Telegram alerts (Voice + Text) upon distress detection.

# Model Architecture
## Input Features (77 total):  
MFCC + Delta + Delta-Delta  
Chroma features  
RMS Energy  
Spectral Centroid, Bandwidth, Rolloff  
Zero Crossing Rate  

## Model:  
CNN (spatial features)  
Bidirectional LSTM (temporal patterns)  
Dense layers for classification  

# Performance Progression
Stage	Description	                             Accuracy     
1	    MFCC only	                        50.56%  
2	    Hybrid features + CNN-BiLSTM	      77.78%  
3	    Improved features	                  82.6%  
4	    Multi-dataset training	            88.82%

# Datasets Used
RAVDESS  
TESS  
SAVEE  
CREMA-D  
EMO-DB  
ESD  
Hindi Dataset  
JL Corpus  

# Tech Stack
## Backend:  
FastAPI  
TensorFlow / Keras  
Librosa  
WebSockets  
Telegram BOT API (Alerting)  
PyTorch (Wav2Vec2)  

## Frontend:  
React  
Web Audio API  
WebSocket streaming  

# System Architecture
Microphone (Browser)  
      ↓  
React (Web Audio API)  
      ↓  
WebSocket (Real-time streaming)  
      ↓  
FastAPI Backend  
      ↓  
Feature Extraction (Librosa)  
      ↓  
CNN + BiLSTM Model OR fine-tuned Wav2Vec 2.0 Transformer model.
      ↓  
Emotion Prediction   
      ↓  
Frontend Display  
      ↓  
Send Alerts (If Distress detected)

# Real-Time Processing
Sliding Window:  
Window size: 3 seconds  
Step size: 1 second  

Ensures:  
High accuracy  
Smooth predictions  
Low latency  

# Setup Instructions

1. Clone Repository  

git clone https://github.com/Iam-Jai-Kumar/Safety_App  
cd Safety_App  

2. Set the Environment Variables  

Create a .env in the backend folder with:  
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=guardians_telegram_chat_id_here

3. Backend Setup  

Toggle model in app/inference.py via USE_PRETRAINED = True. (If want to use fine-tuned Wav2Vec 2.0 Transformer model.)  

cd backend  

Make a virtual environment:  
python -m venv venv  

Activate virtual environment:  
venv\Scripts\activate   # Windows  
source venv/bin/activate  # Mac/Linux  

Install dependencies:  
pip install -r requirements.txt  
pip install "uvicorn[standard]"  

Run backend:  
uvicorn app.main:app --reload  

4. Frontend Setup  

cd frontend  
npm install  
npm start  

### API Endpoints
- **WebSocket (Real-time Streaming):**  
  `ws://localhost:8000/ws/audio`
- **HTTP POST (Emergency Alerts):**  
  `http://localhost:8000/trigger-alert`


# Important Notes  
Ensure model files are placed in:  
backend/models/  (model.keras, scaler.pkl and label_encoder.pkl)
and  
backend/wav2vec/  (pytorch_model.bin OR model.safetensors, config.json and preprocessor_config.json)

Match sample rate:  
Frontend: 16000 Hz  
Backend: 16000 Hz  

# Future Improvements

Mobile deployment (React Native)  
TensorFlow Lite optimization  
Multi-language emotion calibration  
Accuracy > 90%  
Optimization for background silence detection.

# Contributing

Contributions are welcome! Feel free to fork and submit a PR.  

# License

This project is for academic and research purposes.  
