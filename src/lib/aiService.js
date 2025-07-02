// AI Service - OpenAI API integration with unified lesson generation across age groups
import { createLesson } from './supabase'

// Mock data for development/demo purposes
const mockSettings = {
  openaiApiKey: '',
  modelName: 'gpt-4o-mini',
  preferredTone: 'friendly',
  lessonTemplate: '',
  customInstructions: ''
}

const mockTrainingSamples = []

// Enhanced lesson generation with unified content across age groups
export const generateLesson = async (formData, userId) => {
  const settings = await getAISettings(userId)
  
  if (!settings?.openaiApiKey) {
    throw new Error('OpenAI API key not configured. Please set it in AI Settings.')
  }

  // Get training samples to improve lesson quality
  const trainingSamples = await getTrainingSamples(userId)

  try {
    // For multiple age groups, generate unified content first, then age-specific adaptations
    if (formData.selectedClasses && formData.selectedClasses.length > 1) {
      return await generateUnifiedLessonsForMultipleAges(formData, settings, trainingSamples, userId)
    } else {
      // Single age group - use existing logic
      return await generateSingleLesson(formData, settings, trainingSamples, userId)
    }
  } catch (error) {
    console.error('Error generating lesson:', error)
    throw error
  }
}

// Generate unified lessons for multiple age groups with same core content
const generateUnifiedLessonsForMultipleAges = async (formData, settings, trainingSamples, userId) => {
  // Step 1: Generate the master lesson content with core biblical truth
  const masterPrompt = buildMasterLessonPrompt(formData, settings, trainingSamples)
  
  console.log('Generating master lesson content...')
  const masterResponse = await callOpenAI(settings, masterPrompt)
  const masterContent = masterResponse.choices[0].message.content
  
  // Parse the master content to extract key components
  const masterLesson = parseMasterLesson(masterContent)
  
  console.log('Master lesson generated:', {
    title: masterLesson.title,
    memoryVerse: masterLesson.memoryVerse,
    coreMessage: masterLesson.coreMessage.substring(0, 100) + '...'
  })

  // Step 2: Generate age-specific adaptations for each selected class
  const results = []
  
  for (let i = 0; i < formData.selectedClasses.length; i++) {
    const ageGroup = formData.selectedClasses[i]
    console.log(`Generating age-specific adaptation for ${ageGroup}...`)
    
    const ageSpecificPrompt = buildAgeAdaptationPrompt(masterLesson, ageGroup, formData, settings, trainingSamples)
    const ageResponse = await callOpenAI(settings, ageSpecificPrompt)
    const ageSpecificContent = ageResponse.choices[0].message.content

    // Create the lesson data
    const lessonData = {
      title: `${masterLesson.title} (${ageGroup})`,
      content: ageSpecificContent,
      age_group: ageGroup,
      bible_passage: formData.biblePassage,
      theme: formData.theme,
      topic: formData.topic,
      lesson_type: formData.lessonType,
      duration: parseInt(formData.duration),
      created_by: userId,
      // Add AI-specific metadata as JSON
      ai_metadata: {
        model_used: settings.modelName,
        master_lesson_id: Date.now().toString(), // Same for all in this batch
        memory_verse: masterLesson.memoryVerse,
        core_message: masterLesson.coreMessage,
        age_adaptation: true,
        unified_generation: true,
        generated_at: new Date().toISOString(),
        source: 'ai'
      }
    }

    // Save to database
    const { data: savedLesson, error } = await createLesson(lessonData)
    
    results.push({
      id: savedLesson?.id || Date.now().toString(),
      title: lessonData.title,
      content: ageSpecificContent,
      ageGroup: ageGroup,
      topic: formData.topic,
      biblePassage: formData.biblePassage,
      theme: formData.theme,
      memoryVerse: masterLesson.memoryVerse,
      coreMessage: masterLesson.coreMessage,
      savedToDatabase: !!savedLesson
    })

    // Small delay between generations to avoid rate limiting
    if (i < formData.selectedClasses.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
  }

  return results
}

// Generate single lesson (existing functionality)
const generateSingleLesson = async (formData, settings, trainingSamples, userId) => {
  const prompt = buildPrompt(formData, settings, trainingSamples)
  const response = await callOpenAI(settings, prompt)
  const content = response.choices[0].message.content

  // Create title based on content or provided data
  let title = formData.seriesTitle || `${formData.topic} Lesson`
  if (formData.ageGroup) {
    title += ` (${formData.ageGroup})`
  }

  // Prepare lesson data for database
  const lessonData = {
    title: title,
    content: content,
    age_group: formData.ageGroup,
    bible_passage: formData.biblePassage,
    theme: formData.theme,
    topic: formData.topic,
    lesson_type: formData.lessonType,
    duration: parseInt(formData.duration),
    created_by: userId,
    // Add AI-specific metadata as JSON
    ai_metadata: {
      model_used: settings.modelName,
      prompt_used: prompt,
      series_title: formData.seriesTitle,
      lesson_count: formData.lessonCount || 1,
      generated_at: new Date().toISOString(),
      source: 'ai'
    }
  }

  // Save directly to database
  const { data: savedLesson, error } = await createLesson(lessonData)

  return {
    id: savedLesson?.id || Date.now().toString(),
    title: lessonData.title,
    content: content,
    ageGroup: formData.ageGroup,
    topic: formData.topic,
    biblePassage: formData.biblePassage,
    theme: formData.theme,
    savedToDatabase: !!savedLesson
  }
}

// Build master lesson prompt for unified content generation
const buildMasterLessonPrompt = (formData, settings, trainingSamples = []) => {
  let prompt = `You are creating a MASTER LESSON that will be adapted for multiple age groups. 

LESSON DETAILS:
- Topic: ${formData.topic}
- Bible Passage: ${formData.biblePassage}
- Theme: ${formData.theme}
- Duration: ${formData.duration} minutes per age group
- Age Groups to be created: ${formData.selectedClasses.join(', ')}

CRITICAL REQUIREMENTS:
1. Create ONE core biblical message that works for ALL age groups
2. Choose ONE memory verse that is appropriate for all ages (shorter is better for younger kids)
3. Establish the main spiritual truth/lesson objective
4. Provide the basic Bible story/teaching content
5. Suggest core discussion points that can be adapted

PLEASE STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:

=== MASTER LESSON ===
TITLE: [Lesson title without age group]

MEMORY VERSE: [One verse that works for all ages - keep it concise]

CORE MESSAGE: [The main spiritual truth in 2-3 sentences]

BIBLE STORY/TEACHING:
[The core biblical content that will be adapted for each age group]

KEY DISCUSSION POINTS:
1. [Point that can be adapted for different ages]
2. [Point that can be adapted for different ages]  
3. [Point that can be adapted for different ages]

MAIN ACTIVITY CONCEPT:
[One central activity idea that can be modified for different age groups]

PRACTICAL APPLICATION:
[How this lesson applies to daily life - to be age-adapted]

=== END MASTER LESSON ===`

  if (formData.objectives) {
    prompt += `\n\nLEARNING OBJECTIVES: ${formData.objectives}`
  }

  if (formData.specialRequests) {
    prompt += `\n\nSPECIAL REQUESTS: ${formData.specialRequests}`
  }

  // Add training samples context if available
  if (trainingSamples && trainingSamples.length > 0) {
    const goodExamples = trainingSamples.filter(sample => sample.is_good_example === true)
    
    if (goodExamples.length > 0) {
      prompt += `\n\n===STYLE GUIDANCE FROM TRAINING EXAMPLES===\n`
      prompt += `Please incorporate the effective teaching methods and style from these examples:\n\n`
      
      goodExamples.slice(0, 2).forEach((sample, index) => {
        prompt += `EXAMPLE ${index + 1}: "${sample.title}"\n`
        prompt += `${sample.content.substring(0, 300)}...\n`
        if (sample.feedback) {
          prompt += `WHY THIS WORKS: ${sample.feedback}\n`
        }
        prompt += `\n---\n\n`
      })
    }
  }

  if (settings.customInstructions) {
    prompt += `\n\nADDITIONAL INSTRUCTIONS: ${settings.customInstructions}`
  }

  prompt += `\n\nRemember: This master lesson will be adapted for ages ${formData.selectedClasses.join(', ')}, so keep the core content solid but adaptable!`

  return prompt
}

// Build age-specific adaptation prompt
const buildAgeAdaptationPrompt = (masterLesson, ageGroup, formData, settings, trainingSamples = []) => {
  let prompt = `You are now adapting the master lesson for ${ageGroup} year olds specifically.

=== MASTER LESSON TO ADAPT ===
TITLE: ${masterLesson.title}
MEMORY VERSE: ${masterLesson.memoryVerse}
CORE MESSAGE: ${masterLesson.coreMessage}

BIBLE STORY: ${masterLesson.bibleStory}
KEY POINTS: ${masterLesson.keyPoints.join('\n')}
ACTIVITY CONCEPT: ${masterLesson.activityConcept}
APPLICATION: ${masterLesson.application}
=== END MASTER LESSON ===

AGE-SPECIFIC ADAPTATION REQUIREMENTS FOR ${ageGroup} YEAR OLDS:`

  // Add age-specific instructions
  const ageInstructions = {
    '3-5': `
DEVELOPMENTAL FOCUS:
- Use VERY simple language (3-4 word sentences)
- Repeat the memory verse many times with actions
- Include lots of movement, songs, and sensory activities
- Keep each activity to 3-5 minutes maximum
- Use concrete examples they can see/touch
- Include parent/caregiver involvement suggestions
- Focus on simple emotions: happy, sad, love, care

TEACHING METHODS:
- Show and tell with props/pictures
- Action songs and finger plays
- Simple craft with large materials
- Snack that relates to lesson
- Dramatic play/pretend
- Repetitive chants and rhymes`,

    '5-10': `
DEVELOPMENTAL FOCUS:
- Use simple but complete sentences
- Include interactive storytelling with participation
- Memory verse with motions and visual aids
- Mix of sitting and moving activities (5-10 minutes each)
- Beginning reading skills support
- Simple cause-and-effect discussions
- Basic right and wrong concepts

TEACHING METHODS:
- Interactive Bible story with props
- Group games that reinforce the lesson
- Art projects with multiple steps
- Simple discussion questions with concrete answers
- Role-playing scenarios
- Memory techniques (songs, rhymes, visual cues)`,

    '11-14': `
DEVELOPMENTAL FOCUS:
- Encourage deeper thinking and discussion
- Address questions about faith and identity
- Connect Bible stories to modern situations
- Include peer interaction and group work
- Challenge with memorization and Bible skills
- Address social pressures and choices
- Encourage personal application

TEACHING METHODS:
- Small group discussions
- Creative projects (drama, art, writing)
- Case studies and "What would you do?" scenarios
- Bible exploration with concordance/study tools
- Service projects and practical applications
- Journaling and reflection time`,

    '15-18': `
DEVELOPMENTAL FOCUS:
- Address real-life challenges and tough questions
- Encourage critical thinking about faith
- Discuss contemporary issues from biblical perspective
- Support identity development and future planning
- Address relationships, peer pressure, life choices
- Encourage leadership and mentoring opportunities
- Connect faith to daily life and decision-making

TEACHING METHODS:
- Socratic discussions and debate
- Research projects and presentations
- Mentoring younger students
- Real-world application projects
- Personal testimony sharing
- Community service integration
- Life application homework`,

    '18+': `
DEVELOPMENTAL FOCUS:
- Provide theological depth and scholarly insight
- Address adult life challenges (work, relationships, parenting)
- Encourage spiritual leadership and discipleship
- Connect to historical and cultural context
- Support life transitions and major decisions
- Encourage teaching and mentoring others
- Address complex theological questions

TEACHING METHODS:
- In-depth Bible study with commentary
- Group discussions on complex topics
- Practical life application workshops
- Mentoring and discipleship opportunities
- Service leadership roles
- Personal spiritual growth planning
- Integration with family and work life`
  }

  prompt += ageInstructions[ageGroup] || ageInstructions['5-10']

  prompt += `

ADAPTATION REQUIREMENTS:
1. Keep the SAME memory verse: "${masterLesson.memoryVerse}"
2. Keep the SAME core message: "${masterLesson.coreMessage}"
3. Adapt the language complexity for ${ageGroup} year olds
4. Modify activities to be age-appropriate
5. Adjust discussion questions for their understanding level
6. Include age-specific application examples

LESSON STRUCTURE FOR ${ageGroup}:
- Opening Prayer/Welcome (age-appropriate style)
- Memory Verse Introduction (with age-specific learning method)
- Bible Story/Teaching (adapted complexity)
- Discussion Questions (age-appropriate depth)
- Main Activity (age-suitable)
- Application/Life Connection (relevant to their world)
- Closing Prayer/Wrap-up
- Materials List
- Teacher Tips for this age group

Please create a complete, detailed lesson specifically for ${ageGroup} year olds that maintains the core biblical truth while being perfectly suited to their developmental stage.`

  // Add training samples for this specific age group
  const ageSpecificSamples = trainingSamples.filter(sample => 
    sample.is_good_example === true && 
    (sample.age_group === ageGroup || sample.age_group === 'all')
  )

  if (ageSpecificSamples.length > 0) {
    prompt += `\n\n===AGE-SPECIFIC TEACHING EXAMPLES===\n`
    ageSpecificSamples.slice(0, 1).forEach((sample, index) => {
      prompt += `EXCELLENT ${ageGroup} EXAMPLE: "${sample.title}"\n`
      prompt += `${sample.content.substring(0, 400)}...\n`
      if (sample.feedback) {
        prompt += `WHY THIS WORKS FOR ${ageGroup}: ${sample.feedback}\n`
      }
    })
  }

  if (settings.customInstructions) {
    prompt += `\n\nADDITIONAL INSTRUCTIONS: ${settings.customInstructions}`
  }

  return prompt
}

// Parse the master lesson response into structured components
const parseMasterLesson = (content) => {
  const sections = {
    title: '',
    memoryVerse: '',
    coreMessage: '',
    bibleStory: '',
    keyPoints: [],
    activityConcept: '',
    application: ''
  }

  try {
    // Extract title
    const titleMatch = content.match(/TITLE:\s*(.+)/i)
    if (titleMatch) sections.title = titleMatch[1].trim()

    // Extract memory verse
    const memoryVerseMatch = content.match(/MEMORY VERSE:\s*(.+)/i)
    if (memoryVerseMatch) sections.memoryVerse = memoryVerseMatch[1].trim()

    // Extract core message
    const coreMessageMatch = content.match(/CORE MESSAGE:\s*([\s\S]*?)(?=BIBLE STORY|KEY DISCUSSION|$)/i)
    if (coreMessageMatch) sections.coreMessage = coreMessageMatch[1].trim()

    // Extract Bible story
    const bibleStoryMatch = content.match(/BIBLE STORY\/TEACHING:\s*([\s\S]*?)(?=KEY DISCUSSION|MAIN ACTIVITY|$)/i)
    if (bibleStoryMatch) sections.bibleStory = bibleStoryMatch[1].trim()

    // Extract key discussion points
    const keyPointsMatch = content.match(/KEY DISCUSSION POINTS:\s*([\s\S]*?)(?=MAIN ACTIVITY|PRACTICAL APPLICATION|$)/i)
    if (keyPointsMatch) {
      const points = keyPointsMatch[1].trim().split(/\d+\./).filter(p => p.trim())
      sections.keyPoints = points.map(p => p.trim())
    }

    // Extract activity concept
    const activityMatch = content.match(/MAIN ACTIVITY CONCEPT:\s*([\s\S]*?)(?=PRACTICAL APPLICATION|$)/i)
    if (activityMatch) sections.activityConcept = activityMatch[1].trim()

    // Extract practical application
    const applicationMatch = content.match(/PRACTICAL APPLICATION:\s*([\s\S]*?)(?=$)/i)
    if (applicationMatch) sections.application = applicationMatch[1].trim()

  } catch (error) {
    console.error('Error parsing master lesson:', error)
    // Fallback to basic structure
    sections.title = sections.title || 'Bible Lesson'
    sections.memoryVerse = sections.memoryVerse || 'Jesus loves me, this I know. John 3:16'
    sections.coreMessage = sections.coreMessage || 'God loves us and wants us to know Him.'
  }

  return sections
}

// Call OpenAI API
const callOpenAI = async (settings, prompt) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.openaiApiKey}`
    },
    body: JSON.stringify({
      model: settings.modelName || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert Sunday School curriculum writer. Create engaging, age-appropriate lessons that are biblically sound and pedagogically effective. Use a ${settings.preferredTone} tone. ${settings.customInstructions || ''}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to generate lesson')
  }

  return await response.json()
}

// Original single lesson prompt builder (kept for backward compatibility)
const buildPrompt = (formData, settings, trainingSamples = []) => {
  let prompt = `Create a ${formData.lessonType === 'series' ? `${formData.lessonCount}-lesson series` : 'single lesson'} for Sunday School.

