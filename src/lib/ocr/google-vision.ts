import { ImageAnnotatorClient } from "@google-cloud/vision";

export class GoogleCloudVisionClient {
  private client: ImageAnnotatorClient;

  constructor() {
    // Initialize the client with credentials from environment variables
    // In production, these should be securely stored in environment variables
    this.client = new ImageAnnotatorClient({
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  /**
   * Detects text in an image using Google Cloud Vision API
   * @param imageBuffer - Buffer containing the image data
   * @returns Array of detected text blocks
   */
  async detectText(imageBuffer: Buffer): Promise<string[]> {
    try {
      // Perform text detection
      const [result] = await this.client.textDetection(imageBuffer);
      const detections = result.textAnnotations || [];
      
      if (detections.length === 0) {
        return [];
      }
      
      // The first annotation contains the entire text
      // The rest are individual words/elements
      const fullText = detections[0].description || '';
      
      // Split the text into lines
      return fullText.split('\n');
    } catch (error) {
      console.error('Error in Google Vision OCR:', error);
      throw new Error('Failed to process image with OCR');
    }
  }
}
