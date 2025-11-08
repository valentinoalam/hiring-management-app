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

export function useHandGestureDetection(videoRef: React.RefObject<HTMLVideoElement> | null) {
  const [handPose, setHandPose] = useState<HandPose | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const detectorRef = useRef<{ detectForVideo: (video: HTMLVideoElement, timestamp: number) => unknown } | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
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
    if (!videoRef?.current || !detectorRef.current || !isVideoReady) return

    try {
      // Check if video has valid dimensions
      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        console.warn("[v0] Video dimensions are zero, skipping detection")
        return
      }

      // Check if video is ready to play
      if (videoRef.current.readyState < 2) { // Less than HAVE_CURRENT_DATA
        return
      }

      const results = detectorRef.current.detectForVideo(videoRef.current, performance.now()) as {
        landmarks?: { x: number; y: number; z: number }[][];
        handedness?: { score: number }[];
        handDetections?: { boundingBox?: { originX: number; originY: number; width: number; height: number } }[];
      }
      console.log("[v0] Detection results:", results)
      //    Ensure 'confidence' is 0 if handedness score is missing, resolving the type issue.
      const baseConfidence = results.handedness?.[0]?.score || 0;  // OPTIONAL: Can set to 1.0 if you only want the gesture confidence
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0]
        const { count: fingers, confidence: gestureConfidence } = countExtendedFingers(landmarks)
        // **Combine the scores:** //    
        // The final confidence is the minimum of the base hand-presence score and the calculated gesture score.
        const finalConfidence = Math.min(baseConfidence, gestureConfidence);
        console.log(`[v0] Hand detected! Fingers: ${fingers}, Confidence: ${finalConfidence}`)
        // Calculate bounding box from landmarks
        const boundingBox = calculateBoundingBox(landmarks)
        
        setHandPose({
          fingers,
          confidence: finalConfidence,
          boundingBox,
        })
      } else {
        console.log("[v0] No hand detected")
        setHandPose(null)
      }
    } catch (err) {
      console.error("[v0] Hand detection error:", err)
      // Don't set error state for temporary detection errors
    }

    // Only continue animation frame if video is still ready
    if (isVideoReady && videoRef?.current) {
      animationFrameRef.current = requestAnimationFrame(detectHandPose)
    }
  }, [videoRef, isVideoReady])

  // Set up video event listeners and start detection when ready
  useEffect(() => {
    if (!videoRef?.current || isLoading || !detectorRef.current) return

    const video = videoRef.current

    const handleLoadedData = () => {
      console.log("[v0] Video loaded data, dimensions:", video.videoWidth, "x", video.videoHeight)
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setIsVideoReady(true)
      }
    }

    const handleResize = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setIsVideoReady(true)
      } else {
        setIsVideoReady(false)
      }
    }

    // Check if video is already ready
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      console.log("[v0] Video already ready, starting detection")
      setIsVideoReady(true)
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('resize', handleResize)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('resize', handleResize)
      setIsVideoReady(false)
    }
  }, [videoRef, isLoading])

  // Start/stop detection based on video readiness
  useEffect(() => {
    if (isVideoReady && !isLoading && videoRef?.current && detectorRef.current) {
      console.log("[v0] Starting hand detection loop")
      detectHandPose()
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
  }, [isVideoReady, isLoading, detectHandPose, videoRef])

  return { handPose, isLoading, error }
}

// Count extended fingers based on hand landmarks AND calculate a confidence score
function countExtendedFingers(landmarks: { x: number; y: number; z: number }[]): { count: number; confidence: number } {
  if (!landmarks || landmarks.length < 21) {
    return { count: 0, confidence: 0 };
  }

  let extendedCount = 0;
  let totalConfidence = 0;
  
  // Define the required landmarks for each finger:
  // Tip, PIP (middle knuckle), and MCP (knuckle connecting to hand)
  const fingerLandmarks = [
    // Thumb: (Tip=4, IP=3, MCP=2). Note: The thumb is handled separately due to its orientation.
    { tip: landmarks[4], joint: landmarks[3], mcp: landmarks[2], isThumb: true, name: 'Thumb' }, 
    // Index: (Tip=8, PIP=6, MCP=5)
    { tip: landmarks[8], joint: landmarks[6], mcp: landmarks[5], isThumb: false, name: 'Index' },
    // Middle: (Tip=12, PIP=10, MCP=9)
    { tip: landmarks[12], joint: landmarks[10], mcp: landmarks[9], isThumb: false, name: 'Middle' },
    // Ring: (Tip=16, PIP=14, MCP=13)
    { tip: landmarks[16], joint: landmarks[14], mcp: landmarks[13], isThumb: false, name: 'Ring' },
    // Pinky: (Tip=20, PIP=18, MCP=17)
    { tip: landmarks[20], joint: landmarks[18], mcp: landmarks[17], isThumb: false, name: 'Pinky' },
  ];

  for (const finger of fingerLandmarks) {
    let fingerConfidence = 0;

    // 1. Calculate the full length of the finger (MCP to Tip)
    // This is the distance when the finger is fully extended (our maximum baseline)
    const fullExtensionLength = Math.hypot(finger.tip.x - finger.mcp.x, finger.tip.y - finger.mcp.y);

    // 2. Calculate the distance of the PIP joint to the MCP joint (segmentLength)
    // We use this as a rough measure of the hand size and segment length for normalization.
    const segmentLength = Math.hypot(finger.joint.x - finger.mcp.x, finger.joint.y - finger.mcp.y);

    // --- Extension Check: Thumb (Special Case) ---
    if (finger.isThumb) {
      // Simple check: If the tip is significantly further from the MCP joint than the PIP joint is, 
      // AND the tip is on the correct side of the hand's center line (simplified X check).
      if (fullExtensionLength > segmentLength * 1.5 && finger.tip.x < finger.mcp.x) {
         extendedCount++;
         // Thumb confidence based on how straight it is relative to its MCP joint
         fingerConfidence = Math.min(1.0, fullExtensionLength / (segmentLength * 2.0));
      } else {
         fingerConfidence = 0.1;
      }
    } 
    // --- Extension Check: Index, Middle, Ring, Pinky ---
    else {
      // Check for Extension: If the distance from Tip to MCP is greater than 
      // a certain ratio of the MCP-to-PIP segment, the finger is likely extended.
      // Use a multiplier (e.g., 1.8) to account for the two outer segments of the finger.
      if (fullExtensionLength > segmentLength * 1.8) {
        extendedCount++;
        
        // Calculate Confidence (0.0 to 1.0): 
        // How close the current length (fullExtensionLength) is to a 'fully straight' length (segmentLength * 2.0).
        fingerConfidence = Math.min(1.0, (fullExtensionLength - segmentLength * 1.8) / (segmentLength * 0.2));
      } else {
        // Finger is bent or not extended. Low confidence that it IS extended.
        fingerConfidence = 0.1;
      }
    }

    // Accumulate confidence for the final average
    totalConfidence += fingerConfidence;
  }

  // Final gesture confidence is the average confidence of ALL fingers (extended or not)
  // to give a smooth score, or only the extended ones if you prefer a strict measure.
  // Using all 5 fingers for a smoother confidence output:
  const finalConfidence = totalConfidence / 5.0; 
  
  return { 
    count: extendedCount, 
    confidence: finalConfidence 
  };
}

// NOTE: Remember to apply the changes from Step 2 of the previous response to the main hook 
// to ensure the final confidence value is correctly integrated and the base confidence is handled:
/*
Inside detectHandPose function:

}
*/

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