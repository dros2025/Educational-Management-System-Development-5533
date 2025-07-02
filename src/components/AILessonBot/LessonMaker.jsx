import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { generateLesson } from '../../lib/aiService'
import { generateLessonPDF, generateBatchLessonPDF, downloadBlob, checkPDFServiceHealth } from '../../lib/pdfService'
import { getUsers } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiBook, FiUsers, FiTarget, FiFileText, FiDownload, FiRefreshCw, FiLayers, FiZap, FiArrowLeft, FiCheck, FiX, FiShuffle, FiClock, FiAlertCircle, FiCheckCircle, FiDatabase, FiBookmark, FiHeart, FiMail, FiBell } = FiIcons

const LessonMaker = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [lessonType, setLessonType] = useState('single')
  const [pdfServiceAvailable, setPdfServiceAvailable] = useState(false)
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  
  const [formData, setFormData] = useState({
    lessonType: 'single',
    topic: '',
    biblePassage: '',
    theme: '',
    selectedClasses: [],
    duration: '45',
    objectives: '',
    specialRequests: '',
    seriesTitle: '',
    lessonCount: 4,
    autoGenerateTopics: false,
    avoidRepeats: true,
    // New assignment fields
    assignToTeachers: [],
    assignToStudents: [],
    assignmentDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    sendNotifications: true
  })

  const [generatedContent, setGeneratedContent] = useState(null)
  const [generatingProgress, setGeneratingProgress] = useState(null)
  const [masterLesson, setMasterLesson] = useState(null)

  // Enhanced age group sections matching the Lessons page
  const availableClasses = [
    {
      id: '3-5',
      name: 'Children (3-5 years)',
      color: 'bg-pink-100 text-pink-800',
      section: 'Children',
      description: 'Simple stories and hands-on activities'
    },
    {
      id: '5-10',
      name: 'Children (5-10 years)',
      color: 'bg-pink-100 text-pink-800',
      section: 'Children',
      description: 'Interactive storytelling and visual learning'
    },
    {
      id: '11-14',
      name: 'Preteen (11-14 years)',
      color: 'bg-blue-100 text-blue-800',
      section: 'Preteen',
      description: 'Deeper discussions and group activities'
    },
    {
      id: '15-18',
      name: 'Teen (15-18 years)',
      color: 'bg-green-100 text-green-800',
      section: 'Teen',
      description: 'Real-life challenges and faith applications'
    },
    {
      id: '18+',
      name: 'Youth (18+ years)',
      color: 'bg-purple-100 text-purple-800',
      section: 'Youth',
      description: 'Theological depth and practical applications'
    }
  ]

  // Auto-generated topic suggestions
  const topicSuggestions = [
    { topic: "God's Love", passage: "John 3:16", theme: "Understanding God's unconditional love for humanity" },
    { topic: "Forgiveness", passage: "Matthew 6:14-15", theme: "Learning to forgive others as God forgives us" },
    { topic: "Prayer", passage: "Matthew 6:9-13", theme: "How to communicate with God through prayer" },
    { topic: "Faith", passage: "Hebrews 11:1", theme: "What it means to have faith in God" },
    { topic: "Kindness", passage: "Ephesians 4:32", theme: "Showing kindness to others as Christ showed us" },
    { topic: "Trust in God", passage: "Proverbs 3:5-6", theme: "Learning to trust God's plan for our lives" },
    { topic: "Jesus the Good Shepherd", passage: "John 10:11-16", theme: "Jesus cares for us like a shepherd cares for sheep" },
    { topic: "Creation", passage: "Genesis 1:1-31", theme: "God created everything and it was good" },
    { topic: "Noah's Ark", passage: "Genesis 6-9", theme: "God keeps His promises and protects His people" },
    { topic: "David and Goliath", passage: "1 Samuel 17", theme: "With God's help, we can overcome any challenge" },
    { topic: "The Golden Rule", passage: "Matthew 7:12", theme: "Treat others the way you want to be treated" },
    { topic: "Sharing", passage: "Acts 2:44-47", theme: "The joy of sharing with others in need" },
    { topic: "Honesty", passage: "Proverbs 12:22", theme: "God values truthfulness and integrity" },
    { topic: "Helping Others", passage: "Galatians 6:2", theme: "We should help carry each other's burdens" },
    { topic: "Gratitude", passage: "1 Thessalonians 5:18", theme: "Being thankful in all circumstances" }
  ]

  // Check PDF service availability on component mount
  useEffect(() => {
    const checkPDFService = async () => {
      const isAvailable = await checkPDFServiceHealth()
      setPdfServiceAvailable(isAvailable)
      if (!isAvailable) {
        console.warn('PDF service not available - falling back to text downloads')
      }
    }
    checkPDFService()
    fetchUsersForAssignment()
  }, [])

  const fetchUsersForAssignment = async () => {
    try {
      const { data: users, error } = await getUsers()
      if (error) throw error

      const teacherUsers = users.filter(u => u.role === 'teacher')
      const studentUsers = users.filter(u => u.role === 'student')
      
      setTeachers(teacherUsers)
      setStudents(studentUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleClassSelection = (classId) => {
    setFormData(prev => ({
      ...prev,
      selectedClasses: prev.selectedClasses.includes(classId)
        ? prev.selectedClasses.filter(id => id !== classId)
        : [...prev.selectedClasses, classId]
    }))
  }

  const handleTeacherSelection = (teacherId) => {
    setFormData(prev => ({
      ...prev,
      assignToTeachers: prev.assignToTeachers.includes(teacherId)
        ? prev.assignToTeachers.filter(id => id !== teacherId)
        : [...prev.assignToTeachers, teacherId]
    }))
  }

  const handleStudentSelection = (studentId) => {
    setFormData(prev => ({
      ...prev,
      assignToStudents: prev.assignToStudents.includes(studentId)
        ? prev.assignToStudents.filter(id => id !== studentId)
        : [...prev.assignToStudents, studentId]
    }))
  }

  const selectAllClasses = () => {
    setFormData(prev => ({
      ...prev,
      selectedClasses: availableClasses.map(cls => cls.id)
    }))
  }

  const clearAllClasses = () => {
    setFormData(prev => ({
      ...prev,
      selectedClasses: []
    }))
  }

  const selectClassesBySection = (sectionName) => {
    const sectionClasses = availableClasses
      .filter(cls => cls.section === sectionName)
      .map(cls => cls.id)
    
    setFormData(prev => ({
      ...prev,
      selectedClasses: [...new Set([...prev.selectedClasses, ...sectionClasses])]
    }))
  }

  const getRandomTopic = () => {
    return topicSuggestions[Math.floor(Math.random() * topicSuggestions.length)]
  }

  const handleAutoGenerateTopic = () => {
    const randomTopic = getRandomTopic()
    setFormData(prev => ({
      ...prev,
      topic: randomTopic.topic,
      biblePassage: randomTopic.passage,
      theme: randomTopic.theme
    }))
    toast.success(`Generated topic: ${randomTopic.topic}`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.selectedClasses.length === 0) {
      toast.error('Please select at least one class/age group')
      return
    }

    if (!formData.autoGenerateTopics && !formData.topic.trim()) {
      toast.error('Please enter a lesson topic or enable auto-generate')
      return
    }

    if (!formData.autoGenerateTopics && !formData.biblePassage.trim()) {
      toast.error('Please enter a Bible passage or enable auto-generate')
      return
    }

    setLoading(true)
    setGeneratingProgress({
      current: 0,
      total: formData.selectedClasses.length,
      currentClass: '',
      stage: 'preparing'
    })

    try {
      let lessonData = { ...formData }

      // Auto-generate topic if enabled
      if (formData.autoGenerateTopics) {
        const randomTopic = getRandomTopic()
        lessonData = {
          ...lessonData,
          topic: randomTopic.topic,
          biblePassage: randomTopic.passage,
          theme: randomTopic.theme
        }
      }

      // Update progress for master lesson generation
      if (formData.selectedClasses.length > 1) {
        setGeneratingProgress({
          current: 0,
          total: formData.selectedClasses.length + 1, // +1 for master lesson
          currentClass: 'Master Lesson',
          stage: 'master'
        })
      }

      // Generate lessons with assignment data
      const lessonDataWithAssignments = {
        ...lessonData,
        assignToTeachers: formData.assignToTeachers,
        assignToStudents: formData.assignToStudents,
        assignmentDate: formData.assignmentDate,
        dueDate: formData.dueDate,
        sendNotifications: formData.sendNotifications
      }

      const result = await generateLesson(lessonDataWithAssignments, user.profile.id)

      // Handle multiple lessons result
      if (Array.isArray(result)) {
        // Extract master lesson info from the first result's metadata
        const firstLesson = result[0]
        if (firstLesson && firstLesson.memoryVerse) {
          setMasterLesson({
            title: lessonData.topic,
            memoryVerse: firstLesson.memoryVerse,
            coreMessage: firstLesson.coreMessage,
            topic: lessonData.topic,
            biblePassage: lessonData.biblePassage,
            theme: lessonData.theme
          })
        }

        setGeneratedContent({
          type: 'multiple',
          results: result,
          metadata: {
            totalClasses: formData.selectedClasses.length,
            lessonType: formData.lessonType,
            autoGenerated: formData.autoGenerateTopics,
            unified: true,
            masterLesson: masterLesson,
            assignedTeachers: formData.assignToTeachers.length,
            assignedStudents: formData.assignToStudents.length,
            notificationsSent: formData.sendNotifications
          }
        })

        // Show success message with database and assignment info
        const savedCount = result.filter(r => r.savedToDatabase).length
        const totalCount = result.length

        let successMessage = ''
        if (savedCount === totalCount) {
          successMessage = `Successfully generated unified lesson series for ${totalCount} age group${totalCount > 1 ? 's' : ''} and saved to Lessons tab!`
        } else if (savedCount > 0) {
          successMessage = `Generated ${totalCount} lesson${totalCount > 1 ? 's' : ''} - ${savedCount} saved to Lessons tab`
        } else {
          successMessage = `Generated ${totalCount} lesson${totalCount > 1 ? 's' : ''} (not saved to database)`
        }

        // Add assignment info to success message
        if (formData.assignToTeachers.length > 0 || formData.assignToStudents.length > 0) {
          const assignmentInfo = []
          if (formData.assignToTeachers.length > 0) {
            assignmentInfo.push(`${formData.assignToTeachers.length} teacher${formData.assignToTeachers.length > 1 ? 's' : ''}`)
          }
          if (formData.assignToStudents.length > 0) {
            assignmentInfo.push(`${formData.assignToStudents.length} student${formData.assignToStudents.length > 1 ? 's' : ''}`)
          }
          successMessage += ` Assigned to ${assignmentInfo.join(' and ')}.`
          
          if (formData.sendNotifications) {
            successMessage += ' Notifications sent!'
          }
        }

        toast.success(successMessage, { duration: 6000 })
      } else {
        // Single lesson result
        setGeneratedContent({
          type: 'single',
          ...result,
          metadata: {
            assignedTeachers: formData.assignToTeachers.length,
            assignedStudents: formData.assignToStudents.length,
            notificationsSent: formData.sendNotifications
          }
        })

        let successMessage = 'Lesson generated and saved to Lessons tab!'
        if (formData.assignToTeachers.length > 0 || formData.assignToStudents.length > 0) {
          const assignmentInfo = []
          if (formData.assignToTeachers.length > 0) {
            assignmentInfo.push(`${formData.assignToTeachers.length} teacher${formData.assignToTeachers.length > 1 ? 's' : ''}`)
          }
          if (formData.assignToStudents.length > 0) {
            assignmentInfo.push(`${formData.assignToStudents.length} student${formData.assignToStudents.length > 1 ? 's' : ''}`)
          }
          successMessage += ` Assigned to ${assignmentInfo.join(' and ')}.`
          
          if (formData.sendNotifications) {
            successMessage += ' Notifications sent!'
          }
        }

        toast.success(successMessage)
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate lesson')
    } finally {
      setLoading(false)
      setGeneratingProgress(null)
    }
  }

  const handleDownload = async (lesson, index = 0, format = 'pdf') => {
    try {
      if (format === 'pdf' && pdfServiceAvailable) {
        // Generate PDF using microservice
        const pdfData = {
          title: lesson.title,
          content: lesson.content,
          studentName: '',
          ageGroup: lesson.className || lesson.ageGroup,
          topic: lesson.topic || formData.topic,
          biblePassage: lesson.biblePassage || formData.biblePassage,
          theme: lesson.theme || formData.theme,
          filename: `${(lesson.topic || formData.topic).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${lesson.ageGroup || 'lesson'}.pdf`
        }

        const blob = await generateLessonPDF(pdfData)
        downloadBlob(blob, pdfData.filename)
        toast.success('PDF downloaded successfully!')
      } else {
        // Fallback to text file
        const content = `
${lesson.title}
${'='.repeat(lesson.title.length)}

Age Group: ${lesson.className || lesson.ageGroup}
Topic: ${lesson.topic || formData.topic}
Bible Passage: ${lesson.biblePassage || formData.biblePassage}
Theme: ${lesson.theme || formData.theme}
Duration: ${formData.duration} minutes

${masterLesson ? `Memory Verse: ${masterLesson.memoryVerse}` : ''}
${masterLesson ? `Core Message: ${masterLesson.coreMessage}` : ''}

${lesson.content}

---
Generated by AI Lesson Bot (Unified Generation)
Date: ${new Date().toLocaleDateString()}
Saved to Database: ${lesson.savedToDatabase ? 'Yes' : 'No'}
Assigned to: ${formData.assignToTeachers.length + formData.assignToStudents.length} users
        `.trim()

        const blob = new Blob([content], { type: 'text/plain' })
        const filename = `${(lesson.topic || formData.topic).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${lesson.ageGroup || 'lesson'}.txt`
        downloadBlob(blob, filename)
        toast.success('Text file downloaded successfully!')
      }
    } catch (error) {
      toast.error('Failed to download lesson: ' + error.message)
    }
  }

  const handleDownloadAll = async (format = 'pdf') => {
    if (generatedContent?.type === 'multiple') {
      try {
        if (format === 'pdf' && pdfServiceAvailable) {
          // Generate batch PDF using microservice
          const lessons = generatedContent.results.map(lesson => ({
            title: lesson.title,
            content: lesson.content,
            studentName: '',
            ageGroup: lesson.className || lesson.ageGroup,
            topic: lesson.topic || formData.topic,
            biblePassage: lesson.biblePassage || formData.biblePassage,
            theme: lesson.theme || formData.theme
          }))

          const blob = await generateBatchLessonPDF(lessons, 'unified_lesson_series.pdf')
          downloadBlob(blob, 'unified_lesson_series.pdf')
          toast.success('Unified lesson series PDF downloaded successfully!')
        } else {
          // Fallback to individual text files
          generatedContent.results.forEach((lesson, index) => {
            setTimeout(() => handleDownload(lesson, index, 'text'), index * 500)
          })
          toast.success('Downloading all lessons as text files...')
        }
      } catch (error) {
        toast.error('Failed to download batch: ' + error.message)
      }
    }
  }

  const handleNewLesson = () => {
    setGeneratedContent(null)
    setMasterLesson(null)
    setFormData({
      lessonType: 'single',
      topic: '',
      biblePassage: '',
      theme: '',
      selectedClasses: [],
      duration: '45',
      objectives: '',
      specialRequests: '',
      seriesTitle: '',
      lessonCount: 4,
      autoGenerateTopics: false,
      avoidRepeats: true,
      assignToTeachers: [],
      assignToStudents: [],
      assignmentDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      sendNotifications: true
    })
  }

  // Group classes by section for easier selection
  const classesBySection = availableClasses.reduce((acc, cls) => {
    if (!acc[cls.section]) acc[cls.section] = []
    acc[cls.section].push(cls)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center space-x-4">
        <Link
          to="/ai-lesson-bot"
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <SafeIcon icon={FiArrowLeft} className="h-4 w-4 mr-1" />
          Back to AI Lesson Bot
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center space-x-3">
        <SafeIcon icon={FiBook} className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">AI Lesson Maker</h1>
      </div>

      {/* Enhanced Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <SafeIcon icon={FiHeart} className="h-6 w-6 text-purple-600 mt-1" />
          <div>
            <h3 className="text-lg font-medium text-purple-900 mb-2">🎯 Complete Lesson Management</h3>
            <div className="text-sm text-purple-800 space-y-1">
              <p><strong>✨ Generate:</strong> AI-powered lessons for multiple age groups simultaneously</p>
              <p><strong>📚 Auto-Save:</strong> All lessons automatically saved to the Lessons database</p>
              <p><strong>👥 Assign:</strong> Directly assign to teachers and students during generation</p>
              <p><strong>🔔 Notify:</strong> Automatic notifications sent to assigned users</p>
              <p><strong>📱 Access:</strong> Everyone can access via the main Lessons tab</p>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Service Status */}
      {!pdfServiceAvailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiAlertCircle} className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              PDF service unavailable - lessons will be downloaded as text files. To enable PDF generation, start the PDF microservice on port 5000.
            </p>
          </div>
        </div>
      )}

      {!generatedContent ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              
              {/* Lesson Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Lesson Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setLessonType('single')
                      setFormData(prev => ({ ...prev, lessonType: 'single' }))
                    }}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      lessonType === 'single'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <SafeIcon icon={FiFileText} className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Single Lesson</div>
                    <div className="text-xs text-gray-500">One unified lesson for all selected ages</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLessonType('series')
                      setFormData(prev => ({ ...prev, lessonType: 'series' }))
                    }}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      lessonType === 'series'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <SafeIcon icon={FiLayers} className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Lesson Series</div>
                    <div className="text-xs text-gray-500">Multi-week curriculum</div>
                  </button>
                </div>
              </div>

              {/* Auto-Generate Options */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-purple-900">AI Auto-Generation</h3>
                  <SafeIcon icon={FiShuffle} className="h-5 w-5 text-purple-600" />
                </div>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="autoGenerateTopics"
                      checked={formData.autoGenerateTopics}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-purple-800">
                      Let AI choose topics automatically
                    </span>
                  </label>
                </div>
                {!formData.autoGenerateTopics && (
                  <button
                    type="button"
                    onClick={handleAutoGenerateTopic}
                    className="mt-3 text-sm text-purple-600 hover:text-purple-700 flex items-center space-x-1"
                  >
                    <SafeIcon icon={FiShuffle} className="h-4 w-4" />
                    <span>Generate random topic</span>
                  </button>
                )}
              </div>

              {/* Class Selection with Sections */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Age Groups *
                    <span className="text-xs text-gray-500 block">
                      (Same lesson adapted for each age group's understanding)
                    </span>
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={selectAllClasses}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={clearAllClasses}
                      className="text-xs text-gray-600 hover:text-gray-700"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Section-based quick selectors */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.keys(classesBySection).map(sectionName => (
                    <button
                      key={sectionName}
                      type="button"
                      onClick={() => selectClassesBySection(sectionName)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      + All {sectionName}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {Object.entries(classesBySection).map(([sectionName, classes]) => (
                    <div key={sectionName}>
                      <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center space-x-2">
                        <span>{sectionName}</span>
                        <span className="text-xs text-gray-500">
                          ({classes.map(c => c.id.replace('-', ' to ')).join(', ')} years)
                        </span>
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {classes.map((cls) => (
                          <label
                            key={cls.id}
                            className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                              formData.selectedClasses.includes(cls.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedClasses.includes(cls.id)}
                              onChange={() => handleClassSelection(cls.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="ml-3 flex items-center justify-between w-full">
                              <div>
                                <span className="text-sm font-medium">{cls.name}</span>
                                <p className="text-xs text-gray-500">{cls.description}</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${cls.color}`}>
                                {cls.section}
                              </span>
                            </div>
                            {formData.selectedClasses.includes(cls.id) && (
                              <SafeIcon icon={FiCheck} className="h-4 w-4 text-blue-600 ml-auto" />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {formData.selectedClasses.length} age group{formData.selectedClasses.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Assignment Section */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-green-900">📚 Lesson Assignment</h3>
                  <SafeIcon icon={FiUsers} className="h-5 w-5 text-green-600" />
                </div>
                <div className="space-y-4">
                  {/* Teacher Assignment */}
                  {teachers.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign to Teachers
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {teachers.map((teacher) => (
                          <label
                            key={teacher.id}
                            className="flex items-center p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.assignToTeachers.includes(teacher.id)}
                              onChange={() => handleTeacherSelection(teacher.id)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm">{teacher.name}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Selected: {formData.assignToTeachers.length} teacher{formData.assignToTeachers.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  {/* Student Assignment */}
                  {students.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign to Students
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {students.map((student) => (
                          <label
                            key={student.id}
                            className="flex items-center p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.assignToStudents.includes(student.id)}
                              onChange={() => handleStudentSelection(student.id)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm">{student.name}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Selected: {formData.assignToStudents.length} student{formData.assignToStudents.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  {/* Assignment Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assignment Date
                      </label>
                      <input
                        type="date"
                        name="assignmentDate"
                        value={formData.assignmentDate}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date (Optional)
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  {/* Notification Option */}
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="sendNotifications"
                      checked={formData.sendNotifications}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Send notifications to assigned users
                    </span>
                  </label>
                </div>
              </div>

              {/* Series Title (if series) */}
              {lessonType === 'series' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Series Title
                  </label>
                  <input
                    type="text"
                    name="seriesTitle"
                    value={formData.seriesTitle}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Heroes of Faith"
                  />
                </div>
              )}

              {/* Lesson Count (if series) */}
              {lessonType === 'series' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Lessons
                  </label>
                  <select
                    name="lessonCount"
                    value={formData.lessonCount}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={3}>3 Lessons</option>
                    <option value={4}>4 Lessons</option>
                    <option value={5}>5 Lessons</option>
                    <option value={6}>6 Lessons</option>
                    <option value={8}>8 Lessons</option>
                  </select>
                </div>
              )}

              {/* Topic, Bible Passage, Theme (if not auto-generating) */}
              {!formData.autoGenerateTopics && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Topic *
                      <span className="text-xs text-gray-500">(Same for all age groups)</span>
                    </label>
                    <input
                      type="text"
                      name="topic"
                      value={formData.topic}
                      onChange={handleInputChange}
                      required={!formData.autoGenerateTopics}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., God's Love, Forgiveness, Prayer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bible Passage *
                      <span className="text-xs text-gray-500">(Same memory verse for all)</span>
                    </label>
                    <input
                      type="text"
                      name="biblePassage"
                      value={formData.biblePassage}
                      onChange={handleInputChange}
                      required={!formData.autoGenerateTopics}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., John 3:16, Psalm 23, Matthew 6:9-13"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Theme
                      <span className="text-xs text-gray-500">(Core message for all ages)</span>
                    </label>
                    <input
                      type="text"
                      name="theme"
                      value={formData.theme}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., God's unconditional love for us"
                    />
                  </div>
                </>
              )}

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>

              {/* Learning Objectives */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Learning Objectives
                </label>
                <textarea
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What should students learn or understand from this lesson?"
                />
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests
                </label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any specific activities, materials, or teaching methods you'd like included?"
                />
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <SafeIcon icon={FiRefreshCw} className="h-5 w-5 animate-spin" />
                    <span>Generating Unified Lessons...</span>
                  </>
                ) : (
                  <>
                    <SafeIcon icon={FiZap} className="h-5 w-5" />
                    <span>
                      Generate & Assign Lesson{formData.selectedClasses.length > 1 ? 's' : ''}
                      {formData.selectedClasses.length > 1 && ` (${formData.selectedClasses.length} Age Groups)`}
                    </span>
                  </>
                )}
              </button>

              {/* Progress indicator */}
              {generatingProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <SafeIcon icon={FiClock} className="h-5 w-5 text-blue-600 animate-spin" />
                    <span className="text-sm font-medium text-blue-900">
                      {generatingProgress.stage === 'master' ? (
                        'Creating master lesson with unified content...'
                      ) : generatingProgress.stage === 'preparing' ? (
                        'Preparing lesson generation...'
                      ) : (
                        `Adapting for age group ${generatingProgress.current} of ${generatingProgress.total}`
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {generatingProgress.stage === 'master' ? (
                      '🎯 Establishing core biblical truth and memory verse'
                    ) : (
                      `Current: ${generatingProgress.currentClass}`
                    )}
                  </p>
                  <div className="mt-2 bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(generatingProgress.current / generatingProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                🎯 Complete Workflow
              </h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                  <div>
                    <p className="font-medium">Generate Lessons</p>
                    <p className="text-xs">AI creates age-appropriate content for all selected groups</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                  <div>
                    <p className="font-medium">Auto-Save to Database</p>
                    <p className="text-xs">Lessons automatically appear in main Lessons tab</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                  <div>
                    <p className="font-medium">Assign to Users</p>
                    <p className="text-xs">Direct assignment to selected teachers and students</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</div>
                  <div>
                    <p className="font-medium">Send Notifications</p>
                    <p className="text-xs">Automatic alerts to all assigned users</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">
                ✨ Assignment Benefits
              </h3>
              <div className="text-sm text-green-800 space-y-2">
                <p>• <strong>Instant Access:</strong> Assigned users immediately see lessons</p>
                <p>• <strong>Smart Notifications:</strong> Email and in-app alerts</p>
                <p>• <strong>Due Date Tracking:</strong> Optional deadline management</p>
                <p>• <strong>Progress Monitoring:</strong> Track lesson completion</p>
                <p>• <strong>Unified Experience:</strong> Same lesson, different age adaptations</p>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">
                📊 Assignment Summary
              </h3>
              <div className="text-sm text-purple-800 space-y-2">
                <p>• <strong>Available Teachers:</strong> {teachers.length}</p>
                <p>• <strong>Available Students:</strong> {students.length}</p>
                <p>• <strong>Selected Teachers:</strong> {formData.assignToTeachers.length}</p>
                <p>• <strong>Selected Students:</strong> {formData.assignToStudents.length}</p>
                <p>• <strong>Notifications:</strong> {formData.sendNotifications ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>

            {pdfServiceAvailable && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                  📄 PDF Service Active
                </h3>
                <div className="text-sm text-yellow-800 space-y-2">
                  <p>• Professional PDF generation available</p>
                  <p>• Batch download for multiple age groups</p>
                  <p>• Formatted headers with lesson metadata</p>
                  <p>• Assignment information included</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Generated Content Display */
        <div className="space-y-6">
          {generatedContent.type === 'multiple' ? (
            /* Multiple Unified Lessons Display */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      🎯 Unified Lesson Series Generated & Assigned ({generatedContent.results.length} age groups)
                    </h2>

                    {/* Assignment Summary */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h3 className="font-semibold text-green-900 mb-2">📚 Assignment Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p><strong>Teachers Assigned:</strong> {generatedContent.metadata.assignedTeachers}</p>
                          <p><strong>Students Assigned:</strong> {generatedContent.metadata.assignedStudents}</p>
                        </div>
                        <div>
                          <p><strong>Assignment Date:</strong> {formData.assignmentDate}</p>
                          {formData.dueDate && <p><strong>Due Date:</strong> {formData.dueDate}</p>}
                        </div>
                        <div>
                          <p><strong>Notifications:</strong> {generatedContent.metadata.notificationsSent ? '✅ Sent' : '❌ Not sent'}</p>
                          <p><strong>Database Status:</strong> ✅ All saved</p>
                        </div>
                      </div>
                    </div>

                    {/* Master Lesson Info */}
                    {masterLesson && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-blue-900 mb-2">📖 Core Lesson Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><strong>Topic:</strong> {masterLesson.topic}</p>
                            <p><strong>Bible Passage:</strong> {masterLesson.biblePassage}</p>
                          </div>
                          <div>
                            <p><strong>Memory Verse:</strong></p>
                            <p className="text-blue-800 font-medium italic">"{masterLesson.memoryVerse}"</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p><strong>Core Message:</strong> {masterLesson.coreMessage}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center space-x-1">
                        <SafeIcon icon={FiUsers} className="h-4 w-4" />
                        <span>{generatedContent.results.length} Age Groups</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <SafeIcon icon={FiTarget} className="h-4 w-4" />
                        <span>Duration: {formData.duration} min each</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <SafeIcon icon={FiBell} className="h-4 w-4" />
                        <span>{generatedContent.metadata.assignedTeachers + generatedContent.metadata.assignedStudents} Assigned</span>
                      </span>
                    </div>

                    {/* Database Save Status */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <SafeIcon icon={FiCheckCircle} className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">
                          All lessons saved to database, assigned to {generatedContent.metadata.assignedTeachers + generatedContent.metadata.assignedStudents} users, and accessible via Lessons tab
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {pdfServiceAvailable ? (
                      <button
                        onClick={() => handleDownloadAll('pdf')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <SafeIcon icon={FiDownload} className="h-4 w-4" />
                        <span>Download All PDF</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDownloadAll('text')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <SafeIcon icon={FiDownload} className="h-4 w-4" />
                        <span>Download All Text</span>
                      </button>
                    )}
                    <button
                      onClick={handleNewLesson}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <SafeIcon icon={FiRefreshCw} className="h-4 w-4" />
                      <span>New Lessons</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {generatedContent.results.map((lesson, index) => {
                  const classInfo = availableClasses.find(cls => cls.id === lesson.ageGroup)
                  return (
                    <div key={index} className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${classInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                              {classInfo?.section || lesson.ageGroup}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                              🎯 Unified Content
                            </span>
                            {lesson.savedToDatabase && (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                ✓ Saved & Assigned
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Age Group:</strong> {lesson.className || lesson.ageGroup}</p>
                            <p><strong>Topic:</strong> {lesson.topic}</p>
                            <p><strong>Bible Passage:</strong> {lesson.biblePassage}</p>
                            {lesson.theme && <p><strong>Theme:</strong> {lesson.theme}</p>}
                            {masterLesson && (
                              <p><strong>Memory Verse:</strong> <span className="italic text-blue-600">"{masterLesson.memoryVerse}"</span></p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {pdfServiceAvailable && (
                            <button
                              onClick={() => handleDownload(lesson, index, 'pdf')}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center space-x-1"
                            >
                              <SafeIcon icon={FiDownload} className="h-4 w-4" />
                              <span>PDF</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(lesson, index, 'text')}
                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center space-x-1"
                          >
                            <SafeIcon icon={FiDownload} className="h-4 w-4" />
                            <span>Text</span>
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                        <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                          {lesson.content.substring(0, 800)}...
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Single Lesson Display */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {generatedContent.title}
                    </h2>

                    {/* Assignment Info for Single Lesson */}
                    {(generatedContent.metadata.assignedTeachers > 0 || generatedContent.metadata.assignedStudents > 0) && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-2">
                          <SafeIcon icon={FiBell} className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            Assigned to {generatedContent.metadata.assignedTeachers + generatedContent.metadata.assignedStudents} users
                            {generatedContent.metadata.notificationsSent && ' • Notifications sent'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <SafeIcon icon={FiUsers} className="h-4 w-4" />
                        <span>Age: {formData.selectedClasses.join(', ')}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <SafeIcon icon={FiTarget} className="h-4 w-4" />
                        <span>Duration: {formData.duration} min</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {pdfServiceAvailable && (
                      <button
                        onClick={() => handleDownload(generatedContent, 0, 'pdf')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <SafeIcon icon={FiDownload} className="h-4 w-4" />
                        <span>Download PDF</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(generatedContent, 0, 'text')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <SafeIcon icon={FiFileText} className="h-4 w-4" />
                      <span>Download Text</span>
                    </button>
                    <button
                      onClick={handleNewLesson}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <SafeIcon icon={FiRefreshCw} className="h-4 w-4" />
                      <span>New Lesson</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="prose max-w-none">
                  <div
                    className="whitespace-pre-wrap text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: generatedContent.content.replace(/\n/g, '<br />')
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default LessonMaker