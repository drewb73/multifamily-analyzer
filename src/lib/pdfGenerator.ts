// src/lib/pdfGenerator.ts
// FIXED WIDTH VERSION - Carefully forces consistent width
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
  // Ensure scale is valid
  let scale = options.scale || 2
  if (isNaN(scale) || scale <= 0 || !isFinite(scale)) {
    console.warn('Invalid scale, using default:', scale)
    scale = 2
  }

  const {
    filename = 'Property_Analysis.pdf',
    onProgress,
    quality = 0.95
  } = options

  try {
    onProgress?.(10)

    console.log('Starting PDF generation with scale:', scale)

    // CRITICAL: Force consistent width for PDF capture
    const FIXED_PDF_WIDTH = 850  // Fixed width for consistent PDFs
    
    console.log('Original element dimensions:', {
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight
    })

    // Store original styles to restore later
    const originalStyles = {
      width: element.style.width,
      minWidth: element.style.minWidth,
      maxWidth: element.style.maxWidth,
      boxSizing: element.style.boxSizing
    }

    // Force fixed width temporarily
    element.style.width = `${FIXED_PDF_WIDTH}px`
    element.style.minWidth = `${FIXED_PDF_WIDTH}px`
    element.style.maxWidth = `${FIXED_PDF_WIDTH}px`
    element.style.boxSizing = 'border-box'

    // Force browser to recalculate layout
    void element.offsetHeight

    // Wait a moment for layout to settle
    await new Promise(resolve => setTimeout(resolve, 100))

    console.log('Forced element dimensions:', {
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight,
      targetWidth: FIXED_PDF_WIDTH
    })

    // Capture at fixed width
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    // Restore original styles immediately after capture
    element.style.width = originalStyles.width
    element.style.minWidth = originalStyles.minWidth
    element.style.maxWidth = originalStyles.maxWidth
    element.style.boxSizing = originalStyles.boxSizing

    console.log('Canvas created successfully:', {
      width: canvas.width,
      height: canvas.height
    })

    // Validate canvas
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas creation failed - invalid dimensions')
    }

    onProgress?.(60)

    // Create PDF - Letter size in mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
      compress: true
    })

    // Letter dimensions
    const pdfWidth = 215.9   // 8.5 inches in mm
    const pdfHeight = 279.4  // 11 inches in mm
    
    // Calculate dimensions
    const canvasAspectRatio = canvas.height / canvas.width
    
    if (!isFinite(canvasAspectRatio) || canvasAspectRatio <= 0) {
      throw new Error('Invalid aspect ratio calculated')
    }

    const imgWidth = pdfWidth
    const imgHeight = pdfWidth * canvasAspectRatio

    console.log('Calculated PDF dimensions:', {
      pdfWidth,
      pdfHeight,
      imgWidth,
      imgHeight,
      aspectRatio: canvasAspectRatio,
      estimatedPages: Math.ceil(imgHeight / pdfHeight)
    })

    // Validate dimensions
    if (!isFinite(imgWidth) || !isFinite(imgHeight) || imgWidth <= 0 || imgHeight <= 0) {
      throw new Error(`Invalid image dimensions: ${imgWidth} x ${imgHeight}`)
    }

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/jpeg', quality)

    if (!imgData || imgData.length < 100) {
      throw new Error('Failed to convert canvas to image')
    }

    onProgress?.(80)

    // Add pages
    let heightLeft = imgHeight
    let position = 0

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight

    // Add more pages if needed
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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Make sure to restore styles even on error
    try {
      element.style.width = ''
      element.style.minWidth = ''
      element.style.maxWidth = ''
      element.style.boxSizing = ''
    } catch (restoreError) {
      console.error('Failed to restore element styles:', restoreError)
    }
    
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