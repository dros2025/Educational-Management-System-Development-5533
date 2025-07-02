import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiHome, FiUsers, FiBookOpen, FiCheckSquare, FiDollarSign, FiGrid, FiBarChart3, FiCpu } = FiIcons

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth()

  if (!user) return null

  const getMenuItems = () => {
    const role = user.profile?.role

    const commonItems = [
      { to: '/dashboard', icon: FiHome, label: 'Dashboard' }
    ]

    if (role === 'admin') {
      return [
        ...commonItems,
        { to: '/users', icon: FiUsers, label: 'Users' },
        { to: '/lessons', icon: FiBookOpen, label: 'Lessons' }, // Unified lessons
        { to: '/attendance', icon: FiCheckSquare, label: 'Attendance' },
        { to: '/offerings', icon: FiDollarSign, label: 'Offerings' },
        { to: '/word-search', icon: FiGrid, label: 'Word Search' },
        { to: '/ai-lesson-bot', icon: FiCpu, label: 'AI Lesson Bot' },
        { to: '/analytics', icon: FiBarChart3, label: 'Analytics' }
      ]
    }

    if (role === 'teacher') {
      return [
        ...commonItems,
        { to: '/lessons', icon: FiBookOpen, label: 'Lessons' }, // Unified lessons - view-only access
        { to: '/attendance', icon: FiCheckSquare, label: 'Attendance' },
        { to: '/offerings', icon: FiDollarSign, label: 'Offerings' },
        { to: '/word-search', icon: FiGrid, label: 'Word Search' }
      ]
    }

    if (role === 'student') {
      return [
        ...commonItems,
        { to: '/lessons', icon: FiBookOpen, label: 'My Lessons' } // Unified lessons - view-only access
      ]
    }

    return commonItems
  }

  const menuItems = getMenuItems()

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-50 border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          pt-14 sm:pt-16 lg:pt-0
        `}
      >
        <div className="p-3 sm:p-4 h-full overflow-y-auto">
          <nav className="space-y-1 sm:space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)} // Close sidebar on mobile when item is clicked
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <SafeIcon icon={item.icon} className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}

export default Sidebar