Details:
- Topic: ${formData.topic}
- Bible Passage: ${formData.biblePassage}
- Age Group: ${formData.ageGroup}
- Duration: ${formData.duration} minutes`

  if (formData.theme) {
    prompt += `\n- Theme: ${formData.theme}`
  }

  if (formData.objectives) {
    prompt += `\n- Learning Objectives: ${formData.objectives}`
  }

  if (formData.specialRequests) {
    prompt += `\n- Special Requests: ${formData.specialRequests}`
  }

  if (formData.lessonType === 'series' && formData.seriesTitle) {
    prompt += `\n- Series Title: ${formData.seriesTitle}`
  }

  // Add age-specific instructions
  const ageInstructions = {
    '3-5': 'Focus on simple stories, songs, and hands-on activities. Use repetition and visual aids. Keep activities short (5-10 minutes each).',
    '5-10': 'Include interactive storytelling, crafts, games, and simple discussion questions. Use concrete examples and visual learning.',
    '11-14': 'Incorporate deeper discussions, group activities, and real-life applications. Address questions about faith and identity.',
    '15-18': 'Include challenging questions, peer discussions, and practical life applications. Address contemporary issues from a biblical perspective.',
    '18+': 'Provide in-depth Bible study, theological discussions, and practical applications for daily life and family situations.'
  }

  if (ageInstructions[formData.ageGroup]) {
    prompt += `\n\nAGE-SPECIFIC REQUIREMENTS: ${ageInstructions[formData.ageGroup]}`
  }

  // Add training samples context
  if (trainingSamples && trainingSamples.length > 0) {
    const relevantSamples = trainingSamples.filter(sample =>
      !sample.age_group || sample.age_group === formData.ageGroup || sample.age_group === 'all'
    )

    const goodExamples = relevantSamples.filter(sample => sample.is_good_example === true)
    const badExamples = relevantSamples.filter(sample => sample.is_good_example === false)

    if (goodExamples.length > 0) {
      prompt += `\n\n===EXCELLENT LESSON EXAMPLES TO FOLLOW===\n`
      prompt += `Please study these high-quality lesson examples and incorporate their effective teaching methods, structure, and style into your lesson:\n\n`

      goodExamples.forEach((sample, index) => {
        prompt += `GOOD EXAMPLE ${index + 1} - "${sample.title}" (Age: ${sample.age_group}):\n`
        prompt += `${sample.content.substring(0, 500)}...\n`
        if (sample.feedback) {
          prompt += `WHY THIS IS EXCELLENT: ${sample.feedback}\n`
        }
        if (sample.tags && sample.tags.length > 0) {
          prompt += `EFFECTIVE TECHNIQUES USED: ${sample.tags.join(', ')}\n`
        }
        prompt += `\n---\n\n`
      })

      prompt += `IMPORTANT: Please emulate the teaching style, engagement techniques, and structural elements from these GOOD EXAMPLES above. These represent the preferred lesson quality and approach.\n\n`
    }

    if (badExamples.length > 0) {
      prompt += `===AVOID THESE APPROACHES===\n`
      prompt += `The following examples show what NOT to do. Please avoid these patterns:\n\n`

      badExamples.forEach((sample, index) => {
        prompt += `AVOID THIS APPROACH ${index + 1} - "${sample.title}":\n`
        prompt += `${sample.content.substring(0, 300)}...\n`
        if (sample.feedback) {
          prompt += `WHY TO AVOID: ${sample.feedback}\n`
        }
        prompt += `\n---\n\n`
      })
    }
  }

  if (settings.lessonTemplate) {
    prompt += `\n\nPLEASE FOLLOW THIS STRUCTURE:\n${settings.lessonTemplate}`
  }

  prompt += `

