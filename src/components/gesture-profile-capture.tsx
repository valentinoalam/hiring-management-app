"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useHandGestureDetection } from "@/hooks/use-hand-gesture-detection"
import { Camera, RotateCcw, Download, X } from "lucide-react"

interface GestureProfileCaptureProps {
  onSave?: (imageData: string) => void
  onClose?: () => void
}

export function GestureProfileCapture({ onSave, onClose }: GestureProfileCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [gestureSequence, setGestureSequence] = useState<number[]>([])
  const [message, setMessage] = useState<string>("")
  const [isCapturing, setIsCapturing] = useState(false)

  const { handPose, isLoading, error } = useHandGestureDetection(videoRef)

  // Initialize camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
        setMessage("Show 1 finger, then 2, then 3 to capture!")
      }
    } catch (err) {
      console.error("[v0] Camera access error:", err)
      setMessage("Unable to access camera. Please check permissions.")
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      setCameraActive(false)
      setGestureSequence([])
      setMessage("")
    }
  }

  // Monitor hand gesture sequence
  useEffect(() => {
    if (!handPose || !cameraActive) return

    const currentFingers = handPose.fingers

    // Check if this is a new gesture in the sequence
    if (gestureSequence.length === 0 && currentFingers === 1) {
      setGestureSequence([1])
      setMessage("✓ 1 finger detected! Now show 2 fingers...")
    } else if (gestureSequence.length === 1 && gestureSequence[0] === 1 && currentFingers === 2) {
      setGestureSequence([1, 2])
      setMessage("✓ 2 fingers detected! Now show 3 fingers to capture...")
    } else if (
      gestureSequence.length === 2 &&
      gestureSequence[0] === 1 &&
      gestureSequence[1] === 2 &&
      currentFingers === 3
    ) {
      // Capture photo
      capturePhoto()
      setGestureSequence([])
    }
  }, [handPose, gestureSequence, cameraActive])

  // Capture photo from video
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)
    const context = canvasRef.current.getContext("2d")
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      context.drawImage(videoRef.current, 0, 0)
      const imageData = canvasRef.current.toDataURL("image/jpeg")
      setCapturedImage(imageData)
      setMessage("✓ Photo captured! Review and save.")
      stopCamera()
    }
  }

  // Save captured image
  const handleSave = () => {
    if (capturedImage && onSave) {
      onSave(capturedImage)
      setMessage("✓ Profile picture saved!")
      setTimeout(() => {
        setCapturedImage(null)
        setGestureSequence([])
      }, 1500)
    }
  }

  // Reset capture
  const handleReset = () => {
    setCapturedImage(null)
    setGestureSequence([])
    setMessage("")
    startCamera()
  }

  return (
    <Card className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Capture Profile Picture</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Camera Feed or Captured Image */}
      <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden mb-4">
        {!capturedImage ? (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {/* Gesture Indicator */}
            {cameraActive && handPose && (
              <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {handPose.fingers} 🖐️
              </div>
            )}
            {/* Gesture Progress */}
            {cameraActive && gestureSequence.length > 0 && (
              <div className="absolute bottom-4 left-4 flex gap-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      gestureSequence.includes(step) ? "bg-green-500 text-white" : "bg-gray-400 text-gray-700"
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <img
            src={capturedImage || "/placeholder.svg"}
            alt="Captured profile"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Status Message */}
      {message && <p className="text-center text-sm font-medium mb-4 text-blue-600 dark:text-blue-400">{message}</p>}

      {/* Loading State */}
      {isLoading && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">Loading hand detection...</p>
      )}

      {/* Error State */}
      {error && <p className="text-center text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!cameraActive && !capturedImage ? (
          <Button onClick={startCamera} disabled={isLoading} className="flex-1 gap-2">
            <Camera className="w-4 h-4" />
            Start Camera
          </Button>
        ) : cameraActive ? (
          <Button onClick={stopCamera} variant="outline" className="flex-1 gap-2 bg-transparent">
            <X className="w-4 h-4" />
            Cancel
          </Button>
        ) : (
          <>
            <Button onClick={handleReset} variant="outline" className="flex-1 gap-2 bg-transparent">
              <RotateCcw className="w-4 h-4" />
              Retake
            </Button>
            <Button onClick={handleSave} className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Save
            </Button>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-gray-700 dark:text-gray-300">
          <strong>How it works:</strong> Show your hand to the camera and display 1 finger, then 2 fingers, then 3
          fingers in sequence. The photo will capture automatically when you show 3 fingers!
        </p>
      </div>
    </Card>
  )
}
