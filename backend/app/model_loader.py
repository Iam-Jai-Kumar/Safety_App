import os
import joblib
import numpy as np
from tensorflow.keras.models import load_model

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

model = load_model(os.path.join(BASE_DIR, "models", "model.keras"))
scaler = joblib.load(os.path.join(BASE_DIR, "models", "scaler.pkl"))
label_encoder = joblib.load(os.path.join(BASE_DIR, "models", "label_encoder.pkl"))
classes = np.load(os.path.join(BASE_DIR, "models", "classes.npy"), allow_pickle=True)
