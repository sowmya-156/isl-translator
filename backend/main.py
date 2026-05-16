"""
ISL Translator Backend - FastAPI
Handles gesture prediction from hand landmarks and text-to-sign conversion.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import os
import math

app = FastAPI(title="ISL Translator API", version="1.0.0")

# Allow frontend (React on port 5173) to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve ISL images as static files
DATASET_PATH = os.path.join(os.path.dirname(__file__), "../dataset/isl_images")
if os.path.exists(DATASET_PATH):
    app.mount("/images", StaticFiles(directory=DATASET_PATH), name="images")

# ─────────────────────────────────────────────────────────
# Data Models
# ─────────────────────────────────────────────────────────

class Landmark(BaseModel):
    x: float
    y: float
    z: float

class PredictRequest(BaseModel):
    landmarks: List[Landmark]  # 21 MediaPipe hand landmarks

class PredictResponse(BaseModel):
    letter: str
    confidence: float
    method: str

class TextToSignRequest(BaseModel):
    text: str

class TextToSignResponse(BaseModel):
    letters: List[str]
    image_urls: List[str]

# ─────────────────────────────────────────────────────────
# Gesture Classification (Rule-Based)
# ─────────────────────────────────────────────────────────

def get_angle(a, b, c):
    """Calculate angle at point b given three landmarks."""
    ba = np.array([a.x - b.x, a.y - b.y, a.z - b.z])
    bc = np.array([c.x - b.x, c.y - b.y, c.z - b.z])
    cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-9)
    return math.degrees(math.acos(np.clip(cosine, -1.0, 1.0)))

def finger_extended(landmarks, finger_tip_idx, finger_mcp_idx, wrist_idx=0):
    """Check if a finger is extended (tip above MCP relative to wrist)."""
    tip = landmarks[finger_tip_idx]
    mcp = landmarks[finger_mcp_idx]
    wrist = landmarks[wrist_idx]
    # In image coords, y increases downward; extended means tip.y < mcp.y
    return tip.y < mcp.y

def fingers_state(lm):
    """
    Return boolean list [thumb, index, middle, ring, pinky] for extended fingers.
    Landmark indices from MediaPipe:
      Thumb:  4 (tip), 3, 2, 1 (CMC)
      Index:  8 (tip), 7, 6, 5 (MCP)
      Middle: 12 (tip), 11, 10, 9 (MCP)
      Ring:   16 (tip), 15, 14, 13 (MCP)
      Pinky:  20 (tip), 19, 18, 17 (MCP)
    """
    thumb  = lm[4].x < lm[3].x  # thumb points left (right hand)
    index  = lm[8].y  < lm[6].y
    middle = lm[12].y < lm[10].y
    ring   = lm[16].y < lm[14].y
    pinky  = lm[20].y < lm[18].y
    return [thumb, index, middle, ring, pinky]

def classify_gesture(landmarks: List[Landmark]) -> tuple:
    """
    Rule-based ISL gesture classification.
    Returns (letter, confidence) based on hand landmark geometry.
    
    This implements common ISL (Indian Sign Language) static gestures.
    Replace this with a trained ML model for better accuracy.
    """
    if len(landmarks) != 21:
        return "?", 0.0

    lm = landmarks
    f = fingers_state(lm)
    thumb, index, middle, ring, pinky = f

    # Helper: distance between two landmarks
    def dist(a, b):
        return math.sqrt((lm[a].x-lm[b].x)**2 + (lm[a].y-lm[b].y)**2)

    # Helper: are fingertips close together?
    tips_close = dist(8, 12) < 0.05

    # ── ISL Rule-based mappings ──
    # A: Fist with thumb on side
    if not index and not middle and not ring and not pinky and thumb:
        return "A", 0.85

    # B: Four fingers up, thumb tucked
    if index and middle and ring and pinky and not thumb:
        return "B", 0.85

    # C: Curved hand (C-shape) - fingers slightly bent
    if not index and not middle and not ring and not pinky and not thumb:
        if dist(4, 8) < 0.15:
            return "C", 0.75

    # D: Index up, others curled
    if index and not middle and not ring and not pinky:
        return "D", 0.80

    # E: All fingers bent/curled
    if not index and not middle and not ring and not pinky and not thumb:
        return "E", 0.70

    # F: Index touches thumb, others up
    if not index and middle and ring and pinky and dist(4, 8) < 0.08:
        return "F", 0.78

    # G: Index points sideways, thumb parallel
    if index and not middle and not ring and not pinky and thumb:
        if abs(lm[8].y - lm[5].y) < 0.05:  # index roughly horizontal
            return "G", 0.72

    # H: Index and middle pointing sideways
    if index and middle and not ring and not pinky:
        return "H", 0.78

    # I: Pinky up only
    if not index and not middle and not ring and pinky and not thumb:
        return "I", 0.85

    # J: Pinky up with motion (we detect static J)
    if not index and not middle and not ring and pinky and thumb:
        return "J", 0.70

    # K: Index and middle up, thumb out
    if index and middle and not ring and not pinky and thumb:
        return "K", 0.75

    # L: L-shape: thumb and index extended
    if thumb and index and not middle and not ring and not pinky:
        return "L", 0.85

    # M: Three fingers over thumb
    if not index and not middle and not ring and not pinky:
        return "M", 0.65

    # N: Two fingers over thumb
    if not index and not middle and not ring and not pinky:
        return "N", 0.60

    # O: All fingers curve to touch thumb
    if dist(4, 8) < 0.06 and dist(4, 12) < 0.08:
        return "O", 0.80

    # P: Index pointing down, thumb out
    if index and thumb and not middle and not ring and not pinky:
        if lm[8].y > lm[5].y:  # index pointing down
            return "P", 0.72

    # Q: Index and thumb pointing down
    if not index and not middle and not ring and not pinky and thumb:
        return "Q", 0.65

    # R: Index and middle crossed
    if index and middle and not ring and not pinky:
        if lm[8].x < lm[12].x:  # crossed
            return "R", 0.72

    # S: Fist with thumb over fingers
    if not index and not middle and not ring and not pinky and not thumb:
        return "S", 0.70

    # T: Index bent, thumb between index and middle
    if not index and not middle and not ring and not pinky:
        return "T", 0.65

    # U: Index and middle up together
    if index and middle and not ring and not pinky and not thumb:
        if abs(lm[8].x - lm[12].x) < 0.04:  # fingers close
            return "U", 0.78

    # V: Index and middle spread (Victory/V)
    if index and middle and not ring and not pinky and not thumb:
        if abs(lm[8].x - lm[12].x) > 0.05:  # fingers spread
            return "V", 0.80

    # W: Three fingers up (index, middle, ring)
    if index and middle and ring and not pinky and not thumb:
        return "W", 0.80

    # X: Index hooked
    if not index and not middle and not ring and not pinky:
        return "X", 0.65

    # Y: Thumb and pinky extended (Hang Loose)
    if thumb and not index and not middle and not ring and pinky:
        return "Y", 0.88

    # Z: Index traces Z (detect as index pointing)
    if index and not middle and not ring and not pinky and not thumb:
        return "Z", 0.68

    return "?", 0.40


# ─────────────────────────────────────────────────────────
# API Routes
# ─────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "ISL Translator API is running!", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse)
def predict_gesture(req: PredictRequest):
    """
    Accept 21 MediaPipe hand landmarks, return predicted ISL letter.
    
    Input: { landmarks: [{x, y, z}, ...] }  (21 points)
    Output: { letter: "A", confidence: 0.85, method: "rule-based" }
    """
    if len(req.landmarks) != 21:
        raise HTTPException(400, f"Expected 21 landmarks, got {len(req.landmarks)}")

    letter, confidence = classify_gesture(req.landmarks)
    return PredictResponse(letter=letter, confidence=confidence, method="rule-based")


@app.post("/text-to-sign", response_model=TextToSignResponse)
def text_to_sign(req: TextToSignRequest):
    """
    Convert text to list of ISL gesture image URLs.
    
    Input: { text: "HELLO" }
    Output: { letters: ["H","E","L","L","O"], image_urls: [...] }
    """
    text = req.text.upper().strip()
    letters = []
    image_urls = []
    base_url = "http://localhost:8000/images"

    for char in text:
        if char.isalpha():
            letters.append(char)
            # Check if image file exists
            img_path = os.path.join(DATASET_PATH, f"{char}.png")
            if os.path.exists(img_path):
                image_urls.append(f"{base_url}/{char}.png")
            else:
                image_urls.append(f"{base_url}/placeholder.png")
        elif char == " ":
            letters.append(" ")
            image_urls.append("")  # Empty URL for space

    return TextToSignResponse(letters=letters, image_urls=image_urls)


@app.get("/signs/{letter}")
def get_sign_image_url(letter: str):
    """Get image URL for a specific letter."""
    letter = letter.upper()
    if not letter.isalpha() or len(letter) != 1:
        raise HTTPException(400, "Please provide a single letter A-Z")
    return {"letter": letter, "image_url": f"http://localhost:8000/images/{letter}.png"}


@app.get("/available-signs")
def available_signs():
    """List all available ISL gesture images."""
    available = []
    for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        path = os.path.join(DATASET_PATH, f"{letter}.png")
        available.append({"letter": letter, "available": os.path.exists(path)})
    return {"signs": available}
