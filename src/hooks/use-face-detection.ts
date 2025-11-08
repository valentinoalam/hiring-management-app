"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"

interface FaceDetection {
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
  landmarks?: { x: number; y: number }[]
}

export function useFaceDetection(videoRef: React.RefObject<HTMLVideoElement> | null) {
  const [faceDetection, setFaceDetection] = useState<FaceDetection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const detectorRef = useRef<{ detectForVideo: (video: HTMLVideoElement, timestamp: number) => unknown } | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)

  // Initialize MediaPipe Face Detector
  useEffect(() => {
    const initializeDetector = async () => {
      try {
        console.log("[v0] Initializing MediaPipe Face Detector...")
        
        // Dynamically import MediaPipe
        const { FilesetResolver, FaceDetector } = await import("@mediapipe/tasks-vision")

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
        )

        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          },
          runningMode: "VIDEO",
        })

        detectorRef.current = detector
        console.log("[v0] Face detector initialized successfully")
        setIsLoading(false)
      } catch (err) {
        console.error("[v0] Face detection initialization error:", err)
        setError("Failed to load face detection model")
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

  // Detect face from video
  const detectFace = useCallback(async () => {
    if (!videoRef?.current || !detectorRef.current || !isVideoReady) {
      return
    }

    try {
      // Check if video has valid dimensions
      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        return
      }

      const results = detectorRef.current.detectForVideo(videoRef.current, performance.now()) as {
        detections?: Array<{
          boundingBox?: { originX: number; originY: number; width: number; height: number };
          categories?: Array<{ score: number }>;
          keypoints?: Array<{ x: number; y: number }>;
        }>;
      }
      
      if (results.detections && results.detections.length > 0) {
        // Use the first detected face (most prominent)
        const detection = results.detections[0]
        const boundingBox = detection.boundingBox
        
        if (boundingBox) {
          const faceDetection: FaceDetection = {
            boundingBox: {
              x: boundingBox.originX / videoRef.current.videoWidth,
              y: boundingBox.originY / videoRef.current.videoHeight,
              width: boundingBox.width / videoRef.current.videoWidth,
              height: boundingBox.height / videoRef.current.videoHeight,
            },
            confidence: detection.categories? detection.categories[0]?.score : 0.8,
            landmarks: detection.keypoints?.map((kp: { x: number; y: number }) => ({
              x: kp.x / videoRef.current!.videoWidth,
              y: kp.y / videoRef.current!.videoHeight,
            }))
          }
          
          setFaceDetection(faceDetection)
        }
      } else {
        setFaceDetection(null)
      }
    } catch (err) {
      console.error("[v0] Face detection error:", err)
    }

    if (isVideoReady && videoRef?.current) {
      animationFrameRef.current = requestAnimationFrame(detectFace)
    }
  }, [videoRef, isVideoReady])

  // Set up video event listeners
  useEffect(() => {
    if (!videoRef?.current || isLoading || !detectorRef.current) return

    const video = videoRef.current

    const handleLoadedData = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setIsVideoReady(true)
      }
    }

    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      setIsVideoReady(true)
    }

    video.addEventListener('loadeddata', handleLoadedData)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      setIsVideoReady(false)
    }
  }, [videoRef, isLoading])

  // Start/stop detection based on video readiness
  useEffect(() => {
    if (isVideoReady && !isLoading && videoRef?.current && detectorRef.current) {
      detectFace()
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isVideoReady, isLoading, detectFace, videoRef])

  return { faceDetection, isLoading, error }
}