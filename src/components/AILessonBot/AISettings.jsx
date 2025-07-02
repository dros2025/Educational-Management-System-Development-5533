import React,{useState,useEffect} from 'react'
import {Link} from 'react-router-dom'
import {useAuth} from '../../contexts/AuthContext'
import {getAISettings,saveAISettings,testOpenAIConnection} from '../../lib/aiService'
import toast from 'react-hot-toast'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi' 

const {FiSettings,FiKey,FiCpu,FiCheck,FiAlertCircle,FiEye,FiEyeOff,FiArrowLeft}=FiIcons 

const AISettings=()=> {
  const {user}=useAuth() 
  const [loading,setLoading]=useState(false) 
  const [testing,setTesting]=useState(false) 
  const [showApiKey,setShowApiKey]=useState(false) 
  const [connectionStatus,setConnectionStatus]=useState(null) 
  const [formData,setFormData]=useState({
    openaiApiKey: '',
    modelName: 'gpt-4o-mini',
    preferredTone: 'friendly',
    lessonTemplate: '',
    customInstructions: ''
  }) 

  useEffect(()=> {
    fetchSettings()
  },[]) 

  const fetchSettings=async ()=> {
    try {
      const settings=await getAISettings(user.profile.id) 
      if (settings) {
        setFormData(settings)
      }
    } catch (error) {
      console.error('Error fetching settings:',error)
    }
  } 

  const handleInputChange=(e)=> {
    const {name,value}=e.target 
    setFormData(prev=> ({
      ...prev,
      [name]: value
    }))
  } 

  const handleSubmit=async (e)=> {
    e.preventDefault() 
    setLoading(true) 
    try {
      await saveAISettings({
        ...formData,
        user_id: user.profile.id
      }) 
      toast.success('Settings saved successfully!')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  } 

  const handleTestConnection=async ()=> {
    if (!formData.openaiApiKey.trim()) {
      toast.error('Please enter your OpenAI API key first') 
      return
    } 

    setTesting(true) 
    setConnectionStatus(null) 
    
    try {
      const result=await testOpenAIConnection(formData.openaiApiKey,formData.modelName) 
      setConnectionStatus({
        success: true,
        message: result.message
      }) 
      toast.success('Connection successful!')
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: error.message
      }) 
      toast.error('Connection failed')
    } finally {
      setTesting(false)
    }
  } 

  const models=[ 
    {value: 'gpt-4o-mini',label: 'GPT-4o Mini (Recommended)',description: 'Fast and cost-effective'},
    {value: 'gpt-4o',label: 'GPT-4o',description: 'More powerful but slower'},
    {value: 'gpt-3.5-turbo',label: 'GPT-3.5 Turbo',description: 'Budget-friendly option'}
  ] 

  const tones=[ 
    {value: 'friendly',label: 'Friendly',description: 'Warm and approachable'},
    {value: 'professional',label: 'Professional',description: 'Formal and structured'},
    {value: 'casual',label: 'Casual',description: 'Relaxed and conversational'},
    {value: 'enthusiastic',label: 'Enthusiastic',description: 'Energetic and excited'}
  ] 

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
        <SafeIcon icon={FiSettings} className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Settings</h1>
          <p className="text-gray-600">Configure OpenAI API and customize AI behavior</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            {/* OpenAI API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OpenAI API Key *
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  name="openaiApiKey"
                  value={formData.openaiApiKey}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="sk-..."
                />
                <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                  <button
                    type="button"
                    onClick={()=> setShowApiKey(!showApiKey)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <SafeIcon icon={showApiKey ? FiEyeOff : FiEye} className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700">OpenAI Platform</a>
              </p>
            </div>

            {/* Test Connection */}
            <div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !formData.openaiApiKey.trim()}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {testing ? (
                  <>
                    <SafeIcon icon={FiCpu} className="h-4 w-4 animate-spin" />
                    <span>Testing Connection...</span>
                  </>
                ) : (
                  <>
                    <SafeIcon icon={FiCpu} className="h-4 w-4" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>

              {connectionStatus && (
                <div className={`mt-2 p-3 rounded-lg flex items-center space-x-2 ${
                  connectionStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  <SafeIcon icon={connectionStatus.success ? FiCheck : FiAlertCircle} className="h-4 w-4" />
                  <span className="text-sm">{connectionStatus.message}</span>
                </div>
              )}
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Model
              </label>
              <select
                name="modelName"
                value={formData.modelName}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {models.map(model=> (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {models.find(m=> m.value===formData.modelName)?.description}
              </p>
            </div>

            {/* Preferred Tone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Tone
              </label>
              <select
                name="preferredTone"
                value={formData.preferredTone}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {tones.map(tone=> (
                  <option key={tone.value} value={tone.value}>
                    {tone.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {tones.find(t=> t.value===formData.preferredTone)?.description}
              </p>
            </div>

            {/* Lesson Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lesson Template
              </label>
              <textarea
                name="lessonTemplate"
                value={formData.lessonTemplate}
                onChange={handleInputChange}
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Define your preferred lesson structure..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Define a specific structure or format for lessons
              </p>
            </div>

            {/* Custom Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Instructions
              </label>
              <textarea
                name="customInstructions"
                value={formData.customInstructions}
                onChange={handleInputChange}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Any specific requirements or preferences..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Additional instructions for the AI to follow
              </p>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Getting Started
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p>Sign up for OpenAI API access</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p>Generate your API key</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p>Test the connection</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p>Start generating lessons!</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">
              Cost Information
            </h3>
            <div className="space-y-2 text-sm text-yellow-800">
              <p>• GPT-4o Mini: ~$0.01-0.05 per lesson</p>
              <p>• GPT-4o: ~$0.10-0.30 per lesson</p>
              <p>• GPT-3.5 Turbo: ~$0.005-0.02 per lesson</p>
              <p className="text-xs italic">Costs vary based on lesson complexity</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              Security
            </h3>
            <div className="space-y-2 text-sm text-green-800">
              <p>• API keys are stored securely</p>
              <p>• Data is encrypted in transit</p>
              <p>• Only you can access your settings</p>
              <p>• Keys are never shared or logged</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AISettings