# 🤚 ISL Translator — Indian Sign Language

A full-stack real-time Indian Sign Language translator built with:

- **React + Vite + Tailwind CSS** (frontend)
- **MediaPipe Hands** (hand landmark detection in browser)
- **FastAPI + Python** (gesture classification backend)
- **Web Speech API** (Text-to-Speech + Speech-to-Text)

---

## 📁 Project Structure

```
isl-translator/
├── frontend/               # React app (Vite)
│   ├── src/
│   │   ├── components/     # Navbar, WebcamView, SignCard, etc.
│   │   ├── hooks/          # useHandTracking (MediaPipe integration)
│   │   ├── pages/          # Home, Gesture, TextToSign, About
│   │   └── utils/          # api.js, speech.js
│   ├── package.json
│   └── vite.config.js
│
├── backend/                # FastAPI server
│   ├── main.py             # All API routes + gesture classifier
│   └── requirements.txt
│
├── dataset/
│   └── isl_images/         # A.png … Z.png (replace with real data)
│
└── model/                  # (optional) place .h5 model here
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** — https://nodejs.org
- **Python 3.9+** — https://python.org
- **pip** (comes with Python)
- A browser with camera support (**Chrome recommended**)

---

### Step 1 — Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

---

### Step 2 — Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🖥️ Features

### Page 1 — Gesture → Text (Live Detection)
1. Click **START CAMERA** to enable webcam
2. MediaPipe loads and starts tracking your hand in real time
3. Hold any ISL sign steady for **~1.5 seconds** — the letter is added to your sentence
4. Click **SPEAK SENTENCE** to hear the result via Text-to-Speech
5. Click **SAVE SENTENCE** to save it to history

### Page 2 — Text → ISL Signs
1. Type any word/sentence (or click the 🎙 mic button)
2. Click **CONVERT →** — each letter becomes an ISL gesture image
3. Click **▶ ANIMATE** to play through the signs one by one
4. Adjust the speed slider for faster/slower animation

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health` | JSON health status |
| POST | `/predict` | Predict letter from 21 landmarks |
| POST | `/text-to-sign` | Get image URLs for text |
| GET | `/signs/{letter}` | Get URL for one letter |
| GET | `/available-signs` | List all available signs |
| GET | `/images/{letter}.png` | Serve sign image |

### POST /predict

```json
// Request
{
  "landmarks": [
    {"x": 0.45, "y": 0.63, "z": -0.02},
    // ... 21 landmarks total
  ]
}

// Response
{
  "letter": "A",
  "confidence": 0.85,
  "method": "rule-based"
}
```

### POST /text-to-sign

```json
// Request
{ "text": "HELLO" }

// Response
{
  "letters": ["H", "E", "L", "L", "O"],
  "image_urls": [
    "http://localhost:8000/images/H.png",
    "http://localhost:8000/images/E.png",
    ...
  ]
}
```

---

## 🖼️ Using a Real ISL Dataset

The app ships with auto-generated placeholder images. To use real ISL photos:

1. Download a dataset, e.g. from Kaggle:
   - Search: **"Indian Sign Language Dataset"** by iamsouravbanerjee
   - Or: **"ISL Gesture Image Dataset"**

2. Rename images to `A.png`, `B.png` … `Z.png`

3. Place them in `dataset/isl_images/` (overwrite the placeholders)

4. Restart the backend — images are served automatically

---

## 🧠 Upgrading the Gesture Classifier

Currently uses **rule-based geometry** (fast, no training needed).

To use a trained Keras model:

1. Place your model at `model/isl_model.h5`
2. Edit `backend/main.py` — find `classify_gesture()` and replace with:

```python
import tensorflow as tf

model = tf.keras.models.load_model('../model/isl_model.h5')

def classify_gesture(landmarks):
    flat = [[lm.x, lm.y, lm.z] for lm in landmarks]
    arr = np.array(flat).flatten().reshape(1, -1)
    probs = model.predict(arr)[0]
    idx = int(np.argmax(probs))
    letter = chr(ord('A') + idx)
    return letter, float(probs[idx])
```

3. Add `tensorflow==2.15.0` to `requirements.txt` and re-install

---

## 🌐 Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| MediaPipe Hands | ✅ | ✅ | ✅ | ✅ |
| Speech-to-Text | ✅ | ❌ | ❌ | ✅ |
| Text-to-Speech | ✅ | ✅ | ✅ | ✅ |

**Recommended: Google Chrome**

---

## 🔧 Troubleshooting

**Camera not working?**
- Check browser camera permissions (click the 🔒 icon in URL bar)
- Try `http://` instead of file:// (camera requires a web server)

**Backend not connecting?**
- Make sure FastAPI is running: `uvicorn main:app --reload`
- Check no firewall blocks port 8000
- CORS is pre-configured for `localhost:5173`

**MediaPipe failing to load?**
- Check your internet connection (models load from CDN on first run)
- After first load they are cached by the browser

**Speech recognition not working?**
- Use Chrome or Edge (Firefox doesn't support Web Speech API)
- Allow microphone permissions

---

## 🎯 Gesture Recognition Tips

- **Good lighting** on your hand (avoid backlight)
- Keep your hand **within the camera frame**
- Face your **palm toward the camera**
- **Hold signs steady** for 1.5 seconds to register
- Confidence must be **> 60%** for a letter to start counting

---

## 📝 License

MIT License — free to use and modify.
