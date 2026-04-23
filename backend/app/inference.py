import numpy as np
from app.feature_extractor import extract_hybrid_features
from app.model_loader import model, scaler, label_encoder

def predict_emotion(file_path):
    features = extract_hybrid_features(file_path)

    if features is None:
        return {"error": "Feature extraction failed"}

    features = features.reshape(1, 128, 77)
    features = scaler.transform(features.reshape(-1, 77)).reshape(1, 128, 77)

    preds = model.predict(features)[0]

    idx = np.argmax(preds)
    emotion = label_encoder.inverse_transform([idx])[0]

    return {
        "emotion": emotion,
        "confidence": float(np.max(preds))
    }
