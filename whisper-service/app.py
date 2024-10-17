from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import torch
import whisper
import os
import cv2
import random
import string
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Load Whisper model
whisper_model = whisper.load_model("small")

try:
    model = torch.hub.load('ultralytics/yolov5', 'yolov5s')
    print("YOLOv5 loaded successfully.")
except Exception as e:
    print(f"Error loading YOLOv5: {e}")

# Ensure a folder to store uploaded files exists
UPLOAD_FOLDER = './uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# German labels to COCO class IDs
german_to_id = {
    0: "Person",
    1: "Fahrrad",
    2: "Auto",
    3: "Motorrad",
    4: "Flugzeug",
    5: "Bus",
    6: "Zug",
    7: "Lastwagen",
    8: "Boot",
    9: "Ampel",
    10: "Hydrant",
    11: "Stoppschild",
    12: "Parkuhr",
    13: "Bank",
    14: "Vogel",
    15: "Katze",
    16: "Hund",
    17: "Pferd",
    18: "Schaf",
    19: "Kuh",
    20: "Elefant",
    21: "Bär",
    22: "Zebra",
    23: "Giraffe",
    24: "Rucksack",
    25: "Regenschirm",
    26: "Handtasche",
    27: "Krawatte",
    28: "Koffer",
    29: "Frisbee",
    30: "Ski",
    31: "Snowboard",
    32: "Sportball",
    33: "Drachen",
    34: "Baseballschläger",
    35: "Baseballhandschuh",
    36: "Skateboard",
    37: "Surfbretter",
    38: "Tennisschläger",
    39: "Flasche",
    40: "Weinglas",
    41: "Tasse",
    42: "Gabel",
    43: "Messer",
    44: "Löffel",
    45: "Schüssel",
    46: "Banane",
    47: "Apfel",
    48: "Sandwich",
    49: "Orange",
    50: "Brokkoli",
    51: "Karotte",
    52: "Hotdog",
    53: "Pizza",
    54: "Donut",
    55: "Kuchen",
    56: "Stuhl",
    57: "Sofa",
    58: "Blumentopf",
    59: "Bett",
    60: "Esstisch",
    61: "Toilette",
    62: "Fernseher",
    63: "Laptop",
    64: "Maus",
    65: "Fernbedienung",
    66: "Tastatur",
    67: "Handy",
    68: "Mikrowelle",
    69: "Ofen",
    70: "Toaster",
    71: "Spüle",
    72: "Kühlschrank",
    73: "Buch",
    74: "Uhr",
    75: "Vase",
    76: "Schere",
    77: "Teddybär",
    78: "Haartrockner",
    79: "Zahnbürste"
}

def generate_unique_color(existing_colors):
    distinct_colors = [
        (255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0), (255, 0, 255),
        (0, 255, 255), (128, 0, 128), (128, 128, 0), (0, 128, 128), (255, 165, 0)
    ]
    random.shuffle(distinct_colors)
    for color in distinct_colors:
        if color not in existing_colors:
            return color
    return tuple(random.randint(0, 255) for _ in range(3))

def detect_objects(image_path, german_text):
    img = cv2.imread(image_path)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    with torch.no_grad():
        results = model(img_rgb)

    df = results.pandas().xyxy[0]
    object_ids = []
    detected_objects = []
    confidences = []
    object_colors = {}

    german_text_cleaned = german_text.translate(str.maketrans('', '', string.punctuation))

    for word in german_text_cleaned.split():
        for key, value in german_to_id.items():
            if word.lower() == value.lower():
                object_ids.append(key)

    for _, row in df.iterrows():
        if int(row['class']) in object_ids:
            x1, y1, x2, y2 = int(row['xmin']), int(row['ymin']), int(row['xmax']), int(row['ymax'])
            label = german_to_id[int(row['class'])]
            confidence = row['confidence']

            if label not in object_colors:
                object_colors[label] = generate_unique_color(object_colors.values())

            color = object_colors[label]
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
            cv2.putText(img, f"{label}: {confidence:.2f}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            detected_objects.append(label)
            confidences.append(confidence)

    detected_image_path = os.path.join(UPLOAD_FOLDER, "detected_" + os.path.basename(image_path))
    cv2.imwrite(detected_image_path, img)

    object_colors_serialized = {label: list(color) for label, color in object_colors.items()}
    path = "detected_" + os.path.basename(image_path)
    return path, detected_objects, confidences, object_colors_serialized

@app.route("/transcribe_chunk", methods=["POST"])
def transcribe_chunk():
    audio_file = request.files.get('audio')

    if audio_file is None:
        return jsonify({'error': 'No audio file provided'}), 400

    try:
        audio_path = os.path.join(UPLOAD_FOLDER, "temp_audio_chunk.wav")
        audio_file.save(audio_path)

        segments = whisper_model.transcribe(audio_path, language='de')
        transcription = segments['text']

        os.remove(audio_path)  # Clean up the temporary file

        return jsonify({'transcription': transcription}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/process', methods=['POST'])
def process():
    audio_file = request.files.get('audioFile')
    image_file = request.files.get('imageFile')

    if not audio_file or not image_file:
        return jsonify(error='Both audio and image files are required.'), 400

    audio_filename = secure_filename(f"{random.randint(1000,9999)}_{audio_file.filename}")
    image_filename = secure_filename(f"{random.randint(1000,9999)}_{image_file.filename}")

    audio_filepath = os.path.join(UPLOAD_FOLDER, audio_filename)
    image_filepath = os.path.join(UPLOAD_FOLDER, image_filename)

    audio_file.save(audio_filepath)
    image_file.save(image_filepath)

    transcript = ""
    overall_confidence = 0

    try:
        result = whisper_model.transcribe(audio_filepath, language='de')
        transcript = result['text']
        total_confidence = sum([1 - seg['no_speech_prob'] for seg in result['segments']])
        overall_confidence = total_confidence / len(result['segments']) if result['segments'] else 0
    except Exception as e:
        return jsonify(error='Failed to process the audio file: {}'.format(str(e))), 500
    finally:
        os.remove(audio_filepath)

    try:
        detected_img_path, objects, obj_accuracy, object_colors = detect_objects(image_filepath, transcript)
    except Exception as e:
        return jsonify(error='Failed to process the image file: {}'.format(str(e))), 500
    finally:
        os.remove(image_filepath)

    response = {
        "transcript": transcript,
        "overall_average_confidence": overall_confidence,
        "image_path": detected_img_path,
        "object_detection": objects,
        "object_confidences": obj_accuracy,
        "object_colors": object_colors
    }

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
