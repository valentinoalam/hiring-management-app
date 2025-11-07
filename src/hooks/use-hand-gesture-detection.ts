"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"

interface HandPose {
  fingers: number
  confidence: number
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
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
        console.error("Hand detection initialization error:", err)
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
        handDetections?: { boundingBox?: { originX: number; originY: number; width: number; height: number } }[];
      }

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0]
        const fingers = countExtendedFingers(landmarks)
        
        // Calculate bounding box from landmarks
        const boundingBox = calculateBoundingBox(landmarks)
        
        setHandPose({
          fingers,
          confidence: results.handedness?.[0]?.score || 0,
          boundingBox,
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

  const fingerTips = [4, 8, 12, 16, 20]
  const fingerPIPs = [3, 6, 10, 14, 18]

  let extendedCount = 0

  for (let i = 0; i < fingerTips.length; i++) {
    const tip = landmarks[fingerTips[i]]
    const pip = landmarks[fingerPIPs[i]]

    if (tip.y < pip.y) {
      extendedCount++
    }
  }

  return extendedCount
}

// Calculate bounding box from hand landmarks
function calculateBoundingBox(landmarks: { x: number; y: number; z: number }[]): { x: number; y: number; width: number; height: number } {
  if (!landmarks || landmarks.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  landmarks.forEach(landmark => {
    minX = Math.min(minX, landmark.x)
    minY = Math.min(minY, landmark.y)
    maxX = Math.max(maxX, landmark.x)
    maxY = Math.max(maxY, landmark.y)
  })

  // Add some padding around the hand
  const padding = 0.05
  const width = maxX - minX
  const height = maxY - minY
  
  return {
    x: Math.max(0, minX - width * padding),
    y: Math.max(0, minY - height * padding),
    width: Math.min(1, width * (1 + 2 * padding)),
    height: Math.min(1, height * (1 + 2 * padding))
  }
}