import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApiRequest } from '@/hooks/shared/useApiRequest'

// Mock dependencies
vi.mock('@/hooks/use-api', () => ({
  useApi: vi.fn()
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

const mockRequest = vi.fn()

describe('useApiRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const { useApi } = require('@/hooks/use-api')
    useApi.mockReturnValue({ request: mockRequest })
  })

  it('returns initial state', () => {
    const { result } = renderHook(() => useApiRequest())
    
    expect(result.current.data).toBe(null)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.isSuccess).toBe(false)
  })

  it('handles successful request', async () => {
    const mockData = { id: 1, name: 'Test' }
    mockRequest.mockResolvedValue(mockData)
    
    const { result } = renderHook(() => useApiRequest())
    
    await act(async () => {
      await result.current.execute('/api/test')
    })
    
    expect(result.current.data).toEqual(mockData)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.isSuccess).toBe(true)
  })

  it('handles request error', async () => {
    const error = new Error('Request failed')
    mockRequest.mockRejectedValue(error)
    const { toast } = require('sonner')
    
    const { result } = renderHook(() => useApiRequest())
    
    await act(async () => {
      try {
        await result.current.execute('/api/test')
      } catch (e) {
        // Expected to throw
      }
    })
    
    expect(result.current.error).toEqual({
      message: 'Request failed',
      status: undefined,
      code: undefined
    })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(toast.error).toHaveBeenCalledWith('Request failed')
  })

  it('shows loading state during request', async () => {
    let resolveRequest: (value: any) => void
    const requestPromise = new Promise(resolve => {
      resolveRequest = resolve
    })
    mockRequest.mockReturnValue(requestPromise)
    
    const { result } = renderHook(() => useApiRequest())
    
    act(() => {
      result.current.execute('/api/test')
    })
    
    expect(result.current.isLoading).toBe(true)
    
    await act(async () => {
      resolveRequest({ data: 'test' })
      await requestPromise
    })
    
    expect(result.current.isLoading).toBe(false)
  })

  it('clears error when clearError is called', async () => {
    const error = new Error('Request failed')
    mockRequest.mockRejectedValue(error)
    
    const { result } = renderHook(() => useApiRequest())
    
    await act(async () => {
      try {
        await result.current.execute('/api/test')
      } catch (e) {
        // Expected to throw
      }
    })
    
    expect(result.current.error).toBeTruthy()
    
    act(() => {
      result.current.clearError()
    })
    
    expect(result.current.error).toBe(null)
  })

  it('cancels request when cancel is called', () => {
    const { result } = renderHook(() => useApiRequest())
    
    act(() => {
      result.current.execute('/api/test')
    })
    
    expect(result.current.isLoading).toBe(true)
    
    act(() => {
      result.current.cancel()
    })
    
    expect(result.current.isLoading).toBe(false)
  })

  it('respects showErrorToast option', async () => {
    const error = new Error('Request failed')
    mockRequest.mockRejectedValue(error)
    const { toast } = require('sonner')
    
    const { result } = renderHook(() => useApiRequest({ showErrorToast: false }))
    
    await act(async () => {
      try {
        await result.current.execute('/api/test')
      } catch (e) {
        // Expected to throw
      }
    })
    
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows success toast when configured', async () => {
    const mockData = { id: 1, name: 'Test' }
    mockRequest.mockResolvedValue(mockData)
    const { toast } = require('sonner')
    
    const { result } = renderHook(() => useApiRequest({ 
      showSuccessToast: true, 
      successMessage: 'Success!' 
    }))
    
    await act(async () => {
      await result.current.execute('/api/test')
    })
    
    expect(toast.success).toHaveBeenCalledWith('Success!')
  })
})