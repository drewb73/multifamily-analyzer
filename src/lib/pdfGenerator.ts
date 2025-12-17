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
    onProgress?.(5)

    // Get the actual content dimensions
    const contentWidth = element.scrollWidth
    const contentHeight = element.scrollHeight

    // Letter size in pixels at 96 DPI
    const pdfWidthPx = 816  // 8.5 inches × 96 DPI
    const pdfHeightPx = 1056 // 11 inches × 96 DPI

    // Calculate scale to fit content to page width
    const scaleToFit = pdfWidthPx / contentWidth

    onProgress?.(10)
    
    // Capture HTML as canvas with proper scaling
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: contentWidth,
      height: contentHeight,
      windowWidth: contentWidth,
      windowHeight: contentHeight,
      onclone: (clonedDoc) => {
        // Find the cloned element
        const clonedElement = clonedDoc.querySelector('[data-pdf-content]') as HTMLElement
        if (clonedElement) {
          // Remove any transform/zoom applied by preview
          clonedElement.style.transform = 'none'
          clonedElement.style.width = '816px' // Set to PDF page width
          
          // Ensure proper sizing for all child elements
          const allElements = clonedElement.querySelectorAll('*') as NodeListOf<HTMLElement>
          allElements.forEach(el => {
            // Remove any preview-specific styling
            if (el.style.transform && el.style.transform.includes('scale')) {
              el.style.transform = 'none'
            }
          })
        }
      }
    })

    onProgress?.(60)

    // Create PDF with Letter size
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [pdfWidthPx, pdfHeightPx],
      compress: true
    })

    // Calculate how many pages we need
    const imgWidth = pdfWidthPx
    const imgHeight = (canvas.height * pdfWidthPx) / canvas.width
    const pageHeight = pdfHeightPx
    
    let heightLeft = imgHeight
    let position = 0
    let page = 0

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/jpeg', quality)

    onProgress?.(80)

    // Add pages
    while (heightLeft > 0) {
      if (page > 0) {
        pdf.addPage()
      }
      
      // Calculate position for this page
      const yOffset = -page * pageHeight
      
      pdf.addImage(
        imgData, 
        'JPEG', 
        0, 
        yOffset, 
        imgWidth, 
        imgHeight,
        undefined,
        'FAST'
      )
      
      heightLeft -= pageHeight
      page++
    }

    onProgress?.(95)

    // Save PDF
    pdf.save(filename)

    onProgress?.(100)

    // Estimate file size
    const fileSize = (canvas.width * canvas.height * 3 * quality) / 1024 // KB

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