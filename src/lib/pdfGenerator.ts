// src/lib/pdfGenerator.ts
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface GeneratePDFOptions {
  filename?: string
  onProgress?: (progress: number) => void
  quality?: number
  scale?: number
}

export interface GeneratePDFResult {
  success: boolean
  filename?: string
  error?: string
  fileSize?: number
}

export async function generatePDFFromElement(
  element: HTMLElement,
  options: GeneratePDFOptions = {}
): Promise<GeneratePDFResult> {
  const {
    filename = 'Property_Analysis.pdf',
    onProgress,
    quality = 0.95,
    scale = 2  // Higher scale for better quality
  } = options

  try {
    onProgress?.(10)

    console.log('Capturing element:', {
      width: element.offsetWidth,
      height: element.offsetHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight
    })

    // Capture the element
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    console.log('Canvas created:', {
      width: canvas.width,
      height: canvas.height
    })

    onProgress?.(60)

    // Create PDF - Letter size
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
      compress: true
    })

    // Letter dimensions in mm
    const pdfWidth = 215.9   // 8.5 inches
    const pdfHeight = 279.4  // 11 inches
    
    // Calculate image dimensions to FILL the page width
    const canvasAspectRatio = canvas.height / canvas.width
    
    // Image spans full page width
    const imgWidth = pdfWidth
    const imgHeight = pdfWidth * canvasAspectRatio

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/jpeg', quality)

    onProgress?.(80)

    // Add pages
    let heightLeft = imgHeight
    let position = 0

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight

    // Add more pages if content is longer than one page
    while (heightLeft > 0) {
      position = -(imgHeight - heightLeft)
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight
    }

    onProgress?.(95)

    // Save
    pdf.save(filename)

    onProgress?.(100)

    const fileSize = (canvas.width * canvas.height * 3 * quality) / 1024

    return {
      success: true,
      filename,
      fileSize: Math.round(fileSize)
    }

  } catch (error) {
    console.error('PDF generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export function generatePDFFilename(
  propertyName: string,
  date: Date = new Date()
): string {
  const cleanName = propertyName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30)
    .trim()

  const dateStr = date.toISOString().split('T')[0]

  return `PropertyAnalysis_${cleanName}_${dateStr}.pdf`
}

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