from fastapi import FastAPI, WebSocket
import numpy as np
import tempfile
import soundfile as sf
from app.inference import predict_emotion

app = FastAPI()

SAMPLE_RATE = 16000

WINDOW_SECONDS = 3   # match training
STEP_SECONDS = 1     # how often to predict

WINDOW_SIZE = SAMPLE_RATE * WINDOW_SECONDS
STEP_SIZE = SAMPLE_RATE * STEP_SECONDS

CONF_THRESHOLD = 0.5  # confidence threshold

@app.websocket("/ws/audio")
async def websocket_audio(ws: WebSocket):
    await ws.accept()

    buffer = []

    try:
        while True:
            data = await ws.receive_bytes()
            chunk = np.frombuffer(data, dtype=np.float32)

            buffer.extend(chunk)

            # Only process when we have enough for a full window
            while len(buffer) >= WINDOW_SIZE:

                # Take the last WINDOW (3 sec)
                segment = np.array(buffer[:WINDOW_SIZE])

                # Save temp wav
                temp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
                sf.write(temp.name, segment, SAMPLE_RATE)

                # Predict
                result = predict_emotion(temp.name)

                # Applying confidence threshold at streaming level
                if "confidence" in result:
                    if result["confidence"] < CONF_THRESHOLD:
                        result["top_emotion"] = "uncertain"

                await ws.send_json(result)

                # Slide forward by STEP (1 sec)
                buffer = buffer[STEP_SIZE:]

    except Exception as e:
        print("Disconnected:", e)


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
