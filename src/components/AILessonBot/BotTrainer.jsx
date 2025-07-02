import React,{useState,useEffect} from 'react'
import {Link} from 'react-router-dom'
import {useAuth} from '../../contexts/AuthContext'
import {getTrainingSamples,saveTrainingSample,deleteTrainingSample,updateTrainingSample} from '../../lib/aiService'
import toast from 'react-hot-toast'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi' 

const {FiBrain,FiPlus,FiTrash2,FiEdit,FiUpload,FiTag,FiThumbsUp,FiThumbsDown,FiArrowLeft}=FiIcons 

const BotTrainer=()=> {
  const {user}=useAuth() 
  const [trainingSamples,setTrainingSamples]=useState([]) 
  const [loading,setLoading]=useState(false) 
  const [showAddForm,setShowAddForm]=useState(false) 
  const [editingSample,setEditingSample]=useState(null)
  const [formData,setFormData]=useState({
    title: '',
    content: '',
    ageGroup: '5-10',
    tags: '',
    feedback: '',
    isGoodExample: true
  }) 

  useEffect(()=> {
    fetchTrainingSamples()
  },[]) 

  const fetchTrainingSamples=async ()=> {
    try {
      const samples=await getTrainingSamples(user.profile.id) 
      setTrainingSamples(samples)
    } catch (error) {
      console.error('Error fetching training samples:',error)
    }
  } 

  const handleInputChange=(e)=> {
    const {name,value,type,checked}=e.target 
    
    if (name === 'isGoodExample') {
      // Explicitly handle the boolean conversion for isGoodExample
      setFormData(prev => ({
        ...prev,
        [name]: value === 'true' // Convert string 'true' to boolean true
      }))
    } else {
      setFormData(prev=> ({
        ...prev,
        [name]: type==='checkbox' ? checked : value
      }))
    }
  } 

  const handleSubmit=async (e)=> {
    e.preventDefault() 
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in title and content') 
      return
    } 

    setLoading(true) 
    try {
      const sampleData={
        ...formData,
        tags: formData.tags.split(',').map(tag=> tag.trim()).filter(tag=> tag),
        user_id: user.profile.id,
        // Ensure boolean conversion
        isGoodExample: formData.isGoodExample === true || formData.isGoodExample === 'true'
      } 
      
      console.log('Saving sample with isGoodExample:', sampleData.isGoodExample) // Debug log
      
      if (editingSample) {
        // Update existing sample
        await updateTrainingSample(editingSample.id, sampleData)
        toast.success('Training sample updated successfully!')
      } else {
        // Create new sample
        await saveTrainingSample(sampleData) 
        const successMessage = sampleData.isGoodExample
          ? 'Training sample saved successfully! The AI will now learn from this excellent example.'
          : 'Training sample saved successfully! The AI will now know to avoid this approach.'
        toast.success(successMessage)
      }
      
      resetForm()
      fetchTrainingSamples()
    } catch (error) {
      toast.error(editingSample ? 'Failed to update training sample' : 'Failed to save training sample')
    } finally {
      setLoading(false)
    }
  } 

  const handleEdit = (sample) => {
    setEditingSample(sample)
    setFormData({
      title: sample.title,
      content: sample.content,
      ageGroup: sample.age_group,
      tags: Array.isArray(sample.tags) ? sample.tags.join(', ') : '',
      feedback: sample.feedback || '',
      isGoodExample: !!sample.is_good_example // Use !! for boolean conversion
    })
    setShowAddForm(true)
  }

  const handleDelete=async (sampleId)=> {
    if (!confirm('Are you sure you want to delete this training sample?')) return 

    try {
      await deleteTrainingSample(sampleId) 
      toast.success('Training sample deleted') 
      fetchTrainingSamples()
    } catch (error) {
      toast.error('Failed to delete training sample')
    }
  } 

  const handleFileUpload=(e)=> {
    const file=e.target.files[0] 
    if (!file) return 

    const reader=new FileReader() 
    reader.onload=(event)=> {
      const content=event.target.result 
      setFormData(prev=> ({
        ...prev,
        content: content,
        title: file.name.replace(/\.[^/.]+$/,'')
      }))
    } 
    reader.readAsText(file)
  } 

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      ageGroup: '5-10',
      tags: '',
      feedback: '',
      isGoodExample: true // Default to excellent example
    })
    setShowAddForm(false)
    setEditingSample(null)
  }

  const ageGroups=[ 
    {value: '3-5',label: '3-5 years'},
    {value: '5-10',label: '5-10 years'},
    {value: '11-14',label: '11-14 years'},
    {value: '15-18',label: '15-18 years'},
    {value: '18+',label: '18+ years'}
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
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <SafeIcon icon={FiBrain} className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bot Training</h1>
            <p className="text-gray-600">Train the AI with lesson examples (both good and bad)</p>
          </div>
        </div>
        <button
          onClick={()=> {
            resetForm()
            setShowAddForm(true)
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <SafeIcon icon={FiPlus} className="h-5 w-5" />
          <span>Add Lesson Example</span>
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-2">Excellent Examples</h3>
          <p className="text-sm text-green-800">Upload your best lessons to teach the AI your preferred style and quality standards</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-semibold text-red-900 mb-2">Poor Examples</h3>
          <p className="text-sm text-red-800">Show the AI what approaches to avoid by providing examples of ineffective lessons</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-semibold text-purple-900 mb-2">Quality Training</h3>
          <p className="text-sm text-purple-800">Add feedback to help the AI understand what makes examples good or bad</p>
        </div>
      </div>

      {/* Add/Edit Sample Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingSample ? 'Edit Lesson Example' : 'Add Lesson Example'}
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You can add both excellent examples (for the AI to follow) and poor examples (for the AI to avoid).
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter the lesson title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lesson Content *
                  </label>
                  {!editingSample && (
                    <div className="mb-2">
                      <label className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200 transition-colors">
                        <SafeIcon icon={FiUpload} className="h-4 w-4 mr-2" />
                        <span className="text-sm">Upload File</span>
                        <input
                          type="file"
                          accept=".txt,.md,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-gray-500 ml-2">or type/paste content below</span>
                    </div>
                  )}
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    rows={10}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Paste your lesson content here..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age Group
                    </label>
                    <select
                      name="ageGroup"
                      value={formData.ageGroup}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {ageGroups.map(group=> (
                        <option key={group.value} value={group.value}>
                          {group.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Example Quality *
                    </label>
                    <select
                      name="isGoodExample"
                      value={String(formData.isGoodExample)} // Convert to string for select
                      onChange={handleInputChange}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                        formData.isGoodExample 
                          ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                          : 'border-red-300 focus:ring-red-500 bg-red-50'
                      }`}
                    >
                      <option value="true">✅ Excellent Example (AI should follow this)</option>
                      <option value="false">❌ Poor Example (AI should avoid this)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teaching Techniques Used
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="interactive, visual, storytelling, hands-on (comma-separated)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.isGoodExample ? '✅ What Makes This Lesson Excellent?' : '❌ Why Should This Approach Be Avoided?'} *
                  </label>
                  <textarea
                    name="feedback"
                    value={formData.feedback}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                      formData.isGoodExample 
                        ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                        : 'border-red-300 focus:ring-red-500 bg-red-50'
                    }`}
                    placeholder={formData.isGoodExample 
                      ? "Explain what makes this lesson effective: engagement techniques, structure, age-appropriateness, etc."
                      : "Explain what problems this lesson has: boring delivery, inappropriate content, poor structure, etc."
                    }
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                      formData.isGoodExample 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {loading ? (editingSample ? 'Updating...' : 'Saving...') : (editingSample ? 'Update Example' : 'Save Training Example')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Training Samples List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Training Examples ({trainingSamples.length})</h2>
          <p className="text-sm text-gray-600 mt-1">These examples help train the AI to understand your preferences</p>
        </div>
        
        {trainingSamples.length===0 ? (
          <div className="p-8 text-center text-gray-500">
            <SafeIcon icon={FiBrain} className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No training examples yet.</p>
            <p className="text-sm">Add some lesson examples to improve AI lesson generation quality!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {trainingSamples.map((sample)=> (
              <div key={sample.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    {/* Show appropriate icon based on example quality */}
                    <div className={`p-1 rounded-full border-2 ${sample.is_good_example
                      ? 'border-green-500 bg-green-50' 
                      : 'border-red-500 bg-red-50'
                    }`}>
                      <SafeIcon 
                        icon={sample.is_good_example ? FiThumbsUp : FiThumbsDown} 
                        className={`h-4 w-4 ${sample.is_good_example ? 'text-green-500' : 'text-red-500'}`} 
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900">{sample.title}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                      {sample.age_group}
                    </span>
                    {/* Fixed: Remove redundant Boolean calls */}
                    <span className={`text-xs px-2 py-1 rounded-full ${sample.is_good_example
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                      {sample.is_good_example ? '✅ Excellent Example' : '❌ Poor Example'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={()=> handleEdit(sample)}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="Edit example"
                    >
                      <SafeIcon icon={FiEdit} className="h-4 w-4" />
                    </button>
                    <button
                      onClick={()=> handleDelete(sample.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete example"
                    >
                      <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {sample.tags && sample.tags.length > 0 && (
                  <div className="flex items-center space-x-2 mb-2">
                    <SafeIcon icon={FiTag} className="h-4 w-4 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {sample.tags.map((tag,index)=> (
                        <span key={index} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                  {sample.content.substring(0,200)}...
                </p>

                {/* Fixed: Remove redundant Boolean calls */}
                {sample.feedback && (
                  <div className={`rounded-lg p-3 mt-3 border ${sample.is_good_example
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-sm ${sample.is_good_example ? 'text-green-800' : 'text-red-800'}`}>
                      <strong>{sample.is_good_example ? '✅ Why This Is Excellent:' : '❌ Why To Avoid This:'}</strong> {sample.feedback}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  Added {new Date(sample.created_at).toLocaleDateString()}
                  {sample.updated_at && sample.updated_at !== sample.created_at && (
                    <span> • Updated {new Date(sample.updated_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BotTrainer