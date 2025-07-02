import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getLessons, deleteLesson } from '../../lib/supabase'
import { generateLessonPDF } from '../../lib/pdfService'
import { downloadBlob, checkPDFServiceHealth } from '../../lib/pdfService'
import toast from 'react-hot-toast'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiBookOpen, FiEye, FiDownload, FiTrash2, FiSearch, FiUsers, FiCalendar, FiTag, FiCpu, FiFileText, FiLock, FiInfo, FiFilter, FiGrid, FiClock, FiLayers, FiDatabase, FiArchive } = FiIcons

const LessonManagement = () => {
  const { user } = useAuth()
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewingLesson, setViewingLesson] = useState(null)
  const [pdfServiceAvailable, setPdfServiceAvailable] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSection, setSelectedSection] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterSource, setFilterSource] = useState('all') // 'all', 'ai', 'manual'
  const [viewMode, setViewMode] = useState('sections') // 'sections' or 'list'

  // Age group sections with enhanced categorization
  const ageSections = [
    {
      id: 'children',
      title: 'Children',
      subtitle: 'Ages 3-10',
      ageGroups: ['3-5', '5-10'],
      color: 'bg-pink-500',
      lightColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      textColor: 'text-pink-700',
      icon: '🧸',
      description: 'Early childhood lessons with simple stories and hands-on activities'
    },
    {
      id: 'preteen',
      title: 'Preteen',
      subtitle: 'Ages 11-14',
      ageGroups: ['11-14'],
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      icon: '📚',
      description: 'Middle school lessons with deeper discussions and group activities'
    },
    {
      id: 'teen',
      title: 'Teen',
      subtitle: 'Ages 15-18',
      ageGroups: ['15-18'],
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      icon: '🎯',
      description: 'High school lessons addressing real-life challenges and faith'
    },
    {
      id: 'youth',
      title: 'Youth',
      subtitle: 'Ages 18+',
      ageGroups: ['18+'],
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      icon: '🌟',
      description: 'Adult lessons with theological depth and practical applications'
    }
  ]

  useEffect(() => {
    fetchAllLessons()
    checkPDFService()
  }, [])

  const checkPDFService = async () => {
    const isAvailable = await checkPDFServiceHealth()
    setPdfServiceAvailable(isAvailable)
  }

  const fetchAllLessons = async () => {
    try {
      // Fetch all lessons from the database
      const { data: allLessons, error } = await getLessons()
      if (error) throw error

      // Process lessons and add source information
      const processedLessons = (allLessons || []).map(lesson => ({
        ...lesson,
        sourceType: 'database',
        isHistorical: false,
        // Ensure consistent field names
        age_group: lesson.age_group || 'Unknown',
        bible_passage: lesson.bible_passage || '',
        source: lesson.ai_metadata?.source || 'manual'
      }))

      setLessons(processedLessons)
    } catch (error) {
      toast.error('Error fetching lessons')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (lesson) => {
    if (user.profile?.role !== 'admin') {
      toast.error('Only administrators can delete lessons')
      return
    }

    const confirmMessage = lesson.source === 'ai'
      ? 'Are you sure you want to delete this AI-generated lesson?'
      : 'Are you sure you want to delete this lesson?'

    if (!confirm(confirmMessage)) return

    try {
      const { error } = await deleteLesson(lesson.id)
      if (error) throw error
      
      toast.success('Lesson deleted successfully')
      fetchAllLessons()
    } catch (error) {
      toast.error('Error deleting lesson')
    }
  }

  const handleDownload = async (lesson, format = 'pdf') => {
    try {
      if (format === 'pdf' && pdfServiceAvailable) {
        const pdfData = {
          title: lesson.title,
          content: lesson.content,
          studentName: '',
          ageGroup: lesson.age_group,
          topic: lesson.topic || '',
          biblePassage: lesson.bible_passage || '',
          theme: lesson.theme || '',
          filename: `${lesson.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
        }

        const blob = await generateLessonPDF(pdfData)
        downloadBlob(blob, pdfData.filename)
        toast.success('PDF downloaded successfully!')
      } else {
        const content = `
${lesson.title}
${'='.repeat(lesson.title.length)}

Age Group: ${lesson.age_group}
${lesson.topic ? `Topic: ${lesson.topic}` : ''}
${lesson.bible_passage ? `Bible Passage: ${lesson.bible_passage}` : ''}
${lesson.theme ? `Theme: ${lesson.theme}` : ''}
${lesson.duration ? `Duration: ${lesson.duration} minutes` : ''}
${lesson.lesson_type ? `Type: ${lesson.lesson_type}` : ''}

${lesson.content}

---
Source: Database
${lesson.source === 'ai' ? `Generated by AI (${lesson.ai_metadata?.model_used || 'GPT-4o-mini'})` : 'Created manually'}
Created by: ${lesson.created_by_name || 'Administrator'}
Date: ${new Date(lesson.created_at).toLocaleDateString()}
        `.trim()

        const blob = new Blob([content], { type: 'text/plain' })
        const filename = `${lesson.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
        downloadBlob(blob, filename)
        toast.success('Text file downloaded successfully!')
      }
    } catch (error) {
      toast.error('Failed to download lesson: ' + error.message)
    }
  }

  const handleView = (lesson) => {
    setViewingLesson(lesson)
  }

  // Get lessons for a specific section
  const getLessonsForSection = (sectionId) => {
    if (sectionId === 'all') return lessons

    const section = ageSections.find(s => s.id === sectionId)
    return lessons.filter(lesson => section?.ageGroups.includes(lesson.age_group))
  }

  // Filter lessons based on search criteria
  const getFilteredLessons = (sectionLessons) => {
    return sectionLessons.filter(lesson => {
      const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.theme?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = filterType === 'all' ||
        (filterType === 'ai' && lesson.source === 'ai') ||
        (filterType === 'manual' && lesson.source !== 'ai')

      const matchesSource = filterSource === 'all' ||
        (filterSource === 'ai' && lesson.source === 'ai') ||
        (filterSource === 'manual' && lesson.source !== 'ai')

      return matchesSearch && matchesType && matchesSource
    })
  }

  // Get role-specific messaging
  const getRoleInfo = () => {
    switch (user.profile?.role) {
      case 'admin':
        return {
          title: 'Lesson Management',
          subtitle: 'Manage all lessons including AI-generated and manually created content',
          canCreate: true,
          canDelete: true
        }
      case 'teacher':
        return {
          title: 'Available Lessons',
          subtitle: 'Browse all lessons by age group',
          canCreate: false,
          canDelete: false
        }
      case 'student':
        return {
          title: 'My Lessons',
          subtitle: 'View lessons organized by age group',
          canCreate: false,
          canDelete: false
        }
      default:
        return {
          title: 'Lessons',
          subtitle: 'View available lessons by age group',
          canCreate: false,
          canDelete: false
        }
    }
  }

  const roleInfo = getRoleInfo()

  if (loading && lessons.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const renderLessonCard = (lesson, section) => {
    return (
      <div key={lesson.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={lesson.source === 'ai' ? FiCpu : FiFileText} className={`h-4 w-4 ${lesson.source === 'ai' ? 'text-purple-600' : 'text-blue-600'}`} />
              <span className={`text-xs px-2 py-1 rounded-full ${lesson.source === 'ai' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {lesson.source === 'ai' ? 'AI' : 'Manual'}
              </span>
              {lesson.lesson_type === 'series' && (
                <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                  <SafeIcon icon={FiLayers} className="h-3 w-3 inline mr-1" />
                  Series
                </span>
              )}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${section.textColor} ${section.lightColor}`}>
              {lesson.age_group}
            </span>
          </div>

          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
            {lesson.title}
          </h3>

          {lesson.topic && (
            <p className="text-sm text-gray-600 mb-1">
              <strong>Topic:</strong> {lesson.topic}
            </p>
          )}

          {lesson.bible_passage && (
            <p className="text-sm text-blue-600 mb-2 font-medium line-clamp-1">
              {lesson.bible_passage}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span className="flex items-center space-x-1">
              <SafeIcon icon={FiDatabase} className="h-3 w-3" />
              <span>Database</span>
            </span>
            <span className="flex items-center space-x-1">
              <SafeIcon icon={FiCalendar} className="h-3 w-3" />
              <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
            </span>
            <div className="flex items-center space-x-2">
              {lesson.duration && <span>{lesson.duration}min</span>}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleView(lesson)}
              className="flex-1 bg-blue-600 text-white py-2 px-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 text-sm"
            >
              <SafeIcon icon={FiEye} className="h-3 w-3" />
              <span>View</span>
            </button>
            {pdfServiceAvailable && (
              <button
                onClick={() => handleDownload(lesson, 'pdf')}
                className="bg-green-600 text-white py-2 px-2 rounded-md hover:bg-green-700 transition-colors"
                title="Download PDF"
              >
                <SafeIcon icon={FiDownload} className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={() => handleDownload(lesson, 'text')}
              className="bg-gray-600 text-white py-2 px-2 rounded-md hover:bg-gray-700 transition-colors"
              title="Download Text"
            >
              <SafeIcon icon={FiFileText} className="h-3 w-3" />
            </button>
            {roleInfo.canDelete && (
              <button
                onClick={() => handleDelete(lesson)}
                className="bg-red-600 text-white py-2 px-2 rounded-md hover:bg-red-700 transition-colors"
                title="Delete"
              >
                <SafeIcon icon={FiTrash2} className="h-3 w-3" />
              </button>
            )}
            {!roleInfo.canDelete && (
              <div className="bg-gray-100 text-gray-400 py-2 px-2 rounded-md" title="Read Only">
                <SafeIcon icon={FiLock} className="h-3 w-3" />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderSectionView = () => {
    return (
      <div className="space-y-8">
        {ageSections.map((section) => {
          const sectionLessons = getLessonsForSection(section.id)
          const filteredLessons = getFilteredLessons(sectionLessons)

          // Separate by source for statistics
          const aiLessons = filteredLessons.filter(l => l.source === 'ai')
          const manualLessons = filteredLessons.filter(l => l.source !== 'ai')

          return (
            <div key={section.id} className={`${section.lightColor} ${section.borderColor} border rounded-lg p-6`}>
              {/* Section Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`${section.color} text-white p-3 rounded-lg text-2xl`}>
                    {section.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                    <p className="text-gray-600">{section.subtitle} • {section.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 ${section.color} text-white rounded-full text-sm font-medium mb-1`}>
                    {filteredLessons.length} total lesson{filteredLessons.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex space-x-2 text-xs">
                    {aiLessons.length > 0 && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                        <SafeIcon icon={FiCpu} className="h-3 w-3 inline mr-1" />
                        {aiLessons.length} AI
                      </span>
                    )}
                    {manualLessons.length > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        <SafeIcon icon={FiFileText} className="h-3 w-3 inline mr-1" />
                        {manualLessons.length} Manual
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Lessons Grid */}
              {filteredLessons.length === 0 ? (
                <div className="text-center py-12">
                  <SafeIcon icon={FiBookOpen} className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No lessons found</h3>
                  <p className="text-gray-600">
                    {searchTerm || filterType !== 'all' || filterSource !== 'all'
                      ? "No lessons match your current filters for this age group."
                      : `No lessons have been created for ${section.title.toLowerCase()} yet.`
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLessons
                    .sort((a, b) => {
                      // Sort by: AI lessons first, then by date (newest first)
                      if (a.source !== b.source) {
                        return a.source === 'ai' ? -1 : 1
                      }
                      return new Date(b.created_at) - new Date(a.created_at)
                    })
                    .map((lesson) => renderLessonCard(lesson, section))
                  }
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderListView = () => {
    const allFilteredLessons = getFilteredLessons(getLessonsForSection(selectedSection))

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedSection === 'all' ? 'All Lessons' : ageSections.find(s => s.id === selectedSection)?.title + ' Lessons'}
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <span>Showing {allFilteredLessons.length} lesson{allFilteredLessons.length !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>{allFilteredLessons.filter(l => l.source === 'ai').length} AI-generated</span>
            <span>•</span>
            <span>{allFilteredLessons.filter(l => l.source !== 'ai').length} manually created</span>
          </div>
        </div>

        {allFilteredLessons.length === 0 ? (
          <div className="p-12 text-center">
            <SafeIcon icon={FiBookOpen} className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No lessons found</h3>
            <p className="text-gray-600 mb-4">
              {lessons.length === 0
                ? `No lessons have been created yet. ${roleInfo.canCreate ? 'Start by creating your first lesson!' : 'Check back later for new content.'}`
                : "No lessons match your current filters. Try adjusting your search criteria."
              }
            </p>
            {roleInfo.canCreate && (
              <Link
                to="/ai-lesson-bot/lesson-maker"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center space-x-2"
              >
                <SafeIcon icon={FiCpu} className="h-4 w-4" />
                <span>Generate with AI</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            {allFilteredLessons
              .sort((a, b) => {
                // Sort by: AI lessons first, then by date (newest first)
                if (a.source !== b.source) {
                  return a.source === 'ai' ? -1 : 1
                }
                return new Date(b.created_at) - new Date(a.created_at)
              })
              .map((lesson) => {
                const lessonSection = ageSections.find(section =>
                  section.ageGroups.includes(lesson.age_group)
                )

                return (
                  <div key={lesson.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <SafeIcon icon={lesson.source === 'ai' ? FiCpu : FiFileText} className={`h-5 w-5 ${lesson.source === 'ai' ? 'text-purple-600' : 'text-blue-600'}`} />
                          <span className={`text-xs px-2 py-1 rounded-full ${lesson.source === 'ai' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {lesson.source === 'ai' ? 'AI Generated' : 'Admin Created'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {lessonSection && (
                            <span className={`text-xs px-2 py-1 rounded-full ${lessonSection.textColor} ${lessonSection.lightColor}`}>
                              {lessonSection.title}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">{lesson.age_group}</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {lesson.title}
                      </h3>

                      {lesson.topic && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Topic:</strong> {lesson.topic}
                        </p>
                      )}

                      {lesson.bible_passage && (
                        <p className="text-sm text-blue-600 mb-2 font-medium">
                          {lesson.bible_passage}
                        </p>
                      )}

                      {lesson.theme && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          <strong>Theme:</strong> {lesson.theme}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span className="flex items-center space-x-1">
                          <SafeIcon icon={FiDatabase} className="h-3 w-3" />
                          <span>Database</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <SafeIcon icon={FiCalendar} className="h-3 w-3" />
                          <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
                        </span>
                        <div className="flex items-center space-x-2">
                          {lesson.duration && <span>{lesson.duration} min</span>}
                          {lesson.source === 'ai' && lesson.ai_metadata?.model_used && (
                            <span className="text-purple-600">{lesson.ai_metadata.model_used}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(lesson)}
                          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                        >
                          <SafeIcon icon={FiEye} className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        {pdfServiceAvailable && (
                          <button
                            onClick={() => handleDownload(lesson, 'pdf')}
                            className="bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors"
                            title="Download PDF"
                          >
                            <SafeIcon icon={FiDownload} className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(lesson, 'text')}
                          className="bg-gray-600 text-white py-2 px-3 rounded-md hover:bg-gray-700 transition-colors"
                          title="Download Text"
                        >
                          <SafeIcon icon={FiFileText} className="h-4 w-4" />
                        </button>
                        {roleInfo.canDelete && (
                          <button
                            onClick={() => handleDelete(lesson)}
                            className="bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700 transition-colors"
                            title="Delete"
                          >
                            <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                          </button>
                        )}
                        {!roleInfo.canDelete && (
                          <div className="bg-gray-100 text-gray-400 py-2 px-3 rounded-md" title="Read Only">
                            <SafeIcon icon={FiLock} className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            }
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{roleInfo.title}</h1>
          <p className="text-gray-600">{roleInfo.subtitle}</p>
        </div>
        {roleInfo.canCreate && (
          <div className="flex space-x-3">
            <Link
              to="/ai-lesson-bot/lesson-maker"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <SafeIcon icon={FiCpu} className="h-5 w-5" />
              <span>Generate with AI</span>
            </Link>
          </div>
        )}
      </div>

      {/* Role-specific info banner */}
      {!roleInfo.canCreate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiInfo} className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                {user.profile?.role === 'teacher' ? 'Teacher Access' : 'Student Access'}
              </h3>
              <p className="text-sm text-blue-800">
                {user.profile?.role === 'teacher'
                  ? 'Browse all lessons organized by age groups. All content is created by administrators.'
                  : 'View lessons organized by age groups assigned by your teachers.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Unified Content Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <SafeIcon icon={FiDatabase} className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-medium text-blue-900">Unified Lesson Management</h3>
        </div>
        <p className="text-sm text-blue-800">
          This page shows all lessons from the database, including both AI-generated and manually created content, organized by age groups.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiSearch} className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Search lessons..."
                />
              </div>
            </div>
            <div className="flex space-x-3">
              {viewMode === 'list' && (
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Ages</option>
                  {ageSections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.title} ({section.subtitle})
                    </option>
                  ))}
                </select>
              )}
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Sources</option>
                <option value="ai">AI Generated</option>
                <option value="manual">Manual Created</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="ai">AI Generated</option>
                <option value="manual">Manual Created</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('sections')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'sections'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <SafeIcon icon={FiGrid} className="h-4 w-4 inline mr-1" />
                Sections
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <SafeIcon icon={FiFilter} className="h-4 w-4 inline mr-1" />
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Statistics */}
      {lessons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiDatabase} className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="text-sm font-medium text-green-900">Total Lessons</h3>
                <p className="text-2xl font-bold text-green-700">{lessons.length}</p>
                <p className="text-xs text-green-600">All content</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiCpu} className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="text-sm font-medium text-purple-900">AI Generated</h3>
                <p className="text-2xl font-bold text-purple-700">{lessons.filter(l => l.source === 'ai').length}</p>
                <p className="text-xs text-purple-600">AI-powered content</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiFileText} className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Manual Created</h3>
                <p className="text-2xl font-bold text-blue-700">{lessons.filter(l => l.source !== 'ai').length}</p>
                <p className="text-xs text-blue-600">Admin created</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {viewMode === 'sections' ? renderSectionView() : renderListView()}

      {/* View Lesson Modal */}
      {viewingLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {viewingLesson.title}
                    </h2>
                    <span className={`text-xs px-2 py-1 rounded-full ${viewingLesson.source === 'ai' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {viewingLesson.source === 'ai' ? 'AI Generated' : 'Admin Created'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <SafeIcon icon={FiUsers} className="h-4 w-4" />
                      <span>Age: {viewingLesson.age_group}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <SafeIcon icon={FiDatabase} className="h-4 w-4" />
                      <span>Database</span>
                    </span>
                    {viewingLesson.lesson_type && (
                      <span className="flex items-center space-x-1">
                        <SafeIcon icon={FiTag} className="h-4 w-4" />
                        <span>{viewingLesson.lesson_type}</span>
                      </span>
                    )}
                    <span>{new Date(viewingLesson.created_at).toLocaleDateString()}</span>
                  </div>
                  {viewingLesson.topic && (
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Topic:</strong> {viewingLesson.topic}
                    </p>
                  )}
                  {viewingLesson.bible_passage && (
                    <p className="text-sm text-blue-600 mt-1 font-medium">
                      <strong>Bible Passage:</strong> {viewingLesson.bible_passage}
                    </p>
                  )}
                  {viewingLesson.theme && (
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Theme:</strong> {viewingLesson.theme}
                    </p>
                  )}
                  {viewingLesson.source === 'ai' && (
                    <div className="mt-2 text-sm text-purple-700">
                      <span>Generated by: {viewingLesson.ai_metadata?.model_used || 'AI'}</span>
                      {viewingLesson.created_by_name && (
                        <span> • Created by: {viewingLesson.created_by_name}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {pdfServiceAvailable && (
                    <button
                      onClick={() => handleDownload(viewingLesson, 'pdf')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <SafeIcon icon={FiDownload} className="h-4 w-4" />
                      <span>PDF</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(viewingLesson, 'text')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <SafeIcon icon={FiFileText} className="h-4 w-4" />
                    <span>Text</span>
                  </button>
                  <button
                    onClick={() => setViewingLesson(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="prose max-w-none">
                <div
                  className="whitespace-pre-wrap text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: viewingLesson.content.replace(/\n/g, '<br />')
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LessonManagement