import { renderHook, act } from "@testing-library/react"
import { useHandGestureDetection } from "../use-hand-gesture-detection"
import jest from "jest" // Declare the jest variable

// Mock MediaPipe
jest.mock("@mediapipe/tasks-vision", () => ({
  FilesetResolver: {
    forVisionTasks: jest.fn().mockResolvedValue({}),
  },
  HandLandmarker: {
    createFromOptions: jest.fn().mockResolvedValue({
      detect: jest.fn().mockReturnValue({
        landmarks: [
          Array(21).fill({ x: 0.5, y: 0.5, z: 0 }), // Mock hand landmarks
        ],
      }),
    }),
  },
}))

describe("useHandGestureDetection", () => {
  it("should initialize with default state", () => {
    const { result } = renderHook(() => useHandGestureDetection())

    expect(result.current.fingersDetected).toBe(0)
    expect(result.current.isReady).toBe(false)
  })

  it("should handle video ref", () => {
    const { result } = renderHook(() => useHandGestureDetection())
    const videoRef = { current: document.createElement("video") }

    act(() => {
      if (result.current.videoRef) {
        result.current.videoRef.current = videoRef.current
      }
    })

    expect(result.current.videoRef?.current).toBe(videoRef.current)
  })

  it("should handle canvas ref", () => {
    const { result } = renderHook(() => useHandGestureDetection())
    const canvasRef = { current: document.createElement("canvas") }

    act(() => {
      if (result.current.canvasRef) {
        result.current.canvasRef.current = canvasRef.current
      }
    })

    expect(result.current.canvasRef?.current).toBe(canvasRef.current)
  })

  it("should cleanup on unmount", () => {
    const { unmount } = renderHook(() => useHandGestureDetection())

    expect(() => {
      unmount()
    }).not.toThrow()
  })
})
