import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { tempSignIn } from '../../lib/supabase'
import toast from 'react-hot-toast'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiUser, FiUsers, FiUserCheck, FiArrowLeft, FiEye } = FiIcons

const TempSignIn = () => {
  const [selectedRole, setSelectedRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleTempSignIn = async (role) => {
    setLoading(true)
    
    try {
      const { data, error } = await tempSignIn(role)
      
      if (error) {
        toast.error('Error with temporary sign in')
      } else {
        // Store temp user data in localStorage for demo purposes
        localStorage.setItem('tempUser', JSON.stringify(data.user))
        toast.success(`Signed in as Demo ${role.charAt(0).toUpperCase() + role.slice(1)}!`)
        navigate('/dashboard')
      }
    } catch (error) {
      toast.error('Error with temporary sign in')
    } finally {
      setLoading(false)
    }
  }

  const roles = [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full access to all features, user management, and system analytics',
      icon: FiUsers,
      color: 'bg-red-500',
      permissions: ['User Management', 'All Features', 'Analytics', 'System Settings']
    },
    {
      id: 'teacher',
      name: 'Teacher',
      description: 'Create lessons, track attendance, manage offerings, and generate word searches',
      icon: FiUserCheck,
      color: 'bg-blue-500',
      permissions: ['Lesson Management', 'Attendance Tracking', 'Offerings', 'Word Search Generator']
    },
    {
      id: 'student',
      name: 'Student',
      description: 'Access assigned lessons, submit work, and view personal progress',
      icon: FiUser,
      color: 'bg-green-500',
      permissions: ['My Lessons', 'Submit Work', 'View Progress', 'Basic Dashboard']
    }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <Link
            to="/login"
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <SafeIcon icon={FiArrowLeft} className="h-4 w-4 mr-1" />
            Back to login
          </Link>
          
          <div className="text-center">
            <SafeIcon icon={FiEye} className="mx-auto h-12 w-12 text-primary-600" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Demo Access
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Explore the School Management System with temporary access
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <SafeIcon icon={FiEye} className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Demo Mode
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This is a demonstration mode that provides temporary access without requiring registration. 
                  Data may not persist between sessions.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 text-center">
            Choose your role to explore:
          </h3>
          
          <div className="grid gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`relative rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedRole === role.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${role.color}`}>
                      <SafeIcon icon={role.icon} className="h-6 w-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {role.name}
                        </h4>
                        {selectedRole === role.id && (
                          <div className="w-4 h-4 rounded-full bg-primary-500 border-2 border-white"></div>
                        )}
                      </div>
                      
                      <p className="mt-1 text-sm text-gray-500">
                        {role.description}
                      </p>
                      
                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Available Features:
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleTempSignIn(selectedRole)}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              'Signing in...'
            ) : (
              `Continue as Demo ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Need a permanent account?{' '}
              <Link
                to="/signup"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Create account
              </Link>
              {' or '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TempSignIn