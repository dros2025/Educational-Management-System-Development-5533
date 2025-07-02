import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiLogOut, FiUser, FiHome, FiMenu, FiX } = FiIcons

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      // Check if this is a temp user
      const tempUser = localStorage.getItem('tempUser')
      if (tempUser) {
        localStorage.removeItem('tempUser')
        toast.success('Demo session ended')
      } else {
        await signOut()
        toast.success('Signed out successfully')
      }
      navigate('/login')
    } catch (error) {
      toast.error('Error signing out')
    }
  }

  if (!user) return null

  const isDemo = localStorage.getItem('tempUser')

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <SafeIcon icon={sidebarOpen ? FiX : FiMenu} className="h-6 w-6" />
            </button>

            <div className="flex items-center ml-2 lg:ml-0">
              <SafeIcon icon={FiHome} className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900 truncate">
                <span className="hidden sm:inline">School Management</span>
                <span className="sm:hidden">SMS</span>
              </span>
              {isDemo && (
                <span className="ml-2 sm:ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Demo
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* User info - hidden on small screens, shown on medium+ */}
            <div className="hidden md:flex items-center space-x-2">
              <SafeIcon icon={FiUser} className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700 truncate max-w-32 lg:max-w-none">
                {user.profile?.name} ({user.profile?.role})
              </span>
            </div>

            {/* Mobile user info */}
            <div className="md:hidden flex items-center">
              <SafeIcon icon={FiUser} className="h-5 w-5 text-gray-500" />
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <SafeIcon icon={FiLogOut} className="h-4 w-4" />
              <span className="hidden sm:inline">{isDemo ? 'Exit Demo' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar