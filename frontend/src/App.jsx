import React, { useState, useRef } from "react";
import { startStreaming } from "./AudioStreamer";

function App() {
    const [predictions, setPredictions] = useState({});
    const [topEmotion, setTopEmotion] = useState("Waiting...");
    const [confidence, setConfidence] = useState(0);
    const [isDistress, setIsDistress] = useState(false);

    const historyRef = useRef([]);
    const wsRef = useRef(null);

    // Alert System Refs
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const isAlertingRef = useRef(false); // Prevents multiple simultaneous alerts

    // Smoothing (moving average)
    const smoothPredictions = (newPreds) => {
        historyRef.current.push(newPreds);

        if (historyRef.current.length > 15) {
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

    // Alert Sending Logic
    const sendAlertToBackend = async (blob, emotion) => {
        const formData = new FormData();
        formData.append("audio", blob, "distress_signal.wav");
        formData.append("emotion", emotion);

        try {
            await fetch("http://127.0.0.1:8000/trigger-alert", {
                method: "POST",
                body: formData,
            });
            console.log("Guardian Alert Sent");
        } catch (err) {
            console.error("Failed to send alert:", err);
        } finally {
            isAlertingRef.current = false;
        }
    };

    // Audio Capture Logic
    const captureDistressAudio = (emotion) => {
        if (isAlertingRef.current) return;
        isAlertingRef.current = true;

        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                sendAlertToBackend(audioBlob, emotion);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            // Record for 5 seconds to give guardian context
            setTimeout(() => {
                if (mediaRecorder.state === "recording") mediaRecorder.stop();
            }, 5000);
        }).catch(err => {
            console.error("Mic access denied for alert:", err);
            isAlertingRef.current = false;
        });
    };

    // Distress detection → update icon state
    const checkDistress = (preds, currentTop) => {
        if (preds["fearful"] > 0.6 || preds["angry"] > 0.6) {
            // Trigger alert only if we aren't already in a distress state
            if (!isDistress) {
                captureDistressAudio(currentTop);
            }
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

                    const sortedEmotions = Object.entries(smooth).sort((a, b) => b[1] - a[1]);
                    const [sTopEmotion, sConfidence] = sortedEmotions[0];

                    let finalTop = sTopEmotion;
                    if (sConfidence < 0.4) {
                        setTopEmotion("uncertain");
                        finalTop = "uncertain";
                    } else {
                        setTopEmotion(sTopEmotion);
                    }

                    setConfidence(sConfidence);
                    checkDistress(smooth, finalTop);
                }
            });
        };

        wsRef.current = ws;
    };

    return (
        <div style={{
            backgroundColor: "#0f172a",
            color: "#f8fafc",
            minHeight: "100vh",
            fontFamily: "'Inter', sans-serif",
            padding: "60px 20px"
        }}>
            {/* Centered Header Section */}
            <div style={{
                textAlign: "center", // Centering headings
                marginBottom: "60px"
            }}>
                <h1 style={{
                    fontSize: "3.5rem",
                    fontWeight: "900",
                    letterSpacing: "-1px",
                    margin: "0",
                    background: "linear-gradient(to right, #38bdf8, #818cf8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                }}>
                    Safety App
                </h1>
                <p style={{
                    color: "#94a3b8",
                    fontSize: "1.2rem",
                    marginTop: "10px",
                    letterSpacing: "1px",
                    textTransform: "uppercase"
                }}>
                    Real-Time Emotional Intelligence
                </p>

                <button
                    onClick={start}
                    style={{
                        marginTop: "30px",
                        padding: "14px 40px",
                        borderRadius: "50px",
                        border: "none",
                        backgroundColor: "#38bdf8",
                        color: "#0f172a",
                        fontSize: "1rem",
                        fontWeight: "800",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        boxShadow: "0 0 25px rgba(56, 189, 248, 0.4)",
                        textTransform: "uppercase"
                    }}
                    onMouseOver={(e) => {
                        e.target.style.transform = "scale(1.05)";
                        e.target.style.boxShadow = "0 0 35px rgba(56, 189, 248, 0.6)";
                    }}
                    onMouseOut={(e) => {
                        e.target.style.transform = "scale(1)";
                        e.target.style.boxShadow = "0 0 25px rgba(56, 189, 248, 0.4)";
                    }}
                >
                    {wsRef.current ? "ANALYZING AUDIO..." : "START ANALYSIS"}
                </button>
            </div>

            {/* Main Horizontal Container */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "stretch",
                gap: "30px",
                maxWidth: "1200px",
                margin: "auto",
                flexWrap: "wrap"
            }}>

                {/* Left Card: Status & Top Result */}
                <div style={{
                    flex: "1",
                    minWidth: "350px",
                    background: "rgba(30, 41, 59, 0.5)",
                    padding: "50px 40px",
                    borderRadius: "28px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)",
                    display: "flex",
                    flexDirection: "column",
                    textAlign: "center"
                }}>
                    <div
                        style={{
                            width: "150px",
                            height: "150px",
                            borderRadius: "50%",
                            margin: "0 auto 40px",
                            backgroundColor: isDistress ? "#ef4444" : "#10b981",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.3rem",
                            fontWeight: "900",
                            letterSpacing: "2px",
                            boxShadow: isDistress ? "0 0 50px rgba(239, 68, 68, 0.5)" : "0 0 50px rgba(16, 185, 129, 0.5)",
                            transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
                        }}
                    >
                        {isDistress ? "DISTRESS" : "SECURE"}
                    </div>

                    <h2 style={{ color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "3px", marginBottom: "15px" }}>Detected Emotion</h2>
                    <h3 style={{ fontSize: "3rem", margin: "0", color: "#f8fafc", textTransform: "capitalize", fontWeight: "800" }}>{topEmotion}</h3>
                    <div style={{ fontSize: "1.6rem", color: "#38bdf8", fontWeight: "300", marginTop: "10px" }}>
                        {(confidence * 100).toFixed(1)}% <span style={{ fontSize: '0.9rem', color: '#475569' }}>confidence</span>
                    </div>
                </div>

                {/* Right Card: Probability Bars */}
                <div style={{
                    flex: "1.4",
                    minWidth: "400px",
                    background: "rgba(30, 41, 59, 0.5)",
                    padding: "40px",
                    borderRadius: "28px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)"
                }}>
                    <h2 style={{ textAlign: "left", marginBottom: "35px", fontSize: "1.1rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>Spectral Breakdown</h2>

                    {Object.entries(predictions).length === 0 ? (
                        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontStyle: "italic" }}>
                            Waiting for audio stream input...
                        </div>
                    ) : (
                        Object.entries(predictions).sort((a, b) => b[1] - a[1]).map(([emotion, value]) => (
                            <div key={emotion} style={{ marginBottom: "22px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "0.95rem" }}>
                                    <span style={{ textTransform: "capitalize", fontWeight: "600", color: "#cbd5e1" }}>{emotion}</span>
                                    <span style={{ color: "#64748b", fontFamily: "monospace" }}>{(value * 100).toFixed(1)}%</span>
                                </div>

                                <div style={{ height: "10px", background: "#0f172a", borderRadius: "20px", overflow: "hidden" }}>
                                    <div
                                        style={{
                                            width: `${value * 100}%`,
                                            height: "100%",
                                            background: emotion === "fearful" || emotion === "angry"
                                                ? "linear-gradient(90deg, #f87171, #ef4444)"
                                                : "linear-gradient(90deg, #34d399, #10b981)",
                                            borderRadius: "20px",
                                            transition: "width 0.5s ease-out",
                                            boxShadow: value > 0.2 ? (emotion === "fearful" || emotion === "angry" ? "0 0 12px rgba(239, 68, 68, 0.4)" : "0 0 12px rgba(16, 185, 129, 0.4)") : "none"
                                        }}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
