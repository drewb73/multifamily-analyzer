// src/lib/pdfGenerator.ts
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface GeneratePDFOptions {
  filename?: string
  onProgress?: (progress: number) => void
  quality?: number  // 0.1 to 1, default 0.92
  scale?: number    // Canvas scale, default 2
}

export interface GeneratePDFResult {
  success: boolean
  filename?: string
  error?: string
  fileSize?: number
}

/**
 * Generate a PDF from an HTML element
 * @param element - The HTML element to convert to PDF
 * @param options - Generation options
 * @returns Result object with success status
 */
export async function generatePDFFromElement(
  element: HTMLElement,
  options: GeneratePDFOptions = {}
): Promise<GeneratePDFResult> {
  const {
    filename = 'Property_Analysis.pdf',
    onProgress,
    quality = 0.92,
    scale = 2
  } = options

  try {
    // Step 1: Capture HTML as canvas (0-50%)
    onProgress?.(10)
    
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Remove any interactive elements from the clone
        const clonedElement = clonedDoc.querySelector('[data-pdf-preview]')
        if (clonedElement) {
          // Remove zoom controls, buttons, etc.
          const controls = clonedElement.querySelectorAll('button, input')
          controls.forEach(control => control.remove())
        }
      }
    })

    onProgress?.(50)

    // Step 2: Create PDF (50-80%)
    // Letter size: 8.5" x 11" = 215.9mm x 279.4mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
      compress: true
    })

    // Calculate dimensions
    const imgWidth = 215.9 // Letter width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pageHeight = 279.4 // Letter height in mm

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/jpeg', quality)

    onProgress?.(70)

    // Step 3: Add pages (80-95%)
    let heightLeft = imgHeight
    let position = 0

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    onProgress?.(95)

    // Step 4: Save PDF (95-100%)
    pdf.save(filename)

    onProgress?.(100)

    // Calculate approximate file size (rough estimate)
    const fileSize = canvas.width * canvas.height * 3 * quality / 1024 // KB

    return {
      success: true,
      filename,
      fileSize: Math.round(fileSize)
    }

  } catch (error) {
    console.error('PDF generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF'
    }
  }
}

/**
 * Generate a formatted filename for the PDF
 * @param propertyName - Property address or name
 * @param date - Optional date (defaults to today)
 * @returns Formatted filename
 */
export function generatePDFFilename(
  propertyName: string,
  date: Date = new Date()
): string {
  // Clean property name (remove special characters, limit length)
  const cleanName = propertyName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30)
    .trim()
    .replace(/_+$/, '') // Remove trailing underscores

  // Format date as YYYY-MM-DD
  const dateStr = date.toISOString().split('T')[0]

  return `PropertyAnalysis_${cleanName}_${dateStr}.pdf`
}

/**
 * Validate if element is ready for PDF generation
 * @param element - The HTML element to check
 * @returns true if ready, error message if not
 */
export function validatePDFElement(element: HTMLElement | null): {
  valid: boolean
  error?: string
} {
  if (!element) {
    return { valid: false, error: 'Element not found' }
  }

  if (element.offsetHeight === 0 || element.offsetWidth === 0) {
    return { valid: false, error: 'Element has no dimensions' }
  }

  return { valid: true }
}