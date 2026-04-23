export async function startStreaming(ws, setEmotion) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);

    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);

        ws.send(new Float32Array(input).buffer);
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setEmotion(data);
    };
}
