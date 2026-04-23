# Real-Time Speech Emotion Recognition System

A real-time Speech Emotion Recognition (SER) system designed to enhance personal safety by detecting distress signals (fear, anger) directly from voice without requiring manual intervention.

# Problem Statement

Traditional safety systems (apps, helplines) fail when:  

Victim cannot access phone  
User is incapacitated by fear  
No reliable bystander intervention  

This project addresses that gap by automatically detecting emotional distress from speech in real time.  

# Solution Overview

We built a hybrid deep learning pipeline that:  

Captures live audio from microphone (React frontend)  
Streams audio via WebSockets  
Processes audio using advanced feature extraction  
Predicts emotional state using a CNN + BiLSTM model  

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
Stage	Description	                    Accuracy     
1	    MFCC only	                    50.56%  
2	    Hybrid features + CNN-BiLSTM	77.78%  
3	    Improved features	            82.6%  
4	    Multi-dataset training	        88.82%

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
CNN + BiLSTM Model  
      ↓
Emotion Prediction   
      ↓
Frontend Display  

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

git clone https://github.com/your-username/ser-realtime-app.git  
cd Safety_App  

2. Backend Setup  

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

3. Frontend Setup  

cd frontend  
npm install  
npm start  

API Endpoints:  
WebSocket  
ws://localhost:8000/ws/audio  

# Important Notes  
Ensure model files are placed in:  
backend/models/  

Match sample rate:  
Frontend: 16000 Hz  
Backend: 16000 Hz  

# Future Improvements

Emergency alert system (SMS/WhatsApp)  
Mobile deployment (React Native)  
TensorFlow Lite optimization  
Multi-language emotion calibration  
Accuracy > 90%  

# Contributing

Contributions are welcome! Feel free to fork and submit a PR.  

# License

This project is for academic and research purposes.  
