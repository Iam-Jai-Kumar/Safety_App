import React, { useState } from "react";
import { startStreaming } from "./AudioStreamer";

function App() {
    const [emotion, setEmotion] = useState({
        emotion: "Waiting...",
        confidence: 0,
    });

    const start = () => {
        const ws = new WebSocket("ws://localhost:8000/ws/audio");

        ws.onopen = () => {
            console.log("Connected");
            startStreaming(ws, setEmotion);
        };

        ws.onerror = (err) => console.error(err);
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>🎤 Live Emotion Detection</h1>

            <button onClick={start}>Start Listening</button>

            <h2>Emotion: {emotion.emotion}</h2>
            <h3>Confidence: {emotion.confidence.toFixed(2)}</h3>
        </div>
    );
}

export default App;
