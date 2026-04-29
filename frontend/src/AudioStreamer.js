export async function startStreaming(ws, setEmotion) {
  try {
    // Request Microphone Access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Setup Audio Context (Forcing 16kHz to match Wav2Vec2 requirement)
    const audioContext = new AudioContext({
      sampleRate: 16000,
      latencyHint: 'interactive'
    });

    await audioContext.resume();

    const source = audioContext.createMediaStreamSource(stream);

    /**
     * Using ScriptProcessor as a reliable fallback for real-time streaming 
     * in simple React setups, but ensuring we use a standard buffer size 
     * to prevent audio dropouts.
     */
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);

      // Check if WebSocket is ready before sending
      if (ws.readyState === WebSocket.OPEN) {
        // Sending as binary (Float32Array)
        ws.send(new Float32Array(input).buffer);
      }
    };

    // Handling incoming predictions from Backend
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEmotion(data);
      } catch (err) {
        console.error("Error parsing prediction data:", err);
      }
    };

    // Handling Socket Closure
    ws.onclose = () => {
      console.warn("WebSocket Closed. Stopping audio stream...");
      stream.getTracks().forEach(track => track.stop());
      processor.disconnect();
      source.disconnect();
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

  } catch (err) {
    console.error("Mic access or streaming error:", err);
    alert("Could not access microphone. Please check permissions.");
  }
}
