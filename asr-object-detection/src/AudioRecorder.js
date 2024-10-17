import React, { useState, useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import "./App.css";
import SpinnerLoader from "./SpinnerLoader";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import audioImg from "./audio-waves.png"; // Replace with actual path
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faStop,
  faUpload,
  faMicrophone,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import "animate.css";

const NotesBox = ({ confidence }) => {
  const accuracy = (confidence * 100).toFixed(1);

  const getPathColor = (accuracy) => {
    const red = Math.max(255 - accuracy * 2.55, 0);
    const green = Math.min(accuracy * 2.55, 255);
    return `rgba(${red}, ${green}, 0, 1)`;
  };

  return (
    <div className="small-box animated fadeIn">
      <h3 className="acc-text">Transcript Accuracy</h3>
      <CircularProgressbar
        value={accuracy}
        text={`${accuracy}%`}
        styles={buildStyles({
          pathColor: getPathColor(accuracy),
          textColor: "#000",
          trailColor: "#d6d6d6",
          backgroundColor: "#3e98c7",
        })}
        className="accuracy_bar"
      />
    </div>
  );
};

const SummaryBox = ({ audioLength, audioIcon }) => (
  <div className="small-box-audio animated fadeIn">
    <img src={audioIcon} alt="Audio Icon" className="audio-icon" />
    <p>{audioLength ? audioLength + " sec" : "No audio loaded"}</p>
  </div>
);

const AudioRecorder = () => {
  const [waveSurfer, setWaveSurfer] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLength, setAudioLength] = useState(null);
  const [image, setImage] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const fileUploadRef = useRef();
  const audioFileRef = useRef();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ws = WaveSurfer.create({
      container: "#waveform",
      waveColor: "#91c788",
      progressColor: "#2b4285",
      cursorColor: "#f78b38",
      barWidth: 2,
      barHeight: 1,
      height: 150,
      responsive: true,
      barRadius: 3,
    });
    setWaveSurfer(ws);
    return () => {
      ws.destroy();
    };
  }, []);

  const startRecording = async () => {
    setAudioChunks([]);
    setIsRecording(true);
    setIsPlaying(false);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);

    recorder.ondataavailable = (event) => {
      setAudioChunks((prev) => [...prev, event.data]);
    };

    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      waveSurfer.loadBlob(audioBlob);

      waveSurfer.on("ready", () => {
        const duration = waveSurfer.getDuration();
        setAudioLength(duration.toFixed(2));
      });

      setAudioFile(audioBlob);
      audioFileRef.current = audioBlob;
    };

    recorder.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorder) mediaRecorder.stop();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file);
      audioFileRef.current = file;

      waveSurfer.loadBlob(file);
      waveSurfer.on("ready", () => {
        const duration = waveSurfer.getDuration();
        setAudioLength(duration.toFixed(2));
      });
    }
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

  const uploadImageDisplay = (event) => {
    const uploadedImage = event.target.files[0];
    if (uploadedImage) {
      const cachedURL = URL.createObjectURL(uploadedImage);
      setImage(cachedURL);
    }
  };

  const clearUploads = () => {
    setAudioFile(null);
    setAudioChunks([]);
    setIsRecording(false);
    setIsPlaying(false);
    setAudioLength(null);
    setImage(null);
    audioFileRef.current = null;
    waveSurfer.empty();
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevents the form submission from reloading the page

    if (!audioFileRef.current) {
      console.error("Audio file is required.");
      return;
    }

    const formData = new FormData();
    formData.append("audioFile", audioFileRef.current);

    const imageFile = fileUploadRef.current.files[0];
    if (image) {
      if (imageFile) {
        formData.append("imageFile", imageFile);
      } else {
        console.error("Image file is required.");
        return;
      }
    } else {
      console.error("Image file is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/process", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTranscript(data.transcript);
        setConfidence(data.overall_average_confidence);

        // Create an array with object details including name, confidence, and color
        const objectAccuracies = data.object_detection.map((object, index) => ({
          name: object,
          confidence: data.object_confidences[index],
          color: data.object_colors[object], // Get the color for the object from response
        }));
        setDetectedObjects(objectAccuracies); // Update the state with detected objects and their colors

        if (data.image_path) {
          const path = `/uploads/${data.image_path}`;
          setImage(path); // Set the path for the detected image
        }
      } else {
        console.error("Upload failed:", response.statusText);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  // const handleSubmit = async () => {
  //   if (!audioFileRef.current) {
  //     console.error("Audio file is required.");
  //     return;
  //   }

  //   const formData = new FormData();
  //   formData.append("audioFile", audioFileRef.current);

  //   const imageFile = fileUploadRef.current.files[0];
  //   if (image) {
  //     if (imageFile) {
  //       formData.append("imageFile", imageFile);
  //     } else {
  //       console.error("Image file is required.");
  //       return;
  //     }
  //   } else {
  //     console.error("Image file is required.");
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     const response = await fetch("http://127.0.0.1:5000/process", {
  //       method: "POST",
  //       body: formData,
  //       headers: {
  //         Accept: "application/json",
  //       },
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       console.log(data);
  //       setTranscript(data.transcript);
  //       setConfidence(data.overall_average_confidence);

  //       // Combine detected objects with their confidences into an array of objects
  //       const objectAccuracies = data.object_detection.map((object, index) => ({
  //         name: object,
  //         confidence: data.object_confidences[index],
  //       }));

  //       setDetectedObjects(objectAccuracies);

  //       // Assuming the server responds with an image URL
  //       if (data.image_path) {
  //         const imagePath = `/uploads/${data.image_path}`; // Use the public path
  //         setImage(imagePath); // Update image state with the full path
  //       }
  //     } else {
  //       console.error("Upload failed:", response.statusText);
  //     }
  //   } catch (error) {
  //     console.error("Error submitting form:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="container">
      <div className="sidebar">
        <button onClick={handleSubmit} className="submit-btn">
          Submit
        </button>
        <button onClick={clearUploads} className="clear-btn">
          <FontAwesomeIcon icon={faTrash} /> Clear
        </button>
        {loading && (
          <div className="spinner">
            <SpinnerLoader />
          </div>
        )}
      </div>
      <div className="main-content">
        <div className="feature-section">
          <NotesBox confidence={confidence} />
          <SummaryBox audioLength={audioLength} audioIcon={audioImg} />
        </div>

        <div className="media-section">
          <div className="audio-section">
            <div id="waveform" className="waveform"></div>
            <div className="audio-controls">
              {!audioFile && !isRecording && (
                <>
                  <button onClick={startRecording} className="record-btn">
                    <FontAwesomeIcon icon={faMicrophone} /> Start Recording
                  </button>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                    id="audio-upload"
                  />
                  <label htmlFor="audio-upload" className="upload-btn">
                    <FontAwesomeIcon icon={faUpload} /> Upload Audio
                  </label>
                </>
              )}
              {(isRecording || audioFile) && (
                <button onClick={handlePlayPause} className="play-pause-btn">
                  <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                </button>
              )}
              {isRecording && (
                <button onClick={stopRecording} className="stop-btn">
                  <FontAwesomeIcon icon={faStop} /> Stop Recording
                </button>
              )}
            </div>
          </div>

          <div className="image-upload-section">
            <input
              type="file"
              accept="image/*"
              onChange={uploadImageDisplay}
              style={{ display: "none" }}
              ref={fileUploadRef}
              id="image-upload"
            />
            <label htmlFor="image-upload" className="image-upload-label">
              {image ? (
                <img src={image} alt="Uploaded" className="uploaded-image" />
              ) : (
                <span className="image-upload-text">Upload Image</span>
              )}
            </label>
          </div>
        </div>

        <div class="transcript-container">
          <div class="transcript-section">
            <h2>Transcript</h2>
            <p>{transcript || "No transcript available."}</p>
          </div>
          <div className="object-section">
    <h3>Detected Objects</h3>
    {detectedObjects.length > 0 ? (
        <ul className="detected-objects-list">
            {detectedObjects.map((object, index) => (
                <li
                    key={index}
                    className="detected-object"
                    style={{
                        color: `rgb(${object.color[0]}, ${object.color[1]}, ${object.color[2]})`,
                    }}
                >
                    {object.name} - Confidence: {object.confidence.toFixed(2)}%
                </li>
            ))}
        </ul>
    ) : (
        <p>No objects detected.</p>
    )}
</div>

        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;
