"""
Updated backend/main.py that uses the trained ML model.
Replace your existing backend/main.py with this AFTER training.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
import numpy as np
import os

app = FastAPI(title="ISL Translator API - ML Version", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATASET_PATH = os.path.join(os.path.dirname(__file__), "../dataset/isl_images")
if os.path.exists(DATASET_PATH):
    app.mount("/images", StaticFiles(directory=DATASET_PATH), name="images")

# ── Load ML model ──
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../model/isl_model.h5")
LABELS = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
ml_model = None

if os.path.exists(MODEL_PATH):
    try:
        import tensorflow as tf
        ml_model = tf.keras.models.load_model(MODEL_PATH)
        print(f"✓ ML model loaded from {MODEL_PATH}")
    except Exception as e:
        print(f"⚠ Could not load ML model: {e}. Falling back to rule-based.")
else:
    print("⚠ No ML model found. Using rule-based classifier.")
    print(f"  Expected path: {MODEL_PATH}")

# ── Models ──
class Landmark(BaseModel):
    x: float
    y: float
    z: float

class PredictRequest(BaseModel):
    landmarks: List[Landmark]

class PredictResponse(BaseModel):
    letter: str
    confidence: float
    method: str

class TextToSignRequest(BaseModel):
    text: str

class TextToSignResponse(BaseModel):
    letters: List[str]
    image_urls: List[str]

# ── ML Prediction ──
def predict_ml(landmarks):
    pts = np.array([[l.x, l.y, l.z] for l in landmarks], dtype=np.float32)
    # Normalize: subtract wrist, scale by hand size
    wrist = pts[0].copy()
    pts = pts - wrist
    scale = np.max(np.abs(pts)) + 1e-9
    pts = pts / scale
    flat = pts.flatten().reshape(1, -1)
    probs = ml_model.predict(flat, verbose=0)[0]
    idx = int(np.argmax(probs))
    return LABELS[idx], float(probs[idx])

# ── Rule-based fallback ──
import math

def dist(lm, a, b):
    return math.sqrt((lm[a].x-lm[b].x)**2+(lm[a].y-lm[b].y)**2+(lm[a].z-lm[b].z)**2)

def is_extended(lm, tip, pip, mcp):
    return lm[tip].y < lm[pip].y and lm[pip].y < lm[mcp].y

def predict_rules(landmarks):
    lm = landmarks
    thumb  = lm[4].x < lm[3].x
    index  = is_extended(lm, 8,  6,  5)
    middle = is_extended(lm, 12, 10, 9)
    ring   = is_extended(lm, 16, 14, 13)
    pinky  = is_extended(lm, 20, 18, 17)

    d_ti = dist(lm,4,8); d_tm = dist(lm,4,12)
    spread = abs(lm[8].x - lm[12].x)

    if not index and not middle and not ring and not pinky: return 'A', 0.80
    if index and middle and ring and pinky and not thumb:   return 'B', 0.85
    if index and not middle and not ring and not pinky:
        if d_tm < 0.07: return 'D', 0.82
        return 'Z', 0.65
    if d_ti < 0.06 and middle and ring and pinky:           return 'F', 0.85
    if not index and not middle and not ring and not pinky and pinky: return 'I', 0.90
    if thumb and pinky and not index and not middle and not ring:     return 'Y', 0.90
    if thumb and index and not middle and not ring and not pinky:     return 'L', 0.85
    if index and middle and not ring and not pinky and not thumb:
        return 'U', 0.80 if spread < 0.04 else 'V', 0.85
    if index and middle and ring and not pinky and not thumb:         return 'W', 0.85
    if pinky and not index and not middle and not ring and not thumb: return 'I', 0.90
    return '?', 0.30

# ── Routes ──
@app.get("/")
def root():
    return {"message": "ISL Translator API v3", "model": "ML" if ml_model else "rule-based"}

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": ml_model is not None}

@app.post("/predict", response_model=PredictResponse)
def predict_gesture(req: PredictRequest):
    if len(req.landmarks) != 21:
        raise HTTPException(400, f"Expected 21 landmarks, got {len(req.landmarks)}")
    if ml_model:
        letter, conf = predict_ml(req.landmarks)
        return PredictResponse(letter=letter, confidence=conf, method="ml-model")
    else:
        letter, conf = predict_rules(req.landmarks)
        return PredictResponse(letter=letter, confidence=conf, method="rule-based")

@app.post("/text-to-sign", response_model=TextToSignResponse)
def text_to_sign(req: TextToSignRequest):
    text = req.text.upper().strip()
    letters, image_urls = [], []
    base_url = "http://localhost:8000/images"
    for char in text:
        if char.isalpha():
            letters.append(char)
            img_path = os.path.join(DATASET_PATH, f"{char}.png")
            image_urls.append(f"{base_url}/{char}.png" if os.path.exists(img_path) else "")
        elif char == " ":
            letters.append(" ")
            image_urls.append("")
    return TextToSignResponse(letters=letters, image_urls=image_urls)

@app.get("/available-signs")
def available_signs():
    return {"signs": [
        {"letter": l, "available": os.path.exists(os.path.join(DATASET_PATH, f"{l}.png"))}
        for l in LABELS
    ]}
