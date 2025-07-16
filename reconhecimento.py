import pyaudio
from PySimpleGUI import PySimpleGUI as sg
import json
import pyperclip
from vosk import Model, KaldiRecognizer

sg.theme('DarkPurple')

arquivo_txt="libras.txt" #variavel que define o nome onde a voz captada será transcrita para o arquivo

# Carrega o modelo de linguagem (pasta "modelo" precisa estar no mesmo local)
model = Model("modelo")
rec = KaldiRecognizer(model, 16000) #inicializa o reconhecimento, que transforma a voz em texto, 16000 é a taxa de 
#amostragem (16kHz)

p = pyaudio.PyAudio() # Inicializa PyAudio

# Configura o microfone #captura o som do microfone
stream = p.open(format=pyaudio.paInt16, #parâmetros -> define o formato do audio em 16 bits
                channels=1, #parâmetros -> define que o audio será em um unico canal
                rate=16000, #taxa de amostragem de 16000 Hz
                input=True, #o fluxo será usado como entrada
                frames_per_buffer=8192) #define o tamanho do buffer, ou seja quantos dados são lidos de uma vez 

#LAYOUT
layout = [
    [sg.Text('O professor disse: '), sg.Input(key='professor')],
    [sg.Multiline("", size=(60, 10), key='fala', autoscroll=True, disabled=True)],
    [sg.Button('Encerrar')]
]

janela = sg.Window('Assistente visual', layout)

fala_professor = ''

print("🎙️ Fale algo... (Ctrl+C para sair)\n")

try:
    with open("libras.txt", "w", encoding="utf-8") as f: #abre o arquivo libras para escrita 
        while True: #loop para que o microfone fique ouvindo sem parar, até que seja interrumpido
            evento, valores = janela.read(timeout=100)
            if evento == sg.WIN_CLOSED or evento == "Encerrar":
                break
            data = stream.read(4096, exception_on_overflow=False) #lê o audio envia para o vosk 
            if rec.AcceptWaveform(data): #se o modelo reconhece a frase retorna com true
                resultado = json.loads(rec.Result()) #
                texto = resultado.get("text", "")# pega o texto trasncrito da fala
                print("🗣️ Você disse:", texto) # a fala aparece no terminal
                f.write(texto + "\n") #escreve o texto no arquivo
            if texto:
                fala_professor += texto + ''
                janela['fala'].update(fala_professor)
except KeyboardInterrupt: #encerra com CTRL+C
    print("\nEncerrando...")

finally:
    stream.stop_stream() #fecha a captura do audio
    stream.close() #fecha a stream
    p.terminate() #fecha o pyaudio
    print(f"\n transcrição salva em: {arquivo_txt}")

