from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import librosa
import numpy as np
import tempfile
import os
import cv2
import concurrent.futures

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

print("Loading Whisper model...")
whisper_model = whisper.load_model("tiny")
print("✅ Whisper model loaded!")

# OpenCV face detector — no extra installs needed
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
print("✅ Face detector loaded!")


def analyze_audio(audio_path):
    try:
        result     = whisper_model.transcribe(audio_path)
        transcript = result["text"]

        y, sr = librosa.load(audio_path)

        duration_minutes = librosa.get_duration(y=y, sr=sr) / 60
        word_count       = len(transcript.split())
        wpm              = round(word_count / max(duration_minutes, 0.01))

        rms          = librosa.feature.rms(y=y)[0]
        avg_energy   = float(np.mean(rms))
        energy_score = min(100, round(avg_energy * 5000))

        silence_threshold = 0.01
        silent_frames     = np.sum(rms < silence_threshold)
        silence_ratio     = round(float(silent_frames / len(rms)) * 100)

        pitches, _      = librosa.piptrack(y=y, sr=sr)
        pitch_values    = pitches[pitches > 0]
        pitch_variation = round(float(np.std(pitch_values))) if len(pitch_values) > 0 else 0

        return {
            "transcript":       transcript,
            "wpm":              wpm,
            "energy_score":     energy_score,
            "silence_ratio":    silence_ratio,
            "pitch_variation":  pitch_variation,
            "word_count":       word_count,
            "duration_seconds": round(librosa.get_duration(y=y, sr=sr)),
        }

    except Exception as e:
        print(f"Audio analysis error: {e}")
        return {
            "transcript":       "",
            "wpm":              0,
            "energy_score":     0,
            "silence_ratio":    0,
            "pitch_variation":  0,
            "word_count":       0,
            "duration_seconds": 0,
        }


def analyze_video(video_path):
    try:
        cap          = cv2.VideoCapture(video_path)
        frame_count  = 0
        faces_found  = 0
        total_samples = 0
        sample_every = 60
        max_samples  = 10

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frame_count += 1
            if frame_count % sample_every != 0:
                continue
            if total_samples >= max_samples:
                break

            total_samples += 1
            gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            if len(faces) > 0:
                faces_found += 1

        cap.release()

        presence_ratio   = (faces_found / max(total_samples, 1)) * 100
        engagement_score = round(presence_ratio)
        confidence_score = round(presence_ratio * 0.8)

        return {
            "dominant_emotion":  "neutral",
            "confidence_score":  min(100, confidence_score),
            "engagement_score":  min(100, engagement_score),
            "emotion_breakdown": {
                "engaged": round(presence_ratio),
                "neutral": round(100 - presence_ratio),
            },
        }

    except Exception as e:
        print(f"Video analysis error: {e}")
        return {
            "dominant_emotion":  "neutral",
            "confidence_score":  0,
            "engagement_score":  0,
            "emotion_breakdown": {},
        }


def generate_insights(audio, video):
    insights        = []
    recommendations = []

    if audio["wpm"] > 160:
        insights.append("Speaking pace is fast — may be hard to follow")
        recommendations.append("Try slowing down to 120-140 words per minute")
    elif audio["wpm"] < 80:
        insights.append("Speaking pace is slow")
        recommendations.append("Increase pace slightly to maintain listener engagement")
    else:
        insights.append("Speaking pace is well-balanced")

    if audio["silence_ratio"] > 40:
        insights.append("High silence ratio detected — possible hesitation")
        recommendations.append("Practice reducing filler pauses")

    if audio["energy_score"] < 30:
        insights.append("Low vocal energy detected")
        recommendations.append("Project your voice with more confidence")

    if video["confidence_score"] < 40:
        insights.append("Facial expressions suggest low confidence")
        recommendations.append("Maintain eye contact and smile naturally")

    if video["engagement_score"] > 70:
        insights.append("High facial engagement throughout the session")

    overall_score = round(
        (audio["energy_score"]     * 0.25) +
        (video["confidence_score"] * 0.35) +
        (video["engagement_score"] * 0.25) +
        (min(100, audio["wpm"])    * 0.15)
    )

    return {
        "overall_score":   overall_score,
        "insights":        insights,
        "recommendations": recommendations,
    }


@app.route("/analyze", methods=["POST"])
def analyze():
    audio_file = request.files.get("audio")
    video_file = request.files.get("video")
    results    = {}
    audio_path = None
    video_path = None

    if audio_file:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            audio_file.save(f.name)
            audio_path = f.name

    if video_file:
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            video_file.save(f.name)
            video_path = f.name

    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = {}
        if audio_path:
            futures["audio"] = executor.submit(analyze_audio, audio_path)
        if video_path:
            futures["video"] = executor.submit(analyze_video, video_path)

        for key, future in futures.items():
            try:
                results[key] = future.result(timeout=60)
            except Exception as e:
                print(f"{key} analysis failed: {e}")

    if audio_path:
        try:
            os.unlink(audio_path)
        except Exception as e:
            print(f"Could not delete audio temp file: {e}")

    if video_path:
        try:
            os.unlink(video_path)
        except Exception as e:
            print(f"Could not delete video temp file: {e}")

    if "audio" in results and "video" in results:
        results["insights"] = generate_insights(results["audio"], results["video"])

    return jsonify(results)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(port=8000, debug=True)