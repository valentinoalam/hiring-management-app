// import { NextRequest, NextResponse } from "next/server";
// import { GoogleCloudVisionClient } from "@/lib/ocr/google-vision";
// import { IdCardDataExtractor } from "@/lib/ocr/id-card-extractor";

// export async function POST(request: NextRequest) {
//   try {
//     // Check if the request is multipart/form-data
//     const contentType = request.headers.get("content-type") || "";
//     if (!contentType.includes("multipart/form-data")) {
//       return NextResponse.json(
//         { message: "Content type must be multipart/form-data" },
//         { status: 400 }
//       );
//     }

//     // Parse the form data
//     const formData = await request.formData();
//     const imageFile = formData.get("image") as File | null;

//     if (!imageFile) {
//       return NextResponse.json(
//         { message: "No image file provided" },
//         { status: 400 }
//       );
//     }

//     // Validate file type
//     const validTypes = ["image/jpeg", "image/png", "image/webp"];
//     if (!validTypes.includes(imageFile.type)) {
//       return NextResponse.json(
//         { message: "Invalid file type. Please upload a JPEG, PNG, or WebP image." },
//         { status: 400 }
//       );
//     }

//     // Validate file size (5MB max)
//     const maxSize = 5 * 1024 * 1024; // 5MB
//     if (imageFile.size > maxSize) {
//       return NextResponse.json(
//         { message: "File is too large. Maximum size is 5MB." },
//         { status: 400 }
//       );
//     }

//     // Convert the file to a buffer
//     const arrayBuffer = await imageFile.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);

//     // Initialize the OCR client
//     const visionClient = new GoogleCloudVisionClient();
    
//     // Perform OCR on the image
//     const ocrResult = await visionClient.detectText(buffer);
    
//     if (!ocrResult || ocrResult.length === 0) {
//       return NextResponse.json(
//         { message: "No text detected in the image" },
//         { status: 400 }
//       );
//     }

//     // Extract ID card data from OCR result
//     const extractor = new IdCardDataExtractor();
//     const idCardData = extractor.extractData(ocrResult);

//     // Return the extracted data
//     return NextResponse.json(idCardData, { status: 200 });
//   } catch (error) {
//     console.error("Error processing ID card:", error);
//     return NextResponse.json(
//       { message: "Failed to process the ID card image" },
//       { status: 500 }
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import { LlamaOcrClient } from "@/lib/ocr/llama-ocr";
import { IdCardDataExtractor } from "@/lib/ocr/id-card-extractor";

export async function POST(request: NextRequest) {
  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { message: "Content type must be multipart/form-data" },
        { status: 400 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { message: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { message: "Invalid file type. Please upload a JPEG, PNG, or WebP image." },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { message: "File is too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Convert the file to a buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Initialize the OCR client
    const llamaOcrClient = new LlamaOcrClient();
    
    try {
      // First try to use the direct structured extraction method
      const idCardData = await llamaOcrClient.extractIdCardData(buffer);
      return NextResponse.json(idCardData, { status: 200 });
    } catch (structuredError) {
      console.warn("Structured extraction failed, falling back to text detection:", structuredError);
      
      // Fallback to text detection and manual extraction
      const ocrResult = await llamaOcrClient.detectText(buffer);
      
      if (!ocrResult || ocrResult.length === 0) {
        return NextResponse.json(
          { message: "No text detected in the image" },
          { status: 400 }
        );
      }

      // Extract ID card data from OCR result
      const extractor = new IdCardDataExtractor();
      const idCardData = extractor.extractData(ocrResult);

      // Return the extracted data
      return NextResponse.json(idCardData, { status: 200 });
    }
  } catch (error) {
    console.error("Error processing ID card:", error);
    return NextResponse.json(
      { message: "Failed to process the ID card image" },
      { status: 500 }
    );
  }
}
