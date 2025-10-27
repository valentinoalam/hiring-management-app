'use client'
import { useGestureCamera } from '@/hooks/useGestureCamera'

export default function GestureCamera() {
  const { videoRef, canvasRef, fingerCount, photo } = useGestureCamera({
    onCapture: (blob) => console.log('📸 Captured', blob),
  })

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative">
        <video ref={videoRef} className="rounded-lg shadow-md" width="640" height="480" />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
          width="640"
          height="480"
        />
      </div>
      <p>✋ Finger Count: {fingerCount}</p>
      {photo && (
        <img
          src={photo}
          alt="Captured"
          className="rounded-lg mt-3 border shadow-sm"
          width="320"
        />
      )}
    </div>
  )
}
