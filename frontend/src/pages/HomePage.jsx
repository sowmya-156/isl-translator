/**
 * Home Page - Landing page with feature overview and quick navigation.
 */
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { checkHealth } from '../utils/api.js'

export default function HomePage() {
  const [backendOk, setBackendOk] = useState(null)

  useEffect(() => {
    checkHealth().then(ok => setBackendOk(ok))
  }, [])

  const features = [
    {
      icon: '🤚',
      title: 'Gesture → Text',
      desc: 'Point your camera at your hand. MediaPipe tracks 21 landmarks in real time, predicts the ISL letter, and builds a sentence you can speak aloud.',
      path: '/gesture',
      color: '#00f5ff',
      label: 'OPEN DETECTOR',
    },
    {
      icon: '✍️',
      title: 'Text → Sign',
      desc: 'Type any word or sentence (or use your microphone) and watch each letter rendered as an ISL gesture image — animated one by one.',
      path: '/text-to-sign',
      color: '#bf00ff',
      label: 'OPEN TRANSLATOR',
    },
  ]

  return (
    <div className="min-h-screen bg-grid-pattern pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-16 space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00f5ff]/30 text-[#00f5ff] text-xs font-display tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00f5ff] animate-pulse" />
            MEDIAPIPE · TENSORFLOW · WEB SPEECH API
          </div>

          <h1 className="text-5xl sm:text-7xl font-display font-bold">
            <span className="block text-white">INDIAN SIGN</span>
            <span className="block neon-text-cyan">LANGUAGE</span>
            <span className="block text-gray-400 text-3xl sm:text-4xl tracking-widest mt-2">TRANSLATOR</span>
          </h1>

          <p className="max-w-xl mx-auto text-gray-400 text-base leading-relaxed font-body">
            Bridges communication gap with real-time hand gesture recognition.
            Detect ISL signs A–Z via webcam, convert them to text/speech and translates
            any text/speech back into sign language visuals.
          </p>

          {/* Backend status */}
          <div className="flex items-center justify-center gap-3 text-xs font-display">
            <span className="text-gray-600">BACKEND STATUS:</span>
            {backendOk === null ? (
              <span className="text-yellow-400">CHECKING...</span>
            ) : backendOk ? (
              <span className="text-[#00ff88] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] inline-block animate-pulse" />
                CONNECTED
              </span>
            ) : (
              <span className="text-red-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                OFFLINE — run: <code className="bg-[#1a1a28] px-2 py-0.5 rounded text-red-300">uvicorn main:app --reload</code>
              </span>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {features.map(f => (
            <Link
              key={f.path}
              to={f.path}
              className="group glass-card rounded-xl p-8 hover:border-[#00f5ff]/30 transition-all duration-300 hover:-translate-y-1"
              style={{ borderColor: f.color + '20' }}
            >
              <div className="text-5xl mb-5">{f.icon}</div>
              <h2
                className="text-xl font-display font-bold mb-3 tracking-wider"
                style={{ color: f.color }}
              >
                {f.title}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">{f.desc}</p>
              <span
                className="text-xs font-display tracking-widest border px-4 py-2 rounded transition-all group-hover:shadow-lg"
                style={{
                  color: f.color,
                  borderColor: f.color + '60',
                }}
              >
                {f.label} →
              </span>
            </Link>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="glass-card rounded-xl p-8">
          <h3 className="text-xs font-display tracking-widest text-gray-500 mb-6">TECH STACK</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'HTML+CSS+JS', role: 'Frontend', color: '#61dafb' },
              { name: 'MediaPipe Hands', role: 'Hand Tracking', color: '#00f5ff' },
              { name: 'Fetch API', role: 'Backend', color: '#00ff88' },
              { name: 'Web Speech API', role: 'Audio', color: '#bf00ff' },
            ].map(t => (
              <div key={t.name} className="text-center p-4 rounded bg-[#12121a] border border-white/5">
                <div className="text-xs font-display font-bold mb-1" style={{ color: t.color }}>{t.name}</div>
                <div className="text-xs text-gray-600">{t.role}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
