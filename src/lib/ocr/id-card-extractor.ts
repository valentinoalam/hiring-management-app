import { IdCardData } from "@/types/id-card";

export class IdCardDataExtractor {
  /**
   * Extracts structured data from OCR text lines
   * @param textLines - Array of text lines from OCR
   * @returns Structured ID card data
   */
  extractData(textLines: string[]): IdCardData {
    const data: IdCardData = {};
    
    // Join all lines for regex searches across multiple lines
    const fullText = textLines.join(' ');
    
    // Extract full name
    data.fullName = this.extractFullName(textLines, fullText);
    
    // Extract ID number
    data.idNumber = this.extractIdNumber(textLines, fullText);
    
    // Extract date of birth
    data.dateOfBirth = this.extractDateOfBirth(textLines, fullText);
    
    // Extract expiry date
    data.expiryDate = this.extractExpiryDate(textLines, fullText);
    
    // Extract issue date
    data.issueDate = this.extractIssueDate(textLines, fullText);
    
    // Extract gender
    data.gender = this.extractGender(textLines, fullText);
    
    // Extract address
    data.address = this.extractAddress(textLines, fullText);
    
    return data;
  }
  
  private extractFullName(textLines: string[], fullText: string): string | undefined {
    // Try different patterns for name extraction
    
    // Pattern 1: Look for "Name:" or similar labels
    const nameLabels = ['name:', 'full name:', 'surname:', 'given name:'];
    for (const line of textLines) {
      const lowerLine = line.toLowerCase();
      for (const label of nameLabels) {
        if (lowerLine.includes(label)) {
          return line.substring(lowerLine.indexOf(label) + label.length).trim();
        }
      }
    }
    
    // Pattern 2: Look for common name patterns (e.g., all caps followed by all caps)
    const nameRegex = /([A-Z][a-z]+\s[A-Z][a-z]+)|([A-Z]+\s[A-Z]+)/;
    const nameMatch = fullText.match(nameRegex);
    if (nameMatch) {
      return nameMatch[0];
    }
    
    return undefined;
  }
  
  private extractIdNumber(textLines: string[], fullText: string): string | undefined {
    // Pattern 1: Look for "ID:", "ID Number:", etc.
    const idLabels = ['id:', 'id number:', 'identification number:', 'document no:', 'license no:'];
    for (const line of textLines) {
      const lowerLine = line.toLowerCase();
      for (const label of idLabels) {
        if (lowerLine.includes(label)) {
          return line.substring(lowerLine.indexOf(label) + label.length).trim();
        }
      }
    }
    
    // Pattern 2: Look for common ID number formats (alphanumeric with possible dashes)
    const idRegex = /\b([A-Z0-9]{6,}(-[A-Z0-9]{1,})*)\b/;
    const idMatch = fullText.match(idRegex);
    if (idMatch) {
      return idMatch[0];
    }
    
    return undefined;
  }
  
  private extractDateOfBirth(textLines: string[], fullText: string): string | undefined {
    // Pattern 1: Look for "DOB:", "Date of Birth:", etc.
    const dobLabels = ['dob:', 'date of birth:', 'birth date:', 'born:'];
    for (const line of textLines) {
      const lowerLine = line.toLowerCase();
      for (const label of dobLabels) {
        if (lowerLine.includes(label)) {
          return line.substring(lowerLine.indexOf(label) + label.length).trim();
        }
      }
    }
    
    // Pattern 2: Look for date patterns
    // This regex matches common date formats: DD/MM/YYYY, MM/DD/YYYY, YYYY/MM/DD, etc.
    const dateRegex = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/;
    
    // First check for dates near birth-related words
    const birthContextRegex = /\b(birth|born|dob)(?:[^\d]*)((\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}))/i;
    const birthMatch = fullText.match(birthContextRegex);
    if (birthMatch) {
      return birthMatch[2];
    }
    
    // If no birth-specific date found, look for any dates
    const dateMatches = fullText.match(dateRegex);
    if (dateMatches) {
      return dateMatches[0];
    }
    
