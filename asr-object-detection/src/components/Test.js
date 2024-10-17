










import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import WaveSurfer from 'wavesurfer.js';
import './App.css';

const NotesBox = () => {
  return (
    <div className="small-box">
      <h3>Accuracy</h3>
      {/* Placeholder for accuracy data */}
    </div>
  );
};

const SummaryBox = ({ audioLength }) => {
  return (
    <div className="small-box">
      <h3>Wave Length</h3>
      <p>{audioLength ? `${audioLength} seconds` : 'No audio loaded'}</p>
    </div>
  );
};

const AudioRecorder = () => {
  const [waveSurfer, setWaveSurfer] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioFileUrl, setAudioFileUrl] = useState(null);
  const [audioLength, setAudioLength] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const waveSurferRef = useRef(null);

  useEffect(() => {
    const ws = WaveSurfer.create({
      container: '#waveform',
      waveColor: '#91c788',
      progressColor: '#2b4285',
      cursorColor: '#f78b38',
      barWidth: 2,
      barHeight: 1,
      height: 150,
      responsive: true,
      barRadius: 3,
    });

    setWaveSurfer(ws);
    waveSurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, []);

  const startRecording = async () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    recorder.start();
    setIsRecording(true);
    setIsPlaying(false);

    const audioChunks = [];
    recorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      setAudioBlob(audioBlob);

      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioFileUrl(audioUrl);
      waveSurfer.load(audioUrl);

      waveSurfer.on('ready', () => {
        const duration = waveSurfer.getDuration();
        setAudioLength(duration.toFixed(2));
      });
    };
  };

  const stopRecording = () => {
    SpeechRecognition.stopListening();
    setIsRecording(false);
    mediaRecorder.stop();
  };

  const handlePlayPause = () => {
    if (waveSurfer) {
      if (isPlaying) {
        waveSurfer.pause();
        setIsPlaying(false);
      } else {
        waveSurfer.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="container">
      <div className="main-content">
        <div className="feature-section">
          <NotesBox />
          <SummaryBox audioLength={audioLength} />
        </div>

        <div className="media-section">
          <div className="audio-section">
            <div id="waveform" className="waveform"></div>
            <div className="audio-controls">
              {!audioFileUrl && !isRecording && (
                <>
                  <button onClick={startRecording} className="record-btn">Start Recording</button>
                </>
              )}
              {(isRecording || audioFileUrl) && (
                <button onClick={handlePlayPause} className="play-pause-btn">
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
              )}
              {isRecording && (
                <button onClick={stopRecording} className="stop-btn">Stop Recording</button>
              )}
            </div>
          </div>
        </div>

        <div className="text-section">
          <div className="transcript-section">
            <h3 className='transcript-text'>Transcript</h3>
            <div className="transcript">
              <p>{transcript}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;
