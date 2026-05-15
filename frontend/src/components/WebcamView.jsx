/**
 * WebcamView - Renders the webcam feed with the MediaPipe landmark canvas overlaid.
 * The video is mirrored so it feels natural (like a mirror).
 */
import React from 'react'
import { LoadingSpinner } from './StatusBadge.jsx'

export default function WebcamView({ videoRef, canvasRef, isLoading, error, isReady }) {
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden neon-border-cyan scan-line cam-grid">
      {/* Video element (invisible, used by MediaPipe) */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}  // Mirror
        autoPlay
        playsInline
        muted
      />

      {/* Canvas overlay for landmarks (also mirrored) */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full"
        style={{ transform: 'scaleX(-1)' }}  // Mirror to match video
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]/90">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-xs font-display tracking-widest text-[#00f5ff] animate-pulse">
            INITIALIZING MEDIAPIPE...
          </p>
          <p className="mt-2 text-xs text-gray-500">Loading hand tracking model</p>
        </div>
      )}

      {/* Error overlay */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]/95 p-6">
          <span className="text-4xl mb-4">📷</span>
          <p className="text-red-400 font-display text-sm text-center mb-2">CAMERA ERROR</p>
          <p className="text-gray-400 text-xs text-center max-w-xs">{error}</p>
          <p className="mt-4 text-gray-500 text-xs text-center">
            Make sure you've allowed camera access in your browser.
          </p>
        </div>
      )}

      {/* Ready indicator */}
      {isReady && !isLoading && (
        <div className="absolute top-3 left-3 flex items-center gap-2 text-xs font-display">
          <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
          <span className="text-[#00ff88] text-xs tracking-wider">TRACKING</span>
        </div>
      )}

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00f5ff]/60" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00f5ff]/60" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#00f5ff]/60" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00f5ff]/60" />
    </div>
  )
}
