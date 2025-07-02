// PDF Service - Integration with Flask PDF Generator microservice

const PDF_SERVICE_URL = import.meta.env.VITE_PDF_SERVICE_URL || 'http://localhost:5000'

export const generateLessonPDF = async (lessonData) => {
  try {
    const response = await fetch(`${PDF_SERVICE_URL}/generate-lesson-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: lessonData.title,
        content: lessonData.content,
        studentName: lessonData.studentName || '',
        ageGroup: lessonData.ageGroup || '',
        topic: lessonData.topic || '',
        biblePassage: lessonData.biblePassage || '',
        theme: lessonData.theme || '',
        filename: lessonData.filename || 'lesson.pdf'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate PDF')
    }

    // Return the blob for download
    const blob = await response.blob()
    return blob
  } catch (error) {
    console.error('PDF generation error:', error)
    throw error
  }
}

export const generateBatchLessonPDF = async (lessons, filename = 'batch_lessons.pdf') => {
  try {
    const response = await fetch(`${PDF_SERVICE_URL}/generate-batch-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lessons: lessons,
        filename: filename
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate batch PDF')
    }

    // Return the blob for download
    const blob = await response.blob()
    return blob
  } catch (error) {
    console.error('Batch PDF generation error:', error)
    throw error
  }
}

export const checkPDFServiceHealth = async () => {
  try {
    console.log('Checking PDF service health at:', `${PDF_SERVICE_URL}/health`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
    
    const response = await fetch(`${PDF_SERVICE_URL}/health`, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.log('PDF service responded with error:', response.status)
      return false
    }

    const data = await response.json()
    console.log('PDF service health response:', data)
    return data.status === 'healthy'
  } catch (error) {
    console.log('PDF service health check failed:', error.message)
    return false
  }
}

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}