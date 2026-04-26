import React, { useState, useRef } from "react";
import { startStreaming } from "./AudioStreamer";

function App() {
    const [predictions, setPredictions] = useState({});
    const [topEmotion, setTopEmotion] = useState("Waiting...");
    const [confidence, setConfidence] = useState(0);
    const [isDistress, setIsDistress] = useState(false);

    const historyRef = useRef([]);
    const wsRef = useRef(null);

    // Smoothing (moving average)
    const smoothPredictions = (newPreds) => {
        historyRef.current.push(newPreds);

        if (historyRef.current.length > 5) {
            historyRef.current.shift();
        }

        const avg = {};

        historyRef.current.forEach((p) => {
            Object.keys(p).forEach((key) => {
                avg[key] = (avg[key] || 0) + p[key];
            });
        });

        Object.keys(avg).forEach((key) => {
            avg[key] /= historyRef.current.length;
        });

        return avg;
    };

    // Distress detection → update icon state
    const checkDistress = (preds) => {
        if (preds["fearful"] > 0.6 || preds["angry"] > 0.6) {
            setIsDistress(true);
        } else {
            setIsDistress(false);
        }
    };

    const start = () => {
        if (wsRef.current) return;

        const ws = new WebSocket("ws://127.0.0.1:8000/ws/audio");

        ws.onopen = () => {
            console.log("Connected");

            startStreaming(ws, (data) => {
                if (data.predictions) {
                    const smooth = smoothPredictions(data.predictions);

                    setPredictions(smooth);

                    setTopEmotion(data.top_emotion);
                    setConfidence(data.confidence);

                    checkDistress(smooth);
                }
            });
        };

        wsRef.current = ws;
    };

    return (
        <div style={{ textAlign: "center", marginTop: "40px" }}>
            <h1>Real-Time Emotion Detection</h1>

            <button onClick={start}>Start Listening</button>

            {/* Distress Indicator */}
            <div style={{ marginTop: "20px" }}>
                <h2>Status:</h2>
                <div
                    style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        margin: "auto",
                        backgroundColor: isDistress ? "red" : "green",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "18px",
                        fontWeight: "bold",
                        boxShadow: isDistress
                            ? "0 0 20px red"
                            : "0 0 20px green",
                    }}
                >
                    {isDistress ? "DISTRESS" : "SAFE"}
                </div>
            </div>

            <h2 style={{ marginTop: "20px" }}>
                Top Emotion: {topEmotion}
            </h2>
            <h3>Confidence: {(confidence * 100).toFixed(2)}%</h3>

            <h2>Emotion Probabilities</h2>

            <div style={{ width: "400px", margin: "auto" }}>
                {Object.entries(predictions).map(([emotion, value]) => (
                    <div key={emotion} style={{ marginBottom: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>{emotion}</span>
                            <span>{(value * 100).toFixed(1)}%</span>
                        </div>

                        <div
                            style={{
                                height: "12px",
                                background: "#eee",
                                borderRadius: "6px",
                            }}
                        >
                            <div
                                style={{
                                    width: `${value * 100}%`,
                                    height: "100%",
                                    background:
                                        emotion === "fearful" || emotion === "angry"
                                            ? "red"
                                            : "green",
                                    borderRadius: "6px",
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
