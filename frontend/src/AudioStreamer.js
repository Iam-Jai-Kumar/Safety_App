export async function startStreaming(ws, setEmotion) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const audioContext = new AudioContext({ sampleRate: 16000 });
    await audioContext.resume();

    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(new Float32Array(input).buffer);
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEmotion(data);
    };

  } catch (err) {
    console.error("Mic error:", err);
  }
}
