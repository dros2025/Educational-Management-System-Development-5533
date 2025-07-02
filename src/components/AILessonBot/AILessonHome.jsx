import React from 'react'
import { Link } from 'react-router-dom'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiBook, FiSettings, FiCpu, FiClock, FiBrain, FiZap, FiArrowLeft } = FiIcons

const AILessonHome = () => {
  const features = [
    {
      title: 'Lesson Maker',
      description: 'Generate single lessons or multi-lesson curricula using AI',
      icon: FiBook,
      color: 'bg-blue-500',
      link: '/ai-lesson-bot/lesson-maker',
      features: ['Single Lesson Generation', 'Multi-Lesson Series', 'Age-Appropriate Content', 'Bible Passage Integration']
    },
    {
      title: 'Bot Training',
      description: 'Train the AI to match your teaching style and preferences',
      icon: FiBrain,
      color: 'bg-green-500',
      link: '/ai-lesson-bot/bot-trainer',
      features: ['Upload Sample Lessons', 'Style Preferences', 'Custom Templates', 'Feedback System']
    },
    {
      title: 'AI Settings',
      description: 'Configure OpenAI API and model preferences',
      icon: FiSettings,
      color: 'bg-purple-500',
      link: '/ai-lesson-bot/settings',
      features: ['API Key Management', 'Model Selection', 'Connection Testing', 'Custom Instructions']
    },
    {
      title: 'Lesson History',
      description: 'View and manage previously generated lessons',
      icon: FiClock,
      color: 'bg-orange-500',
      link: '/ai-lesson-bot/history',
      features: ['Generated Lessons', 'Download Options', 'Edit & Reuse', 'Search & Filter']
    }
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Back Button */}
      <div className="flex items-center space-x-4">
        <Link
          to="/dashboard"
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <SafeIcon icon={FiArrowLeft} className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
            <SafeIcon icon={FiCpu} className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">AI Lesson Bot</h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
          Generate engaging Sunday School lessons with AI-powered content creation, personalized to your teaching style and student needs.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 text-center">
          <SafeIcon icon={FiZap} className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 mx-auto mb-2" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Fast Generation</h3>
          <p className="text-xs sm:text-sm text-gray-600">Create lessons in under 30 seconds</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 text-center">
          <SafeIcon icon={FiBrain} className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mx-auto mb-2" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">AI-Powered</h3>
          <p className="text-xs sm:text-sm text-gray-600">Uses GPT-4o-mini for quality content</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 text-center">
          <SafeIcon icon={FiBook} className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mx-auto mb-2" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Customizable</h3>
          <p className="text-xs sm:text-sm text-gray-600">Tailored to your teaching style</p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-start space-x-3 sm:space-x-4 mb-4">
                <div className={`p-2 sm:p-3 rounded-lg ${feature.color} flex-shrink-0`}>
                  <SafeIcon icon={feature.icon} className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">{feature.description}</p>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {feature.features.map((item, idx) => (
                  <li key={idx} className="flex items-center text-xs sm:text-sm text-gray-600">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-3 flex-shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={feature.link}
                className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <span>Get Started</span>
                <SafeIcon icon={feature.icon} className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Getting Started */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg sm:text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Configure API</h3>
            <p className="text-xs sm:text-sm text-gray-600">Add your OpenAI API key in settings to enable AI generation</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg sm:text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Train Your Bot</h3>
            <p className="text-xs sm:text-sm text-gray-600">Upload sample lessons to teach the AI your preferred style</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg sm:text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Generate Lessons</h3>
            <p className="text-xs sm:text-sm text-gray-600">Create amazing Sunday School lessons with AI assistance</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AILessonHome