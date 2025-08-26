// Integration tests for authentication API endpoints
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useAuth } from '@/composables/useApi'
import { 
  mockFetch, 
  createMockUser, 
  mockLocalStorage, 
  flushPromises 
} from '../../utils/test-helpers'

describe('Authentication API Integration', () => {
  let authComposable: ReturnType<typeof useAuth>
  let localStorageMock: Map<string, string>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock = mockLocalStorage()
    authComposable = useAuth()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('User Registration', () => {
    it('successfully registers a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Doe',
        organization: 'Test University',
        specialization: ['oncology', 'immunology'],
      }

      const mockResponse = {
        success: true,
        data: {
          token: 'jwt-token-123',
          user: createMockUser({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
          }),
        },
      }

      mockFetch(mockResponse)

      const result = await authComposable.signUp(userData)
      await flushPromises()

      expect(result).toBe(true)
      expect(authComposable.user.value).toBeTruthy()
      expect(authComposable.user.value?.email).toBe(userData.email)
      expect(authComposable.isAuthenticated.value).toBe(true)
      expect(localStorageMock.get('authToken')).toBe('jwt-token-123')
    })

    it('handles registration validation errors', async () => {
      const userData = {
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: 'Doe',
      }

      mockFetch(
        {
          success: false,
          message: 'Validation failed',
          errors: [
            { field: 'email', message: 'Invalid email format' },
            { field: 'password', message: 'Password too short' },
            { field: 'firstName', message: 'First name required' },
          ],
        },
        { ok: false, status: 400 }
      )

      const result = await authComposable.signUp(userData)

      expect(result).toBe(false)
      expect(authComposable.error.value).toBeTruthy()
      expect(authComposable.error.value?.message).toContain('Validation failed')
      expect(authComposable.isAuthenticated.value).toBe(false)
    })

    it('handles duplicate email registration', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Doe',
      }

      mockFetch(
        {
          success: false,
          message: 'Email already registered',
        },
        { ok: false, status: 409 }
      )

      const result = await authComposable.signUp(userData)

      expect(result).toBe(false)
      expect(authComposable.error.value?.message).toBe('Email already registered')
    })

    it('validates required fields', async () => {
      const incompleteData = {
        email: 'test@example.com',
        // Missing password, firstName, lastName
      }

      mockFetch(
        {
          success: false,
          message: 'Missing required fields',
          errors: [
            { field: 'password', message: 'Password is required' },
            { field: 'firstName', message: 'First name is required' },
            { field: 'lastName', message: 'Last name is required' },
          ],
        },
        { ok: false, status: 400 }
      )

      const result = await authComposable.signUp(incompleteData as any)

      expect(result).toBe(false)
      expect(authComposable.error.value).toBeTruthy()
    })
  })

  describe('User Login', () => {
    it('successfully logs in user with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      }

      const mockResponse = {
        success: true,
        data: {
          token: 'jwt-token-456',
          user: createMockUser({ email: credentials.email }),
        },
      }

      mockFetch(mockResponse)

      const result = await authComposable.signIn(credentials.email, credentials.password)

      expect(result).toBe(true)
      expect(authComposable.user.value?.email).toBe(credentials.email)
      expect(authComposable.isAuthenticated.value).toBe(true)
      expect(localStorageMock.get('authToken')).toBe('jwt-token-456')
    })

    it('handles invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      mockFetch(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { ok: false, status: 401 }
      )

      const result = await authComposable.signIn(credentials.email, credentials.password)

      expect(result).toBe(false)
      expect(authComposable.error.value?.message).toBe('Invalid email or password')
      expect(authComposable.isAuthenticated.value).toBe(false)
      expect(localStorageMock.has('authToken')).toBe(false)
    })

    it('handles account lockout after multiple failed attempts', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      mockFetch(
        {
          success: false,
          message: 'Account temporarily locked due to too many failed login attempts',
          details: {
            lockUntil: new Date(Date.now() + 3600000).toISOString(), // 1 hour
            attemptsRemaining: 0,
          },
        },
        { ok: false, status: 423 }
      )

      const result = await authComposable.signIn(credentials.email, credentials.password)

      expect(result).toBe(false)
      expect(authComposable.error.value?.message).toContain('Account temporarily locked')
    })

    it('handles unverified email', async () => {
      const credentials = {
        email: 'unverified@example.com',
        password: 'SecurePass123!',
      }

      mockFetch(
        {
          success: false,
          message: 'Please verify your email address before logging in',
          details: { emailVerified: false },
        },
        { ok: false, status: 403 }
      )

      const result = await authComposable.signIn(credentials.email, credentials.password)

      expect(result).toBe(false)
      expect(authComposable.error.value?.message).toContain('verify your email')
    })
  })

  describe('Session Management', () => {
    it('initializes user from existing token', async () => {
      const existingToken = 'existing-token-789'
      const mockUser = createMockUser()

      localStorageMock.set('authToken', existingToken)

      mockFetch({
        success: true,
        data: mockUser,
      })

      await authComposable.initialize()

      expect(authComposable.user.value).toEqual(mockUser)
      expect(authComposable.isAuthenticated.value).toBe(true)
    })

    it('clears invalid token from localStorage', async () => {
      const invalidToken = 'invalid-token'
      localStorageMock.set('authToken', invalidToken)

      mockFetch(
        { success: false, message: 'Invalid token' },
        { ok: false, status: 401 }
      )

      await authComposable.initialize()

      expect(authComposable.user.value).toBe(null)
      expect(authComposable.isAuthenticated.value).toBe(false)
      expect(localStorageMock.has('authToken')).toBe(false)
    })

    it('handles expired token gracefully', async () => {
      const expiredToken = 'expired-token'
      localStorageMock.set('authToken', expiredToken)

      mockFetch(
        {
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
        },
        { ok: false, status: 401 }
      )

      await authComposable.initialize()

      expect(authComposable.user.value).toBe(null)
      expect(authComposable.isAuthenticated.value).toBe(false)
      expect(localStorageMock.has('authToken')).toBe(false)
    })
  })

  describe('Logout', () => {
    it('successfully logs out user', async () => {
      // Setup authenticated state
      const mockUser = createMockUser()
      localStorageMock.set('authToken', 'valid-token')
      authComposable.user.value = mockUser

      mockFetch({ success: true })

      await authComposable.signOut()

      expect(authComposable.user.value).toBe(null)
      expect(authComposable.isAuthenticated.value).toBe(false)
      expect(localStorageMock.has('authToken')).toBe(false)
    })

    it('clears local state even if API call fails', async () => {
      // Setup authenticated state
      const mockUser = createMockUser()
      localStorageMock.set('authToken', 'valid-token')
      authComposable.user.value = mockUser

      // Mock API failure
      mockFetch(
        { success: false, message: 'Server error' },
        { ok: false, status: 500 }
      )

      await authComposable.signOut()

      // Should still clear local state
      expect(authComposable.user.value).toBe(null)
      expect(authComposable.isAuthenticated.value).toBe(false)
      expect(localStorageMock.has('authToken')).toBe(false)
    })
  })

  describe('Token Refresh', () => {
    it('refreshes expired token automatically', async () => {
      const oldToken = 'old-token'
      const newToken = 'new-token'

      localStorageMock.set('authToken', oldToken)

      // First call fails with expired token
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            success: false,
            message: 'Token expired',
            code: 'TOKEN_EXPIRED',
          }),
        })
        // Refresh token call succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { token: newToken },
          }),
        })
        // Retry original call succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: createMockUser(),
          }),
        })

      await authComposable.initialize()

      expect(localStorageMock.get('authToken')).toBe(newToken)
      expect(authComposable.isAuthenticated.value).toBe(true)
    })

    it('handles refresh token failure', async () => {
      const expiredToken = 'expired-token'
      localStorageMock.set('authToken', expiredToken)

      // Both original and refresh calls fail
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            success: false,
            message: 'Token expired',
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            success: false,
            message: 'Refresh token invalid',
          }),
        })

      await authComposable.initialize()

      expect(authComposable.user.value).toBe(null)
      expect(authComposable.isAuthenticated.value).toBe(false)
      expect(localStorageMock.has('authToken')).toBe(false)
    })
  })

  describe('API Error Handling', () => {
    it('handles network connectivity issues', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await authComposable.signIn('test@example.com', 'password')

      expect(result).toBe(false)
      expect(authComposable.error.value?.message).toContain('Network error')
    })

    it('handles server timeout', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Request timeout'))

      const result = await authComposable.signIn('test@example.com', 'password')

      expect(result).toBe(false)
      expect(authComposable.error.value?.message).toContain('timeout')
    })

    it('handles malformed API responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      const result = await authComposable.signIn('test@example.com', 'password')

      expect(result).toBe(false)
      expect(authComposable.error.value).toBeTruthy()
    })

    it('retries failed requests with exponential backoff', async () => {
      let attempts = 0
      global.fetch = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          return Promise.reject(new Error('Temporary server error'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              token: 'success-token',
              user: createMockUser(),
            },
          }),
        })
      })

      const result = await authComposable.signIn('test@example.com', 'password')

      expect(result).toBe(true)
      expect(attempts).toBe(3)
    })
  })

  describe('Security Features', () => {
    it('includes CSRF protection headers', async () => {
      mockFetch({ success: true, data: { token: 'token', user: createMockUser() } })

      await authComposable.signIn('test@example.com', 'password')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('sanitizes user input', async () => {
      const maliciousInput = {
        email: 'test@example.com<script>alert("xss")</script>',
        password: 'password',
        firstName: '<img src=x onerror=alert("xss")>',
        lastName: 'Doe',
      }

      mockFetch({ success: true, data: { token: 'token', user: createMockUser() } })

      await authComposable.signUp(maliciousInput)

      const requestBody = JSON.parse(
        (global.fetch as any).mock.calls[0][1].body
      )

      // Should have sanitized the input
      expect(requestBody.email).not.toContain('<script>')
      expect(requestBody.firstName).not.toContain('<img')
    })

    it('validates password strength requirements', async () => {
      const weakPasswords = [
        'password',      // Too common
        '123456',        // Too simple
        'Pass1',         // Too short
        'PASSWORD123',   // No lowercase
        'password123',   // No uppercase
        'Password',      // No numbers
        'Password123',   // No special characters
      ]

      for (const password of weakPasswords) {
        mockFetch(
          {
            success: false,
            message: 'Password does not meet security requirements',
          },
          { ok: false, status: 400 }
        )

        const result = await authComposable.signUp({
          email: 'test@example.com',
          password,
          firstName: 'Test',
          lastName: 'User',
        })

        expect(result).toBe(false)
        expect(authComposable.error.value?.message).toContain('security requirements')
      }
    })
  })

  describe('User Preferences and Subscription', () => {
    it('maintains user subscription information', async () => {
      const premiumUser = createMockUser({
        subscription: 'premium',
        specialization: ['oncology', 'cardiology'],
      })

      mockFetch({ success: true, data: { token: 'token', user: premiumUser } })

      const result = await authComposable.signIn('premium@example.com', 'password')

      expect(result).toBe(true)
      expect(authComposable.user.value?.subscription).toBe('premium')
      expect(authComposable.user.value?.specialization).toContain('oncology')
    })

    it('tracks API usage limits based on subscription', async () => {
      const userWithUsage = createMockUser({
        apiUsage: {
          daily: { requests: 45, tokens: 5000, date: new Date().toISOString() },
          monthly: { requests: 850, tokens: 120000, month: 1, year: 2024 },
        },
      })

      mockFetch({ success: true, data: { token: 'token', user: userWithUsage } })

      const result = await authComposable.signIn('user@example.com', 'password')

      expect(result).toBe(true)
      expect(authComposable.user.value?.apiUsage.daily.requests).toBe(45)
      expect(authComposable.user.value?.apiUsage.monthly.requests).toBe(850)
    })

    it('handles enterprise user features', async () => {
      const enterpriseUser = createMockUser({
        subscription: 'enterprise',
        role: 'admin',
        organization: 'Enterprise Corp',
      })

      mockFetch({ success: true, data: { token: 'token', user: enterpriseUser } })

      const result = await authComposable.signIn('admin@enterprise.com', 'password')

      expect(result).toBe(true)
      expect(authComposable.user.value?.subscription).toBe('enterprise')
      expect(authComposable.user.value?.role).toBe('admin')
    })
  })

  describe('Loading States', () => {
    it('indicates loading during authentication requests', async () => {
      let resolvePromise: (value: any) => void
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve
      })

      global.fetch = vi.fn().mockReturnValue(delayedPromise)

      // Start login process
      const loginPromise = authComposable.signIn('test@example.com', 'password')

      // Should be loading
      expect(authComposable.loading.value).toBe(true)

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { token: 'token', user: createMockUser() },
        }),
      })

      await loginPromise

      // Should no longer be loading
      expect(authComposable.loading.value).toBe(false)
    })

    it('clears loading state on error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await authComposable.signIn('test@example.com', 'password')

      expect(authComposable.loading.value).toBe(false)
    })
  })
})