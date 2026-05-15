/**
 * GesturePage - Live ISL gesture detection using webcam + MediaPipe.
 *
 * Flow:
 *  1. Webcam feed → MediaPipe Hands → 21 landmarks
 *  2. Landmarks sent to backend POST /predict every ~300ms
 *  3. Backend returns predicted letter + confidence
 *  4. Letter is added to sentence when held steady for 1.5s
 *  5. User can speak the sentence via Web Speech API
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import WebcamView from '../components/WebcamView.jsx'
import { DetectedLetter, SentenceBuilder } from '../components/LetterDisplay.jsx'
import { StatusBadge, ErrorBox } from '../components/StatusBadge.jsx'
import { useHandTracking } from '../hooks/useHandTracking.js'
import { predictGesture } from '../utils/api.js'
import { speak } from '../utils/speech.js'

// Minimum time (ms) a letter must be held before adding to sentence
const HOLD_DURATION_MS = 1500
// Throttle API calls to this interval (ms)
const PREDICT_INTERVAL_MS = 300

export default function GesturePage() {
  const [detectedLetter, setDetectedLetter] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [sentence, setSentence] = useState('')
  const [apiError, setApiError] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0) // 0-100
  const [lastAdded, setLastAdded] = useState('')
  const [savedSentences, setSavedSentences] = useState([])

  // Refs for timing logic (avoid stale closures)
  const lastPredictTime = useRef(0)
  const holdStart = useRef(null)
  const holdLetter = useRef('')
  const holdTimer = useRef(null)

  // Called by useHandTracking with each frame's landmarks
  const handleLandmarks = useCallback(async (landmarks) => {
    const now = Date.now()
    if (now - lastPredictTime.current < PREDICT_INTERVAL_MS) return
    lastPredictTime.current = now

    try {
      const result = await predictGesture(landmarks)
      setDetectedLetter(result.letter)
      setConfidence(result.confidence)
      setApiError(null)

      // Hold-to-add logic: must hold same letter for HOLD_DURATION_MS
      if (result.letter !== '?' && result.confidence > 0.6) {
        if (holdLetter.current !== result.letter) {
          holdLetter.current = result.letter
          holdStart.current = now
          setHoldProgress(0)
        } else {
          const elapsed = now - holdStart.current
          const progress = Math.min((elapsed / HOLD_DURATION_MS) * 100, 100)
          setHoldProgress(progress)

          if (elapsed >= HOLD_DURATION_MS) {
            setSentence(prev => prev + result.letter)
            setLastAdded(result.letter)
            holdLetter.current = ''
            holdStart.current = null
            setHoldProgress(0)
            // Brief visual feedback
            setTimeout(() => setLastAdded(''), 500)
          }
        }
      } else {
        holdLetter.current = ''
        holdStart.current = null
        setHoldProgress(0)
      }
    } catch (err) {
      setApiError('Backend unreachable. Is FastAPI running on port 8000?')
    }
  }, [])

  const { videoRef, canvasRef, isReady, isLoading, error } = useHandTracking({
    onResult: handleLandmarks,
    enabled: isTracking,
  })

  const handleSpeak = () => {
    if (sentence.trim()) speak(sentence)
  }

  const handleSave = () => {
    if (sentence.trim()) {
      setSavedSentences(prev => [sentence, ...prev.slice(0, 9)])
      setSentence('')
    }
  }

  const handleAddSpace = () => setSentence(prev => prev + ' ')

  return (
    <div className="min-h-screen bg-grid-pattern pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-display font-bold neon-text-cyan">GESTURE DETECTION</h1>
            <StatusBadge status={isReady ? 'ok' : isLoading ? 'loading' : 'idle'} label={isReady ? 'ACTIVE' : isLoading ? 'LOADING' : 'STOPPED'} />
          </div>
          <p className="text-gray-500 text-sm">
            Show ISL hand signs to your webcam. Hold each sign for ~1.5 seconds to add the letter.
          </p>
        </div>

        {/* Errors */}
        {(error || apiError) && (
          <div className="mb-6 space-y-2">
            {error && <ErrorBox message={error} />}
            {apiError && <ErrorBox message={apiError} onDismiss={() => setApiError(null)} />}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left: Webcam */}
          <div className="lg:col-span-2 space-y-4">
            {/* Start/Stop */}
            <div className="flex gap-3 flex-wrap">
              {!isTracking ? (
                <button onClick={() => setIsTracking(true)} className="btn-neon btn-neon-green">
                  ▶ START CAMERA
                </button>
              ) : (
                <button onClick={() => setIsTracking(false)} className="btn-neon" style={{ borderColor: '#ff4d4d', color: '#ff4d4d' }}>
                  ■ STOP CAMERA
                </button>
              )}
              <button onClick={handleAddSpace} className="btn-neon" disabled={!isTracking}>
                ␣ ADD SPACE
              </button>
            </div>

            {/* Webcam view (only shown when tracking) */}
            {isTracking ? (
              <WebcamView
                videoRef={videoRef}
                canvasRef={canvasRef}
                isLoading={isLoading}
                error={error}
                isReady={isReady}
              />
            ) : (
              <div className="w-full aspect-video rounded-lg neon-border-cyan cam-grid flex flex-col items-center justify-center gap-4">
                <div className="text-6xl opacity-30">🤚</div>
                <p className="text-gray-600 font-display text-xs tracking-widest">CAMERA OFF — PRESS START</p>
              </div>
            )}

            {/* Hold progress bar */}
            {isTracking && detectedLetter && detectedLetter !== '?' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-display text-gray-500">
                  <span>HOLD TO ADD: <span className="text-[#00f5ff]">{detectedLetter}</span></span>
                  <span>{Math.round(holdProgress)}%</span>
                </div>
                <div className="h-1.5 bg-[#1a1a28] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      width: `${holdProgress}%`,
                      background: holdProgress === 100 ? '#00ff88' : 'linear-gradient(90deg, #bf00ff, #00f5ff)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Sentence Builder */}
            <SentenceBuilder
              sentence={sentence}
              onClear={() => { setSentence(''); holdLetter.current = ''; }}
              onSpeak={handleSpeak}
              onBackspace={() => setSentence(prev => prev.slice(0, -1))}
            />

            <button onClick={handleSave} disabled={!sentence.trim()} className="btn-neon w-full">
              💾 SAVE SENTENCE
            </button>
          </div>

          {/* Right: Detected letter + tips */}
          <div className="space-y-6">
            {/* Detected letter display */}
            <div className="glass-card rounded-xl p-6 text-center space-y-4">
              <h3 className="text-xs font-display tracking-widest text-gray-500">DETECTED SIGN</h3>
              <DetectedLetter letter={detectedLetter || '—'} confidence={confidence} />
              {lastAdded && (
                <div className="text-[#00ff88] font-display text-sm animate-pulse">
                  ✓ ADDED: {lastAdded}
                </div>
              )}
            </div>

            {/* ISL Alphabet reference */}
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-xs font-display tracking-widest text-gray-500 mb-3">ISL ALPHABET</h3>
              <div className="grid grid-cols-7 gap-1">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => (
                  <div
                    key={l}
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs font-display transition-all
                      ${detectedLetter === l ? 'bg-[#00f5ff] text-[#0a0a0f] shadow-[0_0_10px_#00f5ff]' : 'bg-[#1a1a28] text-gray-500'}`}
                  >
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Usage tips */}
            <div className="glass-card rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-display tracking-widest text-gray-500">TIPS</h3>
              {[
                'Good lighting on your hand',
                'Keep hand within frame',
                'Face your palm toward camera',
                'Hold sign steady for 1.5s',
                'Confidence > 60% to register',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <span className="text-[#00f5ff] mt-0.5">›</span>
                  {tip}
                </div>
              ))}
            </div>

            {/* Saved sentences */}
            {savedSentences.length > 0 && (
              <div className="glass-card rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-display tracking-widest text-gray-500 mb-3">SAVED</h3>
                {savedSentences.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 rounded bg-[#12121a]">
                    <span className="text-xs font-display text-white truncate">{s}</span>
                    <button onClick={() => speak(s)} className="text-xs text-[#00f5ff] shrink-0">🔊</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
