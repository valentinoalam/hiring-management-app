import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { Hands } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import Image from 'next/image';

const GesturePhotoCapture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const countFingers = (landmarks: unknown[]) => {
    // Finger tip landmarks
    const fingerTips = [4, 8, 12, 16, 20]; // thumb, index, middle, ring, pinky
    const fingerPips = [2, 5, 9, 13, 17]; // corresponding pip joints
    
    let count = 0;

    // Thumb (special handling)
    const thumbTip = landmarks[4] as { x: number; y: number };
    const thumbIp = landmarks[3] as { x: number; y: number };
    
    // For right hand, thumb is extended if tip is to the right of IP joint
    if (thumbTip.x > thumbIp.x) {
      count++;
    }

    // Other fingers
    for (let i = 1; i < 5; i++) {
      const tip = landmarks[fingerTips[i]] as { x: number; y: number };
      const pip = landmarks[fingerPips[i]] as { x: number; y: number };
      
      // Finger is extended if tip is above pip (lower y value in canvas coordinates)
      if (tip.y < pip.y) {
        count++;
      }
    }

    return count;
  };

  const capturePhoto = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const photoDataUrl = canvas.toDataURL('image/jpeg');
    
    setCapturedPhotos(prev => [photoDataUrl, ...prev.slice(0, 4)]); // Keep last 5 photos
  }, []);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const handleFingerCount = (fingerCount: number) => {
      if (fingerCount >= 1 && fingerCount <= 3) {
        if (countdown === null || countdown !== fingerCount) {
          setCountdown(fingerCount);
          
          // Start countdown timer
          setTimeout(() => {
            setCountdown(prev => {
              if (prev === 1) {
                capturePhoto();
                return null;
              } else if (prev && prev > 1) {
                return prev - 1;
              }
              return prev;
            });
          }, 1000);
        }
      } else if (fingerCount > 3) {
        setCountdown(null);
      }
    };

    const onResults = (results: unknown) => {
      const canvasElement = canvasRef.current;
      if (!canvasElement) return;
      const canvasCtx = canvasElement.getContext('2d');

      // Clear canvas
      canvasCtx!.save();
      canvasCtx!.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // Draw video frame
      canvasCtx!.drawImage(
        (results as { image: HTMLVideoElement }).image, 0, 0, canvasElement.width, canvasElement.height
      );

      const multiHandLandmarks = (results as { multiHandLandmarks?: unknown[] }).multiHandLandmarks;
      if (multiHandLandmarks && multiHandLandmarks.length > 0) {
        for (const landmarks of multiHandLandmarks) {
          drawConnectors(canvasCtx!, landmarks as never, (Hands as unknown as { HAND_CONNECTIONS: unknown }).HAND_CONNECTIONS as never, {
            color: '#00FF00',
            lineWidth: 2
          });
          drawLandmarks(canvasCtx!, landmarks as never, {
            color: '#FF0000',
            lineWidth: 1,
            radius: 2
          });

          // Count fingers and handle countdown
          const fingerCount = countFingers(landmarks as unknown[]);
          handleFingerCount(fingerCount);
        }
      }

      canvasCtx!.restore();
    };

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480
    });

    cameraRef.current = camera;
    
    // Start camera automatically when component mounts
    camera.start().then(() => {
      setIsCameraActive(true);
    }).catch(() => {
      setIsCameraActive(false);
    });

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, [countdown, capturePhoto]);

  const startCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.start();
      setIsCameraActive(true);
    }
  };

  const stopCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      setIsCameraActive(false);
    }
  };

  const downloadPhoto = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.download = `gesture-photo-${index + 1}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Gesture Photo Capture</h1>
      
      <div style={styles.instructions}>
        <h3>Instructions:</h3>
        <p>Show 3, 2, then 1 finger to automatically capture a photo!</p>
        <p>Make sure your hand is clearly visible in the camera view.</p>
      </div>

      <div style={styles.cameraSection}>
        <div style={styles.videoContainer}>
          <video
            ref={videoRef}
            style={styles.video}
            playsInline
          />
          <canvas
            ref={canvasRef}
            style={styles.canvas}
            width={640}
            height={480}
          />
        </div>

        {countdown && (
          <div style={styles.countdownOverlay}>
            <div style={styles.countdownText}>{countdown}</div>
          </div>
        )}

        <div style={styles.controls}>
          <button
            onClick={isCameraActive ? stopCamera : startCamera}
            style={{
              ...styles.button,
              ...(isCameraActive ? styles.stopButton : styles.startButton)
            }}
          >
            {isCameraActive ? 'Stop Camera' : 'Start Camera'}
          </button>
          
          <button
            onClick={capturePhoto}
            style={styles.button}
          >
            Manual Capture
          </button>
        </div>
      </div>

      {capturedPhotos.length > 0 && (
        <div style={styles.photosSection}>
          <h3>Captured Photos:</h3>
          <div style={styles.photosGrid}>
            {capturedPhotos.map((photo, index) => (
              <div key={index} style={styles.photoContainer}>
                <Image width={300} height={300}
                  src={photo}
                  alt={`Captured ${index + 1}`}
                  style={styles.photo}
                />
                <button
                  onClick={() => downloadPhoto(photo, index)}
                  style={styles.downloadButton}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    textAlign: 'center' as const,
    color: '#333',
    marginBottom: '20px',
  },
  instructions: {
    backgroundColor: '#f0f8ff',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #b3d9ff',
  },
  cameraSection: {
    position: 'relative' as const,
    marginBottom: '30px',
  },
  videoContainer: {
    position: 'relative' as const,
    display: 'inline-block',
  },
  video: {
    display: 'none', // Hide the original video element
  },
  canvas: {
    width: '100%',
    maxWidth: '640px',
    height: 'auto',
    border: '2px solid #333',
    borderRadius: '8px',
  },
  countdownOverlay: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '50%',
    width: '100px',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    color: 'white',
    fontSize: '48px',
    fontWeight: 'bold',
  },
  controls: {
    marginTop: '15px',
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
  },
  startButton: {
    backgroundColor: '#28a745',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  photosSection: {
    marginTop: '30px',
  },
  photosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginTop: '15px',
  },
  photoContainer: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '10px',
    textAlign: 'center' as const,
  },
  photo: {
    width: '100%',
    height: 'auto',
    borderRadius: '4px',
    marginBottom: '10px',
  },
  downloadButton: {
    padding: '5px 10px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
  },
};

export default GesturePhotoCapture;