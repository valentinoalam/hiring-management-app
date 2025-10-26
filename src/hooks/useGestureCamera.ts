import { useEffect, useRef, useState, useCallback } from 'react'
import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'

export function useGestureCamera({ onCapture }: { onCapture?: (blob: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [fingerCount, setFingerCount] = useState<number>(0)
  const [photo, setPhoto] = useState<string | null>(null)

  const setupCamera = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    video.srcObject = stream
    await video.play()
    setIsReady(true)
  }, [])

  const detectFingers = useCallback((landmarks: any[]) => {
    if (!landmarks || landmarks.length === 0) return 0
    const hand = landmarks[0] // Only one hand
    const tips = [8, 12, 16, 20] // Index, Middle, Ring, Pinky tips
    const mcp = [5, 9, 13, 17]   // Their base points

    let count = 0
    for (let i = 0; i < 4; i++) {
      if (hand[tips[i]].y < hand[mcp[i]].y) count++ // finger up
    }
    // thumb logic (rough)
    if (hand[4].x > hand[3].x) count++ // right hand thumb open
    return count
  }, [])

  useEffect(() => {
    if (!videoRef.current) return

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    })

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.6,
    })

    hands.onResults((results) => {
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx || !results.image) return

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ctx.drawImage(results.image, 0, 0, ctx.canvas.width, ctx.canvas.height)

      if (results.multiHandLandmarks?.length) {
        const count = detectFingers(results.multiHandLandmarks)
        setFingerCount(count)

        if (count === 3) {
          // Auto capture when 3 fingers
          capturePhoto()
        }
      }
    })

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current! })
      },
      width: 640,
      height: 480,
    })

    setupCamera().then(() => camera.start())

    return () => {
      hands.close()
      camera.stop()
      const stream = videoRef.current?.srcObject as MediaStream
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [setupCamera, detectFingers])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    if (!video) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        setPhoto(url)
        onCapture?.(blob)
      }
    }, 'image/jpeg')
  }, [onCapture])

  return {
    videoRef,
    canvasRef,
    isReady,
    fingerCount,
    photo,
    capturePhoto,
  }
}
