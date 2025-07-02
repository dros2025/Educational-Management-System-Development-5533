import React, { useState, useEffect } from 'react'
import { runLessonDiagnostics, checkGeneratedLessons } from '../../utils/checkLessons'
import { useAuth } from '../../contexts/AuthContext'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiSearch, FiDatabase, FiHardDrive, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiCpu, FiFileText, FiClock } = FiIcons

const LessonDiagnostics = () => {
  const { user } = useAuth()
  const [diagnostics, setDiagnostics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastCheck, setLastCheck] = useState(null)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      const results = await runLessonDiagnostics()
      setDiagnostics(results)
      setLastCheck(new Date())
    } catch (error) {
      console.error('Diagnostics failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }

  if (loading && !diagnostics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <SafeIcon icon={FiRefreshCw} className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Running lesson diagnostics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lesson Diagnostics</h1>
          <p className="text-gray-600">Check for generated lessons and system status</p>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          <SafeIcon icon={FiRefreshCw} className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {lastCheck && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Last checked: {formatDate(lastCheck)}
          </p>
        </div>
      )}

      {diagnostics && (
        <>
          {/* Database Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <SafeIcon icon={FiDatabase} className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Database Status</h2>
            </div>

            {diagnostics.database.success ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiCheckCircle} className="h-5 w-5 text-green-600" />
                  <span className="text-green-800">Database connected successfully</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <SafeIcon icon={FiFileText} className="h-5 w-5 text-gray-600" />
                      <h3 className="font-medium text-gray-900">Total Lessons</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {diagnostics.database.data.totalLessons}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <SafeIcon icon={FiCpu} className="h-5 w-5 text-purple-600" />
                      <h3 className="font-medium text-purple-900">AI Generated</h3>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {diagnostics.database.data.aiLessons}
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <SafeIcon icon={FiClock} className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium text-blue-900">Recent (24h)</h3>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {diagnostics.database.data.recentLessons}
                    </p>
                  </div>
                </div>

                {/* AI Lesson Details */}
                {diagnostics.database.data.aiLessonDetails.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">AI-Generated Lessons</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {diagnostics.database.data.aiLessonDetails.map((lesson, index) => (
                        <div key={lesson.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                              <p className="text-sm text-gray-600">
                                Age: {lesson.age_group} | Topic: {lesson.topic || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(lesson.created_at)} | 
                                Model: {lesson.ai_metadata?.model_used || 'Unknown'} |
                                Unified: {lesson.ai_metadata?.unified_generation ? 'Yes' : 'No'}
                              </p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                              AI
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiAlertCircle} className="h-5 w-5 text-red-600" />
                <span className="text-red-800">
                  Database error: {diagnostics.database.error}
                </span>
              </div>
            )}
          </div>

          {/* LocalStorage Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <SafeIcon icon={FiHardDrive} className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Local Storage Status</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Storage Keys</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {diagnostics.localStorage.keys?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Lesson-related data</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">AI Settings</h3>
                <p className="text-2xl font-bold text-blue-900">
                  {diagnostics.localStorage.aiSettingsKeys?.length || 0}
                </p>
                <p className="text-sm text-blue-600">Users with API keys</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Training Data</h3>
                <p className="text-2xl font-bold text-green-900">
                  {diagnostics.localStorage.trainingKeys?.length || 0}
                </p>
                <p className="text-sm text-green-600">Users with training samples</p>
              </div>
            </div>

            {diagnostics.localStorage.keys?.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Storage Keys Found</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {diagnostics.localStorage.keys.map((key, index) => (
                    <div key={index} className="text-sm text-gray-600 bg-gray-100 rounded px-2 py-1">
                      {key}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-3">
              📋 Recommendations
            </h2>
            <div className="space-y-2 text-sm text-yellow-800">
              {diagnostics.database.success ? (
                diagnostics.database.data.aiLessons > 0 ? (
                  <p>✅ Great! You have {diagnostics.database.data.aiLessons} AI-generated lessons in your database.</p>
                ) : (
                  <p>💡 No AI lessons found. Try generating your first lesson using the AI Lesson Bot.</p>
                )
              ) : (
                <p>⚠️ Database connection issues. Check your Supabase configuration.</p>
              )}
              
              {diagnostics.localStorage.aiSettingsKeys?.length > 0 ? (
                <p>✅ AI settings configured for {diagnostics.localStorage.aiSettingsKeys.length} user(s).</p>
              ) : (
                <p>💡 Configure your OpenAI API key in AI Settings to start generating lessons.</p>
              )}

              {diagnostics.database.data?.recentLessons > 0 && (
                <p>🎯 You have {diagnostics.database.data.recentLessons} recent lesson(s) from the last 24 hours.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LessonDiagnostics