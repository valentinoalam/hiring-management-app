import { IdCardData } from "@/types/id-card";

export class LlamaOcrClient {
  private apiKey: string;
  private apiEndpoint: string;

  constructor() {
    // Initialize with environment variables
    this.apiKey = process.env.LLAMA_OCR_API_KEY || '';
    this.apiEndpoint = process.env.LLAMA_OCR_ENDPOINT || 'https://api.llama-ocr.ai/v1/extract';
    
    if (!this.apiKey) {
      console.warn('LLAMA_OCR_API_KEY is not set. OCR functionality will not work.');
    }
  }

  /**
   * Detects text in an image using Llama-OCR API
   * @param imageBuffer - Buffer containing the image data
   * @returns Array of detected text blocks
   */
  async detectText(imageBuffer: Buffer): Promise<string[]> {
    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      
      // Prepare the request payload
      const payload = {
        image: base64Image,
        options: {
          detail: 'high',
          language: 'auto',
          document_type: 'id_card'
        }
      };
      
      // Make the API request
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Llama-OCR API error: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract text blocks from the response
      if (!data.text || !data.text.length) {
        return [];
      }
      
      // Split the text into lines
      return data.text.split('\n');
    } catch (error) {
      console.error('Error in Llama-OCR:', error);
      throw new Error('Failed to process image with OCR');
    }
  }

  /**
   * Directly extracts structured ID card data using Llama-OCR's specialized ID card extraction
   * @param imageBuffer - Buffer containing the image data
   * @returns Structured ID card data
   */
  async extractIdCardData(imageBuffer: Buffer): Promise<IdCardData> {
    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      
      // Prepare the request payload for ID card extraction
      const payload = {
        image: base64Image,
        options: {
          detail: 'high',
          document_type: 'id_card',
          extract_fields: true
        }
      };
      
      // Make the API request to the structured data endpoint
      const response = await fetch(`${this.apiEndpoint}/structured`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Llama-OCR API error: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Map the Llama-OCR response to our IdCardData structure
      const idCardData: IdCardData = {
        fullName: data.fields?.full_name || data.fields?.name,
        dateOfBirth: data.fields?.date_of_birth || data.fields?.dob,
        idNumber: data.fields?.id_number || data.fields?.document_number,
        expiryDate: data.fields?.expiry_date || data.fields?.expiration_date,
        issueDate: data.fields?.issue_date,
        address: data.fields?.address,
        gender: data.fields?.gender || data.fields?.sex
      };
      
      return idCardData;
    } catch (error) {
      console.error('Error in Llama-OCR structured extraction:', error);
      throw new Error('Failed to extract ID card data');
    }
  }
}
