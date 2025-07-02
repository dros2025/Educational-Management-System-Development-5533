import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
  return { data, error }
}

// SMS Authentication
export const signInWithOTP = async (phone) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phone,
    options: {
      shouldCreateUser: true
    }
  })
  return { data, error }
}

export const verifyOTP = async (phone, token) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone,
    token: token,
    type: 'sms'
  })
  return { data, error }
}

export const resendOTP = async (phone) => {
  const { data, error } = await supabase.auth.resend({
    type: 'sms',
    phone: phone
  })
  return { data, error }
}

// Temporary sign in (demo purposes)
export const tempSignIn = async (role = 'student') => {
  // Create a temporary user session (for demo/development)
  const tempUsers = {
    admin: {
      id: 'temp-admin-123',
      email: 'admin@demo.com',
      profile: {
        id: 'temp-admin-profile',
        name: 'Demo Administrator',
        role: 'admin',
        email: 'admin@demo.com'
      }
    },
    teacher: {
      id: 'temp-teacher-123',
      email: 'teacher@demo.com',
      profile: {
        id: 'temp-teacher-profile',
        name: 'Demo Teacher',
        role: 'teacher',
        email: 'teacher@demo.com'
      }
    },
    student: {
      id: 'temp-student-123',
      email: 'student@demo.com',
      profile: {
        id: 'temp-student-profile',
        name: 'Demo Student',
        role: 'student',
        email: 'student@demo.com'
      }
    }
  }

  return { data: { user: tempUsers[role] }, error: null }
}

export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/#/reset-password`,
  })
  return { data, error }
}

export const updatePassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Database helpers
export const createUser = async (userData) => {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
  return { data, error }
}

export const getUserByPhone = async (phone) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single()
  return { data, error }
}

export const getUsers = async (role = null) => {
  let query = supabase.from('users').select('*')
  if (role) {
    query = query.eq('role', role)
  }
  const { data, error } = await query
  return { data, error }
}

export const updateUser = async (id, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
  return { data, error }
}

export const deleteUser = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)
  return { data, error }
}

// Enhanced Lessons - Only show lessons created by admins
export const createLesson = async (lessonData) => {
  const { data, error } = await supabase
    .from('lessons')
    .insert([lessonData])
    .select()
  return { data, error }
}

export const getLessons = async () => {
  // Get all lessons with creator information, but filter to admin-created only
  let query = supabase
    .from('lessons')
    .select(`
      *,
      users!lessons_created_by_fkey(name, role)
    `)
    .order('created_at', { ascending: false })
  
  const { data, error } = await query
  
  if (error) return { data, error }
  
  // Filter to only show lessons created by admin users
  const adminLessons = data?.filter(lesson => {
    return lesson.users?.role === 'admin'
  }) || []
  
  // Add source information based on metadata
  const enhancedData = adminLessons.map(lesson => ({
    ...lesson,
    source: lesson.ai_metadata?.source || 'manual',
    model_used: lesson.ai_metadata?.model_used,
    created_by_name: lesson.users?.name
  }))
  
  return { data: enhancedData, error: null }
}

export const updateLesson = async (id, updates) => {
  const { data, error } = await supabase
    .from('lessons')
    .update(updates)
    .eq('id', id)
    .select()
  return { data, error }
}

export const deleteLesson = async (id) => {
  const { data, error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', id)
  return { data, error }
}

// Assignments
export const createAssignment = async (assignmentData) => {
  const { data, error } = await supabase
    .from('assignments')
    .insert([assignmentData])
    .select()
  return { data, error }
}

export const getStudentLessons = async (studentId) => {
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      lessons (*)
    `)
    .eq('student_id', studentId)
  return { data, error }
}

// Attendance
export const createAttendance = async (attendanceData) => {
  const { data, error } = await supabase
    .from('attendance')
    .insert(attendanceData)
    .select()
  return { data, error }
}

export const getAttendance = async (date, teacherId) => {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      users (name)
    `)
    .eq('date', date)
    .eq('teacher_id', teacherId)
  return { data, error }
}

// Offerings
export const createOffering = async (offeringData) => {
  const { data, error } = await supabase
    .from('offerings')
    .insert([offeringData])
    .select()
  return { data, error }
}

export const getOfferings = async (teacherId = null) => {
  let query = supabase.from('offerings').select('*')
  if (teacherId) {
    query = query.eq('teacher_id', teacherId)
  }
  const { data, error } = await query.order('date', { ascending: false })
  return { data, error }
}

// Word Searches
export const createWordSearch = async (wordSearchData) => {
  const { data, error } = await supabase
    .from('word_searches')
    .insert([wordSearchData])
    .select()
  return { data, error }
}

export const getWordSearches = async (generatedBy = null) => {
  let query = supabase.from('word_searches').select('*')
  if (generatedBy) {
    query = query.eq('generated_by', generatedBy)
  }
  const { data, error } = await query.order('created_at', { ascending: false })
  return { data, error }
}