import numpy as np
from app.feature_extractor import extract_hybrid_features
from app.model_loader import model, scaler, label_encoder

def predict_emotion(file_path):
    try:
        features = extract_hybrid_features(file_path)

        if features is None:
            return {"error": "Feature extraction failed"}

        features = features.reshape(1, 128, 77)
        features = scaler.transform(features.reshape(-1, 77)).reshape(1, 128, 77)

        preds = model.predict(features)[0]

        labels = label_encoder.classes_

        prediction_dict = {
            str(label): float(prob)
            for label, prob in zip(labels, preds)
        }

        top_idx = np.argmax(preds)
        top_emotion = labels[top_idx]
        confidence = float(preds[top_idx])

        print(confidence, top_emotion, prediction_dict)

        # Confidence threshold
        if confidence < 0.6:
            return {
                "predictions": prediction_dict,
                "top_emotion": "uncertain",
                "confidence": confidence
            }

        return {
            "predictions": prediction_dict,
            "top_emotion": top_emotion,
            "confidence": confidence
        }

    except Exception as e:
        print("Prediction error:", e)
        return {"error": str(e)}
