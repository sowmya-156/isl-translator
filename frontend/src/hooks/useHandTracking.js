import { useEffect, useRef, useState, useCallback } from 'react'

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

export function useHandTracking({ onResult, enabled = true }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const handsRef = useRef(null)
  const timerRef = useRef(null)
  const streamRef = useRef(null)

  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const origAlert = useRef(null)

  const drawLandmarks = useCallback((ctx, results) => {
    const canvas = canvasRef.current
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!results.multiHandLandmarks?.length) return

    const lms = results.multiHandLandmarks[0]
    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ]
    const W = canvas.width
    const H = canvas.height

    ctx.strokeStyle = 'rgba(0,245,255,0.8)'
    ctx.lineWidth = 2
    connections.forEach(([a, b]) => {
      ctx.beginPath()
      ctx.moveTo(lms[a].x * W, lms[a].y * H)
      ctx.lineTo(lms[b].x * W, lms[b].y * H)
      ctx.stroke()
    })

    lms.forEach((lm, i) => {
      const isTip = [4,8,12,16,20].includes(i)
      ctx.beginPath()
      ctx.arc(lm.x * W, lm.y * H, isTip ? 6 : 4, 0, 2 * Math.PI)
      ctx.fillStyle = isTip ? '#00ff88' : '#00f5ff'
      ctx.shadowColor = ctx.fillStyle
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.shadowBlur = 0
    })
  }, [])

  useEffect(() => {
    if (!enabled) return
    let active = true

    origAlert.current = window.alert
    window.alert = (msg) => {
      if (typeof msg === 'string' && msg.toLowerCase().includes('webgl')) return
      origAlert.current?.(msg)
    }

    async function init() {
      try {
        setIsLoading(true)
        setError(null)

        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js')

        let tries = 0
        while ((!window.Hands || !window.Camera) && tries < 80) {
          await new Promise(r => setTimeout(r, 100))
          tries++
        }

        if (!window.Hands) throw new Error('MediaPipe failed to load')
        if (!active) return

        const hands = new window.Hands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
        })

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        })

        hands.onResults((results) => {
          if (!active) return
          const canvas = canvasRef.current
          if (!canvas) return
          const ctx = canvas.getContext('2d')
          drawLandmarks(ctx, results)

          if (results.multiHandLandmarks?.length > 0) {
            const lms1 = results.multiHandLandmarks[0]
            const lms2 = results.multiHandLandmarks[1] || null
            onResult?.(lms1, results.multiHandedness?.[0], lms2)
          }
        })

        handsRef.current = hands

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        })

        if (!active) { stream.getTracks().forEach(t => t.stop()); return }

        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await new Promise(r => { video.onloadedmetadata = r })
        await video.play()

        const camera = new window.Camera(video, {
          onFrame: async () => {
            if (!active || !handsRef.current) return
            await handsRef.current.send({ image: video })
          },
          width: 640,
          height: 480,
        })

        camera.start()
        setIsReady(true)
        setIsLoading(false)

      } catch (err) {
        if (!active) return
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Allow camera permission.')
        } else if (err.name === 'NotFoundError') {
          setError('No camera found.')
        } else {
          setError(err.message || 'Failed to start.')
        }
        setIsLoading(false)
      }
    }

    init()

    return () => {
      active = false
      clearTimeout(timerRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      try { handsRef.current?.close() } catch (_) {}
      if (origAlert.current) window.alert = origAlert.current
    }
  }, [enabled, drawLandmarks])

  return { videoRef, canvasRef, isReady, isLoading, error }
}
