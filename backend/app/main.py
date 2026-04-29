from fastapi import FastAPI, WebSocket, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import tempfile
import soundfile as sf
import os
import requests
from app.inference import predict_emotion
from dotenv import load_dotenv

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SAMPLE_RATE = 16000
WINDOW_SECONDS = 3   
STEP_SECONDS = 1     
WINDOW_SIZE = SAMPLE_RATE * WINDOW_SECONDS
STEP_SIZE = SAMPLE_RATE * STEP_SECONDS
CONF_THRESHOLD = 0.5

load_dotenv()

# Telegram Config (Get these from @BotFather and @userinfobot)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN") # Your Telegram's bot token
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID") # Guardian's telegram chat id

@app.websocket("/ws/audio")
async def websocket_audio(ws: WebSocket):
    await ws.accept()

    buffer = []

    try:
        while True:
            data = await ws.receive_bytes()
            chunk = np.frombuffer(data, dtype=np.float32)

            buffer.extend(chunk)

            while len(buffer) >= WINDOW_SIZE:
                segment = np.array(buffer[:WINDOW_SIZE])

                # Using a context manager to ensure the temp file is handled safely
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp:
                    sf.write(temp.name, segment, SAMPLE_RATE)
                    temp_path = temp.name

                try:
                    result = predict_emotion(temp_path)
                    
                    if "confidence" in result and result["confidence"] < CONF_THRESHOLD:
                        result["top_emotion"] = "uncertain"

                    await ws.send_json(result)
                finally:
                    # Cleaning up the file after prediction
                    if os.path.exists(temp_path):
                        os.remove(temp_path)

                # Slide forward by STEP (1 sec)
                buffer = buffer[STEP_SIZE:]

    except Exception as e:
        print(f"WebSocket Error: {e}")

@app.post("/trigger-alert")
async def trigger_alert(audio: UploadFile = File(...), emotion: str = Form(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_alert:
            content = await audio.read()
            temp_alert.write(content)
            alert_path = temp_alert.name

        base_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

        # 1. Send Text
        msg = f"🚨 DISTRESS ALERT! \nEmotion: {emotion.upper()}"
        requests.get(f"{base_url}/sendMessage?chat_id={TELEGRAM_CHAT_ID}&text={msg}")

        # 2. Send Voice
        with open(alert_path, 'rb') as voice:
            requests.post(f"{base_url}/sendVoice", data={'chat_id': TELEGRAM_CHAT_ID}, files={'voice': voice})

        os.remove(alert_path)
        return {"status": "Alert sent successfully"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)


# Incoming audio stream
#         ↓
#  Append to buffer
#         ↓
#  Take 3 sec window
#         ↓
#       Predict
#         ↓
# Slide 1 sec forward
#         ↓
#       Repeat
