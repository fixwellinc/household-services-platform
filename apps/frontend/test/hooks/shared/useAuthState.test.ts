import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthState } from '@/hooks/shared/useAuthState'

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

const mockAuth = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn()
}

describe('useAuthState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const { useAuth } = require('@/contexts/AuthContext')
    useAuth.mockReturnValue(mockAuth)
  })

  it('returns initial auth state', () => {
    const { result } = renderHook(() => useAuthState())
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBe(null)
    expect(result.current.error).toBe(null)
  })

  it('handles successful login', async () => {
    mockAuth.login.mockResolvedValue(undefined)
    const { toast } = require('sonner')
    
    const { result } = renderHook(() => useAuthState())
    
    await act(async () => {
      await result.current.handleLogin('test@example.com', 'password')
    })
    
    expect(mockAuth.login).toHaveBeenCalledWith('test@example.com', 'password')
    expect(toast.success).toHaveBeenCalledWith('Welcome back!')
    expect(result.current.error).toBe(null)
  })

  it('handles login error', async () => {
    const loginError = new Error('Invalid credentials')
    mockAuth.login.mockRejectedValue(loginError)
    const { toast } = require('sonner')
    
    const { result } = renderHook(() => useAuthState())
    
    await act(async () => {
      try {
        await result.current.handleLogin('test@example.com', 'wrong-password')
      } catch (error) {
        // Expected to throw
      }
    })
    
    expect(result.current.error).toEqual({
      message: 'Invalid credentials',
      code: undefined
    })
    expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
  })

  it('handles successful registration', async () => {
    mockAuth.register.mockResolvedValue(undefined)
    const { toast } = require('sonner')
    
    const { result } = renderHook(() => useAuthState())
    
    const userData = {
      email: 'test@example.com',
      password: 'password',
      name: 'Test User'
    }
    
    await act(async () => {
      await result.current.handleRegister(userData)
    })
    
    expect(mockAuth.register).toHaveBeenCalledWith(userData)
    expect(toast.success).toHaveBeenCalledWith('Account created successfully!')
    expect(result.current.error).toBe(null)
  })

  it('handles logout', async () => {
    mockAuth.logout.mockResolvedValue(undefined)
    const { toast } = require('sonner')
    
    const { result } = renderHook(() => useAuthState())
    
    await act(async () => {
      await result.current.handleLogout()
    })
    
    expect(mockAuth.logout).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Logged out successfully')
  })

  it('clears error when clearError is called', () => {
    const { result } = renderHook(() => useAuthState())
    
    // Set an error first
    act(() => {
      result.current.handleLogin('', '').catch(() => {})
    })
    
    act(() => {
      result.current.clearError()
    })
    
    expect(result.current.error).toBe(null)
  })

  it('respects showSuccessToast option', async () => {
    mockAuth.login.mockResolvedValue(undefined)
    const { toast } = require('sonner')
    
    const { result } = renderHook(() => useAuthState({ showSuccessToast: false }))
    
    await act(async () => {
      await result.current.handleLogin('test@example.com', 'password')
    })
    
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('respects showErrorToast option', async () => {
    const loginError = new Error('Invalid credentials')
    mockAuth.login.mockRejectedValue(loginError)
    const { toast } = require('sonner')
    
    const { result } = renderHook(() => useAuthState({ showErrorToast: false }))
    
    await act(async () => {
      try {
        await result.current.handleLogin('test@example.com', 'wrong-password')
      } catch (error) {
        // Expected to throw
      }
    })
    
    expect(toast.error).not.toHaveBeenCalled()
  })
})