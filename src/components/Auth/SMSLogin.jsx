import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithOTP, verifyOTP, resendOTP, createUser, getUserByPhone } from '../../lib/supabase'
import toast from 'react-hot-toast'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiPhone, FiKey, FiArrowLeft, FiRefreshCw } = FiIcons

const SMSLogin = () => {
  const [step, setStep] = useState('phone') // 'phone' or 'verify'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const navigate = useNavigate()

  // Format phone number
  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/[^\d]/g, '')
    const phoneNumberLength = phoneNumber.length
    
    if (phoneNumberLength < 4) return phoneNumber
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }

  const handlePhoneSubmit = async (e) => {
    e.preventDefault()
    
    if (phone.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }

    setLoading(true)

    try {
      // Format phone number for international format
      const formattedPhone = `+1${phone.replace(/\D/g, '')}`
      
      const { error } = await signInWithOTP(formattedPhone)
      
      if (error) {
        toast.error(error.message)
      } else {
        setStep('verify')
        toast.success('Verification code sent!')
        startCountdown()
      }
    } catch (error) {
      toast.error('Error sending verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSubmit = async (e) => {
    e.preventDefault()
    
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit verification code')
      return
    }

    setLoading(true)

    try {
      const formattedPhone = `+1${phone.replace(/\D/g, '')}`
      const { data, error } = await verifyOTP(formattedPhone, otp)
      
      if (error) {
        toast.error(error.message)
      } else {
        // Check if user profile exists
        const { data: existingUser, error: userError } = await getUserByPhone(formattedPhone)
        
        if (!existingUser && !userError) {
          // Create user profile for first-time SMS users
          const { error: createError } = await createUser({
            auth_id: data.user.id,
            name: `User ${phone.slice(-4)}`, // Default name
            email: data.user.email || `${phone.replace(/\D/g, '')}@sms.local`,
            phone: formattedPhone,
            role: 'student'
          })
          
          if (createError) {
            console.error('Error creating user profile:', createError)
          }
        }
        
        toast.success('Successfully signed in!')
        navigate('/dashboard')
      }
    } catch (error) {
      toast.error('Error verifying code')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return
    
    setResendLoading(true)

    try {
      const formattedPhone = `+1${phone.replace(/\D/g, '')}`
      const { error } = await resendOTP(formattedPhone)
      
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('New verification code sent!')
        startCountdown()
      }
    } catch (error) {
      toast.error('Error resending code')
    } finally {
      setResendLoading(false)
    }
  }

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <button
              onClick={() => setStep('phone')}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <SafeIcon icon={FiArrowLeft} className="h-4 w-4 mr-1" />
              Change phone number
            </button>
            
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Enter verification code
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We sent a 6-digit code to
            </p>
            <p className="text-center text-sm font-medium text-gray-900">
              {formatPhoneNumber(phone)}
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleOTPSubmit}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiKey} className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  maxLength="6"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm text-center tracking-widest text-lg"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={countdown > 0 || resendLoading}
                className="text-sm text-primary-600 hover:text-primary-500 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
              >
                <SafeIcon icon={FiRefreshCw} className={`h-4 w-4 ${resendLoading ? 'animate-spin' : ''}`} />
                <span>
                  {countdown > 0 
                    ? `Resend code in ${countdown}s` 
                    : resendLoading 
                      ? 'Sending...' 
                      : 'Resend code'
                  }
                </span>
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Use email instead
              </Link>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            to="/login"
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <SafeIcon icon={FiArrowLeft} className="h-4 w-4 mr-1" />
            Back to login
          </Link>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in with SMS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your phone number to receive a verification code
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handlePhoneSubmit}>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SafeIcon icon={FiPhone} className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="(555) 123-4567"
                value={formatPhoneNumber(phone)}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setPhone(value)
                }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              US phone numbers only
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || phone.length < 10}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending code...' : 'Send verification code'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Prefer email?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in with email
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> SMS authentication requires a valid US phone number. 
            Standard messaging rates may apply.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SMSLogin