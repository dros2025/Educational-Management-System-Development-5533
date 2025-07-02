import jsPDF from 'jspdf'

export const generateWordSearchPDF = (wordSearch, title, studentName = '', includeAnswerKey = false) => {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  
  // Title
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  const titleWidth = pdf.getTextWidth(title)
  pdf.text(title, (pageWidth - titleWidth) / 2, 30)
  
  // Student name and date (top right)
  if (studentName) {
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    const currentDate = new Date().toLocaleDateString()
    const studentText = `Name: ${studentName}`
    const dateText = `Date: ${currentDate}`
    
    pdf.text(studentText, pageWidth - 80, 20)
    pdf.text(dateText, pageWidth - 80, 30)
  }
  
  // Grid
  const gridSize = wordSearch.grid.length
  const cellSize = 8
  const gridStartX = 30
  const gridStartY = 50
  
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  
  // Draw grid
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = gridStartX + (col * cellSize)
      const y = gridStartY + (row * cellSize)
      
      // Draw cell border
      pdf.rect(x, y, cellSize, cellSize)
      
      // Add letter
      const letter = wordSearch.grid[row][col]
      pdf.text(letter, x + cellSize/2 - 1.5, y + cellSize/2 + 1.5)
    }
  }
  
  // Word list
  const wordsPerColumn = Math.ceil(wordSearch.words.length / 3)
  const wordListStartY = gridStartY + (gridSize * cellSize) + 20
  
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Find these words:', gridStartX, wordListStartY)
  
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  
  wordSearch.words.forEach((word, index) => {
    const column = Math.floor(index / wordsPerColumn)
    const row = index % wordsPerColumn
    const x = gridStartX + (column * 60)
    const y = wordListStartY + 15 + (row * 8)
    
    pdf.text(`• ${word}`, x, y)
  })
  
  // Answer key on second page
  if (includeAnswerKey) {
    pdf.addPage()
    
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Answer Key', pageWidth / 2 - 20, 30)
    
    // Redraw grid with highlighted words
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = gridStartX + (col * cellSize)
        const y = gridStartY + (row * cellSize)
        
        // Check if this cell is part of a placed word
        const isPartOfWord = wordSearch.placedWords.some(placedWord => {
          for (let i = 0; i < placedWord.word.length; i++) {
            const wordRow = placedWord.startRow + (placedWord.direction[0] * i)
            const wordCol = placedWord.startCol + (placedWord.direction[1] * i)
            if (wordRow === row && wordCol === col) return true
          }
          return false
        })
        
        if (isPartOfWord) {
          pdf.setFillColor(255, 255, 0) // Yellow highlight
          pdf.rect(x, y, cellSize, cellSize, 'F')
        }
        
        pdf.rect(x, y, cellSize, cellSize)
        
        const letter = wordSearch.grid[row][col]
        pdf.setTextColor(0, 0, 0)
        pdf.text(letter, x + cellSize/2 - 1.5, y + cellSize/2 + 1.5)
      }
    }
  }
  
  return pdf
}

export const generateAttendancePDF = (attendanceData, date, teacherName) => {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  
  // Title
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Attendance Report', pageWidth / 2 - 30, 30)
  
  // Date and teacher
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Date: ${date}`, 20, 50)
  pdf.text(`Teacher: ${teacherName}`, 20, 60)
  
  // Attendance list
  let yPosition = 80
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Students:', 20, yPosition)
  
  yPosition += 15
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  
  attendanceData.forEach((record, index) => {
    const status = record.present ? '✓ Present' : '✗ Absent'
    pdf.text(`${index + 1}. ${record.users.name} - ${status}`, 20, yPosition)
    yPosition += 10
  })
  
  // Summary
  yPosition += 10
  const presentCount = attendanceData.filter(r => r.present).length
  const totalCount = attendanceData.length
  
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Summary: ${presentCount}/${totalCount} students present`, 20, yPosition)
  
  return pdf
}