
    console.log("olá, estou aqui");


    const btnStart = document.getElementById("btn-start");
    const btnStop = document.getElementById("btn-stop");
    const statusText = document.getElementById("status-text");
    const texto = document.getElementById("texto");

    let ws;
    let audioContext;
    let processor;
    let source;
// converte um array de audio em formato float 32 como valores -1.0 e 1.0 para uma array em int16 -32768 e 32767
//formato usado em arquivo WAV e transmissão de audio. 
    function convertFloat32ToInt16(buffer) {
        let l = buffer.length;//tamanho de array de entrada
        const int16Buffer = new Int16Array(l);//criando a array de numeros de bits
        for (let i = 0; i < l; i++) { //convertendo numeros flutuantes para inteiros e assim é usada para arquivos de audios tradicionais
            let s = Math.max(-1, Math.min(1, buffer[i]));
            int16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
        return int16Buffer;
    }

        btnStart.onclick = async () => {
            ws = new WebSocket("ws://127.0.0.1:8765");
            ws.binaryType = "arraybuffer";

            ws.onopen = () => {
                statusText.textContent = "Conectado ao servidor";
                btnStart.disabled = true;
                btnStop.disabled = false;
                texto.textContent = "";
                style.backgroundColor = "green";
            };

            ws.onerror = (err) => {
                statusText.textContent = "Erro no WebSocket";
                console.error(err);
            };

            ws.onclose = () => {
                statusText.textContent = "Conexão fechada";
                btnStart.disabled = false;
                btnStop.disabled = true;
            };

            ws.onmessage = (event) => {
                try {
                    const mensagem = JSON.parse(event.data);
                    if (mensagem.type === "partial") {
                        statusText.textContent = "Falando... ";
                    } else if (mensagem.type === "result" || mensagem.type === "final") {
                        // statusText.textContent = "Transcrição recebida";
                        texto.textContent += mensagem.text + "\n";
                    }
                } catch(e) {
                    console.error("Erro mensagem WS:", e);
                }
            };

            audioContext = new AudioContext({ sampleRate: 16000 });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            source = audioContext.createMediaStreamSource(stream);
            processor = audioContext.createScriptProcessor(4096, 1, 1);
            source.connect(processor);
            processor.connect(audioContext.destination);

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16Data = convertFloat32ToInt16(inputData);
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(int16Data.buffer);
                }
            };

        btnStop.onclick = () => {
            if (processor) {
                processor.disconnect();
                processor.onaudioprocess = null;
            }
            if (source) source.disconnect();
            if (audioContext) audioContext.close();
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ cmd: "eof" }));
                ws.close();
            }
            statusText.textContent = "Gravação parada";
            btnStart.disabled = false;
            btnStop.disabled = true;
            
        };
        

    }
