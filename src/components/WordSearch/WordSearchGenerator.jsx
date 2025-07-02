import React, { useState } from 'react'
import { generateWordSearch } from '../../utils/wordSearch'
import { generateWordSearchPDF } from '../../utils/pdfGenerator'
import { createWordSearch } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiGrid, FiDownload, FiRefreshCw, FiSave } = FiIcons

const WordSearchGenerator = () => {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [words, setWords] = useState('')
  const [gridSize, setGridSize] = useState(15)
  const [difficulty, setDifficulty] = useState('easy')
  const [studentName, setStudentName] = useState('')
  const [generatedPuzzle, setGeneratedPuzzle] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = () => {
    if (!title.trim() || !words.trim()) {
      toast.error('Please enter a title and words')
      return
    }

    setLoading(true)
    
    try {
      const wordList = words.split('\n').map(w => w.trim()).filter(w => w.length > 0)
      
      if (wordList.length === 0) {
        toast.error('Please enter at least one word')
        return
      }

      const puzzle = generateWordSearch(wordList, gridSize, difficulty)
      setGeneratedPuzzle({ ...puzzle, title, studentName })
      toast.success('Word search generated successfully!')
    } catch (error) {
      toast.error('Error generating word search')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = (includeAnswerKey = false) => {
    if (!generatedPuzzle) return

    try {
      const pdf = generateWordSearchPDF(generatedPuzzle, title, studentName, includeAnswerKey)
      const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_wordsearch${includeAnswerKey ? '_answers' : ''}.pdf`
      pdf.save(filename)
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      toast.error('Error generating PDF')
    }
  }

  const handleSave = async () => {
    if (!generatedPuzzle) return

    try {
      const { data, error } = await createWordSearch({
        title,
        words: generatedPuzzle.words,
        grid_size: gridSize,
        difficulty,
        generated_by: user.profile.id,
        grid_data: generatedPuzzle.grid,
        placed_words: generatedPuzzle.placedWords
      })

      if (error) throw error
      toast.success('Word search saved successfully!')
    } catch (error) {
      toast.error('Error saving word search')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Word Search Generator</h1>
        <p className="mt-2 text-gray-600">
          Create custom word search puzzles for your students
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Puzzle Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter puzzle title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name (optional)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter student name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grid Size
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                >
                  <option value={10}>10x10</option>
                  <option value={15}>15x15</option>
                  <option value={20}>20x20</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="easy">Easy (Forward only)</option>
                  <option value="hard">Hard (All directions)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Words (one per line)
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={8}
                placeholder="Enter words, one per line"
                value={words}
                onChange={(e) => setWords(e.target.value)}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <SafeIcon icon={loading ? FiRefreshCw : FiGrid} className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Generating...' : 'Generate Puzzle'}</span>
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
            {generatedPuzzle && (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center space-x-1"
                >
                  <SafeIcon icon={FiSave} className="h-4 w-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => handleDownloadPDF(false)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center space-x-1"
                >
                  <SafeIcon icon={FiDownload} className="h-4 w-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleDownloadPDF(true)}
                  className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm flex items-center space-x-1"
                >
                  <SafeIcon icon={FiDownload} className="h-4 w-4" />
                  <span>PDF + Answers</span>
                </button>
              </div>
            )}
          </div>

          {generatedPuzzle ? (
            <div className="space-y-4">
              {/* Grid */}
              <div className="inline-block border border-gray-300">
                {generatedPuzzle.grid.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {row.map((letter, colIndex) => (
                      <div
                        key={colIndex}
                        className="w-6 h-6 border border-gray-200 flex items-center justify-center text-xs font-mono"
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Word List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Words to find ({generatedPuzzle.words.length}):
                </h3>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  {generatedPuzzle.words.map((word, index) => (
                    <div key={index} className="text-gray-600">
                      • {word}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <SafeIcon icon={FiGrid} className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Generate a puzzle to see preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WordSearchGenerator