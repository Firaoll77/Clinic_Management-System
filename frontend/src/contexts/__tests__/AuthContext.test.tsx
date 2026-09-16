import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'

// Mock the API client to handle authentication failures
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(() => Promise.reject(new Error('Not authenticated'))),
    post: jest.fn(() => Promise.reject(new Error('Not authenticated'))),
    delete: jest.fn(() => Promise.reject(new Error('Not authenticated'))),
    clearToken: jest.fn(),
  },
}))

describe('AuthContext', () => {
  it('should provide auth context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should handle logout', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should set loading state correctly', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Initially loading should be true
    expect(result.current.loading).toBe(true)

    // Wait for the async effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    // After the effect completes, loading should be false
    expect(result.current.loading).toBe(false)
  })
})