Please include:
- Opening prayer/welcome
- Bible story presentation  
- Age-appropriate activities
- Discussion questions
- Application for daily life
- Closing prayer
- Materials needed list

Make it engaging and interactive for the specified age group.`

  // Emphasize using good examples if they exist
  if (trainingSamples.some(sample => sample.is_good_example === true)) {
    prompt += `\n\nIMPORTANT: Base your lesson structure, tone, and teaching methods on the EXCELLENT LESSON EXAMPLES provided above. These represent the ideal style and quality expected.`
  }

  return prompt
}

// Rest of the existing functions remain unchanged
export const testOpenAIConnection = async (apiKey, modelName = 'gpt-4o-mini') => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'user', content: 'Hello, this is a test message.' }
        ],
        max_tokens: 10
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'API connection failed')
    }

    return { message: 'Connection successful! API key is valid.' }
  } catch (error) {
    throw new Error(`Connection failed: ${error.message}`)
  }
}

// Settings management
export const getAISettings = async (userId) => {
  const settings = localStorage.getItem(`aiSettings_${userId}`)
  return settings ? JSON.parse(settings) : mockSettings
}

export const saveAISettings = async (settingsData) => {
  localStorage.setItem(`aiSettings_${settingsData.user_id}`, JSON.stringify(settingsData))
  return settingsData
}

// Training samples management
export const getTrainingSamples = async (userId) => {
  const samples = localStorage.getItem(`trainingSamples_${userId}`)
  return samples ? JSON.parse(samples) : []
}

export const saveTrainingSample = async (sampleData) => {
  const existing = JSON.parse(localStorage.getItem(`trainingSamples_${sampleData.user_id}`) || '[]')
  const newSample = {
    ...sampleData,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_good_example: !!(sampleData.isGoodExample === true || sampleData.isGoodExample === 'true')
  }
  
  console.log('Saving training sample:', newSample)
  existing.push(newSample)
  localStorage.setItem(`trainingSamples_${sampleData.user_id}`, JSON.stringify(existing))
  return newSample
}

export const updateTrainingSample = async (sampleId, sampleData) => {
  const allKeys = Object.keys(localStorage).filter(key => key.startsWith('trainingSamples_'))
  
  for (const key of allKeys) {
    const samples = JSON.parse(localStorage.getItem(key) || '[]')
    const sampleIndex = samples.findIndex(sample => sample.id === sampleId)
    
    if (sampleIndex !== -1) {
      samples[sampleIndex] = {
        ...samples[sampleIndex],
        ...sampleData,
        updated_at: new Date().toISOString(),
        is_good_example: !!(sampleData.isGoodExample === true || sampleData.isGoodExample === 'true')
      }
      
      console.log('Updated training sample:', samples[sampleIndex])
      localStorage.setItem(key, JSON.stringify(samples))
      return samples[sampleIndex]
    }
  }
  
  throw new Error('Training sample not found')
}

export const deleteTrainingSample = async (sampleId) => {
  const allKeys = Object.keys(localStorage).filter(key => key.startsWith('trainingSamples_'))
  
  for (const key of allKeys) {
    const samples = JSON.parse(localStorage.getItem(key) || '[]')
    const filtered = samples.filter(sample => sample.id !== sampleId)
    
    if (filtered.length !== samples.length) {
      localStorage.setItem(key, JSON.stringify(filtered))
      break
    }
  }
}

// Fixed functions for lesson history - now works with database
export const getGeneratedLessons = async (userId) => {
  // This now returns lessons from the main database instead of localStorage
  // We'll handle this in the LessonHistory component directly
  return []
}

export const deleteGeneratedLesson = async (lessonId) => {
  // This now works with the main database
  // We'll handle this in the LessonHistory component directly
  console.log('deleteGeneratedLesson called - handled by main database now')
}