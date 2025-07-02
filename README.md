# School Management System with AI Lesson Bot

A comprehensive full-stack school management application built with React, Supabase, and OpenAI integration for AI-powered lesson generation.

## 🌟 **Key Features**

### 🤖 **AI Lesson Bot (Admin Only)**
- **Automatic Database Saving**: All generated lessons are automatically saved to the main Lessons tab
- **AI-Powered Generation**: Create Sunday School lessons using OpenAI's GPT-4o-mini
- **Multi-Class Support**: Generate lessons for multiple age groups simultaneously
- **Age-Appropriate Content**: Tailored for different age groups (3-5, 5-10, 11-14, 15-18, 18+)
- **Bible Integration**: Incorporate specific Bible passages and themes
- **Custom Training**: Train the AI with your preferred teaching style
- **Professional Downloads**: PDF export with formatting and metadata

### 📚 **Unified Lessons Management**
- **Single Source of Truth**: All lessons (AI-generated and manual) in one place
- **Teacher Access**: Teachers can view and download lessons for their age groups
- **Smart Filtering**: Filter by source (AI/Manual), age group, and search terms
- **Visual Indicators**: Clear badges showing lesson source and metadata
- **Download Options**: PDF and text file downloads available

### 🔐 **Authentication & Authorization**
- **Email/Password Login**: Secure login system with validation
- **SMS Authentication**: Phone number-based login with OTP verification
- **Demo Mode**: Try the system without registration
- **Multi-Role Support**: Admin, Teacher, Student roles with different permissions

### 👥 **User Management (Admin Only)**
- Create, edit, and delete users
- Auto-generate secure passwords
- Role assignment and management

### 📊 **Additional Features**
- Word Search Generator with PDF export
- Attendance tracking system
- Offering management
- Dashboard with role-specific analytics

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API account (for AI Lesson Bot)

### Installation

1. **Clone and install**:
```bash
git clone <repository-url>
cd school-management-app
npm install
```

2. **Environment setup**:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=your-openai-api-key
VITE_PDF_SERVICE_URL=http://localhost:5000
```

3. **Database setup** (Supabase):
```sql
-- Enhanced Lessons table with AI metadata
CREATE TABLE lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  age_group TEXT NOT NULL,
  bible_passage TEXT,
  theme TEXT,
  topic TEXT,
  lesson_type TEXT DEFAULT 'single',
  duration INTEGER DEFAULT 45,
  created_by UUID REFERENCES users(id),
  ai_metadata JSONB, -- Stores AI generation info
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view lessons" ON lessons 
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage all lessons" ON lessons 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Teachers can create lessons" ON lessons 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_id = auth.uid() 
      AND users.role IN ('admin', 'teacher')
    )
  );
```

4. **Start development**:
```bash
npm run dev
```

5. **Optional PDF Service** (for professional PDFs):
```bash
# In a separate terminal
python start_pdf_service.py
```

## 🎯 **AI Lesson Bot Workflow**

### **For Admins:**
1. **Setup API**: Go to AI Settings → Add OpenAI API key
2. **Generate Lessons**: AI Lesson Maker → Select age groups → Generate
3. **Auto-Save**: Lessons automatically appear in main Lessons tab
4. **Access Everywhere**: All users can now access these lessons

### **For Teachers:**
1. **Access Lessons**: Go to Lessons tab
2. **Filter by Age**: Filter lessons for your assigned age groups
3. **View & Download**: Full lesson content with PDF/text downloads
4. **Use in Class**: Professional formatting ready for teaching

## 📊 **System Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Lesson     │────│   Main Lessons   │────│   Teacher       │
│   Bot (Admin)   │    │   Database       │    │   Access        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
   Generate with AI    ────▶  Auto-Save to DB  ────▶  View & Download
```

## 🔧 **Technical Features**

### **Database Integration**
- **Unified Storage**: All lessons stored in single `lessons` table
- **AI Metadata**: JSON field stores generation details
- **Source Tracking**: Automatic tagging of AI vs manual lessons
- **RLS Security**: Row-level security for proper access control

### **Smart UI**
- **Visual Indicators**: Purple badges for AI lessons, blue for manual
- **Contextual Actions**: Different buttons for AI vs manual lessons
- **Search & Filter**: Find lessons by topic, age group, or source
- **Responsive Design**: Works on all devices

### **PDF Generation**
- **Microservice**: Optional PDF service for professional output
- **Fallback**: Text file downloads when PDF unavailable
- **Metadata**: Includes lesson details, AI model info, and timestamps

## 🎨 **User Experience**

### **Seamless Workflow**
1. Admin generates lessons → Automatically saved to database
2. Teachers access lessons → Filter by relevant age groups  
3. Everyone downloads → Professional PDF or text formats
4. No manual steps → Complete automation from generation to access

### **Role-Based Experience**
- **Admins**: Full AI generation + all lessons access
- **Teachers**: Lesson viewing, filtering, and downloading
- **Students**: View assigned lessons (future feature)

## 📈 **Benefits**

### **For Administrators**
- ✅ **One-Click Generation**: Create lessons for all age groups instantly
- ✅ **Automatic Distribution**: No manual sharing needed
- ✅ **Quality Control**: AI training ensures consistent quality
- ✅ **Time Savings**: Minutes instead of hours for lesson planning

### **For Teachers**
- ✅ **Instant Access**: All lessons immediately available
- ✅ **Age-Appropriate**: Filter to relevant content automatically  
- ✅ **Professional Format**: Ready-to-use materials
- ✅ **Download Options**: PDF or text based on preference

### **For Organizations**
- ✅ **Centralized Content**: Single source of truth for all lessons
- ✅ **Scalable System**: Handle unlimited lessons and users
- ✅ **Cost Effective**: Reduce manual lesson creation time
- ✅ **Quality Assurance**: Consistent, AI-powered content

## 🔒 **Security & Privacy**

- **API Key Security**: OpenAI keys stored securely per user
- **Database Security**: Row-level security with proper access control
- **Role-Based Access**: Proper permissions for each user type
- **Data Encryption**: All data encrypted in transit and at rest

## 📱 **Cross-Platform Support**

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Progressive Web App**: Install-able on mobile devices
- **Offline Capable**: Downloaded lessons work without internet
- **Touch Optimized**: Mobile-friendly interface

## 🚀 **Future Enhancements**

- **Student Portal**: Lesson assignments and progress tracking
- **Advanced Analytics**: Usage statistics and engagement metrics  
- **Curriculum Planning**: Multi-week lesson series coordination
- **Integration APIs**: Connect with other church management systems

---

## 💡 **Quick Demo**

**Try it now:**
1. Visit `/temp-signin` → Choose "Admin" role
2. Go to "AI Lesson Bot" → "Lesson Maker"  
3. Select age groups → Click "Generate Lessons"
4. Visit "Lessons" tab → See your generated lessons
5. Click "View" → Download as PDF or text

**The entire workflow from generation to access is now seamless!** 🎉