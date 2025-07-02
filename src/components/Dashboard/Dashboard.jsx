import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getLessons, getUsers, getAttendance, getOfferings } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiUsers, FiBookOpen, FiCheckSquare, FiDollarSign, FiTrendingUp, FiCpu, FiZap } = FiIcons

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLessons: 0,
    todayAttendance: 0,
    totalOfferings: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const role = user.profile?.role

        if (role === 'admin') {
          const [usersRes, lessonsRes, offeringsRes] = await Promise.all([
            getUsers(),
            getLessons(),
            getOfferings()
          ])

          setStats({
            totalUsers: usersRes.data?.length || 0,
            totalLessons: lessonsRes.data?.length || 0,
            todayAttendance: 0, // Would need to implement today's attendance count
            totalOfferings: offeringsRes.data?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0
          })
        } else if (role === 'teacher') {
          const [lessonsRes, offeringsRes] = await Promise.all([
            getLessons(user.profile.id),
            getOfferings(user.profile.id)
          ])

          setStats({
            totalUsers: 0,
            totalLessons: lessonsRes.data?.length || 0,
            todayAttendance: 0,
            totalOfferings: offeringsRes.data?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0
          })
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const role = user.profile?.role

  const getStatsCards = () => {
    if (role === 'admin') {
      return [
        { title: 'Total Users', value: stats.totalUsers, icon: FiUsers, color: 'bg-blue-500' },
        { title: 'Total Lessons', value: stats.totalLessons, icon: FiBookOpen, color: 'bg-green-500' },
        { title: "Today's Attendance", value: stats.todayAttendance, icon: FiCheckSquare, color: 'bg-yellow-500' },
        { title: 'Total Offerings', value: `$${stats.totalOfferings}`, icon: FiDollarSign, color: 'bg-purple-500' }
      ]
    }

    if (role === 'teacher') {
      return [
        { title: 'My Lessons', value: stats.totalLessons, icon: FiBookOpen, color: 'bg-green-500' },
        { title: "Today's Attendance", value: stats.todayAttendance, icon: FiCheckSquare, color: 'bg-yellow-500' },
        { title: 'My Offerings', value: `$${stats.totalOfferings}`, icon: FiDollarSign, color: 'bg-purple-500' },
        { title: 'Progress', value: '85%', icon: FiTrendingUp, color: 'bg-indigo-500' }
      ]
    }

    if (role === 'student') {
      return [
        { title: 'Assigned Lessons', value: '12', icon: FiBookOpen, color: 'bg-green-500' },
        { title: 'Completed', value: '8', icon: FiCheckSquare, color: 'bg-yellow-500' },
        { title: 'Progress', value: '67%', icon: FiTrendingUp, color: 'bg-indigo-500' }
      ]
    }

    return []
  }

  const statsCards = getStatsCards()

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
          Welcome back, {user.profile?.name}! Here's what's happening today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center">
              <div className={`p-2 sm:p-3 rounded-lg ${card.color}`}>
                <SafeIcon icon={card.icon} className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{card.title}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Lesson Bot Feature (Admin Only) */}
      {role === 'admin' && (
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg p-4 sm:p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">AI Lesson Bot</h2>
              <p className="text-purple-100 mb-4 text-sm sm:text-base">
                Generate amazing Sunday School lessons with AI. Create single lessons or entire curricula in minutes!
              </p>
              <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-sm">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiZap} className="h-4 w-4" />
                  <span>Fast Generation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiCpu} className="h-4 w-4" />
                  <span>GPT-4o Mini</span>
                </div>
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiBookOpen} className="h-4 w-4" />
                  <span>Custom Training</span>
                </div>
              </div>
            </div>
            <div className="lg:text-right">
              <Link
                to="/ai-lesson-bot"
                className="bg-white text-purple-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors inline-flex items-center space-x-2 text-sm sm:text-base"
              >
                <SafeIcon icon={FiCpu} className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Get Started</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {role === 'admin' && (
            <>
              <Link
                to="/users"
                className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <SafeIcon icon={FiUsers} className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-medium">Manage Users</p>
              </Link>
              <Link
                to="/ai-lesson-bot/lesson-maker"
                className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <SafeIcon icon={FiCpu} className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-medium">Generate Lesson</p>
              </Link>
            </>
          )}

          {(role === 'admin' || role === 'teacher') && (
            <>
              <Link
                to="/attendance"
                className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <SafeIcon icon={FiCheckSquare} className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-medium">Take Attendance</p>
              </Link>
              <Link
                to="/offerings"
                className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <SafeIcon icon={FiDollarSign} className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-medium">Record Offering</p>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard