// Word search generator utility
export const generateWordSearch = (words, gridSize = 15, difficulty = 'easy') => {
  const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''))
  const placedWords = []
  const directions = difficulty === 'easy' 
    ? [[0, 1], [1, 0]] // horizontal and vertical only
    : [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]] // all directions

  // Clean and filter words
  const cleanWords = words
    .map(word => word.toUpperCase().replace(/[^A-Z]/g, ''))
    .filter(word => word.length > 2 && word.length <= gridSize)
    .filter(word => !isFoulWord(word))

  // Try to place each word
  cleanWords.forEach(word => {
    let placed = false
    let attempts = 0
    
    while (!placed && attempts < 100) {
      const direction = directions[Math.floor(Math.random() * directions.length)]
      const startRow = Math.floor(Math.random() * gridSize)
      const startCol = Math.floor(Math.random() * gridSize)
      
      if (canPlaceWord(grid, word, startRow, startCol, direction, gridSize)) {
        placeWord(grid, word, startRow, startCol, direction)
        placedWords.push({
          word,
          startRow,
          startCol,
          direction,
          endRow: startRow + (direction[0] * (word.length - 1)),
          endCol: startCol + (direction[1] * (word.length - 1))
        })
        placed = true
      }
      attempts++
    }
  })

  // Fill empty cells with random letters
  fillEmptyCells(grid)

  return {
    grid,
    placedWords,
    words: placedWords.map(w => w.word)
  }
}

const canPlaceWord = (grid, word, startRow, startCol, direction, gridSize) => {
  const endRow = startRow + (direction[0] * (word.length - 1))
  const endCol = startCol + (direction[1] * (word.length - 1))
  
  // Check if word fits in grid
  if (endRow < 0 || endRow >= gridSize || endCol < 0 || endCol >= gridSize) {
    return false
  }
  
  // Check if cells are empty or contain the same letter
  for (let i = 0; i < word.length; i++) {
    const row = startRow + (direction[0] * i)
    const col = startCol + (direction[1] * i)
    const cell = grid[row][col]
    
    if (cell !== '' && cell !== word[i]) {
      return false
    }
  }
  
  return true
}

const placeWord = (grid, word, startRow, startCol, direction) => {
  for (let i = 0; i < word.length; i++) {
    const row = startRow + (direction[0] * i)
    const col = startCol + (direction[1] * i)
    grid[row][col] = word[i]
  }
}

const fillEmptyCells = (grid) => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] === '') {
        grid[row][col] = letters[Math.floor(Math.random() * letters.length)]
      }
    }
  }
}

// Simple foul word filter (extend as needed)
const foulWords = ['DAMN', 'HELL', 'CRAP', 'STUPID', 'HATE', 'KILL', 'DIE', 'DEAD']

const isFoulWord = (word) => {
  return foulWords.some(foul => word.includes(foul))
}

export { isFoulWord }