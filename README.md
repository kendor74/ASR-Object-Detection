# ASR Object Detection

## Project Overview

The **ASR Object Detection** project combines Automatic Speech Recognition (ASR) with real-time object detection, using a German language transcription model (Whisper) and object detection model (YOLOv5). The system listens to live audio, transcribes it into German text, and then uses the transcript to guide object detection in images. The project is designed to support German language audio input, making it a unique tool for German-language-based audio/image analysis.

This repository contains three main components:
- A **React** frontend (`asr-object-detection`) to interact with the server and visualize results.
- A **Python** backend (`whisper-server`) running Flask, which handles the Whisper ASR and YOLOv5 object detection.
- A **Colab Notebook** for testing and experimenting with the models in an isolated environment.

---

## Folder Structure

1. **React Frontend (`asr-object-detection`)**:
   - **Description**: The React app sends audio and image files to the Flask backend for processing. Once processed, it displays the object detection results along with transcriptions.
   - **Key Features**:
     - Upload audio and image files for processing.
     - Display transcribed German text from the audio.
     - Visualize detected objects in the image with bounding boxes and confidence scores.

2. **Python Backend (`whisper-server`)**:
   - **Description**: This folder contains the server-side logic, including a Flask API for handling POST requests from the frontend. It processes audio using Whisper (ASR for German transcription) and performs object detection on uploaded images using YOLOv5.
   - **Key Features**:
     - **Transcription**: Converts German audio into text using Whisper.
     - **Object Detection**: Detects objects from images based on the transcribed text, filtering relevant objects using YOLOv5.
     - **API Endpoints**:
       - `/transcribe_chunk`: Handles real-time audio chunk transcription.
       - `/process`: Processes both audio and image files, returning detected objects and transcriptions.

To add a Google Colab button (icon) similar to modern GitHub repositories, you can use Markdown with a linked image to the Colab badge. Here's how you can do it:

3. **Notebook Folder**  
   - **Description**: This folder contains a Jupyter notebook specifically designed for running and experimenting with Whisper and YOLOv5 models in Google Colab. It provides users with an interactive environment to test, evaluate, and validate the models on their own data.
     
   - **Key Features**:
     - Directly load and test the Whisper ASR and YOLOv5 object detection models on custom data in Google Colab.
     - Evaluate performance, experiment with hyperparameters, and visualize object detection results.
     
### Access the Colab Notebook:  
You can access the Colab notebook by clicking the button below:

<div align="right">
  <a href="https://colab.research.google.com/drive/1zpemzaIv8RJTWa2G-fJ-iusAhffllLPW?usp=sharing" target="_blank">
    <img
      src="https://colab.research.google.com/assets/colab-badge.svg"
      alt="Open in Colab" width="120px"/>
  </a>
</div>

---



## Installation

### Requirements
To get started with this project, you’ll need the following installed:

- Python 3.8+
- Node.js
- `pip` (Python package installer)

The project also includes a `requirements.txt` file listing all the necessary Python dependencies, and the frontend requires a `package.json` with the Node dependencies.

### Setup Instructions

#### 1. Clone the Repository
```bash
git clone https://github.com/your-repo/asr-object-detection.git
cd asr-object-detection
```

#### 2. Install Backend Dependencies
Navigate to the `whisper-server` folder and install the Python dependencies:
```bash
cd whisper-server
pip install -r requirements.txt
```

#### 3. Install Frontend Dependencies
Navigate to the `asr-object-detection` React folder and install the Node dependencies:
```bash
cd ../asr-object-detection
npm install
```

#### 4. Running the Flask Server
Once the dependencies are installed, start the Python Flask server in the `whisper-server` folder:
```bash
cd whisper-server
python app.py
```
This will run the server on `http://localhost:5000`.

#### 5. Running the React Frontend
To launch the frontend application, run the following in the `asr-object-detection` folder:
```bash
cd ../asr-object-detection
npm start
```
The frontend should now be accessible at `http://localhost:3000`.

---

## How It Works

1. **Audio Transcription**: The user uploads a German audio file. The backend uses **Whisper** to transcribe the audio into German text. 
2. **Object Detection**: The transcribed German text guides **YOLOv5** to detect objects in an uploaded image. Detected objects are then highlighted with bounding boxes and displayed to the user.
3. **Real-Time Transcription**: The backend supports real-time transcription of audio chunks, which can be useful for live audio feeds.

---

## API Documentation

The Flask backend exposes the following API endpoints:

### 1. `/transcribe_chunk` (POST)
- **Description**: Processes an audio chunk and returns its transcription.
- **Parameters**: 
  - `audio` (File): The audio file to be transcribed.
- **Response**:
  ```json
  {
    "transcription": "German text transcription"
  }
  ```

### 2. `/process` (POST)
- **Description**: Processes both audio and image files. It returns the transcription of the audio and detected objects from the image based on the transcript.
- **Parameters**:
  - `audioFile` (File): The audio file to be transcribed.
  - `imageFile` (File): The image file for object detection.
- **Response**:
  ```json
  {
    "transcript": "German text transcription",
    "overall_average_confidence": 0.98,
    "image_path": "detected_image.jpg",
    "object_detection": ["Person", "Auto"],
    "object_confidences": [0.92, 0.87],
    "object_colors": {"Person": [255, 0, 0], "Auto": [0, 255, 0]}
  }
  ```

---

## Testing the Real-Time Transcription

The project includes a Python script for simulating real-time audio streaming and transcription. This client-side script uses the `sounddevice` library to capture audio and send it in chunks to the Flask server for transcription.

### Running the Real-Time Client

1. Make sure the Flask server is running.
2. Run the client script for real-time transcription:
   ```bash
   python client.py
   ```

This will continuously record audio and send chunks to the server for transcription, printing the transcriptions as they are returned.

---

## Contributing

We welcome contributions to this project! If you'd like to contribute:
1. Fork the repository.
2. Create a new branch with your feature or bug fix.
3. Submit a pull request.

---


## Authors

- [Kendor](https://github.com/kendor74)
- [Nada](https://github.com/nada19885)