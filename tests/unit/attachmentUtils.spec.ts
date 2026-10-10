import { describe, expect, it } from 'vitest'
import { FileType } from '@/types'
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  formatFileSize,
  getDownloadUrl,
  getFileExtension,
  getFileIcon,
  getFileIconName,
  getFileTypeColor,
  getFileTypeFromExtension,
  isImageFile,
  truncateFileName,
  validateFile,
} from '@/lib/attachmentUtils'

describe('formatFileSize', () => {
  it('formats zero bytes', () => {
    // Arrange
    const bytes = 0

    // Act
    const result = formatFileSize(bytes)

    // Assert
    expect(result).toBe('0 Bytes')
  })

  it('formats byte values below one kilobyte', () => {
    // Arrange
    const bytes = 500

    // Act
    const result = formatFileSize(bytes)

    // Assert
    expect(result).toBe('500 Bytes')
  })

  it('formats the kilobyte boundary', () => {
    // Arrange
    const justBelow = 1023
    const exactlyOneKB = 1024

    // Act
    const below = formatFileSize(justBelow)
    const exact = formatFileSize(exactlyOneKB)

    // Assert
    expect(below).toBe('1023 Bytes')
    expect(exact).toBe('1 KB')
  })

  it('formats fractional kilobytes', () => {
    // Arrange
    const bytes = 1536

    // Act
    const result = formatFileSize(bytes)

    // Assert
    expect(result).toBe('1.5 KB')
  })

  it('formats megabyte values', () => {
    // Arrange
    const oneMB = 1024 * 1024

    // Act
    const result = formatFileSize(oneMB)
    const maxConfigured = formatFileSize(MAX_FILE_SIZE)

    // Assert
    expect(result).toBe('1 MB')
    expect(maxConfigured).toBe('10 MB')
  })

  it('formats gigabyte values', () => {
    // Arrange
    const oneGB = 1024 * 1024 * 1024

    // Act
    const result = formatFileSize(oneGB)

    // Assert
    expect(result).toBe('1 GB')
  })

  it('formats a value just below one megabyte in kilobytes', () => {
    // Arrange: the algorithm floors to the KB unit, so 1 MB - 1 byte is '1024 KB'
    const bytes = 1024 * 1024 - 1

    // Act
    const result = formatFileSize(bytes)

    // Assert
    expect(result).toBe('1024 KB')
  })
})

describe('getFileExtension', () => {
  it('returns the extension including the dot', () => {
    // Arrange
    const filename = 'report.pdf'

    // Act
    const result = getFileExtension(filename)

    // Assert
    expect(result).toBe('.pdf')
  })

  it('returns the last segment for filenames with multiple dots', () => {
    // Arrange
    const filename = 'archive.tar.gz'

    // Act
    const result = getFileExtension(filename)

    // Assert
    expect(result).toBe('.gz')
  })

  it('preserves the original case of the extension', () => {
    // Arrange
    const filename = 'REPORT.PDF'

    // Act
    const result = getFileExtension(filename)

    // Assert
    expect(result).toBe('.PDF')
  })

  it('returns an empty string for a filename without extension', () => {
    // Original it.skip reason preserved: BUG REAL en src (NO corregir aquí): attachmentUtils.ts:61
    // `filename.slice(filename.lastIndexOf('.'))` con lastIndexOf === -1
    // equivale a `slice(-1)` y devuelve el último carácter ('README' -> 'E').
    // Evidencia: node -e "console.log('README'.slice('README'.lastIndexOf('.')))" -> "E".
    // Este test refleja el comportamiento correcto esperado.
    // Arrange
    const filename = 'README'

    // Act
    const result = getFileExtension(filename)

    // Assert
    expect(result).toBe('')
  })
})

describe('truncateFileName', () => {
  it('returns short filenames unchanged', () => {
    // Arrange
    const filename = 'report.pdf'

    // Act
    const result = truncateFileName(filename)

    // Assert
    expect(result).toBe(filename)
  })

  it('returns a filename of exactly maxLength unchanged', () => {
    // Arrange: 21 chars + '.pdf' (4 chars) = 25, the default maxLength
    const filename = `${'a'.repeat(21)}.pdf`
    expect(filename).toHaveLength(25)

    // Act
    const result = truncateFileName(filename)

    // Assert
    expect(result).toBe(filename)
  })

  it('truncates long filenames preserving the extension', () => {
    // Arrange
    const filename = `${'a'.repeat(40)}.pdf`

    // Act
    const result = truncateFileName(filename)

    // Assert
    expect(result.length).toBeLessThanOrEqual(25)
    expect(result).toContain('...')
    expect(result.endsWith('.pdf')).toBe(true)
  })

  it('honors a custom maxLength', () => {
    // Arrange
    const filename = `${'b'.repeat(30)}.docx`

    // Act
    const result = truncateFileName(filename, 15)

    // Assert
    expect(result.length).toBeLessThanOrEqual(15)
    expect(result.endsWith('.docx')).toBe(true)
  })
})

describe('getFileTypeFromExtension', () => {
  it('maps .pdf to the PDF file type', () => {
    // Arrange
    const filename = 'report.pdf'

    // Act
    const result = getFileTypeFromExtension(filename)

    // Assert
    expect(result).toBe(FileType.PDF)
  })

  it('maps uppercase extensions case-insensitively', () => {
    // Arrange
    const filename = 'REPORT.DOCX'

    // Act
    const result = getFileTypeFromExtension(filename)

    // Assert
    expect(result).toBe(FileType.DOCX)
  })

  it('returns null for unsupported extensions', () => {
    // Arrange
    const image = 'photo.png'
    const text = 'notes.txt'

    // Act
    const imageResult = getFileTypeFromExtension(image)
    const textResult = getFileTypeFromExtension(text)

    // Assert
    expect(imageResult).toBeNull()
    expect(textResult).toBeNull()
  })
})

