-- Create the lessons table if it doesn't exist
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  age_group TEXT NOT NULL,
  bible_passage TEXT,
  theme TEXT,
  topic TEXT,
  lesson_type TEXT DEFAULT 'single',
  duration INTEGER DEFAULT 45,
  created_by UUID REFERENCES auth.users(id),
  ai_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for lessons
CREATE POLICY IF NOT EXISTS "Anyone can view lessons" ON lessons FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admins can manage lessons" ON lessons FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Create policies for users
CREATE POLICY IF NOT EXISTS "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admins can manage users" ON users FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Check for existing AI-generated lessons
SELECT 
  id,
  title,
  age_group,
  topic,
  bible_passage,
  lesson_type,
  created_at,
  ai_metadata->>'source' as source,
  ai_metadata->>'model_used' as model_used,
  created_by
FROM lessons 
WHERE ai_metadata IS NOT NULL 
  AND ai_metadata->>'source' = 'ai'
ORDER BY created_at DESC;