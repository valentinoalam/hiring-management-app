"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"

interface HandPose {
  fingers: number
  confidence: number
}

export function useHandGestureDetection(videoRef: React.RefObject<HTMLVideoElement>) {
  const [handPose, setHandPose] = useState<HandPose | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const detectorRef = useRef<{ detectForVideo: (video: HTMLVideoElement, timestamp: number) => unknown } | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Initialize MediaPipe Hand Detector
  useEffect(() => {
    const initializeDetector = async () => {
      try {
        // Dynamically import MediaPipe
        const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision")

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
        )

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          },
          runningMode: "VIDEO",
          numHands: 1,
        })

        detectorRef.current = landmarker
        setIsLoading(false)
      } catch (err) {
        console.error("[v0] Hand detection initialization error:", err)
        setError("Failed to load hand detection model")
        setIsLoading(false)
      }
    }

    initializeDetector()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Detect hand pose from video
  const detectHandPose = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current) return

    try {
      const results = detectorRef.current.detectForVideo(videoRef.current, performance.now()) as {
        landmarks?: { x: number; y: number; z: number }[][];
        handedness?: { score: number }[];
      }

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0]
        const fingers = countExtendedFingers(landmarks)
        setHandPose({
          fingers,
          confidence: results.handedness?.[0]?.score || 0,
        })
      } else {
        setHandPose(null)
      }
    } catch (err) {
      console.error("[v0] Hand detection error:", err)
    }

    animationFrameRef.current = requestAnimationFrame(detectHandPose)
  }, [videoRef])

  // Start detection when video is ready
  useEffect(() => {
    if (!isLoading && videoRef.current) {
      videoRef.current.addEventListener("loadedmetadata", () => {
        detectHandPose()
      })
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isLoading, detectHandPose, videoRef])

  return { handPose, isLoading, error }
}

// Count extended fingers based on hand landmarks
function countExtendedFingers(landmarks: { x: number; y: number; z: number }[]): number {
  if (!landmarks || landmarks.length < 21) return 0

  // Finger tip indices: thumb=4, index=8, middle=12, ring=16, pinky=20
  const fingerTips = [4, 8, 12, 16, 20]
  // PIP (Proximal Interphalangeal) joint indices
  const fingerPIPs = [3, 6, 10, 14, 18]

  let extendedCount = 0

  for (let i = 0; i < fingerTips.length; i++) {
    const tip = landmarks[fingerTips[i]]
    const pip = landmarks[fingerPIPs[i]]

    // Finger is extended if tip is above (lower y value) than PIP
    if (tip.y < pip.y) {
      extendedCount++
    }
  }

  return extendedCount
}
