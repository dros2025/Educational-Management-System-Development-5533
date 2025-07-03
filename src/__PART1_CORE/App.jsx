import React from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import Login from './components/Auth/Login'
import SignUp from './components/Auth/SignUp'
import ForgotPassword from './components/Auth/ForgotPassword'
import ResetPassword from './components/Auth/ResetPassword'
import SMSLogin from './components/Auth/SMSLogin'
import TempSignIn from './components/Auth/TempSignIn'
import Dashboard from './components/Dashboard/Dashboard'
import UserManagement from './components/Users/UserManagement'
import LessonManagement from './components/Lessons/LessonManagement'
import WordSearchGenerator from './components/WordSearch/WordSearchGenerator'
import AILessonHome from './components/AILessonBot/AILessonHome'
import LessonMaker from './components/AILessonBot/LessonMaker'
import BotTrainer from './components/AILessonBot/BotTrainer'
import AISettings from './components/AILessonBot/AISettings'
import LessonHistory from './components/AILessonBot/LessonHistory'
import LessonDiagnostics from './components/Debug/LessonDiagnostics'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<SignUp />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="sms-login" element={<SMSLogin />} />
              <Route path="temp-signin" element={<TempSignIn />} />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              {/* Unified Lessons - All roles can access but with different permissions */}
              <Route
                path="lessons"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                    <LessonManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="word-search"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                    <WordSearchGenerator />
                  </ProtectedRoute>
                }
              />
              {/* AI Lesson Bot Routes - Admin Only */}
              <Route
                path="ai-lesson-bot"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AILessonHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ai-lesson-bot/lesson-maker"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <LessonMaker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ai-lesson-bot/bot-trainer"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <BotTrainer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ai-lesson-bot/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AISettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ai-lesson-bot/history"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <LessonHistory />
                  </ProtectedRoute>
                }
              />
              {/* Debug Route - Admin Only */}
              <Route
                path="debug/lessons"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <LessonDiagnostics />
                  </ProtectedRoute>
                }
              />
              {/* Placeholder routes for other features */}
              <Route
                path="attendance"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                    <div className="p-6">
                      <h1 className="text-3xl font-bold">Attendance</h1>
                      <p className="text-gray-600 mt-2">Attendance tracking coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="offerings"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                    <div className="p-6">
                      <h1 className="text-3xl font-bold">Offerings</h1>
                      <p className="text-gray-600 mt-2">Offering management coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="analytics"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <div className="p-6">
                      <h1 className="text-3xl font-bold">Analytics</h1>
                      <p className="text-gray-600 mt-2">Analytics dashboard coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