    return undefined;
  }
  
  private extractExpiryDate(textLines: string[], fullText: string): string | undefined {
    // Pattern 1: Look for "Expires:", "Expiry Date:", etc.
    const expiryLabels = ['expires:', 'expiry date:', 'exp:', 'valid until:'];
    for (const line of textLines) {
      const lowerLine = line.toLowerCase();
      for (const label of expiryLabels) {
        if (lowerLine.includes(label)) {
          return line.substring(lowerLine.indexOf(label) + label.length).trim();
        }
      }
    }
    
    // Pattern 2: Look for date patterns near expiry-related words
    const expiryContextRegex = /\b(exp|expiry|expires|valid until)(?:[^\d]*)((\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}))/i;
    const expiryMatch = fullText.match(expiryContextRegex);
    if (expiryMatch) {
      return expiryMatch[2];
    }
    
    return undefined;
  }
  
  private extractIssueDate(textLines: string[], fullText: string): string | undefined {
    // Pattern 1: Look for "Issue Date:", "Issued:", etc.
    const issueLabels = ['issue date:', 'issued:', 'date of issue:'];
    for (const line of textLines) {
      const lowerLine = line.toLowerCase();
      for (const label of issueLabels) {
        if (lowerLine.includes(label)) {
          return line.substring(lowerLine.indexOf(label) + label.length).trim();
        }
      }
    }
    
    // Pattern 2: Look for date patterns near issue-related words
    const issueContextRegex = /\b(issue|issued|date of issue)(?:[^\d]*)((\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}))/i;
    const issueMatch = fullText.match(issueContextRegex);
    if (issueMatch) {
      return issueMatch[2];
    }
    
    return undefined;
  }
  
  private extractGender(textLines: string[], fullText: string): string | undefined {
    // Pattern 1: Look for "Sex:", "Gender:", etc.
    const genderLabels = ['sex:', 'gender:'];
    for (const line of textLines) {
      const lowerLine = line.toLowerCase();
      for (const label of genderLabels) {
        if (lowerLine.includes(label)) {
          const value = line.substring(lowerLine.indexOf(label) + label.length).trim();
          // Only return if it's a valid gender value
          if (/^(m|f|male|female)$/i.test(value)) {
            return value;
          }
        }
      }
    }
    
    // Pattern 2: Look for standalone gender indicators
    const genderRegex = /\b(male|female|sex:\s*[mf]|gender:\s*[mf])\b/i;
    const genderMatch = fullText.match(genderRegex);
    if (genderMatch) {
      return genderMatch[0].replace(/sex:\s*|gender:\s*/i, '');
    }
    
    return undefined;
  }
  
  private extractAddress(textLines: string[], fullText: string): string | undefined {
    // Pattern 1: Look for "Address:", etc.
    const addressLabels = ['address:', 'residence:', 'addr:'];
    for (let i = 0; i < textLines.length; i++) {
      const lowerLine = textLines[i].toLowerCase();
      for (const label of addressLabels) {
        if (lowerLine.includes(label)) {
          // Address might span multiple lines, so collect them
          let address = textLines[i].substring(lowerLine.indexOf(label) + label.length).trim();
          
          // Check the next line(s) for continuation of the address
          let j = i + 1;
          while (j < textLines.length && 
                 !this.isLabelLine(textLines[j]) && 
                 textLines[j].length > 0) {
            address += ' ' + textLines[j];
            j++;
          }
          
          return address;
        }
      }
    }
    
    // Pattern 2: Look for address patterns (e.g., street numbers, postal codes)
    const addressRegex = /\b\d+\s+[A-Za-z]+\s+(St|Ave|Rd|Blvd|Drive|Lane|Place|Court|Way)[\.,]?\s+[A-Za-z]+[\.,]?\s+[A-Z]{2}\s+\d{5}(-\d{4})?\b/i;
    const addressMatch = fullText.match(addressRegex);
    if (addressMatch) {
      return addressMatch[0];
    }
    
    return undefined;
  }
  
  private isLabelLine(line: string): boolean {
    // Check if the line contains common label patterns
    const labelPatterns = [
      'name:', 'id:', 'dob:', 'date of birth:', 'sex:', 'gender:',
      'expires:', 'issued:', 'signature:', 'height:', 'weight:',
      'eyes:', 'hair:', 'class:', 'restrictions:'
    ];
    
    const lowerLine = line.toLowerCase();
    return labelPatterns.some(pattern => lowerLine.includes(pattern));
  }
}
