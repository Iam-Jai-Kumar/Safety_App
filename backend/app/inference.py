import numpy as np
from app.feature_extractor import extract_hybrid_features
from app.model_loader import model, scaler, label_encoder

from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2ForSequenceClassification
import librosa
import torch

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

USE_PRETRAINED = False # Toggle this to use the pretrained model

if USE_PRETRAINED:
    model_path = r"F:\Safety_App\backend\wav2vec"
    feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_path)

    model = Wav2Vec2ForSequenceClassification.from_pretrained(model_path)
    model.to(device)
    model.eval()

    def predict_emotion(file_path):
        try:
            #  Load and Preprocess Audio
            audio, rate = librosa.load(file_path, sr=16000)
            inputs = feature_extractor(audio, sampling_rate=rate, return_tensors="pt", padding=True)
            inputs = inputs.input_values.to(device) # Ensure GPU usage if available

            # Inference
            with torch.no_grad():
                outputs = model(inputs)
                probs = torch.nn.functional.softmax(outputs.logits, dim=-1).cpu().numpy()[0]

            labels = label_encoder.classes_
            
            prediction_dict = {
                str(label): float(prob)
                for label, prob in zip(labels, probs)
            }

            top_idx = np.argmax(probs)
            top_emotion = labels[top_idx]
            confidence = float(probs[top_idx])

            # print(f"Confidence: {confidence:.2f}, Emotion: {top_emotion}")

            return {
                "predictions": prediction_dict,
                "top_emotion": top_emotion,
                "confidence": confidence
            }

        except Exception as e:
            print("Prediction error:", e)
            return {"error": str(e)}

else:
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

            # print(confidence, top_emotion, prediction_dict)

            return {
                "predictions": prediction_dict,
                "top_emotion": top_emotion,
                "confidence": confidence
            }

        except Exception as e:
            print("Prediction error:", e)
            return {"error": str(e)}