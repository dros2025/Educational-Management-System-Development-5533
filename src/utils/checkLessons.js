// Utility to check for generated lessons in the database
import { supabase } from '../lib/supabase'

export const checkGeneratedLessons = async () => {
  try {
    console.log('🔍 Checking for AI-generated lessons...')
    
    // Check if lessons table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'lessons')
    
    if (tableError) {
      console.error('❌ Error checking tables:', tableError)
      return { success: false, error: 'Could not check database tables' }
    }
    
    if (!tables || tables.length === 0) {
      console.log('❌ Lessons table does not exist')
      return { success: false, error: 'Lessons table not found' }
    }
    
    console.log('✅ Lessons table exists')
    
    // Check for all lessons
    const { data: allLessons, error: allError } = await supabase
      .from('lessons')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (allError) {
      console.error('❌ Error fetching all lessons:', allError)
      return { success: false, error: allError.message }
    }
    
    console.log(`📚 Total lessons in database: ${allLessons?.length || 0}`)
    
    // Filter AI-generated lessons
    const aiLessons = allLessons?.filter(lesson => 
      lesson.ai_metadata && lesson.ai_metadata.source === 'ai'
    ) || []
    
    console.log(`🤖 AI-generated lessons: ${aiLessons.length}`)
    
    // Check for recent lessons (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const recentLessons = allLessons?.filter(lesson => 
      new Date(lesson.created_at) > yesterday
    ) || []
    
    console.log(`🕐 Recent lessons (24h): ${recentLessons.length}`)
    
    // Detailed breakdown
    if (aiLessons.length > 0) {
      console.log('🎯 AI Lesson Breakdown:')
      aiLessons.forEach((lesson, index) => {
        console.log(`  ${index + 1}. ${lesson.title}`)
        console.log(`     Age Group: ${lesson.age_group}`)
        console.log(`     Topic: ${lesson.topic || 'N/A'}`)
        console.log(`     Model: ${lesson.ai_metadata?.model_used || 'Unknown'}`)
        console.log(`     Created: ${new Date(lesson.created_at).toLocaleString()}`)
        console.log(`     Unified: ${lesson.ai_metadata?.unified_generation ? 'Yes' : 'No'}`)
        console.log('')
      })
    }
    
    return {
      success: true,
      data: {
        totalLessons: allLessons?.length || 0,
        aiLessons: aiLessons.length,
        recentLessons: recentLessons.length,
        lessons: allLessons || [],
        aiLessonDetails: aiLessons
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return { success: false, error: error.message }
  }
}

// Function to check localStorage for development data
export const checkLocalStorageLessons = () => {
  try {
    console.log('🔍 Checking localStorage for lesson data...')
    
    const keys = Object.keys(localStorage).filter(key => 
      key.includes('lesson') || key.includes('ai') || key.includes('generated')
    )
    
    console.log(`🗂️ Found ${keys.length} lesson-related localStorage keys:`)
    keys.forEach(key => {
      const data = localStorage.getItem(key)
      console.log(`  ${key}: ${data ? `${data.length} characters` : 'empty'}`)
    })
    
    // Check for AI settings
    const aiSettingsKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('aiSettings_')
    )
    
    if (aiSettingsKeys.length > 0) {
      console.log('⚙️ AI Settings found:')
      aiSettingsKeys.forEach(key => {
        const settings = JSON.parse(localStorage.getItem(key) || '{}')
        console.log(`  User: ${key.replace('aiSettings_', '')}`)
        console.log(`  Has API Key: ${settings.openaiApiKey ? 'Yes' : 'No'}`)
        console.log(`  Model: ${settings.modelName || 'Not set'}`)
      })
    }
    
    // Check for training samples
    const trainingKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('trainingSamples_')
    )
    
    if (trainingKeys.length > 0) {
      console.log('🎯 Training Samples found:')
      trainingKeys.forEach(key => {
        const samples = JSON.parse(localStorage.getItem(key) || '[]')
        console.log(`  User: ${key.replace('trainingSamples_', '')}`)
        console.log(`  Samples: ${samples.length}`)
      })
    }
    
    return { keys, aiSettingsKeys, trainingKeys }
    
  } catch (error) {
    console.error('❌ Error checking localStorage:', error)
    return { error: error.message }
  }
}

// Main function to run all checks
export const runLessonDiagnostics = async () => {
  console.log('🚀 Running comprehensive lesson diagnostics...')
  console.log('=' .repeat(50))
  
  // Check localStorage
  const localStorageResult = checkLocalStorageLessons()
  
  console.log('=' .repeat(50))
  
  // Check database
  const databaseResult = await checkGeneratedLessons()
  
  console.log('=' .repeat(50))
  
  // Summary
  console.log('📋 DIAGNOSTIC SUMMARY:')
  console.log(`Database Connection: ${databaseResult.success ? '✅ Connected' : '❌ Failed'}`)
  
  if (databaseResult.success) {
    console.log(`Total Lessons: ${databaseResult.data.totalLessons}`)
    console.log(`AI Generated: ${databaseResult.data.aiLessons}`)
    console.log(`Recent (24h): ${databaseResult.data.recentLessons}`)
  }
  
  console.log(`localStorage Keys: ${localStorageResult.keys?.length || 0}`)
  console.log(`AI Settings: ${localStorageResult.aiSettingsKeys?.length || 0} users`)
  console.log(`Training Data: ${localStorageResult.trainingKeys?.length || 0} users`)
  
  return {
    localStorage: localStorageResult,
    database: databaseResult
  }
}