describe('getFileIcon', () => {
  it('maps each file type to its color class', () => {
    // Arrange
    const pdf = FileType.PDF
    const docx = FileType.DOCX
    const unknown = 'png' as FileType

    // Act
    const pdfIcon = getFileIcon(pdf)
    const docxIcon = getFileIcon(docx)
    const defaultIcon = getFileIcon(unknown)

    // Assert
    expect(pdfIcon).toBe('text-red-600')
    expect(docxIcon).toBe('text-blue-600')
    expect(defaultIcon).toBe('text-gray-600')
  })
})

describe('getFileIconName', () => {
  it('maps supported types to DocumentTextIcon and the rest to DocumentIcon', () => {
    // Arrange
    const pdf = FileType.PDF
    const docx = FileType.DOCX
    const unknown = 'png' as FileType

    // Act
    const pdfIcon = getFileIconName(pdf)
    const docxIcon = getFileIconName(docx)
    const defaultIcon = getFileIconName(unknown)

    // Assert
    expect(pdfIcon).toBe('DocumentTextIcon')
    expect(docxIcon).toBe('DocumentTextIcon')
    expect(defaultIcon).toBe('DocumentIcon')
  })
})

describe('getFileTypeColor', () => {
  it('maps each file type to its badge color classes', () => {
    // Arrange
    const pdf = FileType.PDF
    const docx = FileType.DOCX
    const unknown = 'png' as FileType

    // Act
    const pdfColor = getFileTypeColor(pdf)
    const docxColor = getFileTypeColor(docx)
    const defaultColor = getFileTypeColor(unknown)

    // Assert
    expect(pdfColor).toBe('bg-red-100 text-red-800')
    expect(docxColor).toBe('bg-blue-100 text-blue-800')
    expect(defaultColor).toBe('bg-gray-100 text-gray-800')
  })
})

describe('isImageFile', () => {
  it('returns true for image MIME types', () => {
    // Arrange
    const png = 'image/png'
    const jpeg = 'image/jpeg'

    // Act
    const pngResult = isImageFile(png)
    const jpegResult = isImageFile(jpeg)

    // Assert
    expect(pngResult).toBe(true)
    expect(jpegResult).toBe(true)
  })

  it('returns false for non-image MIME types', () => {
    // Arrange
    const pdf = 'application/pdf'
    const empty = ''

    // Act
    const pdfResult = isImageFile(pdf)
    const emptyResult = isImageFile(empty)

    // Assert
    expect(pdfResult).toBe(false)
    expect(emptyResult).toBe(false)
  })
})

describe('getDownloadUrl', () => {
  it('prefixes a plain filename with the files API path', () => {
    // Arrange
    const filePath = 'report.pdf'

    // Act
    const result = getDownloadUrl(filePath)

    // Assert
    expect(result).toBe('/api/v1/files/report.pdf')
  })

  it('preserves nested paths', () => {
    // Arrange
    const filePath = 'uploads/2024/report.pdf'

    // Act
    const result = getDownloadUrl(filePath)

    // Assert
    expect(result).toBe('/api/v1/files/uploads/2024/report.pdf')
  })
})

describe('validateFile', () => {
  it('rejects a PDF file: only DOCX is allowed for the editor', () => {
    // Arrange
    const file = new File(['content'], 'report.pdf', { type: 'application/pdf' })

    // Act
    const result = validateFile(file)

    // Assert
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Solo se admiten archivos .docx')
  })

  it('accepts a valid DOCX file', () => {
    // Arrange
    const file = new File(['content'], 'report.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    // Act
    const result = validateFile(file)

    // Assert
    expect(result).toEqual({ isValid: true })
  })

  it('accepts an uppercase DOCX extension with an allowed MIME type', () => {
    // Arrange
    const file = new File(['content'], 'REPORT.DOCX', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    // Act
    const result = validateFile(file)

    // Assert
    expect(result).toEqual({ isValid: true })
  })

  it('accepts a file of exactly the maximum size', () => {
    // Arrange
    const file = new File([new Uint8Array(MAX_FILE_SIZE)], 'exact.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    // Act
    const result = validateFile(file)

    // Assert
    expect(result).toEqual({ isValid: true })
  })

  it('rejects a file larger than the maximum size', () => {
    // Arrange
    const file = new File([new Uint8Array(MAX_FILE_SIZE + 1)], 'big.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    // Act
    const result = validateFile(file)

    // Assert
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('10 MB')
  })

  it('rejects a disallowed MIME type', () => {
    // Arrange
    const file = new File(['content'], 'photo.png', { type: 'image/png' })

    // Act
    const result = validateFile(file)

    // Assert
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Tipo de archivo no permitido')
  })

  it('rejects a disallowed extension even with an allowed MIME type', () => {
    // Arrange
    const file = new File(['content'], 'report.png', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    // Act
    const result = validateFile(file)

    // Assert
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Extensión de archivo no permitida')
  })

  it('exposes the configured size limit and allow-lists', () => {
    // Arrange: constants driving validateFile
    const expectedMax = 10 * 1024 * 1024

    // Act
    const max = MAX_FILE_SIZE

    // Assert
    expect(max).toBe(expectedMax)
    expect(ALLOWED_FILE_TYPES).toEqual([
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ])
    expect(ALLOWED_EXTENSIONS).toEqual(['.docx'])
  })
})
