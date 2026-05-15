/**
 * AboutPage - Project info, dataset instructions, and architecture overview.
 */
import React from 'react'

function Code({ children }) {
  return (
    <code className="bg-[#12121a] border border-white/10 px-2 py-0.5 rounded text-[#00f5ff] text-xs font-display">
      {children}
    </code>
  )
}

function Step({ num, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full border border-[#00f5ff]/40 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[#00f5ff] text-xs font-display font-bold">{num}</span>
      </div>
      <div>
        <h4 className="font-display text-sm text-white mb-2">{title}</h4>
        <div className="text-sm text-gray-400 space-y-1 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-grid-pattern pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">

        <div>
          <h1 className="text-2xl font-display font-bold neon-text-cyan mb-2">ABOUT & SETUP</h1>
          <p className="text-gray-400 text-sm">
            ISL Translator — a real-time Indian Sign Language recognition and generation tool.
          </p>
        </div>

        {/* Architecture */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-xs font-display tracking-widest text-gray-500">ARCHITECTURE</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-xs font-display">
            {[
              { label: 'FRONTEND', items: ['React 18 + Vite', 'Tailwind CSS', 'MediaPipe Hands JS', 'Web Speech API', 'React Router'] },
              { label: 'BACKEND', items: ['Python FastAPI', 'REST API', 'Rule-based classifier', 'NumPy geometry', 'Static file serving'] },
              { label: 'DATA', items: ['A–Z placeholder PNGs', 'Real dataset ready slot', 'MediaPipe 21 landmarks', 'Landmark geometry rules'] },
            ].map(col => (
              <div key={col.label} className="p-4 rounded bg-[#12121a] border border-white/5 space-y-2">
                <div className="text-[#00f5ff] font-bold tracking-widest">{col.label}</div>
                {col.items.map(item => (
                  <div key={item} className="text-gray-500 flex items-center gap-1.5">
                    <span className="text-[#00f5ff]/50">›</span>{item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Setup */}
        <div className="glass-card rounded-xl p-6 space-y-6">
          <h2 className="text-xs font-display tracking-widest text-gray-500">SETUP INSTRUCTIONS</h2>

          <Step num="1" title="Clone / download the project">
            <p>Make sure you have <Code>Node.js 18+</Code> and <Code>Python 3.9+</Code> installed.</p>
          </Step>

          <Step num="2" title="Install backend dependencies">
            <pre className="bg-[#0a0a0f] rounded p-3 text-xs text-[#00ff88] overflow-x-auto">
{`cd backend
pip install -r requirements.txt`}
            </pre>
          </Step>

          <Step num="3" title="Start the FastAPI backend">
            <pre className="bg-[#0a0a0f] rounded p-3 text-xs text-[#00ff88] overflow-x-auto">
{`# From the backend/ directory:
uvicorn main:app --reload --port 8000

# API docs available at:
# http://localhost:8000/docs`}
            </pre>
          </Step>

          <Step num="4" title="Install frontend dependencies">
            <pre className="bg-[#0a0a0f] rounded p-3 text-xs text-[#00ff88] overflow-x-auto">
{`cd frontend
npm install`}
            </pre>
          </Step>

          <Step num="5" title="Start the React frontend">
            <pre className="bg-[#0a0a0f] rounded p-3 text-xs text-[#00ff88] overflow-x-auto">
{`npm run dev
# Opens at http://localhost:5173`}
            </pre>
          </Step>

          <Step num="6" title="Allow camera access">
            <p>When the browser asks for camera permission, click <strong className="text-white">Allow</strong>.</p>
            <p>The app works best in <strong className="text-white">Chrome</strong> or <strong className="text-white">Edge</strong> (for Speech API support).</p>
          </Step>
        </div>

        {/* Dataset instructions */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-xs font-display tracking-widest text-gray-500">REPLACING PLACEHOLDER IMAGES WITH REAL ISL DATASET</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            The app ships with auto-generated placeholder images for letters A–Z in{' '}
            <Code>dataset/isl_images/</Code>. To use real ISL gesture photos:
          </p>
          <ol className="space-y-3 text-sm text-gray-400">
            {[
              <>Download an ISL dataset (e.g. from Kaggle: "Indian Sign Language Dataset" by <span className="text-white">iamsouravbanerjee</span>).</>,
              <>Rename your images to <Code>A.png</Code>, <Code>B.png</Code> … <Code>Z.png</Code>.</>,
              <>Replace the files in <Code>dataset/isl_images/</Code> — keep the same filenames.</>,
              <>Restart the backend. The <Code>/images/</Code> static route will serve the new images automatically.</>,
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-[#00f5ff] font-display shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Upgrading to ML model */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-xs font-display tracking-widest text-gray-500">UPGRADING TO A TRAINED ML MODEL</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            The current classifier uses rule-based geometry. To swap in a Keras model:
          </p>
          <pre className="bg-[#0a0a0f] rounded p-4 text-xs text-[#00ff88] overflow-x-auto">
{`# 1. Place your model file at:
model/isl_model.h5

# 2. In backend/main.py, replace classify_gesture() with:
import tensorflow as tf
model = tf.keras.models.load_model('../model/isl_model.h5')

def classify_gesture(landmarks):
    flat = [[lm.x, lm.y, lm.z] for lm in landmarks]
    arr = np.array(flat).flatten().reshape(1, -1)
    probs = model.predict(arr)[0]
    idx = np.argmax(probs)
    letter = chr(ord('A') + idx)
    return letter, float(probs[idx])`}
          </pre>
        </div>

        {/* Landmarks reference */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-xs font-display tracking-widest text-gray-500">MEDIAPIPE HAND LANDMARKS</h2>
          <p className="text-sm text-gray-400">21 landmarks are detected per hand frame:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-display">
            {[
              '0 Wrist', '1 Thumb CMC', '2 Thumb MCP', '3 Thumb IP', '4 Thumb Tip',
              '5 Index MCP', '6 Index PIP', '7 Index DIP', '8 Index Tip',
              '9 Middle MCP', '10 Middle PIP', '11 Middle DIP', '12 Middle Tip',
              '13 Ring MCP', '14 Ring PIP', '15 Ring DIP', '16 Ring Tip',
              '17 Pinky MCP', '18 Pinky PIP', '19 Pinky DIP', '20 Pinky Tip',
            ].map(lm => (
              <div key={lm} className="flex gap-2 text-gray-500">
                <span className="text-[#00f5ff]/60 w-6 shrink-0">{lm.split(' ')[0]}</span>
                <span>{lm.split(' ').slice(1).join(' ')}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
