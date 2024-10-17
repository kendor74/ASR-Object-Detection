import sounddevice as sd
import numpy as np
import requests
import wave
import io
import threading
import queue
import time

# Configuration
SAMPLE_RATE = 16000  # Sample rate for audio recording
CHUNK_DURATION = 4  # Duration of each chunk in seconds
SERVER_URL = "http://localhost:5000/transcribe_chunk"  # Server URL
SAMPLE_WIDTH = 2  # Bytes per sample (16-bit audio)

# Queue to hold audio chunks to be sent
audio_queue = queue.Queue()

def record_audio_stream(q, chunk_duration, sample_rate):
    """Continuously record audio and place chunks into the queue."""
    chunk_size = int(chunk_duration * sample_rate)
    print("Starting to record audio...")

    def callback(indata, frames, time, status):
        if status:
            print(f"Recording error: {status}")
        # Put the audio data into the queue in chunks
        q.put(indata.copy())

    # Start non-blocking recording
    with sd.InputStream(samplerate=sample_rate, channels=1, dtype='float32', blocksize=chunk_size, callback=callback):
        while True:
            time.sleep(0.1)  # Keep the main thread alive

def save_audio_to_wav(audio_data, sample_rate):
    """Save the recorded audio chunk to a WAV format in memory."""
    byte_io = io.BytesIO()
    with wave.open(byte_io, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(SAMPLE_WIDTH)  # 16-bit audio
        wav_file.setframerate(sample_rate)
        # Convert from float32 (-1.0 to 1.0) to int16 (-32768 to 32767)
        wav_file.writeframes((audio_data * 32767).astype(np.int16).tobytes())
    byte_io.seek(0)
    return byte_io

def send_audio_chunk_to_server(audio_chunk, sample_rate):
    """Send the audio chunk to the server."""
    wav_io = save_audio_to_wav(audio_chunk, sample_rate)

    try:
        files = {'audio': ('chunk.wav', wav_io, 'audio/wav')}
        response = requests.post(SERVER_URL, files=files)
        if response.ok:
            transcription = response.json().get('transcription', '')
            print(f"Transcription: {transcription}")
        else:
            print(f"Server error: {response.status_code}")
    except Exception as e:
        print(f"Failed to send audio chunk: {str(e)}")

def process_audio_chunks(q):
    """Continuously process audio chunks from the queue and send them to the server."""
    while True:
        audio_chunk = q.get()
        if audio_chunk is None:
            break  # Exit when None is received
        send_audio_chunk_to_server(audio_chunk, SAMPLE_RATE)
        q.task_done()

def main():
    # Start the thread that sends audio chunks to the server
    threading.Thread(target=process_audio_chunks, args=(audio_queue,), daemon=True).start()

    # Start recording audio and queuing chunks
    record_audio_stream(audio_queue, CHUNK_DURATION, SAMPLE_RATE)

if __name__ == "__main__":
    try:
        print("Press Ctrl+C to stop recording...")
        main()
    except KeyboardInterrupt:
        print("Recording stopped.")
