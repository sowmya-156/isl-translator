/**
 * useHandTracking - Custom React hook that integrates MediaPipe Hands
 * with a webcam video element.
 *
 * Usage:
 *   const { videoRef, canvasRef, landmarks, isReady, error } = useHandTracking({ onResult })
 */

import { useEffect, useRef, useState, useCallback } from 'react'

export function useHandTracking({ onResult, enabled = true }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const handsRef = useRef(null)
  const cameraRef = useRef(null)
  const animFrameRef = useRef(null)

  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [landmarks, setLandmarks] = useState(null)
  const [handedness, setHandedness] = useState(null)

  const drawLandmarks = useCallback((ctx, results) => {
    const canvas = canvasRef.current
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return
    }

    const lms = results.multiHandLandmarks[0]

    // Connection pairs (MediaPipe hand skeleton)
    const connections = [
      [0,1],[1,2],[2,3],[3,4],       // Thumb
      [0,5],[5,6],[6,7],[7,8],       // Index
      [0,9],[9,10],[10,11],[11,12],  // Middle
      [0,13],[13,14],[14,15],[15,16],// Ring
      [0,17],[17,18],[18,19],[19,20],// Pinky
      [5,9],[9,13],[13,17],          // Palm
    ]

    const W = canvas.width
    const H = canvas.height

    // Draw connections
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.6)'
    ctx.lineWidth = 2
    connections.forEach(([a, b]) => {
      ctx.beginPath()
      ctx.moveTo(lms[a].x * W, lms[a].y * H)
      ctx.lineTo(lms[b].x * W, lms[b].y * H)
      ctx.stroke()
    })

    // Draw landmark dots
    lms.forEach((lm, i) => {
      const x = lm.x * W
      const y = lm.y * H
      // Finger tips get bigger dots
      const isTip = [4, 8, 12, 16, 20].includes(i)
      ctx.beginPath()
      ctx.arc(x, y, isTip ? 6 : 4, 0, 2 * Math.PI)
      ctx.fillStyle = isTip ? '#00ff88' : '#00f5ff'
      ctx.shadowColor = isTip ? '#00ff88' : '#00f5ff'
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // Draw wrist label
    ctx.fillStyle = 'rgba(0,245,255,0.9)'
    ctx.font = '12px Space Mono, monospace'
    const hand = results.multiHandedness?.[0]?.label || ''
    ctx.fillText(hand, lms[0].x * W + 5, lms[0].y * H - 5)

  }, [])

  useEffect(() => {
    if (!enabled) return

    let active = true

    async function initMediaPipe() {
      try {
        setIsLoading(true)
        setError(null)

        // Dynamically import MediaPipe (loaded via CDN script or npm)
        // We use the @mediapipe/hands npm package
        const { Hands } = await import('@mediapipe/hands')
        const { Camera } = await import('@mediapipe/camera_utils')

        if (!active) return

        const hands = new Hands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        })

        hands.setOptions({
          maxNumHands: 1,
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

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const lms = results.multiHandLandmarks[0]
            setLandmarks(lms)
            setHandedness(results.multiHandedness?.[0]?.label)
            onResult?.(lms, results.multiHandedness?.[0])
          } else {
            setLandmarks(null)
          }
        })

        handsRef.current = hands

        // Get webcam stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        })

        if (!active) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        const video = videoRef.current
        if (!video) return

        video.srcObject = stream
        video.play()

        // Use MediaPipe Camera utility for processing
        const camera = new Camera(video, {
          onFrame: async () => {
            if (!active || !handsRef.current) return
            await handsRef.current.send({ image: video })
          },
          width: 640,
          height: 480,
        })

        cameraRef.current = camera
        camera.start()

        setIsReady(true)
        setIsLoading(false)
      } catch (err) {
        if (!active) return
        console.error('MediaPipe init error:', err)
        setError(err.message || 'Failed to initialize camera/MediaPipe')
        setIsLoading(false)
      }
    }

    initMediaPipe()

    return () => {
      active = false
      cameraRef.current?.stop()
      // Stop webcam tracks
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      }
      handsRef.current?.close()
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [enabled, drawLandmarks])

  return { videoRef, canvasRef, landmarks, handedness, isReady, isLoading, error }
}
