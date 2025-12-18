// src/lib/pdfGenerator.ts
// IMPROVED SECTION CAPTURE - No repeated headers/footers, consistent sizing
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

    // Find all section wrappers
    const sectionWrappers = element.querySelectorAll('[data-section-id]') as NodeListOf<HTMLElement>
    
    console.log(`Found ${sectionWrappers.length} sections to capture`)

    if (sectionWrappers.length === 0) {
      console.warn('No sections found, using fallback method')
      return await generatePDFFallback(element, options)
    }

    // Define page grouping - which sections go on which page
    const pageGroups = [
      ['property', 'metrics'],           // Page 1
      ['income-expense'],                // Page 2
      ['cashflow', 'returns'],          // Page 3
      ['financing'],                     // Page 4 (if exists)
      ['market'],                        // Page 5 (if exists)
    ]

    // Get header and footer ONCE
    const header = element.querySelector('[class*="pdf-header"]') as HTMLElement | null
    const footer = element.querySelector('[class*="pdf-footer"]') as HTMLElement | null

    // Map sections by ID
    const sectionsMap = new Map<string, HTMLElement>()
    sectionWrappers.forEach(section => {
      const id = section.getAttribute('data-section-id')
      if (id) sectionsMap.set(id, section)
    })

    // Filter to only groups that have sections
    const validGroups = pageGroups.filter(group => 
      group.some(id => sectionsMap.has(id))
    )

    if (validGroups.length === 0) {
      console.warn('No valid section groups found')
      return await generatePDFFallback(element, options)
    }

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
      compress: true
    })

    const pdfWidth = 215.9  // Letter width in mm
    const pdfHeight = 279.4 // Letter height in mm
    const FIXED_WIDTH = 850 // Fixed capture width
    const PADDING = 24      // Padding in pixels

    let currentPage = 0
    const totalPages = validGroups.length

    // Process each page group
    for (let i = 0; i < validGroups.length; i++) {
      const group = validGroups[i]
      const isFirstPage = i === 0
      const isLastPage = i === validGroups.length - 1

      const sectionsInGroup = group
        .map(id => sectionsMap.get(id))
        .filter(Boolean) as HTMLElement[]

      if (sectionsInGroup.length === 0) continue

      currentPage++
      console.log(`Capturing page ${currentPage}/${totalPages}: ${group.join(', ')}`)

      // Create temporary container
      const pageContainer = document.createElement('div')
      pageContainer.style.cssText = `
        width: ${FIXED_WIDTH}px;
        min-width: ${FIXED_WIDTH}px;
        max-width: ${FIXED_WIDTH}px;
        background-color: white;
        padding: ${PADDING}px;
        box-sizing: border-box;
        position: absolute;
        left: -9999px;
        top: 0;
      `

      // Add header ONLY on first page
      if (isFirstPage && header) {
        const headerClone = header.cloneNode(true) as HTMLElement
        headerClone.style.width = '100%'
        headerClone.style.marginBottom = '20px'
        pageContainer.appendChild(headerClone)
      }

      // Add sections with consistent spacing
      sectionsInGroup.forEach((section, idx) => {
        const sectionClone = section.cloneNode(true) as HTMLElement
        sectionClone.style.width = '100%'
        sectionClone.style.marginBottom = idx < sectionsInGroup.length - 1 ? '20px' : '0'
        pageContainer.appendChild(sectionClone)
      })

      // Add footer ONLY on last page
      if (isLastPage && footer) {
        const footerClone = footer.cloneNode(true) as HTMLElement
        footerClone.style.width = '100%'
        footerClone.style.marginTop = '20px'
        pageContainer.appendChild(footerClone)
      }

      // Add to document
      document.body.appendChild(pageContainer)

      // Wait for layout
      await new Promise(resolve => setTimeout(resolve, 150))

      // Capture this page
      const canvas = await html2canvas(pageContainer, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: FIXED_WIDTH,
        windowWidth: FIXED_WIDTH
      })

      // Remove temporary container
      document.body.removeChild(pageContainer)

      // Calculate dimensions
      const canvasAspectRatio = canvas.height / canvas.width
      const imgWidth = pdfWidth
      const imgHeight = pdfWidth * canvasAspectRatio

      // Add new page if not first
      if (currentPage > 1) {
        pdf.addPage()
      }

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/jpeg', quality)

      // Add image to PDF, fitting to page
      if (imgHeight > pdfHeight) {
        // Scale down to fit
        const scaleFactor = pdfHeight / imgHeight
        const scaledWidth = imgWidth * scaleFactor
        const scaledHeight = pdfHeight
        const xOffset = (pdfWidth - scaledWidth) / 2
        pdf.addImage(imgData, 'JPEG', xOffset, 0, scaledWidth, scaledHeight)
      } else {
        // Use full width, top-aligned
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight)
      }

      // Update progress
      const progress = 10 + (currentPage / totalPages) * 85
      onProgress?.(Math.round(progress))
    }

    onProgress?.(95)

    // Save
    pdf.save(filename)

    onProgress?.(100)

    console.log(`PDF generated successfully: ${totalPages} pages`)

    return {
      success: true,
      filename,
      fileSize: totalPages * 200
    }

  } catch (error) {
    console.error('PDF generation error:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Fallback method for when sections aren't found
async function generatePDFFallback(
  element: HTMLElement,
  options: GeneratePDFOptions
): Promise<GeneratePDFResult> {
  const scale = options.scale || 2
  const { filename = 'Property_Analysis.pdf', onProgress, quality = 0.95 } = options

  try {
    console.log('Using fallback PDF generation method')
    
    const FIXED_PDF_WIDTH = 850

    // Store original styles
    const originalStyles = {
      width: element.style.width,
      minWidth: element.style.minWidth,
      maxWidth: element.style.maxWidth,
      boxSizing: element.style.boxSizing
    }

    // Force fixed width
    element.style.width = `${FIXED_PDF_WIDTH}px`
    element.style.minWidth = `${FIXED_PDF_WIDTH}px`
    element.style.maxWidth = `${FIXED_PDF_WIDTH}px`
    element.style.boxSizing = 'border-box'

    void element.offsetHeight
    await new Promise(resolve => setTimeout(resolve, 100))

    // Capture
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    // Restore styles
    element.style.width = originalStyles.width
    element.style.minWidth = originalStyles.minWidth
    element.style.maxWidth = originalStyles.maxWidth
    element.style.boxSizing = originalStyles.boxSizing

    onProgress?.(60)

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
      compress: true
    })

    const pdfWidth = 215.9
    const pdfHeight = 279.4
    const canvasAspectRatio = canvas.height / canvas.width
    const imgWidth = pdfWidth
    const imgHeight = pdfWidth * canvasAspectRatio

    const imgData = canvas.toDataURL('image/jpeg', quality)

    onProgress?.(80)

    // Add pages
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight

    while (heightLeft > 0) {
      position = -(imgHeight - heightLeft)
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight
    }

    onProgress?.(95)
    pdf.save(filename)
    onProgress?.(100)

    return {
      success: true,
      filename,
      fileSize: Math.round((canvas.width * canvas.height * 3 * quality) / 1024)
    }
  } catch (error) {
    console.error('Fallback PDF generation error:', error)
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